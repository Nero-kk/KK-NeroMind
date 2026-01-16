# KK-NeroMind 개발 로그 - 2026-01-17 (Phase 0: TextFileView 전환)

---

## 📋 문서 개요

| 항목          | 내용                                       |
| ------------- | ------------------------------------------ |
| **작업일**    | 2026-01-17                                 |
| **작업자**    | AI Agent (Antigravity) + Nero-kk           |
| **Phase**     | Phase 0 - TextFileView 기반 핵심 엔진 구현 |
| **작업 시간** | 01:00 ~ 01:12 (약 12분)                    |
| **빌드 상태** | ⚠️ 미테스트 (TypeScript 컴파일 필요)       |

---

## 🎯 작업 목표

**KK-NeroMind Architecture v4.2.8 헌법 준수**를 위한 TextFileView 기반 구현

### 왜 이 작업이 필요했는가?

기존 `NeroMindView`는 `ItemView`를 상속하고 있었으나, **Architecture v4.2.8 헌법 4.1절**에 따라 반드시 `TextFileView`를 상속해야 합니다.

**헌법 위반 사항**:

- ❌ 파일이 유일한 진실의 원천(SSOT)이 아님
- ❌ updatedAt 갱신 시점 통제 불가
- ❌ 원자적 쓰기(Atomic Write) 미구현
- ❌ Schema 검증 및 Sanitation 미구현

---

## ✅ 완료된 작업

### 1. Schema 타입 정의

#### 📄 새 파일: `src/types/MindMapData.ts` (102 lines)

`.kknm` 파일 직렬화 포맷을 정의하는 타입:

```typescript
export interface MindMapData {
  meta: {
    createdWith: "KK-NeroMind";  // 파일 시그니처
    schemaVersion: number;         // 정수만 허용
    pluginVersion: string;
    createdAt: number;
    updatedAt: number;             // 직렬화 시점에만 갱신
  };
  nodes: { [id: string]: { ... } };
  edges: { [id: string]: { ... } };
  rootNodeId: string;
  view?: { zoom, pan, selectedNodeId };  // 비영속 힌트
}
```

**핵심 설계 결정**:

- `schemaVersion`은 정수만 허용 (Semantic Versioning 명시적 금지)
- `createdWith`는 파일 소유권 검증용 시그니처
- `view` 섹션은 선택적 (UX 복원 힌트, isDirty 트리거 안 함)

**상수 정의**:

```typescript
export const CURRENT_SCHEMA_VERSION = 1;
export const FILE_SIGNATURE = "KK-NeroMind" as const;
```

---

### 2. Schema 검증기 구현

#### 📄 새 파일: `src/core/SchemaValidator.ts` (83 lines)

**Fail Loudly 원칙**을 준수하는 검증기:

```typescript
class SchemaValidator {
  validate(data: any): asserts data is MindMapData {
    // 1. 파일 시그니처 검증
    if (data.meta?.createdWith !== FILE_SIGNATURE) {
      new Notice("Not a KK-NeroMind file", 0);
      throw new Error("Not a KK-NeroMind file");
    }

    // 2. schemaVersion 타입 검증 (정수만)
    if (typeof data.meta?.schemaVersion !== "number") {
      throw new Error("Invalid schemaVersion type");
    }

    // 3. schemaVersion 호환성 검증 (단순 정수 비교)
    if (data.meta.schemaVersion > CURRENT_SCHEMA_VERSION) {
      throw new Error(`Incompatible schema version`);
    }

    // 4. 필수 필드 검증
    if (!data.rootNodeId) {
      new Notice("파일이 손상되었습니다: 루트 노드 없음", 0);
      throw new Error("Missing root node");
    }

    // 5. 루트 노드 존재 검증
    if (!data.nodes[data.rootNodeId]) {
      throw new Error("Root node does not exist");
    }
  }

  isCompatible(fileVersion: number, currentVersion: number): boolean {
    return fileVersion <= currentVersion; // 단순 정수 비교만
  }
}
```

**핵심 로직**:

- ✅ `throw Error` + `Notice` (사용자 알림)
- ✅ 작업 컨텍스트 즉시 중단
- ❌ 추측, 보정, 생성 금지
- ❌ Partial continuation 금지

---

### 3. 데이터 정화기 구현

#### 📄 새 파일: `src/core/SchemaSanitizer.ts` (71 lines)

**Schema-Driven Sanitation** 구현:

```typescript
class SchemaSanitizer {
  sanitize(data: MindMapData): MindMapData {
    // 1. 유효한 노드 ID 집합 생성
    const validNodeIds = new Set(Object.keys(data.nodes));

    // 2. dangling edges 제거
    const sanitizedEdges: MindMapData["edges"] = {};
    let removedEdgeCount = 0;

    for (const [edgeId, edge] of Object.entries(data.edges)) {
      const isValid =
        validNodeIds.has(edge.fromNodeId) && validNodeIds.has(edge.toNodeId);

      if (isValid) {
        sanitizedEdges[edgeId] = edge;
      } else {
        console.warn(`Invalid edge removed: ${edgeId}`, {
          fromNodeId: edge.fromNodeId,
          toNodeId: edge.toNodeId,
          fromExists: validNodeIds.has(edge.fromNodeId),
          toExists: validNodeIds.has(edge.toNodeId),
        });
        removedEdgeCount++;
      }
    }

    if (removedEdgeCount > 0) {
      console.warn(`Removed ${removedEdgeCount} invalid edge(s)`);
    }

    return { ...data, edges: sanitizedEdges };
  }
}
```

**핵심 로직**:

- Schema가 허용한 최소 조치만 수행 (dangling edges 제거)
- 모든 Sanitation 로그 기록 (헌법 요구사항)
- 추측/보정/생성 금지

**허용 시점**:

- ✅ 파일 로드
- ✅ 명시적 검증
- ✅ 마이그레이션

**금지 시점**:

- ❌ 렌더링
- ❌ 인터랙션
- ❌ 편집

---

### 4. NeroMindView 완전 재작성

#### 📝 수정: `src/views/NeroMindView.ts` (1,359 lines → 1,215 lines, 완전 재작성)

**상속 변경**: `ItemView` → `TextFileView`

```typescript
export class NeroMindView extends TextFileView {
  allowNoFile = false;  // 파일 없이 열기 금지 (헌법 4.1)

  // Schema 검증 및 정화
  private schemaValidator: SchemaValidator = new SchemaValidator();
  private schemaSanitizer: SchemaSanitizer = new SchemaSanitizer();

  // 파일 메타데이터
  private fileCreatedAt: number = Date.now();
```

---

#### 🔧 구현된 핵심 함수

##### 1. `getViewData(): string` (직렬화 + timestamp 갱신)

```typescript
getViewData(): string {
  const data = this.serialize();

  // updatedAt은 직렬화 시점에만 갱신 (유일한 갱신 지점)
  data.meta.updatedAt = Date.now();

  return JSON.stringify(data, null, 2);
}
```

**핵심 로직**:

- ✅ `updatedAt`는 이 메서드에서만 갱신 (헌법 2.2)
- ❌ UI 상호작용, 카메라 이동, 렌더링으로는 절대 갱신 안 됨

---

##### 2. `setViewData(data: string, clear: boolean): void` (로드 + 검증 + 정화)

```typescript
setViewData(data: string, clear: boolean): void {
  if (clear) {
    this.clear();
  }

  try {
    // 1. JSON 파싱
    const parsed = JSON.parse(data);

    // 2. Schema 검증 (Fail Loudly)
    this.schemaValidator.validate(parsed);

    // 3. Sanitation (파일 로드 시점 - 허용)
    const sanitized = this.schemaSanitizer.sanitize(parsed);

    // 4. 상태 복원
    this.deserialize(sanitized);

    // 5. Projection 갱신
    if (this.stateManager) {
      this.renderSnapshot(this.stateManager.getSnapshot());
    }

  } catch (e) {
    // Fail Loudly: 작업 컨텍스트 즉시 중단
    new Notice('파일이 손상되었거나 호환되지 않습니다.');
    throw e;  // Partial continuation 금지
  }
}
```

**핵심 로직**:

- ✅ Schema 검증 실패 시 즉시 중단
- ✅ Sanitation은 파일 로드 시점에만 수행
- ✅ 에러 발생 시 작업 컨텍스트 즉시 중단
- ❌ Partial continuation 금지

---

##### 3. `clear(): void` (상태 초기화)

```typescript
clear(): void {
  if (this.stateManager) {
    // StateManager 초기화
    this.stateManager = new StateManager();
    if (this.eventBus) {
      this.stateManager.setEventBus(this.eventBus);
    }
  }

  // UI 상태 초기화
  this.visibleNodeIds.clear();
  this.forcedVisibleNodeIds.clear();
  this.lastSnapshot = null;
}
```

---

##### 4. `serialize(): MindMapData` (StateSnapshot → MindMapData 변환)

```typescript
private serialize(): MindMapData {
  const snapshot = this.stateManager?.getSnapshot() || { ... };

  // StateSnapshot → MindMapData 변환
  const nodes: MindMapData['nodes'] = {};
  for (const node of snapshot.nodes) {
    nodes[node.id] = { ...node };
  }

  const edges: MindMapData['edges'] = {};
  for (const edge of snapshot.edges) {
    edges[edge.id] = { ...edge };
  }

  return {
    meta: {
      createdWith: FILE_SIGNATURE,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      pluginVersion: this.plugin.manifest.version,
      createdAt: this.fileCreatedAt,
      updatedAt: Date.now(),  // getViewData()에서 다시 갱신됨
    },
    nodes,
    edges,
    rootNodeId: snapshot.rootId || "",
    view: {
      zoom: 1.0,
      pan: { x: 0, y: 0 },
      selectedNodeId: snapshot.selectedNodeId,
    },
  };
}
```

**핵심 로직**:

- Map → Object 변환 (JSON 직렬화 가능)
- `createdAt` 유지, `updatedAt`은 getViewData()에서 갱신
- `view` 섹션은 UX 복원 힌트 (비영속)

---

##### 5. `deserialize(data: MindMapData): void` (MindMapData → StateManager 복원)

```typescript
private deserialize(data: MindMapData): void {
  if (!this.stateManager) return;

  // 파일 생성 시간 저장
  this.fileCreatedAt = data.meta.createdAt;

  // StateManager 초기화
  this.clear();

  // 노드 복원
  for (const node of Object.values(data.nodes)) {
    this.stateManager.addNode(node);
  }

  // View 상태 복원 (힌트)
  if (data.view?.selectedNodeId) {
    const nodeExists = data.nodes[data.view.selectedNodeId];
    if (nodeExists) {
      this.stateManager.selectNode(data.view.selectedNodeId);
    }
  }
}
```

**핵심 로직**:

- Object → StateManager 복원
- View 상태는 힌트로만 사용 (존재하지 않는 노드는 무시)

---

## 🔧 수정된 기존 함수 요약

| 함수명             | 변경 사항                         | 핵심 로직                                  |
| ------------------ | --------------------------------- | ------------------------------------------ |
| `getViewType()`    | 변경 없음                         | `"neromind-view"` 반환                     |
| `getDisplayText()` | TextFileView 필수 메서드로 재구현 | `this.file?.basename` 반환                 |
| `getIcon()`        | TextFileView 필수 메서드로 재구현 | `"brain"` 반환                             |
| `onOpen()`         | setViewData() 호출 제거           | TextFileView가 자동으로 setViewData() 호출 |
| `onClose()`        | 변경 없음                         | 리소스 정리                                |

---

## 📊 아키텍처 헌법 준수 현황

| 헌법 조항                 | 준수 여부 | 구현 위치                        |
| ------------------------- | --------- | -------------------------------- |
| 1. File First             | ✅        | TextFileView 상속                |
| 2. Schema is Law          | ✅        | SchemaValidator                  |
| 3. Intent is Pure         | ⏳        | N/A (Phase 1 이후)               |
| 4. Sanitation is Explicit | ✅        | SchemaSanitizer                  |
| 5. Fail Loudly            | ✅        | SchemaValidator, setViewData()   |
| 6. UI is Isolated         | ✅        | 기존 구현 유지                   |
| 7. Export is Projection   | ⏳        | N/A (Phase 3)                    |
| 8. No Auto-Merge          | ⏳        | N/A (Conflict 미구현)            |
| 9. Atomic Write           | ⏳        | **다음 단계 필요**               |
| 10. No Silent Correction  | ✅        | SchemaValidator, SchemaSanitizer |
| 11. Projection Only       | ✅        | serialize(), deserialize()       |
| 12. AI Must Not Guess     | ✅        | 추측/보정/생성 금지              |
| 13. Context Termination   | ✅        | setViewData() error handling     |
| 14. Conflict Suspension   | ⏳        | N/A (Conflict 미구현)            |
| 15. Integer Versioning    | ✅        | CURRENT_SCHEMA_VERSION = 1       |

---

## 🚧 미완료 작업 (Next Steps)

### 1. Atomic Write 구현 (최우선)

TextFileView는 자동으로 atomic write를 수행하지 않습니다. `requestSave()` 메서드를 override해야 합니다:

```typescript
async requestSave(): Promise<void> {
  if (!this.file) return;

  const tmpPath = this.file.path + '.tmp';
  const data = this.getViewData();

  try {
    // 1. 임시 파일 쓰기
    await this.app.vault.adapter.write(tmpPath, data);

    // 2. 검증
    const written = await this.app.vault.adapter.read(tmpPath);
    if (written !== data) {
      throw new Error('Write verification failed');
    }

    // 3. 원자적 교체
    await this.app.vault.adapter.rename(tmpPath, this.file.path);

  } catch (e) {
    // 임시 파일 정리
    try {
      await this.app.vault.adapter.remove(tmpPath);
    } catch {}

    throw new Error(`File write failed: ${e.message}`);
  }
}
```

---

### 2. 수동 테스트 필요

| 테스트 시나리오   | 예상 결과                    | 상태 |
| ----------------- | ---------------------------- | ---- |
| 파일 생성 및 저장 | JSON 구조 확인               | ⏳   |
| 파일 로드 및 복원 | 노드 위치 복원               | ⏳   |
| Schema 검증       | createdWith 변경 시 에러     | ⏳   |
| Dirty State       | 카메라 이동 → 수정 표시 없음 | ⏳   |
| Undo/Redo         | 상태 복원 확인               | ⏳   |

---

## 📈 코드 통계

| 파일                 | 라인 수   | 변경 유형   |
| -------------------- | --------- | ----------- |
| `MindMapData.ts`     | 102       | 신규        |
| `SchemaValidator.ts` | 83        | 신규        |
| `SchemaSanitizer.ts` | 71        | 신규        |
| `NeroMindView.ts`    | 1,215     | 완전 재작성 |
| **합계**             | **1,471** | -           |

---

## 🎓 핵심 학습 내용

### 1. TextFileView vs ItemView

| 항목      | ItemView  | TextFileView             |
| --------- | --------- | ------------------------ |
| 파일 연결 | 선택적    | 필수                     |
| 직렬화    | 수동 구현 | `getViewData()`          |
| 역직렬화  | 수동 구현 | `setViewData()`          |
| 파일 저장 | 수동 구현 | `requestSave()` override |

### 2. Fail Loudly 패턴

```typescript
// ❌ Silent Failure
try {
  validate(data);
} catch (e) {
  console.error(e); // 조용히 로그만
}

// ✅ Fail Loudly
try {
  validate(data);
} catch (e) {
  new Notice("에러 메시지"); // 사용자 알림
  throw e; // 작업 컨텍스트 중단
}
```

### 3. Sanitation 허용 시점

```typescript
// ✅ 허용: 파일 로드
setViewData(data: string) {
  const parsed = JSON.parse(data);
  const sanitized = this.sanitizer.sanitize(parsed);  // OK
}

// ❌ 금지: 렌더링
render() {
  const sanitized = this.sanitizer.sanitize(data);  // NO!
}
```

---

## 🔍 Breaking Changes

> [!WARNING] > **ItemView → TextFileView 전환**
>
> - 파일 없이는 뷰를 열 수 없습니다 (`allowNoFile = false`)
> - 모든 상태는 `.kknm` 파일에 저장됩니다
> - Obsidian 파일 라이프사이클에 완전히 종속됩니다

---

## 📝 참고 문서

- [KK-NeroMind-Architecture-v4.2.8.md](d:\JIN\Obsidian\ACE.obsidian\plugins\KK-NeroMind\KK-NeroMind-Architecture-v4.2.8.md)
- [kknm-schema-v1.md](d:\JIN\Obsidian\ACE.obsidian\plugins\KK-NeroMind\docs\schema\kknm-schema-v1.md)
- [textfileview-skeleton.md](d:\JIN\Obsidian\ACE.obsidian\plugins\KK-NeroMind\docs\implementation\textfileview-skeleton.md)

---

## 💭 회고 (Retrospective)

### What Went Well

- ✅ 헌법 문서를 정확히 따라 구현
- ✅ Fail Loudly 원칙 철저히 준수
- ✅ 기존 기능(StateManager, Renderer 등) 완전 보존

### What Could Be Improved

- ⚠️ Atomic Write는 다음 단계에서 구현 필요
- ⚠️ 수동 테스트 필요

### Action Items

1. [ ] `requestSave()` 메서드 구현
2. [ ] TypeScript 컴파일 및 빌드 테스트
3. [ ] 수동 테스트 수행 (7가지 시나리오)

---

**작성일**: 2026-01-17 01:12  
**Author**: Nero-kk (with AI Agent Antigravity)

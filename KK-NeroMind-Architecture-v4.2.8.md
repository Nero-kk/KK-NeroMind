# KK-NeroMind Architecture v4.2.8

> **최종 업데이트**: 2026-01-16  
> **버전**: 4.2.8 (Final Architectural Constitution - Fully Sealed)  
> **문서 지위**: **아키텍처 헌법 (Architectural Constitution)**  
> **기반**: v4.2.7 + 헌법 구멍 봉인 완료

---

## 📜 문서의 지위 및 효력

### 본 문서는 "설명서"가 아니라 "헌법"이다

본 문서는 **KK-NeroMind Architecture v4.2.8의 최상위 헌법 문서**다.

- 본 문서는 설계 문서가 아니다 ❌
- 본 문서는 가이드가 아니다 ❌
- 본 문서는 **아키텍처 헌법(Architectural Constitution)** 이다 ✅
- 본 문서는 **AI 통제 규약(AI Control Protocol)** 이다 ✅✅

**강제력**:
- ✅ **필수 준수 사항** - 위반 시 명세 위반 버그로 간주
- ✅ **강제 규범** - 구현자의 재량을 허용하지 않음
- ✅ **단일 진실의 원천** - 모든 아키텍처 논의의 최종 기준

**본 헌법과 충돌하는 모든 구현은 명세 위반 버그이며,**  
**본 헌법과 충돌하는 모든 해석은 무효다.**

---

## 🎯 핵심 설계 철학

### 절대 불변 원칙 (Immutable Core Principles)

> **1. 노드는 움직이지 않는다. 카메라만 움직인다.**  
> **2. 노드는 의미의 단위이고, 카메라는 시선의 단위다.**  
> **3. 사용자의 의도가 언제나 자동 로직보다 우선한다.**  
> **4. 파일이 유일한 진실이다 (File First)**  
> **5. Schema가 법이다 (Schema is Law)**  
> **6. 에러를 숨기지 않는다 (Fail Loudly)**

### 이 원칙으로 해결되는 문제

- ✅ 좌표 시스템 완성
- ✅ 파일 저장/동기화 안정화
- ✅ 데이터 손실 방지
- ✅ 다중 뷰 일관성 보장
- ✅ Excalidraw 수준 UX

---

## 1. Single Source of Truth (SSOT)

### 1.1 File-First 원칙

`.kknm` 파일은 **유일한 진실의 원천(Single Source of Truth)** 이다.

```
파일 상태 ─── 절대적 권위 (Absolute Authority)
    ↓
메모리 상태 ─── 캐시 (Cache)
    ↓
UI 상태 ─── 투영 (Projection)
    ↓
ViewModel ─── 파생물 (Derivative)
```

**강제 규칙**:
- `.kknm` 파일 자체가 유일한 진실의 원천이다
- 파일 상태와 불일치하는 그 어떤 상태도 **권위를 갖지 않는다**
- 모든 데이터 수정은 **파일을 거쳐야만** 유효하다
- 메모리 상태는 언제든 파일로부터 재구성 가능해야 한다

### 1.2 Projection Only 원칙

모든 View, UI, Export, Embed는 **파일 상태의 투영(Projection)** 이다.

```typescript
// ❌ 금지: UI → 파일 직접 수정
function onNodeDrag(node: MindMapNode, newPos: Position) {
  node.position = newPos;  // 직접 수정 금지!
  this.saveFile();
}

// ✅ 올바름: UI → Intent → Engine → 파일
function onNodeDrag(node: MindMapNode, newPos: Position) {
  // 1. Intent 생성 (선언적)
  const intent = new MoveNodeIntent(node.id, newPos);
  
  // 2. Engine 실행
  this.intentProcessor.process(intent);
  
  // 3. 파일 수정 (자동)
  // 4. Projection 갱신 (자동)
}
```

**역방향 의존 전면 금지**:
- UI가 파일을 직접 수정할 수 없다
- View가 State를 직접 변경할 수 없다
- Projection이 Source를 변경할 수 없다

**강제 규칙**:
- UI → 파일 직접 수정 **전면 금지**
- UI → Intent 생성만 허용
- Intent → Engine → File 단방향 흐름만 허용

### 1.3 Intent 순수성 규약 (Intent Purity)

Intent는 **선언적(declarative)이며 부작용(side-effect)이 없어야 한다**.

```typescript
// ✅ Intent는 "의도 표현"
interface MoveNodeIntent {
  type: 'MOVE_NODE';
  nodeId: string;
  newPosition: Position;
}

// ❌ Intent는 "상태 조작 도구"가 아님
class BadIntent {
  execute() {
    // 데이터 정규화 ❌
    this.node.position.x = Math.round(this.newPos.x);
    
    // 스키마 보정 ❌
    if (!this.node.layoutControlled) {
      this.node.layoutControlled = true;
    }
    
    // Sanitation ❌
    this.removeInvalidEdges();
    
    // 상태 변경 ❌
    this.node.position = this.newPos;
    
    // 추론 또는 보완 ❌
    if (this.shouldUpdateParent()) {
      this.updateParent();
    }
  }
}

// ✅ Engine이 Intent를 해석하고 실행
class IntentProcessor {
  process(intent: MoveNodeIntent): void {
    // Engine이 유효성 검증
    this.validate(intent);
    
    // Engine이 상태 변경
    const command = new MoveNodeCommand(intent.nodeId, intent.newPosition);
    this.commandManager.execute(command);
    
    // Engine이 파일 마킹
    this.markDirty();
  }
}
```

**Intent 순수성 원칙**:
- Intent는 **선언적(Declarative)** 이어야 한다
- Intent는 **부작용(Side Effect)이 없어야** 한다
- Intent는 **"의도 표현"이지 "상태 조작 도구"가 아니다**
- Intent가 데이터를 정규화, 보정, 삭제, 생성하는 행위는 **명시적으로 금지된다**

**Intent는 절대 다음을 수행하지 않는다**:
- 데이터 정규화
- 스키마 보정
- Sanitation
- 상태 변경
- 추론 또는 보완

### 1.4 Non-Persistent UI State (비영속 상태 분리)

다음 **비영속 UI 상태**는 절대로 `isDirty`를 트리거해서는 안 된다:

```typescript
// ❌ isDirty 트리거 금지 항목
interface NonPersistentState {
  // 카메라 상태
  camera: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };
  
  // 선택 상태
  selection: Set<string>;
  
  // 임시 하이라이트
  highlightedNodeId: string | null;
  
  // 뷰포트 상태
  viewport: {
    width: number;
    height: number;
  };
  
  // UI 플래그
  isSearchOpen: boolean;
  isMiniMapVisible: boolean;
  
  // 포커스 상태
  focusedNodeId: string | null;
  
  // 뷰 전환 상태
  currentView: 'canvas' | 'outline';
}
```

**강제 규칙**:
```typescript
// Non-persistent UI states MUST NOT trigger isDirty
// or cause file serialization.
// 
// Only semantic data changes that affect
// .kknm file content are allowed to mark the document as dirty.
```

**Dirty State 분리 원칙**:
- 줌, 팬, 선택, 포커스 등 **UI 상태 변경은 isDirty를 트리거하지 않는다**
- `isDirty`는 **직렬화 가능한 데이터 변경**에 의해서만 설정된다

`isDirty`를 트리거하는 **유일한** 경우:
- 노드 이동
- 노드 내용 편집
- 노드 생성/삭제
- 엣지 생성/삭제
- 구조 변경

---

## 2. Schema is Law & Sanitation

### 2.1 Schema is Law

Schema(`kknm-schema-v1.md`)는 **법**이다.

```typescript
// ❌ 금지: 스키마 외 필드 추가
interface MindMapNode {
  id: string;
  position: Position;
  content: string;
  customField: any;  // 스키마에 없음 → 금지!
}

// ✅ 올바름: 스키마 엄격 준수
interface MindMapNode {
  id: string;
  position: { x: number; y: number };
  content: string;
  layoutControlled: boolean;
  direction: Direction | null;
  parentId: string | null;
  isCollapsed: boolean;
  // Schema에 정의된 필드만 존재
}
```

**강제 규칙**:
- 스키마에 정의되지 않은 필드는 **존재할 수 없다**
- 스키마에 정의되지 않은 데이터는 **존재하지 않는 것으로 간주**한다
- 추측, 자동 보정, 암묵적 복구는 **전면 금지**
- 위반 시 **즉시 실패(Fail Loudly)** 한다

### 2.2 schemaVersion 비교 규칙 — v4.2.8 신규

```typescript
/**
 * schemaVersion is a monotonically increasing integer.
 * Version comparison MUST be performed using simple integer comparison.
 * Semantic versioning is explicitly forbidden for schemaVersion.
 */

interface MindMapData {
  schemaVersion: number;  // 정수만 허용
  // ...
}

class SchemaVersionValidator {
  // ✅ 올바른 비교
  isCompatible(fileVersion: number, currentVersion: number): boolean {
    // 단순 정수 비교
    return fileVersion <= currentVersion;
  }
  
  // ❌ 금지: Semantic Versioning
  isCompatibleSemantic(fileVersion: string, currentVersion: string): boolean {
    // compareVersions() 라이브러리 사용 금지!
    // return compareVersions(fileVersion, currentVersion) <= 0;
  }
}
```

**schemaVersion 규칙**:

✅ **강제 사항**:
- `schemaVersion`은 **단조 증가하는 정수(monotonically increasing integer)**
- 버전 비교는 **단순 정수 비교(simple integer comparison)** 로만 수행
- `fileVersion <= currentVersion` 형태만 허용

❌ **명시적 금지**:
- Semantic Versioning (예: "1.2.3") **명시적으로 금지**
- compareVersions 라이브러리 사용 **금지**
- 문자열 기반 버전 비교 **금지**

**이유**: Forward-only 규칙을 확실하게 보장하고, AI의 잘못된 해석을 차단하기 위함

### 2.3 Schema-Driven Sanitation (무결성 회복)

Sanitation은 **단순한 삭제가 아닌 데이터 무결성 회복 과정**이다.

```typescript
/**
 * Schema-driven sanitation is not an optional cleanup,
 * but a mandatory integrity restoration process.
 * 
 * When structural violations are detected
 * (e.g. dangling or invalid edges),
 * the system MUST restore schema-level consistency
 * by removing invalid references,
 * without inference, guessing, or silent correction.
 */
class SchemaSanitizer {
  sanitize(data: MindMapData): MindMapData {
    // 1. 존재하지 않는 노드를 참조하는 엣지 제거
    const validNodeIds = new Set(Object.keys(data.nodes));
    
    const sanitizedEdges = Object.fromEntries(
      Object.entries(data.edges).filter(([id, edge]) => {
        const isValid = validNodeIds.has(edge.fromId) && 
                       validNodeIds.has(edge.toId);
        
        if (!isValid) {
          console.warn(`Invalid edge removed: ${id}`);
        }
        
        return isValid;
      })
    );
    
    // 2. Schema 준수 검증
    this.validateSchema(data);
    
    return {
      ...data,
      edges: sanitizedEdges
    };
  }
  
  private validateSchema(data: MindMapData): void {
    // Schema 위반 시 즉시 실패
    if (!data.version) {
      throw new Error('Missing version field');
    }
    
    if (!data.rootNodeId || !data.nodes[data.rootNodeId]) {
      throw new Error('Invalid root node');
    }
  }
}
```

**Sanitation 원칙**:
- Schema가 허용한 **최소한의 조치만** 수행
- 편의적 정리나 의미 추론은 **절대 금지**
- 모든 Sanitation은 **로그를 남긴다**

### 2.4 Sanitation 허용 시점 (Strict Timing Rule)

Sanitation은 **오직 다음 시점에서만** 수행될 수 있다:

```typescript
// ✅ 허용되는 Sanitation 시점
class DataLoader {
  async loadFile(file: TFile): Promise<MindMapData> {
    const raw = await this.app.vault.read(file);
    const parsed = JSON.parse(raw);
    
    // 1. 파일 로드(load) 시 (허용)
    const sanitized = this.sanitizer.sanitize(parsed);
    
    return sanitized;
  }
  
  async validateAndMigrate(data: MindMapData): Promise<MindMapData> {
    // 2. 명시적 검증(validation) 시 (허용)
    this.validator.validate(data);
    
    // 3. 마이그레이션(migration) 시 (허용)
    const migrated = this.migrator.migrate(data);
    const sanitized = this.sanitizer.sanitize(migrated);
    
    return sanitized;
  }
}

// ❌ 금지되는 Sanitation 시점
class Renderer {
  render(nodes: MindMapNode[]): void {
    // ❌ 렌더링 중 Sanitation 금지
    // const sanitized = this.sanitizer.sanitize(nodes);
    
    this.drawNodes(nodes);
  }
}

class InteractionHandler {
  onNodeClick(nodeId: string): void {
    // ❌ 인터랙션 중 Sanitation 금지
    // this.sanitizer.sanitize(this.data);
    
    this.selectNode(nodeId);
  }
}

class Editor {
  onNodeEdit(nodeId: string, content: string): void {
    // ❌ 편집 중 Sanitation 금지
    // this.sanitizer.sanitize(this.data);
    
    this.updateNode(nodeId, content);
  }
}

class ViewUpdater {
  updateView(data: MindMapData): void {
    // ❌ Projection/View Update 중 Sanitation 금지
    // const sanitized = this.sanitizer.sanitize(data);
    
    this.projectionRenderer.render(data);
  }
}
```

**Sanitation 시점 규칙**:

✅ **허용**:
- 파일 로드(load)
- 명시적 검증(validation)
- 마이그레이션(migration)

❌ **금지**:
- 렌더링
- 인터랙션
- 편집
- Projection 또는 View Update

**금지 이유**: 예측 불가능한 데이터 변경과 성능 저하를 방지하기 위함

---

## 3. Dirty State, Timestamp & Undo/Redo

### 3.1 Timestamp의 권위 (updatedAt)

`updatedAt`은 **오직 직렬화(Serialization) 시점**에만 갱신된다.

```typescript
/**
 * The updatedAt timestamp MUST be updated exclusively
 * at the moment of file serialization.
 * 
 * View changes, focus shifts, rendering,
 * or non-persistent UI interactions
 * MUST NOT modify timestamps
 * or imply file modification.
 */

// ❌ 금지: 뷰 변경 시 timestamp 갱신
function onViewChange() {
  this.data.meta.updatedAt = Date.now();  // 금지!
}

// ❌ 금지: 카메라 이동 시 timestamp 갱신
function onCameraMove() {
  this.data.meta.updatedAt = Date.now();  // 금지!
}

// ❌ 금지: 포커스 변경 시 timestamp 갱신
function onFocusChange() {
  this.data.meta.updatedAt = Date.now();  // 금지!
}

// ❌ 금지: 렌더링 시 timestamp 갱신
function onRender() {
  this.data.meta.updatedAt = Date.now();  // 금지!
}

// ✅ 올바름: 직렬화 시점에만 갱신
getViewData(): string {
  const data = this.serialize();
  data.meta.updatedAt = Date.now();  // 유일한 갱신 지점
  return JSON.stringify(data, null, 2);
}
```

**강제 규칙**:
- 뷰 이동, 포커스 변경, 렌더링으로 timestamp가 바뀌어서는 안 된다
- View 이동, 포커스 변경, UI 상호작용은 **파일 수정으로 간주되지 않는다**
- 뷰 이동만으로 파일이 수정된 것으로 보이는 현상을 **아키텍처 차원에서 금지**

### 3.2 Undo/Redo 연계

```typescript
/**
 * Undo/Redo가 마지막 직렬화 상태와 동일해질 경우,
 * isDirty는 반드시 해제되어야 한다.
 */
class UndoRedoManager {
  private lastSerializedState: string;
  
  async undo(): Promise<void> {
    // Undo 실행
    this.commandHistory.undo();
    
    // 현재 상태 직렬화
    const currentState = this.serialize();
    
    // 마지막 저장 상태와 비교
    if (currentState === this.lastSerializedState) {
      // 동일하면 isDirty 해제
      this.isDirty = false;
    } else {
      this.isDirty = true;
    }
  }
  
  async redo(): Promise<void> {
    // Redo 실행
    this.commandHistory.redo();
    
    // 현재 상태 직렬화
    const currentState = this.serialize();
    
    // 마지막 저장 상태와 비교
    if (currentState === this.lastSerializedState) {
      // 동일하면 isDirty 해제
      this.isDirty = false;
    } else {
      this.isDirty = true;
    }
  }
  
  async save(): Promise<void> {
    // 저장
    await this.saveFile();
    
    // 마지막 직렬화 상태 기록
    this.lastSerializedState = this.serialize();
    
    // isDirty 해제
    this.isDirty = false;
  }
}
```

**Undo/Redo 연계 규칙**:
- Undo/Redo 결과가 마지막 직렬화 상태와 동일해질 경우, **isDirty는 반드시 해제되어야 한다**
- 마지막 저장 상태로 돌아온 경우 isDirty가 유지되어서는 안 된다
- 이는 사용자 경험 향상을 위한 필수 규칙이다

### 3.3 저장 성능 정책 (Debounced Save)

```typescript
class AutoSaveManager {
  private saveTimeout: number | null = null;
  private readonly DEBOUNCE_MS = 300;  // 일반 편집: 300ms
  
  scheduleSave(reason: SaveReason): void {
    // 즉시 Flush 조건
    const immediateReasons = [
      SaveReason.DragEnd,
      SaveReason.FocusLost,
      SaveReason.ViewClose,
      SaveReason.ManualSave
    ];
    
    if (immediateReasons.includes(reason)) {
      this.flushNow();
      return;
    }
    
    // 일반 편집: 디바운스
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = window.setTimeout(() => {
      this.save();
    }, this.DEBOUNCE_MS);
  }
  
  private flushNow(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    this.save();
  }
}
```

**강제 규칙**:
- 데이터 유실 방지는 성능보다 **항상 우선**한다
- 드래그 종료, 포커스 상실, 뷰 종료 시 **즉시 저장**
- 일반 편집은 300ms 디바운스

---

## 4. 파일 시스템 아키텍처

### 4.1 TextFileView 상속 (필수)

```typescript
import { TextFileView, TFile } from 'obsidian';

export class NeroMindView extends TextFileView {
  allowNoFile = false;  // 파일 없이 열기 금지
  
  /**
   * 현재 상태를 JSON 문자열로 직렬화
   * 이 메서드가 호출되는 순간 = 파일 저장 시점
   */
  getViewData(): string {
    const data = this.serialize();
    
    // updatedAt은 직렬화 시점에만 갱신
    data.meta.updatedAt = Date.now();
    
    return JSON.stringify(data, null, 2);
  }
  
  /**
   * JSON 문자열을 파싱하여 상태 복원
   */
  setViewData(data: string, clear: boolean): void {
    if (clear) {
      this.clear();
    }
    
    try {
      const parsed = JSON.parse(data);
      
      // Schema 검증
      this.validateSchema(parsed);
      
      // Sanitation (파일 로드 시점 - 허용)
      const sanitized = this.sanitizer.sanitize(parsed);
      
      // 상태 복원
      this.deserialize(sanitized);
      
      // Projection 갱신
      this.render();
      
    } catch (e) {
      console.error('파일 로드 실패:', e);
      new Notice('파일이 손상되었거나 호환되지 않습니다.');
      
      // Fail Loudly
      throw e;
    }
  }
  
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.camera = this.getDefaultCamera();
    this.selection.clear();
  }
  
  getDisplayText(): string {
    return this.file?.basename || 'Untitled Mind Map';
  }
  
  getIcon(): string {
    return 'brain';
  }
}
```

### 4.2 원자적 쓰기 (Atomic Write) — 필수

모든 저장은 다음 절차를 **반드시** 따른다:

```typescript
class FileWriter {
  async save(file: TFile, data: string): Promise<void> {
    const tmpPath = file.path + '.tmp';
    
    try {
      // 1. 임시 파일 쓰기
      await this.app.vault.adapter.write(tmpPath, data);
      
      // 2. 쓰기 성공 확인
      const written = await this.app.vault.adapter.read(tmpPath);
      if (written !== data) {
        throw new Error('Write verification failed');
      }
      
      // 3. 원본 파일 교체 (원자적 연산)
      await this.app.vault.adapter.rename(tmpPath, file.path);
      
      // 4. isDirty 해제 (쓰기 완료 후에만)
      this.isDirty = false;
      
    } catch (e) {
      // 임시 파일 정리
      try {
        await this.app.vault.adapter.remove(tmpPath);
      } catch {}
      
      // Fail Loudly
      throw new Error(`File write failed: ${e.message}`);
    }
  }
}
```

**강제 규칙**:
- vault.adapter를 통한 파일 시스템 레벨 원자성 보장
- 쓰기 완료 전까지 `isDirty` 플래그는 해제될 수 없다
- 쓰기 실패 시 원본 파일은 **절대 손상되지 않는다**
- 임시 파일은 반드시 정리된다

### 4.3 파일 시그니처 및 소유권 검증

```typescript
interface MindMapData {
  version: string;  // "4.2.8"
  schemaVersion: number;  // 정수만 허용
  meta: {
    createdWith: "KK-NeroMind";  // 필수 시그니처
    createdAt: number;
    updatedAt: number;
  };
  // ...
}

class FileValidator {
  validate(data: MindMapData): ValidationResult {
    // 소유권 검증
    if (data.meta.createdWith !== "KK-NeroMind") {
      return {
        valid: false,
        error: 'Not a KK-NeroMind file',
        action: 'block'  // 기본 로딩 차단
      };
    }
    
    // 버전 호환성 검증 (단순 정수 비교)
    const currentSchemaVersion = 1;
    if (data.schemaVersion > currentSchemaVersion) {
      return {
        valid: false,
        error: `Incompatible schema version: ${data.schemaVersion}`,
        action: 'block'
      };
    }
    
    return { valid: true };
  }
}
```

**강제 규칙**:
- `meta.createdWith !== "KK-NeroMind"` → 기본 로딩 차단
- 사용자 명시 요청 시에만 **읽기 전용** 모드 허용
- 읽기 전용 모드에서는 수정, 자동 저장, 마이그레이션 **전면 금지**

---

## 5. 동기화 및 충돌 정책

### 5.1 다중 뷰 동기화 (Multi-View Sync)

```typescript
class MultiViewSyncManager {
  private views: Set<NeroMindView> = new Set();
  
  registerView(view: NeroMindView): void {
    this.views.add(view);
    
    // 뷰의 변경 이벤트 구독
    view.on('change', (data) => {
      this.broadcastChange(view, data);
    });
  }
  
  private broadcastChange(sourceView: NeroMindView, data: MindMapData): void {
    // 같은 파일을 열고 있는 다른 모든 뷰에 전파
    for (const view of this.views) {
      if (view === sourceView) continue;
      if (view.file?.path !== sourceView.file?.path) continue;
      
      // 다른 뷰 갱신
      view.setViewData(JSON.stringify(data), false);
    }
  }
}
```

**강제 규칙**:
- 동일 파일은 여러 View에서 동시에 열 수 있다
- 변경 사항은 Workspace Event를 통해 **즉시 전파**된다
- 한 View의 변경은 **모든 View에 즉시 반영**된다

### 5.2 외부 변경 대응 및 Conflict Lock — v4.2.8 강화

```typescript
/**
 * Conflict State는 외부 파일 변경과 로컬 Dirty 상태가
 * 동시에 존재할 때 진입하는 특수 상태다.
 * 
 * When entering Conflict Lock state, all save mechanisms,
 * including debounced auto-save timers, MUST be immediately suspended.
 * No serialization may occur until the conflict is resolved.
 * 
 * 이 상태에서는 사용자 결정이 있을 때까지
 * 편집 기능이 일시적으로 잠기며, 모든 저장 파이프라인이 중단된다.
 */
enum ViewState {
  Clean = 'clean',
  Dirty = 'dirty',
  Conflict = 'conflict',
  Locked = 'locked'
}

class ConflictResolver {
  private viewState: ViewState = ViewState.Clean;
  private autoSaveManager: AutoSaveManager;
  
  async handleExternalChange(file: TFile): Promise<void> {
    const view = this.getViewForFile(file);
    if (!view) return;
    
    // Clean 상태: 즉시 리로드
    if (this.viewState === ViewState.Clean) {
      await view.reload();
      new Notice('파일이 외부에서 수정되어 다시 로드되었습니다.');
      return;
    }
    
    // Dirty 상태: Conflict Lock 정책
    if (this.viewState === ViewState.Dirty) {
      // 1. Conflict State 진입
      this.viewState = ViewState.Conflict;
      
      // 2. Save Pipeline 즉시 중단 (v4.2.8 강화)
      this.autoSaveManager.suspend();
      
      // 3. Auto-Save 타이머 즉시 중단 (v4.2.8 강화)
      this.autoSaveManager.cancelPendingSave();
      
      // 4. 편집 기능 일시적 잠금
      view.setEditable(false);
      
      // 5. 충돌 해결 모달 표시
      const choice = await this.showConflictDialog({
        message: '파일이 외부에서 수정되었으나, 저장되지 않은 변경 사항이 있습니다.',
        warning: '결정 전까지 편집 및 저장이 잠깁니다.',
        options: [
          { label: '디스크 버전 로드 (로컬 변경 사항 손실)', value: 'load' },
          { label: '현재 상태 유지 (외부 변경 사항 덮어쓰기)', value: 'keep' }
        ]
      });
      
      // 6. 사용자 결정에 따라 처리
      if (choice === 'load') {
        await view.reload();
        this.viewState = ViewState.Clean;
        view.setEditable(true);
        view.isDirty = false;
        
        // Save Pipeline 재개
        this.autoSaveManager.resume();
        
      } else if (choice === 'keep') {
        this.viewState = ViewState.Dirty;
        view.setEditable(true);
        
        // Save Pipeline 재개
        this.autoSaveManager.resume();
      }
    }
  }
}

class AutoSaveManager {
  private suspended = false;
  private saveTimeout: number | null = null;
  
  suspend(): void {
    this.suspended = true;
    this.cancelPendingSave();
  }
  
  resume(): void {
    this.suspended = false;
  }
  
  cancelPendingSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }
  
  scheduleSave(reason: SaveReason): void {
    // Conflict Lock 중에는 저장 금지
    if (this.suspended) {
      console.warn('Save suspended during conflict state');
      return;
    }
    
    // 일반 저장 로직...
  }
}
```

**Conflict Lock 정책 (v4.2.8 강화)**:

✅ **Clean 상태**: 외부 변경 감지 시 **자동 리로드**

✅ **Dirty 상태**: 
  - 자동 리로드 **금지**
  - **Conflict State 진입**
  - **Save Pipeline 즉시 중단** ⭐ (v4.2.8 신규)
  - **Auto-Save 타이머 즉시 중단** ⭐ (v4.2.8 신규)
  - 편집 기능을 일시적으로 **잠금(Lock)** 처리
  - 사용자 결정 전까지 **상태 변경을 허용하지 않음**
  - 사용자 결정 전까지 **직렬화가 발생할 수 없음** ⭐ (v4.2.8 신규)

✅ **UX 가이드**:
  - 반투명 오버레이
  - 잠금 아이콘
  - **시각적으로 명확히 표현 강력 권장**

❌ **자동 병합 절대 금지**

**v4.2.8 강화 이유**: 
- 데이터 덮어쓰기 사고 방지
- AI의 "백그라운드에서 저장해도 되겠지?" 해석 차단
- Conflict 상태에서의 예측 불가능한 동작 완전 차단

---

## 6. Export & Rendering 정책

### 6.1 Projection 원칙

모든 Export(PNG, SVG, PDF)는 **Projection**이며  
**파일 상태를 변경해서는 안 된다**.

```typescript
// ✅ Export는 읽기 전용
class ExportManager {
  async export(format: ExportFormat): Promise<void> {
    // 파일 상태 읽기만 함
    const data = this.readCurrentState();
    
    // Projection 생성
    const exported = this.createProjection(data, format);
    
    // 파일 상태는 절대 변경하지 않음
    // this.saveFile();  // 금지!
    
    return exported;
  }
}
```

### 6.2 기본 렌더 타겟

```typescript
enum ExportFormat {
  PNG = 'png',   // 기본 출력 포맷
  SVG = 'svg'    // 기본 출력 포맷
}
```

**PNG**와 **SVG**가 **기본 출력 포맷**이다.

### 6.3 PDF 구현 범위

PDF는 **직접 렌더링하지 않는다**.

```typescript
/**
 * PDF is NOT a direct rendering target.
 * 
 * Allowed PDF output methods:
 * 1. Vector PDF conversion from SVG serialization
 * 2. Fallback to Obsidian's built-in print feature
 * 
 * Direct PDF rendering or page layout calculation
 * is an architectural violation.
 * 
 * Font embedding and page splitting are deferred to Phase 2.
 */
class ExportManager {
  async exportPDF(range: ExportRange): Promise<void> {
    // ✅ 허용: SVG → PDF 변환
    const svgEl = this.getSVGElement(range);
    const svgData = new XMLSerializer().serializeToString(svgEl);
    
    // SVG 직렬화 후 벡터 PDF 변환
    const pdf = await this.convertSVGToPDF(svgData);
    await this.saveBlob(pdf, 'pdf');
  }
  
  // ❌ 금지: PDF 직접 렌더링
  async exportPDFDirect(): Promise<void> {
    // const pdf = new jsPDF();
    // pdf.addPage();
    // pdf.text(...);  // 직접 그리기 금지!
  }
  
  // ✅ 허용: Obsidian 기본 인쇄 기능 활용
  async exportPDFFallback(): Promise<void> {
    // window.print() 또는 Obsidian API 활용
  }
}
```

**PDF 구현 범위**:

✅ **허용**:
- SVG 직렬화 후 **벡터 PDF 변환**
- Obsidian 기본 인쇄 기능을 **Fallback**으로 사용

❌ **금지**:
- PDF를 직접 그리기
- 페이지 레이아웃 계산
- PDF 전용 렌더링 로직

⏸️ **Phase 2 이후로 유예**:
- 폰트 임베딩
- 페이지 분할

**위반 시**: 아키텍처 결함으로 간주

---

## 7. UI 격리 원칙 (In-Canvas Isolation)

### 7.1 독립 배치 원칙

```typescript
class NeroMindView extends TextFileView {
  async onOpen(): Promise<void> {
    // ✅ 모든 UI 요소는 this.contentEl 내부에만 배치
    const canvas = this.contentEl.createDiv('neromind-canvas');
    const fab = this.contentEl.createDiv('neromind-fab');
    const toolbar = this.contentEl.createDiv('neromind-toolbar');
    
    // ❌ 금지: View 컨테이너 외부에 배치
    // document.body.appendChild(fab);  // 절대 금지!
  }
}
```

**강제 규칙**:
- 모든 UI 요소는 **반드시** `this.contentEl`을 부모로 한다
- View 컨테이너 내부에서만 Absolute 배치한다
- Absolute positioning은 View 컨테이너 내부에서만 허용

### 7.2 헤더 비간섭 원칙

```typescript
// ❌ 금지: Obsidian 헤더에 대한 보정
.neromind-canvas {
  height: calc(100vh - 48px);  /* 헤더 높이 가정 → 금지! */
  margin-top: -24px;           /* 헤더 보정 → 금지! */
}

// ✅ 올바름: 컨테이너 크기 그대로 사용
.neromind-canvas {
  width: 100%;
  height: 100%;
  position: relative;
}
```

**강제 규칙**:
- Obsidian Header(Breadcrumbs)에 대한 높이 보정, margin 계산, CSS override를 **전면 금지**
- UI는 헤더와 **논리적·물리적으로 완전히 분리**
- 레이아웃 계산, 높이 추정, margin override **전면 금지**

---

## 8. 설정 시스템

### 8.1 경로 및 폴더 관리

```typescript
import { normalizePath } from 'obsidian';

class FolderManager {
  async ensureFolderExists(path: string): Promise<void> {
    // 1. 경로 정규화 (필수)
    const normalized = normalizePath(path);
    
    // 2. 멱등성 보장
    const existing = this.app.vault.getAbstractFileByPath(normalized);
    if (existing) return;
    
    // 3. 중첩 폴더 생성
    await this.app.vault.createFolder(normalized);
  }
}
```

**강제 규칙**:
- 모든 경로는 `normalizePath()` **필수**
- Vault 루트 기준 상대 경로만 저장
- 중첩 폴더 생성은 **멱등성** 보장

### 8.2 Folder Creation Idempotency (멱등성)

폴더 생성 로직은 반드시 **멱등성(Idempotency)** 을 보장해야 한다.

```typescript
class FolderCreator {
  async createFolderIdempotent(path: string): Promise<void> {
    const normalized = normalizePath(path);
    
    // 멱등성: 저장 시마다 호출해도 안전
    const parts = normalized.split('/');
    let currentPath = '';
    
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      // 이미 존재하는 폴더는 스킵
      const existing = this.app.vault.getAbstractFileByPath(currentPath);
      if (existing) continue;
      
      // 없는 폴더만 생성
      await this.app.vault.createFolder(currentPath);
    }
  }
}
```

**멱등성 규칙**:
- 저장 시마다 호출되어도 **안전**해야 한다
- 중첩 경로(A/B/C)는 누락된 모든 상위 폴더를 **재귀적으로 생성**
- 이미 존재하는 폴더에 대해 **실패해서는 안 된다**

### 8.3 Settings UI 수식

```typescript
// ✅ 올바른 수식 (공백은 명시적 문자열)
function generateFilename(settings: NeroMindSettings): string {
  const prefix = settings.saving.filenamePrefix;
  const dateStr = moment().format(settings.saving.filenameDateFormat);
  const ext = settings.saving.useExtendedExtension ? '.kkneromind.kknm' : '.kknm';
  
  // 수식: {prefix} + " " + moment().format({date}) + {ext}
  return `${prefix} ${dateStr}${ext}`;
}

// 예시 출력: "Making 2026-01-16 14.30.45.kknm"
```

**강제 규칙**:
- 공백은 명시적 문자열 `" "`로 표현되어야 한다
- Prefix와 Date 사이 공백 필수

### 8.4 Auto-Save OFF UX

```typescript
class AutoSaveOffHandler {
  handleViewClose(): void {
    if (this.settings.saving.autoSave) {
      // Auto-Save ON: 자동 저장
      this.save();
      return;
    }
    
    // Auto-Save OFF: 저장 확인 모달 강제
    if (this.isDirty) {
      const choice = this.showSaveConfirmDialog();
      
      if (choice === 'save') {
        this.save();
      } else if (choice === 'discard') {
        // 명시적 폐기
        this.isDirty = false;
      } else {
        // 취소 → View 닫기 차단
        return;
      }
    }
  }
}
```

**강제 규칙**:
- Unsaved Changes 인디케이터 표시
- View 종료 시 저장 확인 모달 **강제**
- 묵시적 폐기 **금지**

---

## 9. Fail Loudly 규약 — v4.2.8 강화

Fail Loudly란 다음을 의미한다:

```typescript
/**
 * Fail Loudly means:
 * - Immediate error surfacing to the user
 * - Immediate termination of the current operation context
 *   (load, save, migration, or render)
 * - No partial continuation is allowed
 */

// ✅ Fail Loudly
class Validator {
  validate(data: MindMapData): void {
    if (!data.version) {
      // 1. 명시적 에러 발생
      throw new Error('Missing version field');
    }
    
    if (!data.rootNodeId) {
      // 2. 사용자에게 인지 가능한 오류 상태 노출
      new Notice('파일이 손상되었습니다: 루트 노드 없음', 0);
      
      // 3. 현재 작업 컨텍스트의 즉각 중단
      throw new Error('Missing root node');
    }
  }
}

// ❌ Silent Failure (금지)
class BadValidator {
  validate(data: MindMapData): void {
    if (!data.version) {
      // 로그만 출력 → Silent Failure
      console.warn('Missing version field');
      
      // 기본값으로 복구 → Silent Correction
      data.version = '4.2.8';
      
      // 일부만 로드 → Partial Continuation
      this.loadPartially(data);
    }
  }
}
```

**Fail Loudly 규칙 (v4.2.8 강화)**:

✅ **필수**:
- 명시적 에러 발생
- **사용자에게 인지 가능한 오류 상태 노출**
- **현재 작업 컨텍스트(load, save, migration, render)의 즉각 중단** ⭐ (v4.2.8 명확화)

❌ **금지**:
- 로그 출력만으로는 실패로 간주하지 않음
- Silent fallback **절대 허용 안 됨**
- Silent correction **절대 금지**
- 부분 성공, 자동 무시, 묵살 **허용되지 않음**
- **부분 계속(Partial Continuation) 금지** ⭐ (v4.2.8 명확화)

**v4.2.8 명확화 이유**:
- "컨텍스트 단위 중단"을 못 박아야 AI가 "일단 렌더는 하자" 같은 짓을 안 함
- 작업 컨텍스트 명시: load, save, migration, render
- 부분 계속 금지 명시

---

## 10. AI 구현체 금지 규칙

### 10.1 AI 및 인간 구현체가 반드시 따라야 할 규칙

```typescript
/**
 * AI Implementation Restrictions
 * 
 * These rules apply to ALL implementers,
 * including AI agents and human developers.
 */

// ❌ 추측 금지 (No Guessing)
class BadAIImplementation {
  loadFile(data: any): MindMapData {
    // 추측으로 누락 필드 생성 ❌
    if (!data.rootNodeId) {
      data.rootNodeId = this.guessRootNode(data.nodes);  // 금지!
    }
  }
}

// ❌ 자동 보정 금지 (No Auto-Correction)
class BadAIImplementation {
  sanitize(data: MindMapData): MindMapData {
    // 자동 보정 ❌
    data.nodes = data.nodes.map(node => ({
      ...node,
      layoutControlled: node.layoutControlled ?? true  // 금지!
    }));
  }
}

// ❌ 누락 데이터 생성 금지 (No Data Generation)
class BadAIImplementation {
  deserialize(data: any): MindMapState {
    // 누락 데이터 자동 생성 ❌
    if (!data.meta) {
      data.meta = {
        createdWith: 'KK-NeroMind',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };  // 금지!
    }
  }
}

// ✅ 스키마 위반 시: 거부 또는 Read-Only
class GoodAIImplementation {
  loadFile(data: any): MindMapData {
    // 1. 스키마 검증
    if (!this.validator.isValid(data)) {
      // 2. 거부
      throw new Error('Schema validation failed');
      
      // 또는 Read-Only 모드
      // return this.loadAsReadOnly(data);
    }
    
    return data;
  }
}
```

**AI 구현체 금지 규칙 요약**:

❌ **추측 금지** (No Guessing)
- 누락된 필드를 추측으로 채우지 않는다
- 불명확한 데이터를 추론하지 않는다

❌ **자동 보정 금지** (No Auto-Correction)
- 잘못된 데이터를 자동으로 보정하지 않는다
- 기본값으로 대체하지 않는다

❌ **누락 데이터 생성 금지** (No Data Generation)
- 없는 필드를 자동으로 생성하지 않는다
- 편의를 위한 데이터 추가 금지

✅ **스키마 위반 시**:
- **거부 (Reject)** 또는
- **읽기 전용 (Read-Only)** 모드만 허용

---

## 11. Golden Rules

### 절대 규칙 (Absolute Rules)

```
1. File First
   파일이 유일한 진실이다

2. Schema is Law
   규율이 편의보다 우선한다

3. Intent is Pure
   Intent는 선언적이며 부작용이 없다

4. Sanitation is Explicit
   Sanitation은 정해진 시점에만 수행한다

5. Fail Loudly
   에러를 숨기지 않는다

6. UI is Isolated
   UI는 뷰 내부에만 존재한다

7. Export is Projection
   Export는 파일 상태를 변경하지 않는다

8. No Auto-Merge
   자동 병합을 절대 하지 않는다

9. Atomic Write
   파일 쓰기는 항상 원자적이다

10. No Silent Correction
    암묵적 보정을 절대 하지 않는다

11. Projection Only
    View는 파일의 투영일 뿐이다

12. AI Must Not Guess
    AI는 추측, 보정, 생성을 하지 않는다

13. Context Termination (v4.2.8 신규)
    에러 발생 시 작업 컨텍스트를 즉각 중단한다

14. Conflict Suspension (v4.2.8 신규)
    Conflict 시 모든 저장 메커니즘을 즉시 중단한다

15. Integer Versioning (v4.2.8 신규)
    schemaVersion은 정수이며 단순 비교만 허용한다
```

---

## 12. 문서 권위 계층 (Authority Hierarchy)

KK-NeroMind 아키텍처는 아래 문서들에 의해 지배되며,  
위에서 아래로 갈수록 권위가 낮다.

```
1. KK-NeroMind-Architecture-v4.2.8.md (본 문서)
   └─ 아키텍처 헌법 (Architectural Constitution)
   └─ AI 통제 규약 (AI Control Protocol)

2. kknm-schema-v1.md
   └─ 데이터 구조 법 (Data Structure Law)

3. textfileview-skeleton.md
   └─ 파일 I/O 규범 (File I/O Specification)

4. settings-ui.md
   └─ 설정 UI 규범 (Settings UI Specification)

5. KK-NeroMind-Coding-Guidelines-v2.1.md
   └─ 구현 가이드라인 (Implementation Guidelines)

6. KK-NeroMind-Development-Roadmap-v2.1.md
   └─ 개발 로드맵 (Development Roadmap)
```

**하위 문서는 상위 문서를 위반할 수 없다.**

### 강제 참조 규칙

- File I/O 및 Dirty State 로직 → `textfileview-skeleton.md`
- 데이터 구조 검증 및 Sanitation → `kknm-schema-v1.md`
- 설정 UI 및 영속성 → `settings-ui.md`

---

## 13. 구현 체크리스트

### Phase 0: 파일 시스템 (최우선)

- [ ] TextFileView 상속
- [ ] getViewData() / setViewData() 구현
- [ ] .kknm 확장자 등록
- [ ] 원자적 쓰기 구현
- [ ] updatedAt은 직렬화 시점에만 갱신
- [ ] 비영속 상태는 isDirty 트리거 금지

### Phase 0.3: Undo/Redo 연계

- [ ] 마지막 직렬화 상태 기록
- [ ] Undo/Redo 후 상태 비교
- [ ] 동일 시 isDirty 해제

### Phase 0.5: Intent & Sanitation

- [ ] Intent는 선언적이며 부작용 없음
- [ ] Sanitation은 정해진 시점에만 수행
- [ ] 렌더링/인터랙션/편집 중 Sanitation 금지

### Phase 0.7: 충돌 해결 & Export

- [ ] Conflict State 구현
- [ ] Save Pipeline 즉시 중단 (v4.2.8)
- [ ] Auto-Save 타이머 즉시 중단 (v4.2.8)
- [ ] 외부 변경 감지 시 편집 잠금
- [ ] PNG/SVG 기본 출력 포맷
- [ ] PDF는 SVG 변환 또는 Fallback만

### Phase 0.8: Schema & Fail Loudly (v4.2.8 신규)

- [ ] schemaVersion은 정수만 허용
- [ ] 버전 비교는 단순 정수 비교만
- [ ] Fail Loudly는 컨텍스트 즉각 중단
- [ ] 부분 계속 금지

### Phase 0.9: AI 제어

- [ ] 추측 금지 규칙 적용
- [ ] 자동 보정 금지 규칙 적용
- [ ] 스키마 위반 시 거부 또는 Read-Only

### Phase 1-6: 기존 Phase

- [ ] 카메라 단일 진입점
- [ ] layoutControlled 필터링
- [ ] Interaction Priority Table
- [ ] Follow Selection
- [ ] 내비게이션 시스템
- [ ] Viewport Culling

---

## 14. 종결 선언 (Final Declaration)

본 문서는 **KK-NeroMind v4.2.8의 아키텍처 헌법**을 최종 확정하며,  
이 문서를 기준으로 모든 아키텍처 논의는 **종료**된다.

**본 헌법을 어기는 구현은 즉시 버그로 처리한다.**

본 문서와 충돌하는 모든 구현은 **명세 위반 버그**이며,  
본 문서와 충돌하는 모든 해석은 **무효**다.

**아키텍처 헌법 완전 봉인 완료 (Fully Sealed).**

---

**Author**: Nero-kk  
**GitHub**: [https://github.com/Nero-kk](https://github.com/Nero-kk)  
**YouTube**: [https://www.youtube.com/@Nero-kkk](https://www.youtube.com/@Nero-kkk)  
**Blog**: [http://nero-k.tistory.com](http://nero-k.tistory.com/)  
**Buy Me a Coffee**: [https://buymeacoffee.com/nerokk](https://buymeacoffee.com/nerokk)

---

## 🔄 v4.2.7 → v4.2.8 변경사항

| 항목 | v4.2.7 | v4.2.8 |
|-----|--------|--------|
| **Conflict Lock** | 편집 잠금 | **Save Pipeline 중단** ⭐ |
| **Auto-Save** | 기본 중단 | **타이머 즉시 취소** ⭐ |
| **schemaVersion** | 미정의 | **정수 단순 비교** ⭐ |
| **Fail Loudly** | 컨텍스트 중단 | **작업별 명시** ⭐ |
| **Partial Continue** | 미정의 | **명시적 금지** ⭐ |
| **Golden Rules** | 12개 | **15개** ⭐ |

### 🆕 v4.2.8 신규 추가 개념

1. ⭐ **Conflict Lock 강화** - Save Pipeline 즉시 중단, Auto-Save 타이머 취소
2. ⭐ **schemaVersion 비교 규칙** - 정수 단순 비교만 허용, Semantic Versioning 금지
3. ⭐ **Fail Loudly 명확화** - 작업 컨텍스트 명시 (load, save, migration, render)
4. ⭐ **부분 계속 금지** - Partial Continuation 명시적 금지
5. ⭐ **Golden Rules 확장** - 13. Context Termination, 14. Conflict Suspension, 15. Integer Versioning

### 🔒 헌법 구멍 봉인 완료

✅ **A. Conflict Lock 상태 정의 완성**
- Save Pipeline 중단 명시
- Auto-Save 타이머 중단 명시
- 직렬화 금지 명시

✅ **B. schemaVersion 비교 규칙 추가**
- 단조 증가 정수 명시
- 단순 정수 비교만 허용
- Semantic Versioning 명시적 금지

✅ **C. Fail Loudly 중단 범위 명확화**
- 작업 컨텍스트 명시
- 부분 계속 금지 명시
- "일단 렌더는 하자" 같은 AI 행동 차단

---

**Architecture Frozen + Fully Sealed + No More Holes** 🚀⚖️🔒

# KK-NeroMind Coding Guidelines v4.2.8

> **최종 업데이트**: 2026-01-16  
> **버전**: 4.2.8 (Architecture Constitution Fully Ratified)  
> **문서 성격**: **규칙이 아니라 판결문**  
> **기반**: Architecture v4.2.8 완전 준수

---

## 📜 이 문서의 지위

본 문서는:
- 가이드라인이 아니다 ❌
- 권장사항이 아니다 ❌
- **판결문이다** ✅
- **집행 가능한 법이다** ✅

**본 문서를 위반하는 코드는 즉시 버그로 처리한다.**

---

## 0. 핵심 원칙 (Golden Rules)

### 절대 규칙 15개

```
1. File First - 파일이 유일한 진실이다
2. Schema is Law - 규율이 편의보다 우선한다
3. Intent is Pure - Intent는 선언적이며 부작용이 없다
4. Sanitation is Explicit - Sanitation은 정해진 시점에만 수행한다
5. Fail Loudly - 에러를 숨기지 않는다
6. UI is Isolated - UI는 뷰 내부에만 존재한다
7. Export is Projection - Export는 파일 상태를 변경하지 않는다
8. No Auto-Merge - 자동 병합을 절대 하지 않는다
9. Atomic Write - 파일 쓰기는 항상 원자적이다
10. No Silent Correction - 암묵적 보정을 절대 하지 않는다
11. Projection Only - View는 파일의 투영일 뿐이다
12. AI Must Not Guess - AI는 추측, 보정, 생성을 하지 않는다
13. Context Termination - 에러 발생 시 작업 컨텍스트를 즉각 중단한다
14. Conflict Suspension - Conflict 시 모든 저장 메커니즘을 즉시 중단한다
15. Integer Versioning - schemaVersion은 정수이며 단순 비교만 허용한다
```

---

## 1. Intent Purity (최상위 규칙)

### 1.1 Intent는 "의도 설명서"다

Intent는 **WHAT(무엇을 원하는지)만 기술**한다.  
Intent는 **HOW(어떻게 실행할지)를 포함하지 않는다**.

```typescript
// ✅ 올바른 Intent
interface MoveNodeIntent {
  type: 'MOVE_NODE';
  nodeId: string;
  newPosition: { x: number; y: number };
}

function onNodeDrag(nodeId: string, newPos: Position) {
  // Intent 생성만
  const intent: MoveNodeIntent = {
    type: 'MOVE_NODE',
    nodeId,
    newPosition: newPos
  };
  
  // Engine에 전달
  this.intentProcessor.process(intent);
}
```

### 1.2 Intent는 절대 다음을 하지 않는다

```typescript
// ❌ 금지: Intent 내부 연산
interface BadIntent {
  execute() {
    // 좌표 정규화 ❌
    this.newPosition.x = Math.round(this.newPosition.x);
    
    // 기본값 추측 ❌
    if (!this.layoutControlled) {
      this.layoutControlled = true;
    }
    
    // 구조 보정 ❌
    this.removeInvalidEdges();
    
    // 상태 직접 변경 ❌
    this.node.position = this.newPosition;
  }
}
```

### 1.3 Engine이 Intent를 해석한다

```typescript
// ✅ Engine이 Intent 처리
class IntentProcessor {
  process(intent: Intent): void {
    // 1. 유효성 검증
    this.validate(intent);
    
    // 2. Command 생성
    const command = this.createCommand(intent);
    
    // 3. 실행
    this.commandManager.execute(command);
    
    // 4. isDirty 마킹
    this.markDirty();
  }
}
```

**강제 규칙**:
- Intent는 데이터만 포함
- Intent는 로직 포함 금지
- Intent는 정규화/보정/추론 금지
- Engine이 Intent 해석
- Engine이 유효성 검증
- Engine이 상태 변경

---

## 2. Strict Sanitation (엄격한 정화)

### 2.1 허용 시점 (3가지만)

```typescript
// ✅ 허용: 파일 로드
async loadFile(file: TFile): Promise<MindMapData> {
  const raw = await this.app.vault.read(file);
  const parsed = JSON.parse(raw);
  
  // Sanitation 허용
  const sanitized = this.sanitizer.sanitize(parsed);
  return sanitized;
}

// ✅ 허용: 명시적 검증
validateData(data: MindMapData): MindMapData {
  this.validator.validate(data);
  
  // Sanitation 허용
  const sanitized = this.sanitizer.sanitize(data);
  return sanitized;
}

// ✅ 허용: 마이그레이션
migrate(data: MindMapData): MindMapData {
  const migrated = this.migrator.migrate(data);
  
  // Sanitation 허용
  const sanitized = this.sanitizer.sanitize(migrated);
  return sanitized;
}
```

### 2.2 금지 시점

```typescript
// ❌ 금지: 렌더 중
render(nodes: MindMapNode[]): void {
  // 렌더 중 데이터 수정 금지!
  // const sanitized = this.sanitizer.sanitize(nodes);
  
  this.drawNodes(nodes);
}

// ❌ 금지: UI 이벤트 중
onNodeClick(nodeId: string): void {
  // UI 이벤트 중 자동 정화 금지!
  // this.sanitizer.sanitize(this.data);
  
  this.selectNode(nodeId);
}

// ❌ 금지: 편집 중
onNodeEdit(nodeId: string, content: string): void {
  // 편집 중 데이터 정화 금지!
  // this.sanitizer.sanitize(this.data);
  
  this.updateNode(nodeId, content);
}
```

### 2.3 Sanitation 원칙

```typescript
class SchemaSanitizer {
  sanitize(data: MindMapData): MindMapData {
    // 1. Schema가 허용한 최소 조치만
    const validNodeIds = new Set(Object.keys(data.nodes));
    
    const sanitizedEdges = Object.fromEntries(
      Object.entries(data.edges).filter(([id, edge]) => {
        const isValid = validNodeIds.has(edge.fromId) && 
                       validNodeIds.has(edge.toId);
        
        // 2. 모든 Sanitation 로그 기록
        if (!isValid) {
          console.warn(`Invalid edge removed: ${id}`);
        }
        
        return isValid;
      })
    );
    
    // 3. 추론/보정 금지
    // ❌ 이런 짓 하지 마라:
    // - "이 노드는 아마도 root일 것 같아"
    // - "layoutControlled는 보통 true니까 true로 설정"
    // - "누락된 필드는 기본값으로 채워줄게"
    
    return {
      ...data,
      edges: sanitizedEdges
    };
  }
}
```

**강제 규칙**:
- 조용한 정화 = 버그 제조기
- "이 정도는 괜찮겠지" 금지
- Schema가 허용한 최소 조치만
- 모든 Sanitation 로그 필수

---

## 3. Atomic Write (비타협)

### 3.1 필수 흐름 (4단계)

```typescript
class FileWriter {
  async save(file: TFile, data: string): Promise<void> {
    const tmpPath = file.path + '.tmp';
    
    try {
      // 1. temp 파일 생성
      await this.app.vault.adapter.write(tmpPath, data);
      
      // 2. write 성공 검증
      const written = await this.app.vault.adapter.read(tmpPath);
      if (written !== data) {
        throw new Error('Write verification failed');
      }
      
      // 3. 원본 교체 (원자적 연산)
      await this.app.vault.adapter.rename(tmpPath, file.path);
      
      // 4. 성공 후 isDirty 해제
      this.isDirty = false;
      
    } catch (e) {
      // 실패 시 원본 유지
      try {
        await this.app.vault.adapter.remove(tmpPath);
      } catch {}
      
      throw new Error(`File write failed: ${e.message}`);
    }
  }
}
```

### 3.2 금지 패턴

```typescript
// ❌ 금지: 스트림 덮어쓰기
async badSave(file: TFile, data: string): Promise<void> {
  // 원본 직접 수정 → 실패 시 파일 손상!
  await this.app.vault.adapter.write(file.path, data);
}

// ❌ 금지: 부분 저장
async badPartialSave(file: TFile, data: string): Promise<void> {
  // 일부만 저장 → 상태 불일치!
  const partial = data.substring(0, 1000);
  await this.app.vault.adapter.write(tmpPath, partial);
}

// ❌ 금지: 실패 무시
async badIgnoreFailure(file: TFile, data: string): Promise<void> {
  try {
    await this.app.vault.adapter.write(tmpPath, data);
  } catch (e) {
    // 실패 무시 → 데이터 손실!
    console.log('Save failed, but continuing...');
  }
}
```

**강제 규칙**:
- 임시 파일 → 검증 → 교체
- 실패 시 원본 절대 손상 금지
- vault.adapter 사용 필수
- 직접 파일 시스템 접근 금지

---

## 4. Fail Loudly (에러는 침묵하지 않는다)

### 4.1 필수 동작

```typescript
// ✅ 올바른 Fail Loudly
class Validator {
  validate(data: MindMapData): void {
    if (!data.version) {
      // 1. 명시적 에러 발생
      throw new Error('Missing version field');
    }
    
    if (!data.rootNodeId) {
      // 2. 사용자 경고
      new Notice('파일이 손상되었습니다: 루트 노드 없음', 0);
      
      // 3. 현재 작업 즉시 중단
      throw new Error('Missing root node');
    }
  }
}
```

### 4.2 금지 패턴

```typescript
// ❌ 금지: try-catch 후 계속 진행
async badLoad(file: TFile): Promise<void> {
  try {
    const data = await this.loadFile(file);
    this.deserialize(data);
  } catch (e) {
    console.error('Load failed, but continuing...');
    // 계속 진행 → 상태 불일치!
    this.render();
  }
}

// ❌ 금지: 콘솔 로그로 대체
validate(data: MindMapData): void {
  if (!data.version) {
    // 로그만 출력 → Silent Failure!
    console.warn('Missing version field');
    
    // 기본값으로 복구 → Silent Correction!
    data.version = '4.2.8';
  }
}

// ❌ 금지: 조용한 fallback
async badSave(): Promise<void> {
  try {
    await this.atomicWrite();
  } catch (e) {
    // 조용히 fallback → 사용자 모름!
    await this.fallbackWrite();
  }
}

// ❌ 금지: 부분 계속 (Partial Continuation)
async badPartialLoad(file: TFile): Promise<void> {
  try {
    const data = await this.loadFile(file);
    this.deserialize(data);
  } catch (e) {
    // 일부만 로드 → 상태 불일치!
    this.loadPartially(file);
    this.render(); // 일단 렌더는 하자 ❌
  }
}
```

### 4.3 작업 컨텍스트 중단

```typescript
/**
 * Fail Loudly means:
 * - Immediate error surfacing to the user
 * - Immediate termination of the current operation context
 *   (load, save, migration, or render)
 * - No partial continuation is allowed
 */

// ✅ 올바른 컨텍스트 중단
async load(file: TFile): Promise<void> {
  try {
    // 1. 파일 읽기
    const raw = await this.app.vault.read(file);
    
    // 2. 파싱
    const parsed = JSON.parse(raw);
    
    // 3. 검증 (실패 시 여기서 중단)
    this.validator.validate(parsed);
    
    // 4. Sanitation
    const sanitized = this.sanitizer.sanitize(parsed);
    
    // 5. 역직렬화
    this.deserialize(sanitized);
    
    // 6. 렌더
    this.render();
    
  } catch (e) {
    // 전체 load 컨텍스트 중단
    new Notice('파일 로드 실패: ' + e.message);
    throw e; // 상위로 전파
  }
}
```

**강제 규칙**:
- throw Error 필수
- Notice로 사용자 알림 필수
- 작업 컨텍스트 즉시 중단 필수
- Silent failure 금지
- Silent fallback 금지
- Silent correction 금지
- Partial continuation 금지

---

## 5. AI 전용 금지 규칙

### 5.1 AI는 절대 다음을 하지 않는다

```typescript
// ❌ AI 금지 1: 누락 필드 생성
class BadAIImplementation {
  loadFile(data: any): MindMapData {
    // 추측으로 필드 생성 ❌
    if (!data.rootNodeId) {
      data.rootNodeId = this.guessRootNode(data.nodes);
    }
    
    // 기본값으로 채우기 ❌
    if (!data.meta) {
      data.meta = {
        createdWith: 'KK-NeroMind',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
  }
}

// ❌ AI 금지 2: 구조 추측
class BadAIImplementation {
  sanitize(data: MindMapData): MindMapData {
    // "이 노드는 아마 root일 것 같아" ❌
    if (!data.rootNodeId) {
      const firstNode = Object.keys(data.nodes)[0];
      data.rootNodeId = firstNode; // 추측 금지!
    }
  }
}

// ❌ AI 금지 3: 의미 보정
class BadAIImplementation {
  deserialize(data: any): void {
    // "layoutControlled는 보통 true니까" ❌
    data.nodes = data.nodes.map(node => ({
      ...node,
      layoutControlled: node.layoutControlled ?? true
    }));
  }
}

// ❌ AI 금지 4: "보통 이런 경우" 판단
class BadAIImplementation {
  migrate(data: MindMapData): MindMapData {
    // "보통 이럴 땐 이렇게 하니까" ❌
    if (data.version === '4.2.7') {
      // 추측 기반 마이그레이션 금지!
      data.newField = this.guessNewFieldValue();
    }
  }
}
```

### 5.2 AI는 Schema 위반 시 거부한다

```typescript
// ✅ 올바른 AI 동작
class GoodAIImplementation {
  loadFile(data: any): MindMapData {
    // 1. Schema 검증
    if (!this.validator.isValid(data)) {
      // 2. 즉시 거부
      throw new Error('Schema validation failed');
      
      // 또는 Read-Only 모드
      // return this.loadAsReadOnly(data);
    }
    
    // 3. 추측/보정/생성 없이 그대로 반환
    return data;
  }
}
```

**강제 규칙**:
- AI는 도구이지 판단 주체가 아니다
- AI는 컴파일러 보조이지 설계자가 아니다
- 추측 금지
- 자동 보정 금지
- 데이터 생성 금지
- "보통 이런 경우" 판단 금지

---

## 6. UI Isolation (UI 격리)

### 6.1 독립 배치 원칙

```typescript
// ✅ 올바른 UI 배치
class NeroMindView extends TextFileView {
  async onOpen(): Promise<void> {
    // 모든 UI는 this.contentEl 내부
    const canvas = this.contentEl.createDiv('neromind-canvas');
    const fab = this.contentEl.createDiv('neromind-fab');
    const toolbar = this.contentEl.createDiv('neromind-toolbar');
    
    // position: absolute는 View 내부에서만
    fab.style.position = 'absolute';
    fab.style.bottom = '20px';
    fab.style.right = '20px';
  }
}

// ❌ 금지: 외부 DOM 의존
class BadView extends TextFileView {
  async onOpen(): Promise<void> {
    // document.body 접근 금지!
    const fab = document.body.createDiv('neromind-fab');
    
    // Obsidian 헤더 높이 계산 금지!
    const headerHeight = document.querySelector('.view-header')?.offsetHeight;
    this.canvas.style.marginTop = `-${headerHeight}px`;
  }
}
```

### 6.2 헤더 비간섭 원칙

```css
/* ❌ 금지: Obsidian 헤더 보정 */
.neromind-canvas {
  height: calc(100vh - 48px); /* 헤더 높이 가정 → 금지! */
  margin-top: -24px;          /* 헤더 보정 → 금지! */
}

/* ✅ 올바름: 컨테이너 크기 그대로 */
.neromind-canvas {
  width: 100%;
  height: 100%;
  position: relative;
}
```

**강제 규칙**:
- 모든 UI는 `this.contentEl` 내부
- `position: absolute` 기준점은 View
- Obsidian 헤더 높이 계산 금지
- 외부 DOM 의존 금지
- margin 트릭 금지

---

## 7. State & Timestamp

### 7.1 비영속 상태 분리

```typescript
// ❌ isDirty 트리거 금지
interface NonPersistentState {
  camera: { offsetX: number; offsetY: number; scale: number };
  selection: Set<string>;
  highlightedNodeId: string | null;
  viewport: { width: number; height: number };
  isSearchOpen: boolean;
  focusedNodeId: string | null;
}

// ✅ isDirty 트리거 허용
interface PersistentState {
  nodes: { [id: string]: MindMapNode };
  edges: { [id: string]: MindMapEdge };
  rootNodeId: string;
}
```

### 7.2 Timestamp 권위

```typescript
// ❌ 금지: 뷰 이동 시 timestamp 갱신
onCameraMove(dx: number, dy: number): void {
  this.camera.offsetX += dx;
  this.camera.offsetY += dy;
  
  // timestamp 갱신 금지!
  // this.data.meta.updatedAt = Date.now();
}

// ❌ 금지: 포커스 변경 시 timestamp 갱신
onNodeFocus(nodeId: string): void {
  this.focusedNodeId = nodeId;
  
  // timestamp 갱신 금지!
  // this.data.meta.updatedAt = Date.now();
}

// ✅ 올바름: 직렬화 시점에만 갱신
getViewData(): string {
  const data = this.serialize();
  
  // 유일한 갱신 지점
  data.meta.updatedAt = Date.now();
  
  return JSON.stringify(data, null, 2);
}
```

**강제 규칙**:
- updatedAt은 직렬화 시점에만 갱신
- 뷰 이동/포커스 변경 시 갱신 금지
- 카메라 이동 시 갱신 금지
- 렌더링 시 갱신 금지

---

## 8. Conflict Lock

### 8.1 Save Pipeline 중단

```typescript
class ConflictResolver {
  async handleExternalChange(file: TFile): Promise<void> {
    const view = this.getViewForFile(file);
    if (!view) return;
    
    // Clean 상태: 즉시 리로드
    if (!view.isDirty) {
      await view.reload();
      return;
    }
    
    // Dirty 상태: Conflict Lock
    // 1. Save Pipeline 즉시 중단
    this.autoSaveManager.suspend();
    
    // 2. Auto-Save 타이머 즉시 취소
    this.autoSaveManager.cancelPendingSave();
    
    // 3. 편집 잠금
    view.setEditable(false);
    
    // 4. 사용자 선택 대기
    const choice = await this.showConflictDialog();
    
    // 5. 결정 후 Pipeline 재개
    if (choice === 'load') {
      await view.reload();
      this.autoSaveManager.resume();
    } else if (choice === 'keep') {
      this.autoSaveManager.resume();
    }
  }
}
```

**강제 규칙**:
- Conflict 시 Save Pipeline 즉시 중단
- Auto-Save 타이머 즉시 취소
- 편집 기능 잠금
- 사용자 결정 전까지 저장 금지
- 직렬화 금지

---

## 9. Schema Versioning

### 9.1 정수 비교만 허용

```typescript
// ✅ 올바른 버전 비교
interface MindMapData {
  schemaVersion: number; // 정수만
}

class SchemaVersionValidator {
  isCompatible(fileVersion: number, currentVersion: number): boolean {
    // 단순 정수 비교
    return fileVersion <= currentVersion;
  }
}

// ❌ 금지: Semantic Versioning
class BadValidator {
  isCompatible(fileVersion: string, currentVersion: string): boolean {
    // compareVersions 라이브러리 사용 금지!
    // return compareVersions(fileVersion, currentVersion) <= 0;
  }
}
```

**강제 규칙**:
- schemaVersion은 정수만
- 비교는 단순 정수 비교만
- Semantic Versioning 금지
- compareVersions 라이브러리 금지

---

## 10. 판단 기준 (모호할 때 이걸 따른다)

### 3가지 질문

```
1. 파일이 깨질 가능성이 있는가?
   → 있으면 구현 금지

2. Undo로 되돌릴 수 있는가?
   → 없으면 구현 금지

3. 사용자가 상황을 명확히 인지하는가?
   → 아니면 구현 금지
```

**하나라도 ❌면 구현 금지**

---

## 11. 코드 리뷰 체크리스트

### Phase 0 필수 검증 항목

```typescript
// Phase 0: File System
[ ] TextFileView 상속
[ ] getViewData() / setViewData() 구현
[ ] Atomic Write (임시 파일 → 검증 → 교체)
[ ] updatedAt은 직렬화 시점에만
[ ] schemaVersion은 정수 비교만

// Phase 0.3: State & History
[ ] Undo/Redo 후 isDirty 연계
[ ] 비영속 상태는 isDirty 트리거 안 함
[ ] Multi-View 동기화

// Phase 0.5: Intent & Sanitation
[ ] Intent는 데이터만 포함
[ ] Intent는 로직 포함 안 함
[ ] Sanitation은 허용 시점에만

// Phase 0.7: Conflict & Export
[ ] Conflict 시 Save Pipeline 중단
[ ] Auto-Save 타이머 취소
[ ] Export는 Projection만

// Phase 0.8: Schema & Fail
[ ] Fail Loudly (throw + Notice + 중단)
[ ] 부분 계속 금지
[ ] Schema 검증

// Phase 0.9: AI Governance
[ ] 추측/보정/생성 금지
[ ] Schema 위반 시 거부
```

---

## 12. 예제 코드

### 12.1 올바른 파일 저장

```typescript
class NeroMindView extends TextFileView {
  getViewData(): string {
    const data = this.serialize();
    
    // updatedAt은 여기서만
    data.meta.updatedAt = Date.now();
    
    return JSON.stringify(data, null, 2);
  }
  
  async save(): Promise<void> {
    const tmpPath = this.file.path + '.tmp';
    
    try {
      // 1. 임시 파일 쓰기
      const data = this.getViewData();
      await this.app.vault.adapter.write(tmpPath, data);
      
      // 2. 검증
      const written = await this.app.vault.adapter.read(tmpPath);
      if (written !== data) {
        throw new Error('Write verification failed');
      }
      
      // 3. 원자적 교체
      await this.app.vault.adapter.rename(tmpPath, this.file.path);
      
      // 4. isDirty 해제
      this.isDirty = false;
      
    } catch (e) {
      // 임시 파일 정리
      try {
        await this.app.vault.adapter.remove(tmpPath);
      } catch {}
      
      // Fail Loudly
      new Notice('파일 저장 실패: ' + e.message);
      throw e;
    }
  }
}
```

### 12.2 올바른 Intent 처리

```typescript
// 1. Intent 정의 (데이터만)
interface MoveNodeIntent {
  type: 'MOVE_NODE';
  nodeId: string;
  newPosition: Position;
}

// 2. UI에서 Intent 생성
class InteractionHandler {
  onNodeDrag(nodeId: string, newPos: Position): void {
    const intent: MoveNodeIntent = {
      type: 'MOVE_NODE',
      nodeId,
      newPosition: newPos
    };
    
    this.intentProcessor.process(intent);
  }
}

// 3. Engine이 Intent 처리
class IntentProcessor {
  process(intent: MoveNodeIntent): void {
    // 검증
    if (!this.nodes.has(intent.nodeId)) {
      throw new Error('Node not found');
    }
    
    // Command 생성
    const command = new MoveNodeCommand(
      intent.nodeId,
      intent.newPosition
    );
    
    // 실행
    this.historyManager.execute(command);
    
    // isDirty 마킹
    this.isDirty = true;
  }
}
```

### 12.3 올바른 Conflict 처리

```typescript
class ConflictResolver {
  async handleExternalChange(file: TFile): Promise<void> {
    const view = this.getViewForFile(file);
    if (!view) return;
    
    // Clean: 리로드
    if (!view.isDirty) {
      await view.reload();
      new Notice('파일이 외부에서 수정되어 다시 로드되었습니다.');
      return;
    }
    
    // Dirty: Conflict Lock
    // Save Pipeline 중단
    this.autoSaveManager.suspend();
    this.autoSaveManager.cancelPendingSave();
    
    // 편집 잠금
    view.setEditable(false);
    
    // 사용자 선택
    const choice = await new Promise<string>((resolve) => {
      const modal = new ConflictModal(this.app, resolve);
      modal.open();
    });
    
    // 결정 처리
    if (choice === 'load') {
      await view.reload();
      view.isDirty = false;
    }
    
    // Pipeline 재개
    this.autoSaveManager.resume();
    view.setEditable(true);
  }
}
```

---

## 13. 금지 패턴 요약

### 절대 하지 말 것

```typescript
// ❌ Intent에 로직 포함
// ❌ 렌더링 중 Sanitation
// ❌ 직접 파일 덮어쓰기
// ❌ try-catch 후 계속 진행
// ❌ AI의 추측/보정/생성
// ❌ 외부 DOM 의존
// ❌ Obsidian 헤더 보정
// ❌ 뷰 이동 시 timestamp 갱신
// ❌ Conflict 시 저장
// ❌ Semantic Versioning
// ❌ 부분 계속 (Partial Continuation)
// ❌ Silent failure/fallback/correction
```

---

## 14. 참고 문서

1. **KK-NeroMind-Architecture-v4.2.8.md** (최상위 헌법)
2. **KK-NeroMind-Development-Roadmap-v4.2.8.md** (개발 로드맵)
3. **kknm-schema-v1.md** (데이터 구조 법)
4. **textfileview-skeleton.md** (파일 I/O 규범)
5. **settings-ui.md** (설정 UI 규범)

---

**Author**: Nero-kk  
**GitHub**: [https://github.com/Nero-kk](https://github.com/Nero-kk)  
**YouTube**: [https://www.youtube.com/@Nero-kkk](https://www.youtube.com/@Nero-kkk)  
**Blog**: [http://nero-k.tistory.com](http://nero-k.tistory.com/)  
**Buy Me a Coffee**: [https://buymeacoffee.com/nerokk](https://buymeacoffee.com/nerokk)

---

**Code is Law · Constitution is Supreme · Violations are Bugs** ⚖️🚀

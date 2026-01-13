# HistoryManager 통합 가이드 (Phase 3.0 MVP)

## 목차
1. [설계 원칙](#설계-원칙)
2. [아키텍처](#아키텍처)
3. [API](#api)
4. [통합 방법](#통합-방법)
5. [예제](#예제)
6. [제약사항](#제약사항)
7. [향후 개선](#향후-개선)

---

## 설계 원칙

### Undo-Only (Redo 절대 금지)
- 한 방향으로만 작동
- 구현 단순화
- 사용자 혼동 방지

### Wrapper Pattern
```
NeroMindView
    ↓
HistoryManager (외부 래퍼)
    ↓
StateManager (피래핑 객체)
```

- StateManager은 히스토리를 전혀 모름
- StateManager.apply(command) 호출로만 상호작용
- 실패 시 HistoryManager만 제거하면 StateManager은 독립적으로 작동

### Inverse Operation 패턴
```typescript
// execute: 순방향
context.persistent.graph.nodes.set(nodeId, node);

// undo: 역방향
context.persistent.graph.nodes.delete(nodeId);
```

### 메모리 스냅샷 금지
- 히스토리 항목당 스냅샷 저장 금지
- 커맨드에서 필요한 데이터만 보존
- 메모리 사용량 최소화 (MAX_HISTORY = 10)

---

## 아키텍처

### 클래스 다이어그램

```
┌──────────────────────────────────┐
│        NeroMindView              │
│  (UI 사용자 상호작용)              │
└────────────────┬──────────────────┘
                 │
                 │ view.undo()
                 │ view.execute(command)
                 ↓
┌──────────────────────────────────┐
│      HistoryManager              │
│  - execute(command)              │
│  - undo()                        │
│  - canUndo()                     │
│  - clearHistory()                │
│  - getStateManager()             │
└────────────────┬──────────────────┘
                 │
                 │ stateManager.apply(command)
                 │
                 ↓
┌──────────────────────────────────┐
│      StateManager                │
│  - apply(command)                │
│  - getSnapshot()                 │
│  - addNode/removeNode/...        │
└──────────────────────────────────┘
                 │
                 ↓
         PersistentState
         EphemeralState
```

### 데이터 흐름

#### Execute 흐름
```
1. view.execute(new AddNodeCommand(node))
   ↓
2. historyManager.execute(command)
   ↓
3. stateManager.apply(command)
   ├─ command.execute(context) 실행
   └─ getSnapshot() 반환
   ↓
4. commandQueue.push(command) → 히스토리 저장
   ↓
5. return snapshot
```

#### Undo 흐름
```
1. view.undo()
   ↓
2. historyManager.undo()
   ├─ if (!canUndo()) throw error
   ├─ command = commandQueue.pop()
   └─ createUndoWrapper(command.undo)
   ↓
3. stateManager.apply(undoWrapper)
   ├─ undoWrapper.execute() = command.undo(context) 호출
   └─ getSnapshot() 반환
   ↓
4. return snapshot
```

---

## API

### HistoryManager

#### `execute(command: UndoableCommand): StateSnapshot`
- 커맨드 실행 및 히스토리 저장
- MAX_HISTORY 초과 시 가장 오래된 항목 제거
- 실패 시 호출자가 처리 (StateManager.apply에서 에러 발생)

#### `undo(): StateSnapshot`
- 마지막 작업 취소
- canUndo() 확인 후 호출 권장
- 취소할 히스토리 없으면 Error 던짐

#### `canUndo(): boolean`
- 취소 가능 여부 반환
- UI의 Undo 버튼 활성화/비활성화 제어용

#### `getHistorySize(): number`
- 현재 히스토리 항목 수 반환 (0 ~ 10)
- UI에서 히스토리 개수 표시 용도

#### `clearHistory(): void`
- 모든 히스토리 제거
- 새 파일 로드 시 호출

#### `getStateManager(): StateManager`
- 래핑된 StateManager 직접 접근
- Renderer에서 getSnapshot() 호출 시 사용
- 주의: 이 메서드로 직접 apply() 호출 시 히스토리 미기록

#### `destroy(): void`
- 리소스 정리
- onunload 시 호출

---

### UndoableCommand

```typescript
interface UndoableCommand {
  execute(context: StateContext): void;
  undo(context: StateContext): void;
  description: string;
}
```

#### execute(context)
- 작업 실행 (순방향)
- undo()를 정확히 역으로 되돌릴 수 있도록 필요한 데이터 보존
- 예외 발생 시 StateManager.apply()가 처리

#### undo(context)
- 작업 취소 (역방향)
- execute()를 완벽하게 복원
- 메모리 스냅샷 금지

#### description
- 커맨드 설명 (사용자용 라벨)
- "Undo: Add node" 형태로 표시

---

## 통합 방법

### Step 1: 초기화

```typescript
import { StateManager } from './state/StateManager';
import { HistoryManager } from './history/HistoryManager';

// NeroMindView 또는 main.ts에서
const stateManager = new StateManager();
const historyManager = new HistoryManager(stateManager);
```

### Step 2: 커맨드 구현

필수 조건:
- UndoableCommand 인터페이스 구현
- execute(): 순방향 작업
- undo(): 역방향 작업 (Inverse Operation)
- description: 의미있는 라벨

예제는 `src/history/examples.ts` 참조

### Step 3: 커맨드 실행

```typescript
// 히스토리에 기록 (권장)
const snapshot = historyManager.execute(new AddNodeCommand(node));

// StateManager 직접 호출 (히스토리 미기록)
// const snapshot = stateManager.apply(nonUndoableCommand);
```

### Step 4: Undo UI 구현

```typescript
// Undo 버튼 활성화 제어
function updateUndoButton() {
  undoButton.disabled = !historyManager.canUndo();
  if (historyManager.canUndo()) {
    const lastCommand = commandQueue.peek(); // 별도로 구현 필요
    undoButton.textContent = `Undo: ${lastCommand.description}`;
  } else {
    undoButton.textContent = 'Undo';
  }
}

// Undo 버튼 클릭
undoButton.addEventListener('click', () => {
  if (historyManager.canUndo()) {
    const snapshot = historyManager.undo();
    renderer.render(snapshot);
  }
});
```

### Step 5: Renderer 연결

```typescript
// Renderer에서 현재 상태 조회
class Renderer {
  constructor(private historyManager: HistoryManager) {}

  render(): void {
    const stateManager = this.historyManager.getStateManager();
    const snapshot = stateManager.getSnapshot();

    // 렌더링 로직
    this.renderNodes(snapshot.nodes);
    this.renderEdges(snapshot.edges);
  }
}
```

---

## 예제

### 기본 사용

```typescript
// 초기화
const stateManager = new StateManager();
const historyManager = new HistoryManager(stateManager);

// 노드 추가 (히스토리 기록)
const node: MindMapNode = {
  id: 'node-1',
  content: 'Hello World',
  position: { x: 0, y: 0 },
  parentId: null,
  childIds: [],
  direction: null,
  isPinned: false,
  isCollapsed: false,
  linkedNotePath: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const snapshot1 = historyManager.execute(new AddNodeCommand(node));
console.log(snapshot1.nodes.length); // 1

// 노드 업데이트
const snapshot2 = historyManager.execute(
  new UpdateNodeCommand('node-1', { content: 'Updated' })
);

// 취소
console.log(historyManager.canUndo()); // true
const snapshot3 = historyManager.undo(); // 업데이트 취소
console.log(snapshot3.nodes[0].content); // 'Hello World'

// 다시 취소
console.log(historyManager.canUndo()); // true
const snapshot4 = historyManager.undo(); // 추가 취소
console.log(snapshot4.nodes.length); // 0

// 더 이상 취소 불가
console.log(historyManager.canUndo()); // false
```

### 복잡한 커맨드

```typescript
// 여러 작업을 한 번의 커맨드로 묶기
class AddNodeWithLayoutCommand implements UndoableCommand {
  description = 'Add node with auto-layout';
  private node: MindMapNode;
  private position: Position;

  constructor(node: MindMapNode, autoLayout: boolean = true) {
    this.node = node;
    this.position = { ...node.position };

    // 자동 레이아웃이면 위치 계산
    if (autoLayout) {
      this.position = this.calculatePosition(node.parentId);
    }
  }

  execute(context: StateContext): void {
    // 노드 추가
    context.persistent.graph.nodes.set(this.node.id, this.node);

    // 레이아웃 정보 저장
    context.persistent.layout.nodePositions.set(this.node.id, this.position);
  }

  undo(context: StateContext): void {
    // 노드 제거
    context.persistent.graph.nodes.delete(this.node.id);

    // 레이아웃 제거
    context.persistent.layout.nodePositions.delete(this.node.id);
  }

  private calculatePosition(parentId: NodeId | null): Position {
    // 자동 레이아웃 계산 로직
    return { x: 100, y: 100 };
  }
}
```

---

## 제약사항

### Phase 3.0 MVP 범위

✅ 구현:
- Undo-only (Redo 절대 금지)
- UndoableCommand 인터페이스
- HistoryManager 기본 구현
- Inverse Operation 패턴
- MAX_HISTORY = 10
- 메모리 스냅샷 금지

❌ 제외 (Phase 3+ 이후):
- Redo 기능
- EventBus 통합
- 트랜잭션/배치 작업
- 히스토리 저장/복원 (파일 퍼시스턴스)
- 히스토리 병합/압축
- 커맨드 매크로

### StateManager 미처리 사항

현재 StateManager에서 미구현이므로 커맨드에서도 처리 금지:

- ❌ 연결된 엣지 자동 제거
- ❌ 고아 노드 자동 정리
- ❌ 자식 노드 참조 업데이트
- ❌ 루트 노드 제거 처리

→ Phase 2+ 개선 예정

### 실패 안전성

HistoryManager 제거 시:

```typescript
// ✅ 안전: StateManager은 독립적으로 작동
const stateManager = new StateManager();
stateManager.apply(command);
```

히스토리 관련 코드만 제거하면 롤백 가능.

---

## 향후 개선 (Phase 3.1+)

### Redo 지원
```typescript
class HistoryManager {
  redo(): StateSnapshot { /* ... */ }
  canRedo(): boolean { /* ... */ }
}
```

### EventBus 통합
```typescript
historyManager.on('commandExecuted', (command) => {
  render();
});
```

### 트랜잭션 지원
```typescript
historyManager.beginTransaction();
historyManager.execute(command1);
historyManager.execute(command2);
historyManager.commit(); // 하나의 히스토리 항목으로 저장
```

### 히스토리 퍼시스턴스
```typescript
const data = historyManager.serialize();
historyManager.deserialize(data);
```

---

## FAQ

### Q: StateManager를 직접 사용하면?
A: apply() 호출이 히스토리에 기록되지 않음. 히스토리 필요 시 HistoryManager.execute() 사용.

### Q: Redo는 왜 없나?
A: Phase 3.0 MVP 범위 최소화. 사용자 혼동 방지. 나중에 추가 가능.

### Q: 메모리 스냅샷을 왜 안 하나?
A: 커맨드마다 전체 상태 복사 시 메모리 폭증. Inverse Operation이 더 효율적.

### Q: 10개 이상 히스토리를 원하면?
A: MAX_HISTORY 상수 변경. 단, 메모리 영향 고려.

### Q: undo() 중 에러가 발생하면?
A: StateManager.apply()에서 커맨드 에러 발생. 호출자가 처리 (히스토리 큐는 이미 pop됨 - 주의).

---

## 체크리스트

### 구현 검증
- [ ] UndoableCommand 인터페이스 구현
- [ ] HistoryManager 기본 메서드 (execute, undo, canUndo)
- [ ] StateManager.apply(command) 호출로만 상호작용
- [ ] MAX_HISTORY = 10 제한
- [ ] 메모리 스냅샷 금지
- [ ] Inverse Operation 패턴 적용

### 통합 검증
- [ ] HistoryManager 초기화
- [ ] 최소 3개 커맨드 구현 (AddNode, UpdateNode, RemoveNode)
- [ ] Undo 버튼 UI 연결
- [ ] Renderer에서 getStateManager().getSnapshot() 사용
- [ ] 에러 처리 (canUndo 확인 후 undo 호출)

### 자동 테스트
- [ ] execute() → canUndo() = true
- [ ] MAX_HISTORY 초과 시 자동 제거
- [ ] undo() 반복 시 원래 상태로 복원
- [ ] 빈 히스토리에서 undo() → 에러 발생

### 수동 테스트
- [ ] 노드 추가 후 undo → 노드 제거됨
- [ ] 노드 업데이트 후 undo → 이전 값 복원
- [ ] 10개 이상 작업 후 가장 오래된 것 제거됨
- [ ] Undo 버튼 활성화/비활성화 정상 동작

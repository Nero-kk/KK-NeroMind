# Phase 3.0 HistoryManager Quick Reference Card

**Print this or keep in editor for quick lookup during development**

---

## 📂 파일 위치

```
src/history/
├── UndoableCommand.ts          ← 인터페이스 (커맨드가 구현해야 함)
├── HistoryManager.ts           ← 핵심 구현 (래퍼)
├── examples.ts                 ← 5개 예제 커맨드
├── INTEGRATION_GUIDE.md        ← 상세 가이드
├── SELF_VALIDATION_CHECKLIST.md ← 검증 목록
└── README.md                   ← 개요
```

---

## 🔧 한줄 사용법

```typescript
// 1. 초기화
const historyManager = new HistoryManager(stateManager);

// 2. 실행 (히스토리 기록)
historyManager.execute(new AddNodeCommand(node));

// 3. 취소
if (historyManager.canUndo()) {
  historyManager.undo();
}
```

---

## 📝 커맨드 구현 템플릿

```typescript
import { UndoableCommand } from './history/UndoableCommand';
import { StateContext } from './state/stateTypes';

export class MyCommand implements UndoableCommand {
  description = 'What I do'; // UI 라벨

  constructor(private data: any) {}

  execute(context: StateContext): void {
    // 순방향: 상태 변경
    context.persistent.graph.nodes.set(id, node);
    // this.data에 역작업 필요한 정보 저장됨
  }

  undo(context: StateContext): void {
    // 역방향: execute를 정확히 역으로
    context.persistent.graph.nodes.delete(id);
  }
}
```

---

## 🔄 Inverse Operation Pattern

| 작업 | Execute | Undo |
|------|---------|------|
| **Add Node** | `nodes.set(id, node)` | `nodes.delete(id)` |
| **Remove Node** | `nodes.delete(id)` | `nodes.set(id, savedNode)` |
| **Update** | `node.content = new` | `node.content = old` |
| **Move** | `node.position = new` | `node.position = old` |

---

## ✅ HistoryManager 메서드

```typescript
// 커맨드 실행 (히스토리에 저장)
snapshot = historyManager.execute(command);

// 취소 (마지막 작업)
if (historyManager.canUndo()) {
  snapshot = historyManager.undo();
}

// 취소 가능 여부 (UI 버튼 활성화용)
enabled = historyManager.canUndo();

// 히스토리 항목 수
count = historyManager.getHistorySize();

// 모든 히스토리 삭제
historyManager.clearHistory();

// StateManager 접근 (Renderer용)
stateManager = historyManager.getStateManager();

// 리소스 정리
historyManager.destroy();
```

---

## 📊 StateContext 구조

```typescript
context.persistent: {
  graph: {
    nodes: Map<NodeId, MindMapNode>,
    edges: Map<EdgeId, MindMapEdge>,
    rootId: NodeId
  },
  layout: {
    viewport: { x, y, zoom },
    nodePositions: Map<NodeId, Position>
  },
  settings: UserSettings,
  pinnedNodes: Set<NodeId>
}

context.ephemeral: {
  selectedNodeId: NodeId | null,
  editingNodeId: NodeId | null,
  collapsedNodes: Set<NodeId>,
  dragState: DragContext | null,
  lastSelectedNodeId: NodeId | null
}
```

---

## ⚠️ 주의사항

### 금지 사항
```typescript
// ❌ Redo 구현
redo() { }

// ❌ 메모리 스냅샷 저장
this.fullSnapshot = JSON.parse(JSON.stringify(state));

// ❌ EventBus 통합
eventBus.emit('commandExecuted');

// ❌ StateManager 직접 조작
stateManager.addNode(node);

// ❌ canUndo 확인 없이 undo
historyManager.undo(); // Error 가능!
```

### 필수 사항
```typescript
// ✅ canUndo 확인
if (historyManager.canUndo()) {
  historyManager.undo();
}

// ✅ StateManager.apply() 사용
stateManager.apply(command);

// ✅ execute/undo 대칭 유지
execute: nodes.set(id, node);
undo:    nodes.delete(id);

// ✅ description 명확하게
description = 'Add root node'; // ← good
description = 'cmd';           // ← bad
```

---

## 🔍 오류 처리

```typescript
// undo 전 항상 확인
if (historyManager.canUndo()) {
  try {
    const snapshot = historyManager.undo();
  } catch (error) {
    console.error('Undo failed:', error);
    // 히스토리는 이미 pop됨 (주의!)
  }
}

// execute 에러
try {
  const snapshot = historyManager.execute(command);
} catch (error) {
  console.error('Execute failed:', error);
  // 히스토리에 추가되지 않음 (안전)
}
```

---

## 🧪 테스트 시나리오

```typescript
// 1. 기본 undo
execute(cmd1) → execute(cmd2) → undo() ✓

// 2. MAX_HISTORY 초과 (10개)
for (let i = 0; i < 15; i++) {
  execute(commands[i]);
}
// 첫 5개는 자동 제거됨 ✓

// 3. 빈 히스토리
canUndo() === false ✓
undo() → Error ✓

// 4. 수동 정리
clearHistory();
canUndo() === false ✓
```

---

## 🎯 5개 예제 커맨드

모두 `src/history/examples.ts`에서 제공:

1. **AddNodeCommand** - 노드 추가
2. **RemoveNodeCommand** - 노드 제거
3. **UpdateNodeCommand** - 노드 업데이트
4. **MoveNodeCommand** - 노드 이동
5. **SelectNodeCommand** - 노드 선택 (Ephemeral)

**사용**:
```typescript
import { AddNodeCommand } from './history/examples';

historyManager.execute(new AddNodeCommand(node));
```

---

## 🏗️ 아키텍처

```
NeroMindView
    ↓ (command)
HistoryManager (wrapper)
    ├─ commandQueue: UndoableCommand[]
    └─ MAX_HISTORY: 10
    ↓ (apply)
StateManager (wrapped)
    ├─ persistentState
    └─ ephemeralState
```

**원칙**: StateManager은 히스토리를 몰라도 작동

---

## 📋 체크리스트

### 구현 완료
- [x] UndoableCommand 인터페이스
- [x] HistoryManager 클래스
- [x] execute(), undo(), canUndo()
- [x] MAX_HISTORY = 10
- [x] Inverse Operation 패턴
- [x] 메모리 스냅샷 금지
- [x] 5개 예제 커맨드
- [x] 종합 문서

### 통합 전 확인
- [ ] HistoryManager 초기화
- [ ] 최소 3개 커맨드 구현
- [ ] Undo 버튼 UI 연결
- [ ] canUndo() 확인 로직
- [ ] Renderer에서 getStateManager() 사용
- [ ] 에러 처리 (try-catch)
- [ ] 자동 테스트 작성

---

## 📞 빠른 링크

| 내용 | 파일 | 섹션 |
|------|------|------|
| **인터페이스** | UndoableCommand.ts | - |
| **구현** | HistoryManager.ts | - |
| **예제** | examples.ts | 5개 커맨드 |
| **가이드** | INTEGRATION_GUIDE.md | Step 1-5 |
| **검증** | SELF_VALIDATION_CHECKLIST.md | 11개 섹션 |
| **개요** | README.md | - |

---

## 💾 기억할 것 (5가지)

1. **Undo-only**: Redo 없음 (Phase 3.1+)
2. **Wrapper**: StateManager 래핑 (외부)
3. **Inverse**: execute ↔ undo 대칭
4. **MAX_HISTORY**: 10개 자동 제거
5. **No Snapshot**: 필요한 데이터만

---

**Last Updated**: 2026-01-13 | **Status**: ✅ READY

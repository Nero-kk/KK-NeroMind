# Phase 3 설계 문서: KK-NeroMind Plugin

## 문서 정보
- **작성일**: 2026-01-12
- **기준 코드베이스**: Phase 2.5 안정화 완료 상태
- **목적**: Phase 3 구현을 위한 아키텍처 설계 및 작업 순서 정의

---

## 1. Undo/Redo 레이어 설계

### 1.1 레이어 위치 및 책임

```
┌─────────────────────────────────────────────────────┐
│                   Input Layer                        │
│  (KeyboardManager, MouseManager, ShortcutInterceptor)│
└────────────────┬────────────────────────────────────┘
                 │ Creates Commands
                 ↓
┌─────────────────────────────────────────────────────┐
│              HistoryManager (NEW)                    │  ← Phase 3 추가
│  - CommandHistory 관리                               │
│  - Undo/Redo 스택 관리                               │
│  - 명령 실행 및 역실행                                │
└────────────────┬────────────────────────────────────┘
                 │ Executes Commands
                 ↓
┌─────────────────────────────────────────────────────┐
│                 StateManager                         │
│  - apply(command) 단방향 실행                        │
│  - Snapshot 제공                                     │
│  - 히스토리 무지 (history-agnostic)                  │
└─────────────────────────────────────────────────────┘
```

### 1.2 설계 원칙

**✅ StateManager는 히스토리를 모른다**
- StateManager.apply()는 여전히 단방향 실행만 수행
- 과거/미래 상태를 추적하지 않음
- Snapshot은 "현재" 상태만 표현

**✅ HistoryManager는 StateManager 외부에 존재**
- StateManager를 감싸는 래퍼(Wrapper) 패턴
- Command 실행 전후로 스냅샷 캡처
- Undo/Redo 스택 독립 관리

**✅ Phase 2.5 경계 활용**
- StateManager 주석: "❌ Undo/Redo: Phase 3에서 별도 레이어로 분리 예정"
- 이 경계가 HistoryManager의 정당성 제공

### 1.3 디렉토리 구조

```
src/
├── history/                     # NEW - Phase 3
│   ├── HistoryManager.ts        # Undo/Redo 오케스트레이터
│   ├── CommandHistory.ts        # 스택 관리
│   ├── UndoableCommand.ts       # 역실행 가능 Command 인터페이스
│   └── historyTypes.ts          # History 관련 타입
│
└── state/                       # 변경 없음
    ├── StateManager.ts
    └── stateTypes.ts
```

### 1.4 인터페이스 설계 (Pseudo-code)

```typescript
// src/history/historyTypes.ts

/**
 * 역실행 가능한 Command 인터페이스
 * - StateCommand를 확장하되, undo 메서드 추가
 */
export interface UndoableCommand extends StateCommand {
  /**
   * Command를 역실행
   * - execute()의 역순 작업 수행
   * - StateContext를 받아 상태 복원
   */
  undo(context: StateContext): void;

  /**
   * Command 설명 (필수)
   * - Undo/Redo UI에 표시될 텍스트
   */
  description: string;
}

/**
 * CommandSnapshot
 * - Command 실행 전후 스냅샷 저장
 */
interface CommandSnapshot {
  command: UndoableCommand;
  beforeState: StateSnapshot;
  afterState: StateSnapshot;
  timestamp: number;
}
```

```typescript
// src/history/CommandHistory.ts

/**
 * Undo/Redo 스택 관리
 * - 실행된 명령의 히스토리 추적
 * - 스냅샷 기반 복원 지원
 */
export class CommandHistory {
  private undoStack: CommandSnapshot[] = [];
  private redoStack: CommandSnapshot[] = [];
  private readonly MAX_HISTORY = 100;

  /**
   * Command 실행 기록
   * - undoStack에 추가
   * - redoStack 초기화
   */
  recordExecution(snapshot: CommandSnapshot): void;

  /**
   * Undo 가능 여부
   */
  canUndo(): boolean;

  /**
   * Redo 가능 여부
   */
  canRedo(): boolean;

  /**
   * 가장 최근 실행 명령 반환 (Undo용)
   */
  popUndo(): CommandSnapshot | undefined;

  /**
   * 가장 최근 취소 명령 반환 (Redo용)
   */
  popRedo(): CommandSnapshot | undefined;

  /**
   * Redo 스택에 추가
   */
  pushRedo(snapshot: CommandSnapshot): void;

  /**
   * 히스토리 초기화
   */
  clear(): void;
}
```

```typescript
// src/history/HistoryManager.ts

/**
 * Undo/Redo 오케스트레이터
 * - StateManager를 감싸는 래퍼
 * - Command 실행/역실행 조율
 */
export class HistoryManager implements Disposable {
  private stateManager: StateManager;
  private history: CommandHistory;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
    this.history = new CommandHistory();
  }

  /**
   * Command 실행 (with history tracking)
   *
   * 동작:
   * 1. 현재 상태 스냅샷 캡처 (beforeState)
   * 2. StateManager.apply() 호출
   * 3. 결과 상태 스냅샷 캡처 (afterState)
   * 4. CommandSnapshot 생성 및 history에 기록
   * 5. redoStack 초기화
   */
  execute(command: UndoableCommand): StateSnapshot;

  /**
   * Undo 실행
   *
   * 동작:
   * 1. undoStack에서 CommandSnapshot pop
   * 2. command.undo(context) 호출
   * 3. CommandSnapshot을 redoStack에 push
   * 4. 이벤트 발행: 'historyChanged'
   */
  undo(): StateSnapshot | null;

  /**
   * Redo 실행
   *
   * 동작:
   * 1. redoStack에서 CommandSnapshot pop
   * 2. command.execute(context) 호출
   * 3. CommandSnapshot을 undoStack에 push
   * 4. 이벤트 발행: 'historyChanged'
   */
  redo(): StateSnapshot | null;

  /**
   * Undo/Redo 가능 상태 조회
   */
  getHistoryState(): {
    canUndo: boolean;
    canRedo: boolean;
    undoDescription: string | null;
    redoDescription: string | null;
  };

  /**
   * 정리
   */
  destroy(): void;
}
```

### 1.5 실행 흐름 다이어그램

```
사용자 입력 (예: 노드 삭제)
    ↓
InputManager가 DeleteNodeCommand 생성
    ↓
HistoryManager.execute(command)
    ├─ 1. beforeSnapshot = StateManager.getSnapshot()
    ├─ 2. StateManager.apply(command)
    ├─ 3. afterSnapshot = StateManager.getSnapshot()
    ├─ 4. CommandSnapshot 생성
    │      { command, beforeState, afterState, timestamp }
    ├─ 5. history.recordExecution(snapshot)
    │      → undoStack.push(snapshot)
    │      → redoStack.clear()
    └─ 6. return afterSnapshot

사용자가 Undo 요청 (Ctrl+Z)
    ↓
HistoryManager.undo()
    ├─ 1. snapshot = history.popUndo()
    ├─ 2. command.undo(stateManager.getContext())
    ├─ 3. history.pushRedo(snapshot)
    ├─ 4. emit('historyChanged')
    └─ 5. return StateManager.getSnapshot()

사용자가 Redo 요청 (Ctrl+Y)
    ↓
HistoryManager.redo()
    ├─ 1. snapshot = history.popRedo()
    ├─ 2. command.execute(stateManager.getContext())
    ├─ 3. history.recordExecution(snapshot)
    ├─ 4. emit('historyChanged')
    └─ 5. return StateManager.getSnapshot()
```

---

## 2. Command 패턴 최소 인터페이스 설계

### 2.1 현재 상태 분석

**Phase 2.5 상태:**
- `StateCommand`: execute() 만 가진 단방향 인터페이스
- `NoopCommand`: 구조 검증용 더미 구현체
- 실제 Command 구현체 없음

### 2.2 Phase 3 Command 계층 구조

```typescript
// src/state/stateTypes.ts (기존 - 변경 없음)

/**
 * Phase 2 기본 Command 인터페이스
 * - Undo/Redo 없이 단방향 실행만 지원
 */
export interface StateCommand {
  description?: string;
  execute(context: StateContext): void;
}
```

```typescript
// src/history/historyTypes.ts (신규)

/**
 * Phase 3 확장 Command 인터페이스
 * - StateCommand를 확장하여 undo 기능 추가
 */
export interface UndoableCommand extends StateCommand {
  description: string;  // 필수로 변경
  undo(context: StateContext): void;
}
```

### 2.3 기본 Command 구현 예시 (인터페이스만)

```typescript
// src/history/commands/CreateNodeCommand.ts

/**
 * 노드 생성 Command
 *
 * Execute: 새 노드를 그래프에 추가
 * Undo: 생성된 노드를 그래프에서 제거
 */
export class CreateNodeCommand implements UndoableCommand {
  description = 'Create Node';

  private nodeId: NodeId;
  private node: MindMapNode;

  constructor(node: MindMapNode) {
    this.nodeId = node.id;
    this.node = node;
  }

  execute(context: StateContext): void {
    // context.persistent.graph.nodes.set(this.nodeId, this.node);
    // rootId 설정 로직 (첫 노드인 경우)
  }

  undo(context: StateContext): void {
    // context.persistent.graph.nodes.delete(this.nodeId);
    // rootId 복원 로직 (필요시)
  }
}
```

```typescript
// src/history/commands/DeleteNodeCommand.ts

/**
 * 노드 삭제 Command
 *
 * Execute: 노드와 연결된 엣지 제거
 * Undo: 노드와 엣지 복원
 */
export class DeleteNodeCommand implements UndoableCommand {
  description = 'Delete Node';

  private nodeId: NodeId;
  private deletedNode: MindMapNode | null = null;
  private deletedEdges: MindMapEdge[] = [];

  constructor(nodeId: NodeId) {
    this.nodeId = nodeId;
  }

  execute(context: StateContext): void {
    // 1. 노드 백업
    // this.deletedNode = context.persistent.graph.nodes.get(this.nodeId);

    // 2. 연결된 엣지 찾기 및 백업
    // this.deletedEdges = [...edges where fromNodeId === nodeId || toNodeId === nodeId]

    // 3. 엣지 제거
    // deletedEdges.forEach(edge => context.persistent.graph.edges.delete(edge.id))

    // 4. 노드 제거
    // context.persistent.graph.nodes.delete(this.nodeId);

    // Phase 2.5 주석 활용:
    // StateManager.removeNode()의 "⚠️ 경고: 현재 불완전한 구현" 해결
  }

  undo(context: StateContext): void {
    // 1. 노드 복원
    // if (this.deletedNode) {
    //   context.persistent.graph.nodes.set(this.nodeId, this.deletedNode);
    // }

    // 2. 엣지 복원
    // this.deletedEdges.forEach(edge => {
    //   context.persistent.graph.edges.set(edge.id, edge);
    // });
  }
}
```

```typescript
// src/history/commands/UpdateNodeCommand.ts

/**
 * 노드 업데이트 Command
 *
 * Execute: 노드 속성 변경
 * Undo: 이전 속성으로 복원
 */
export class UpdateNodeCommand implements UndoableCommand {
  description: string;

  private nodeId: NodeId;
  private updates: Partial<MindMapNode>;
  private previousValues: Partial<MindMapNode> = {};

  constructor(nodeId: NodeId, updates: Partial<MindMapNode>) {
    this.nodeId = nodeId;
    this.updates = updates;
    this.description = `Update Node: ${Object.keys(updates).join(', ')}`;
  }

  execute(context: StateContext): void {
    // 1. 현재 노드 조회
    // const node = context.persistent.graph.nodes.get(this.nodeId);

    // 2. 변경될 속성의 이전 값 저장
    // Object.keys(this.updates).forEach(key => {
    //   this.previousValues[key] = node[key];
    // });

    // 3. 업데이트 적용
    // Object.assign(node, this.updates);
    // node.updatedAt = Date.now();
  }

  undo(context: StateContext): void {
    // 1. 노드 조회
    // const node = context.persistent.graph.nodes.get(this.nodeId);

    // 2. 이전 값으로 복원
    // Object.assign(node, this.previousValues);
    // node.updatedAt = Date.now();
  }
}
```

### 2.4 Command Factory 패턴

```typescript
// src/history/CommandFactory.ts

/**
 * Command 생성을 위한 Factory
 * - Input Layer에서 사용
 * - Command 생성 로직 중앙화
 */
export class CommandFactory {
  /**
   * 노드 생성 Command 생성
   */
  static createNode(node: MindMapNode): UndoableCommand {
    return new CreateNodeCommand(node);
  }

  /**
   * 노드 삭제 Command 생성
   */
  static deleteNode(nodeId: NodeId): UndoableCommand {
    return new DeleteNodeCommand(nodeId);
  }

  /**
   * 노드 업데이트 Command 생성
   */
  static updateNode(nodeId: NodeId, updates: Partial<MindMapNode>): UndoableCommand {
    return new UpdateNodeCommand(nodeId, updates);
  }

  /**
   * 노드 이동 Command 생성
   */
  static moveNode(nodeId: NodeId, newPosition: Position): UndoableCommand {
    return new MoveNodeCommand(nodeId, newPosition);
  }

  /**
   * 복합 Command 생성
   * - 여러 Command를 하나의 Undo 단위로 묶음
   */
  static composite(commands: UndoableCommand[], description: string): UndoableCommand {
    return new CompositeCommand(commands, description);
  }
}
```

---

## 3. 이벤트 발행(Event Bus) 책임 분리 구조

### 3.1 Event System 아키텍처

```
┌──────────────────────────────────────────────────────┐
│                   EventBus (NEW)                      │
│  - 이벤트 등록/발행/구독 관리                          │
│  - 타입 안전 이벤트 디스패치                           │
│  - 구독자 생명주기 관리                                │
└─────────────┬────────────────────────────────────────┘
              │
              ├─ Emitters (이벤트 발행자)
              │  ├─ StateManager → 'nodeCreated', 'nodeDeleted', etc.
              │  ├─ HistoryManager → 'historyChanged'
              │  └─ ViewportManager → 'viewportChanged', 'zoomChanged'
              │
              └─ Subscribers (이벤트 구독자)
                 ├─ Renderer → 노드/엣지 렌더링 업데이트
                 ├─ NeroMindView → UI 상태 갱신
                 └─ SyncManager → 파일 동기화 트리거
```

### 3.2 Phase 2.5 주석 활용

**StateManager.ts의 주석:**
```typescript
// Phase 2+: 이벤트 발행
// this.emit('nodeCreated', node);
// this.emit('nodeDeleted', nodeId);
// this.emit('nodeUpdated', node);
```

→ 이 주석들이 정확히 어디서 emit()을 호출해야 하는지 표시

### 3.3 디렉토리 구조

```
src/
├── events/                      # NEW - Phase 3
│   ├── EventBus.ts              # 중앙 이벤트 관리자
│   ├── EventEmitter.ts          # Emitter 인터페이스
│   └── eventTypes.ts            # 이벤트 페이로드 타입
│
├── state/
│   └── StateManager.ts          # EventEmitter 구현 추가
│
└── history/
    └── HistoryManager.ts        # EventEmitter 구현 추가
```

### 3.4 인터페이스 설계

```typescript
// src/events/eventTypes.ts

/**
 * 이벤트 타입 매핑
 * - 각 이벤트 이름과 페이로드 타입 정의
 */
export interface EventPayloadMap {
  // Node Events
  'nodeCreated': { node: MindMapNode };
  'nodeDeleted': { nodeId: NodeId };
  'nodeUpdated': { node: MindMapNode; changes: Partial<MindMapNode> };
  'nodeMoved': { nodeId: NodeId; position: Position };
  'nodeSelected': { nodeId: NodeId | null };
  'nodeDeselected': { nodeId: NodeId };

  // State Events
  'stateChanged': { snapshot: StateSnapshot };
  'historyChanged': { canUndo: boolean; canRedo: boolean };

  // Viewport Events
  'viewportChanged': { viewport: { x: number; y: number; zoom: number } };
  'zoomChanged': { zoom: number };
  'panChanged': { x: number; y: number };
}

/**
 * 이벤트 리스너 타입
 */
export type EventListener<K extends keyof EventPayloadMap> = (
  payload: EventPayloadMap[K]
) => void;

/**
 * 이벤트 구독 해제 함수
 */
export type Unsubscribe = () => void;
```

```typescript
// src/events/EventBus.ts

/**
 * 중앙 이벤트 버스
 * - 타입 안전 이벤트 디스패치
 * - 구독자 관리 및 정리
 */
export class EventBus implements Disposable {
  private listeners: Map<keyof EventPayloadMap, Set<EventListener<any>>> = new Map();

  /**
   * 이벤트 구독
   *
   * @returns 구독 해제 함수
   */
  on<K extends keyof EventPayloadMap>(
    event: K,
    listener: EventListener<K>
  ): Unsubscribe {
    // 1. listeners Map에서 event에 해당하는 Set 조회 (없으면 생성)
    // 2. listener를 Set에 추가
    // 3. Unsubscribe 함수 반환 (Set에서 listener 제거)
  }

  /**
   * 일회성 이벤트 구독
   * - 한 번 실행 후 자동 구독 해제
   */
  once<K extends keyof EventPayloadMap>(
    event: K,
    listener: EventListener<K>
  ): Unsubscribe;

  /**
   * 이벤트 발행
   */
  emit<K extends keyof EventPayloadMap>(
    event: K,
    payload: EventPayloadMap[K]
  ): void {
    // 1. listeners Map에서 event에 해당하는 Set 조회
    // 2. Set의 모든 listener 호출 (try-catch로 감싸서 에러 격리)
    // 3. 에러 발생 시 console.error 로그
  }

  /**
   * 특정 이벤트의 모든 리스너 제거
   */
  off<K extends keyof EventPayloadMap>(event: K): void;

  /**
   * 모든 이벤트 리스너 제거
   */
  clear(): void;

  /**
   * 정리
   */
  destroy(): void {
    this.clear();
  }
}
```

```typescript
// src/events/EventEmitter.ts

/**
 * EventEmitter 인터페이스
 * - 이벤트를 발행할 수 있는 클래스가 구현
 */
export interface EventEmitter {
  /**
   * EventBus 설정
   */
  setEventBus(eventBus: EventBus): void;

  /**
   * 이벤트 발행 (protected)
   */
  emit<K extends keyof EventPayloadMap>(
    event: K,
    payload: EventPayloadMap[K]
  ): void;
}
```

### 3.5 StateManager 통합 예시

```typescript
// src/state/StateManager.ts (수정 - 이벤트 발행 추가)

export class StateManager implements Disposable, EventEmitter {
  private readonly persistentState: PersistentState;
  private readonly ephemeralState: EphemeralState;
  private eventBus: EventBus | null = null;  // NEW

  /**
   * EventBus 주입
   */
  setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  /**
   * 이벤트 발행 (protected)
   */
  protected emit<K extends keyof EventPayloadMap>(
    event: K,
    payload: EventPayloadMap[K]
  ): void {
    if (this.eventBus) {
      this.eventBus.emit(event, payload);
    }
  }

  /**
   * 노드 추가
   * - Phase 2.5 주석: "// Phase 2+: 이벤트 발행" 구현
   */
  addNode(node: MindMapNode): void {
    this.persistentState.graph.nodes.set(node.id, node);

    if (!this.persistentState.graph.rootId) {
      this.persistentState.graph.rootId = node.id;
    }

    // Phase 3: 이벤트 발행 활성화
    this.emit('nodeCreated', { node });
  }

  /**
   * 노드 제거
   * - Phase 2.5 주석: "// Phase 2+: 이벤트 발행" 구현
   */
  removeNode(nodeId: NodeId): void {
    this.persistentState.graph.nodes.delete(nodeId);

    // Phase 3: 연결된 엣지 제거 (Phase 2.5 경고 해결)
    // const edgesToDelete = [...edges where fromNodeId === nodeId || toNodeId === nodeId]
    // edgesToDelete.forEach(edge => this.persistentState.graph.edges.delete(edge.id))

    // Phase 3: 이벤트 발행 활성화
    this.emit('nodeDeleted', { nodeId });
  }

  // updateNode, selectNode, setEditingNode 등도 동일 패턴으로 수정
}
```

### 3.6 Renderer 이벤트 구독 예시

```typescript
// src/rendering/Renderer.ts (수정 - 이벤트 구독 추가)

export class Renderer implements Disposable {
  private svgElement: SVGSVGElement;
  private eventBus: EventBus;
  private unsubscribers: Unsubscribe[] = [];  // NEW

  constructor(svgElement: SVGSVGElement, eventBus: EventBus) {
    this.svgElement = svgElement;
    this.eventBus = eventBus;
    this.subscribeToEvents();
  }

  /**
   * 이벤트 구독 설정
   */
  private subscribeToEvents(): void {
    // 노드 생성 이벤트
    this.unsubscribers.push(
      this.eventBus.on('nodeCreated', ({ node }) => {
        this.renderNode(node);
      })
    );

    // 노드 삭제 이벤트
    this.unsubscribers.push(
      this.eventBus.on('nodeDeleted', ({ nodeId }) => {
        this.removeNodeElement(nodeId);
      })
    );

    // 노드 업데이트 이벤트
    this.unsubscribers.push(
      this.eventBus.on('nodeUpdated', ({ node }) => {
        this.updateNodeElement(node);
      })
    );

    // 히스토리 변경 이벤트 (Undo/Redo 후 전체 재렌더)
    this.unsubscribers.push(
      this.eventBus.on('historyChanged', () => {
        this.scheduleRender();
      })
    );
  }

  /**
   * 정리
   */
  destroy(): void {
    // 모든 이벤트 구독 해제
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];

    this.stop();
  }
}
```

### 3.7 이벤트 흐름 다이어그램

```
사용자 액션 (노드 삭제)
    ↓
InputManager → HistoryManager.execute(DeleteNodeCommand)
    ↓
HistoryManager → StateManager.apply(command)
    ↓
StateManager.removeNode(nodeId)
    ├─ 1. 내부 상태 변경 (nodes.delete)
    ├─ 2. 연결된 엣지 제거
    └─ 3. EventBus.emit('nodeDeleted', { nodeId })
           ↓
           ├─ Renderer: removeNodeElement(nodeId) → SVG DOM 업데이트
           ├─ SyncManager: handleNodeDeleted(nodeId) → 파일 삭제 또는 고아 처리
           └─ MiniMapRenderer: updateMinimap() → 미니맵 갱신
```

---

## 4. Persistence(저장/불러오기) 레이어 분리 전략

### 4.1 현재 상태 분석

**Phase 2.5 문제점:**
- StateManager에 serialize/deserialize 메서드 존재
- 파일 I/O 책임이 State 레이어에 혼재
- Phase 2.5 주석: "❌ 파일 저장: Phase 3에서 Persistence 레이어로 분리 예정"

### 4.2 Persistence 레이어 아키텍처

```
┌─────────────────────────────────────────────────────┐
│              PersistenceManager                      │
│  - 파일 저장/불러오기 오케스트레이션                  │
│  - AutoSave 관리                                     │
└────────────┬────────────────────────────────────────┘
             │
             ├─ Serializer (직렬화/역직렬화)
             │  ├─ GraphSerializer → 그래프 데이터 변환
             │  ├─ LayoutSerializer → 레이아웃 데이터 변환
             │  └─ SettingsSerializer → 설정 데이터 변환
             │
             └─ FileManager (파일 I/O)
                ├─ ObsidianFileAdapter → Obsidian Vault API 래퍼
                └─ ValidationManager → 스키마 검증
```

### 4.3 디렉토리 구조

```
src/
├── persistence/                 # NEW - Phase 3
│   ├── PersistenceManager.ts    # 저장/불러오기 오케스트레이터
│   ├── Serializer.ts            # 직렬화 전략
│   ├── FileManager.ts           # 파일 I/O 추상화
│   ├── AutoSaveManager.ts       # 자동 저장 관리
│   ├── ValidationManager.ts     # 스키마 검증
│   └── persistenceTypes.ts      # Persistence 타입
│
└── state/
    └── StateManager.ts          # serialize/deserialize 제거 고려
```

### 4.4 인터페이스 설계

```typescript
// src/persistence/persistenceTypes.ts

/**
 * 직렬화된 상태 포맷
 * - JSON으로 저장될 구조
 */
export interface SerializedState {
  version: string;  // "1.0.0"
  schemaVersion: number;
  timestamp: number;

  graph: {
    nodes: [NodeId, MindMapNode][];  // Map → Array
    edges: [EdgeId, MindMapEdge][];  // Map → Array
    rootId: NodeId;
  };

  layout: {
    viewport: { x: number; y: number; zoom: number };
    nodePositions: [NodeId, Position][];  // Map → Array
  };

  settings: UserSettings;
  pinnedNodes: NodeId[];  // Set → Array

  // 메타데이터
  metadata: {
    lastModified: number;
    nodeCount: number;
    edgeCount: number;
  };
}

/**
 * 저장 옵션
 */
export interface SaveOptions {
  debounce?: boolean;       // 디바운스 적용 여부
  createBackup?: boolean;   // 백업 생성 여부
  validate?: boolean;       // 저장 전 검증 여부
}

/**
 * 불러오기 옵션
 */
export interface LoadOptions {
  validate?: boolean;       // 불러오기 전 검증 여부
  migrate?: boolean;        // 스키마 마이그레이션 수행 여부
}
```

```typescript
// src/persistence/Serializer.ts

/**
 * 상태 직렬화/역직렬화
 * - StateManager의 serialize/deserialize 로직 이관
 */
export class Serializer {
  /**
   * PersistentState → SerializedState 변환
   */
  serialize(state: PersistentState): SerializedState {
    // 1. Map/Set → Array 변환
    // 2. 메타데이터 추가 (timestamp, version, counts)
    // 3. SerializedState 반환
  }

  /**
   * SerializedState → PersistentState 변환
   */
  deserialize(data: SerializedState): PersistentState {
    // 1. 스키마 버전 확인
    // 2. Array → Map/Set 변환
    // 3. Fallback 값 적용
    // 4. PersistentState 반환
  }

  /**
   * JSON 문자열 → SerializedState 파싱
   */
  parse(jsonString: string): SerializedState;

  /**
   * SerializedState → JSON 문자열 변환
   */
  stringify(data: SerializedState): string;
}
```

```typescript
// src/persistence/FileManager.ts

/**
 * 파일 I/O 추상화
 * - Obsidian Vault API 래퍼
 */
export class FileManager {
  private app: App;  // Obsidian App instance

  constructor(app: App) {
    this.app = app;
  }

  /**
   * 파일 저장
   *
   * @param filePath - 파일 경로 (예: "mindmaps/my-mindmap.json")
   * @param content - 저장할 내용
   */
  async save(filePath: string, content: string): Promise<void> {
    // 1. 파일 존재 여부 확인
    // 2. 존재: app.vault.modify()
    // 3. 없음: app.vault.create()
  }

  /**
   * 파일 불러오기
   */
  async load(filePath: string): Promise<string> {
    // 1. 파일 존재 여부 확인
    // 2. app.vault.read()
    // 3. 내용 반환
  }

  /**
   * 백업 파일 생성
   */
  async createBackup(filePath: string): Promise<string> {
    // 1. 원본 파일 읽기
    // 2. 타임스탬프 기반 백업 경로 생성
    //    예: "mindmaps/my-mindmap.2026-01-12-14-30-00.json"
    // 3. 백업 파일 저장
    // 4. 백업 경로 반환
  }

  /**
   * 파일 존재 여부 확인
   */
  async exists(filePath: string): Promise<boolean>;
}
```

```typescript
// src/persistence/AutoSaveManager.ts

/**
 * 자동 저장 관리
 * - 디바운스 적용
 * - 상태 변경 감지 및 저장 트리거
 */
export class AutoSaveManager implements Disposable {
  private persistenceManager: PersistenceManager;
  private eventBus: EventBus;
  private saveTimerId: number | null = null;
  private readonly DEBOUNCE_MS = 1000;  // 1초 디바운스
  private unsubscribe: Unsubscribe | null = null;

  constructor(persistenceManager: PersistenceManager, eventBus: EventBus) {
    this.persistenceManager = persistenceManager;
    this.eventBus = eventBus;
    this.subscribeToStateChanges();
  }

  /**
   * 상태 변경 이벤트 구독
   */
  private subscribeToStateChanges(): void {
    this.unsubscribe = this.eventBus.on('stateChanged', () => {
      this.scheduleSave();
    });
  }

  /**
   * 저장 스케줄링 (디바운스)
   */
  private scheduleSave(): void {
    // 1. 기존 타이머 취소
    // if (this.saveTimerId) clearTimeout(this.saveTimerId);

    // 2. 새 타이머 설정
    // this.saveTimerId = setTimeout(() => {
    //   this.persistenceManager.save({ debounce: false });
    // }, this.DEBOUNCE_MS);
  }

  /**
   * 즉시 저장 (디바운스 무시)
   */
  async saveNow(): Promise<void> {
    if (this.saveTimerId) {
      clearTimeout(this.saveTimerId);
      this.saveTimerId = null;
    }
    await this.persistenceManager.save({ debounce: false });
  }

  /**
   * 정리
   */
  destroy(): void {
    if (this.saveTimerId) {
      clearTimeout(this.saveTimerId);
    }
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
```

```typescript
// src/persistence/PersistenceManager.ts

/**
 * Persistence 오케스트레이터
 * - 저장/불러오기 조율
 */
export class PersistenceManager implements Disposable {
  private stateManager: StateManager;
  private serializer: Serializer;
  private fileManager: FileManager;
  private validationManager: ValidationManager;
  private autoSaveManager: AutoSaveManager | null = null;

  private currentFilePath: string | null = null;

  constructor(
    stateManager: StateManager,
    app: App,
    eventBus: EventBus
  ) {
    this.stateManager = stateManager;
    this.serializer = new Serializer();
    this.fileManager = new FileManager(app);
    this.validationManager = new ValidationManager();

    // AutoSave 활성화
    this.autoSaveManager = new AutoSaveManager(this, eventBus);
  }

  /**
   * 현재 파일 경로 설정
   */
  setFilePath(filePath: string): void {
    this.currentFilePath = filePath;
  }

  /**
   * 상태 저장
   */
  async save(options: SaveOptions = {}): Promise<void> {
    if (!this.currentFilePath) {
      throw new Error('No file path set for saving');
    }

    // 1. StateManager에서 PersistentState 가져오기
    //    (StateManager에 getPersistentState() 추가 필요)
    // const persistentState = this.stateManager.getPersistentState();

    // 2. 직렬화
    // const serialized = this.serializer.serialize(persistentState);

    // 3. 검증 (옵션)
    // if (options.validate) {
    //   this.validationManager.validate(serialized);
    // }

    // 4. 백업 생성 (옵션)
    // if (options.createBackup) {
    //   await this.fileManager.createBackup(this.currentFilePath);
    // }

    // 5. JSON 변환
    // const jsonString = this.serializer.stringify(serialized);

    // 6. 파일 저장
    // await this.fileManager.save(this.currentFilePath, jsonString);
  }

  /**
   * 상태 불러오기
   */
  async load(filePath: string, options: LoadOptions = {}): Promise<void> {
    // 1. 파일 읽기
    // const jsonString = await this.fileManager.load(filePath);

    // 2. 파싱
    // const serialized = this.serializer.parse(jsonString);

    // 3. 검증 (옵션)
    // if (options.validate) {
    //   this.validationManager.validate(serialized);
    // }

    // 4. 마이그레이션 (옵션)
    // if (options.migrate) {
    //   // 스키마 버전 확인 및 마이그레이션
    // }

    // 5. 역직렬화
    // const persistentState = this.serializer.deserialize(serialized);

    // 6. StateManager에 상태 설정
    //    (StateManager에 restorePersistentState() 추가 필요)
    // this.stateManager.restorePersistentState(persistentState);

    // 7. 현재 파일 경로 저장
    this.currentFilePath = filePath;
  }

  /**
   * 정리
   */
  destroy(): void {
    if (this.autoSaveManager) {
      this.autoSaveManager.destroy();
    }
  }
}
```

### 4.5 StateManager 수정 필요사항

```typescript
// src/state/StateManager.ts (수정 필요)

export class StateManager implements Disposable, EventEmitter {
  // ...

  /**
   * PersistentState 직접 접근 (Persistence 레이어용)
   * - Phase 3: Persistence 레이어가 직렬화할 수 있도록 제공
   */
  getPersistentState(): PersistentState {
    return this.persistentState;
  }

  /**
   * PersistentState 복원 (Persistence 레이어용)
   * - Phase 3: 불러온 상태를 복원
   */
  restorePersistentState(state: PersistentState): void {
    // 1. 기존 상태 초기화
    this.persistentState.graph.nodes.clear();
    this.persistentState.graph.edges.clear();
    // ...

    // 2. 새 상태 복사
    this.persistentState.schemaVersion = state.schemaVersion;
    this.persistentState.graph = state.graph;
    this.persistentState.layout = state.layout;
    // ...

    // 3. 이벤트 발행
    this.emit('stateChanged', { snapshot: this.getSnapshot() });
  }

  // serialize() / deserialize() 메서드는 제거하거나 deprecated 표시
  // Phase 3: 이 메서드들은 PersistenceManager로 이관
}
```

### 4.6 통합 흐름 다이어그램

```
플러그인 onload
    ↓
PersistenceManager 생성
    ↓
PersistenceManager.load("mindmaps/default.json")
    ├─ 1. FileManager.load() → JSON 문자열
    ├─ 2. Serializer.parse() → SerializedState
    ├─ 3. ValidationManager.validate() (옵션)
    ├─ 4. Serializer.deserialize() → PersistentState
    └─ 5. StateManager.restorePersistentState()

사용자 작업 (노드 생성)
    ↓
StateManager.addNode()
    ↓
EventBus.emit('stateChanged')
    ↓
AutoSaveManager.scheduleSave() (1초 디바운스)
    ↓
PersistenceManager.save()
    ├─ 1. StateManager.getPersistentState()
    ├─ 2. Serializer.serialize() → SerializedState
    ├─ 3. Serializer.stringify() → JSON 문자열
    └─ 4. FileManager.save()

플러그인 onunload
    ↓
AutoSaveManager.saveNow() (즉시 저장)
    ↓
PersistenceManager.destroy()
```

---

## 5. Phase 2.5 주석/경계의 Phase 3 활용 매핑

### 5.1 StateManager 주석 매핑

| Phase 2.5 주석 위치 | 내용 | Phase 3 활용 방법 |
|---|---|---|
| **Line 24-30** | ❌ Undo/Redo: Phase 3에서 별도 레이어로 분리 예정 | → `src/history/HistoryManager.ts` 생성 근거 |
| **Line 26** | ❌ 파일 저장: Phase 3에서 Persistence 레이어로 분리 예정 | → `src/persistence/PersistenceManager.ts` 생성 근거 |
| **Line 27** | ❌ 이벤트 발행: Phase 2+에서 추가 예정 | → `src/events/EventBus.ts` 생성 및 StateManager에 EventEmitter 구현 |
| **Line 28** | ❌ 그래프 유효성 검증: 연결된 엣지 제거, 고아 노드 처리 등 미구현 | → `DeleteNodeCommand.execute()`에서 엣지 제거 로직 구현 |
| **Line 196-199** | addNode 제약사항 | → `CreateNodeCommand`에서 ID 중복 검증 추가 고려 |
| **Line 216-220** | ⚠️ removeNode 불완전 구현 경고 | → `DeleteNodeCommand`에서 완전한 구현 제공 (엣지 제거, 자식 참조 업데이트) |
| **Line 210** | `// Phase 2+: this.emit('nodeCreated', node);` | → `this.emit('nodeCreated', { node });` 활성화 |
| **Line 227** | `// Phase 2+: this.emit('nodeDeleted', nodeId);` | → `this.emit('nodeDeleted', { nodeId });` 활성화 |
| **Line 247** | `// Phase 2+: this.emit('nodeUpdated', node);` | → `this.emit('nodeUpdated', { node, changes });` 활성화 |
| **Line 265** | `// Phase 2+: this.emit('nodeSelected', nodeId);` | → `this.emit('nodeSelected', { nodeId });` 활성화 |
| **Line 281** | `// Phase 2+: this.emit('editingChanged', nodeId);` | → `this.emit('editingChanged', { nodeId });` 활성화 |
| **Line 369-370** | 이벤트 리스너 정리, 구독 해제 | → EventEmitter 구독 해제 로직 구현 |

### 5.2 DirectionManager 주석 매핑

| Phase 2.5 주석 위치 | 내용 | Phase 3 활용 방법 |
|---|---|---|
| **Line 25-29** | ❌ 좌표 계산: LayoutEngine 책임 | → `src/core/LayoutEngine.ts`에서 DirectionPlan.laneIndex를 실제 좌표로 변환 |
| **Line 26** | ❌ 간격 계산: LayoutEngine 책임 | → LayoutEngine에서 GAP_CONSTANTS 활용 |
| **Line 27** | ❌ 렌더링: Renderer 책임 | → DirectionManager는 Renderer와 직접 통신 안 함 (State를 통해서만) |
| **Line 28** | ❌ 상태 관리: StateManager 책임 | → DirectionManager는 stateless 유지 |
| **Line 31-34** | 핵심 원칙: 의미적 방향만 다룸 | → LayoutEngine 설계 시 DirectionPlan을 입력으로 받아 좌표 계산 |

### 5.3 Renderer 주석 매핑

| Phase 2.5 관련 영역 | 내용 | Phase 3 활용 방법 |
|---|---|---|
| **Renderer.ts Line 30** | `// Phase 2+: RAF 루프 시작` | → `start()` 메서드 구현 (EventBus 구독 + RAF 시작) |
| **Renderer.ts Line 57-63** | `render()` 메서드 스텁 | → StateSnapshot을 받아 SVG DOM 업데이트 로직 구현 |
| **NeroMindView.ts Line 74-76** | `// Phase 2+: Renderer, StateManager 등 초기화` | → `onOpen()`에서 모든 Phase 3 레이어 초기화 |

### 5.4 Types 주석 매핑

| Phase 2.5 타입 정의 | Phase 3 활용 방법 |
|---|---|
| `NodeEvent`, `ViewportEvent`, `StateEvent` | → EventBus의 EventPayloadMap에 통합 |
| `Command` 인터페이스 (undo 포함) | → UndoableCommand의 기반 (단, StateContext 파라미터 추가 필요) |
| `Disposable` 인터페이스 | → 모든 Phase 3 레이어가 구현 (HistoryManager, EventBus, PersistenceManager, AutoSaveManager) |

### 5.5 Phase 2.5 → Phase 3 전환 체크리스트

#### StateManager 관련
- [ ] `EventEmitter` 인터페이스 구현
- [ ] `setEventBus()` 메서드 추가
- [ ] `emit()` 메서드 추가 (protected)
- [ ] 모든 `// Phase 2+: 이벤트 발행` 주석 제거 및 실제 emit() 호출로 대체
- [ ] `removeNode()`에서 연결된 엣지 제거 로직 추가
- [ ] `getPersistentState()` 메서드 추가 (Persistence용)
- [ ] `restorePersistentState()` 메서드 추가 (Persistence용)
- [ ] `serialize()`/`deserialize()` deprecated 표시 또는 제거

#### 신규 레이어 생성
- [ ] `src/events/` 디렉토리 생성
- [ ] `src/history/` 디렉토리 생성
- [ ] `src/persistence/` 디렉토리 생성
- [ ] `src/history/commands/` 디렉토리 생성 (Command 구현체)

#### Event System
- [ ] `EventBus` 클래스 구현
- [ ] `eventTypes.ts` - EventPayloadMap 정의
- [ ] StateManager에 EventEmitter 통합
- [ ] Renderer에 이벤트 구독 로직 추가

#### History System
- [ ] `UndoableCommand` 인터페이스 정의
- [ ] `CommandHistory` 클래스 구현 (스택 관리)
- [ ] `HistoryManager` 클래스 구현 (오케스트레이터)
- [ ] `CommandFactory` 클래스 구현
- [ ] 기본 Command 구현: CreateNode, DeleteNode, UpdateNode, MoveNode

#### Persistence System
- [ ] `Serializer` 클래스 구현
- [ ] `FileManager` 클래스 구현
- [ ] `AutoSaveManager` 클래스 구현
- [ ] `ValidationManager` 클래스 구현
- [ ] `PersistenceManager` 클래스 구현

#### 통합 및 초기화
- [ ] `main.ts` - initializePlugin()에서 모든 레이어 생성 및 연결
- [ ] `NeroMindView.ts` - onOpen()에서 레이어 초기화
- [ ] Disposable 체인에 모든 Phase 3 레이어 등록
- [ ] 역순 destroy 순서 확인

---

## 6. Phase 3 작업 순서 체크리스트

### Phase 3.1: Event System 구축 (1주차)

**목표:** 이벤트 기반 아키텍처 기반 마련

#### Task 1.1: Event Bus 인프라 구축
- [ ] `src/events/` 디렉토리 생성
- [ ] `eventTypes.ts` 작성
  - [ ] `EventPayloadMap` 인터페이스 정의
  - [ ] `EventListener<K>` 타입 정의
  - [ ] `Unsubscribe` 타입 정의
- [ ] `EventBus.ts` 작성
  - [ ] `on()` 메서드 구현
  - [ ] `once()` 메서드 구현
  - [ ] `emit()` 메서드 구현
  - [ ] `off()` 메서드 구현
  - [ ] `clear()` 메서드 구현
  - [ ] `destroy()` 메서드 구현
  - [ ] 에러 격리 (try-catch) 추가

#### Task 1.2: StateManager에 EventEmitter 통합
- [ ] `EventEmitter` 인터페이스 정의 (`src/events/EventEmitter.ts`)
- [ ] StateManager에 `EventEmitter` 구현
  - [ ] `eventBus` 필드 추가
  - [ ] `setEventBus()` 메서드 추가
  - [ ] `emit()` 메서드 추가 (protected)
- [ ] 모든 state 변경 메서드에 이벤트 발행 추가
  - [ ] `addNode()` → emit('nodeCreated')
  - [ ] `removeNode()` → emit('nodeDeleted')
  - [ ] `updateNode()` → emit('nodeUpdated')
  - [ ] `selectNode()` → emit('nodeSelected')
  - [ ] `setEditingNode()` → emit('editingChanged')
  - [ ] `deserialize()` → emit('stateChanged')

#### Task 1.3: Renderer에 이벤트 구독 추가
- [ ] Renderer 생성자에 `EventBus` 파라미터 추가
- [ ] `subscribeToEvents()` 메서드 구현
  - [ ] 'nodeCreated' 구독
  - [ ] 'nodeDeleted' 구독
  - [ ] 'nodeUpdated' 구독
  - [ ] 'nodeMoved' 구독 (준비)
  - [ ] 'historyChanged' 구독 (준비)
- [ ] `unsubscribers` 배열 관리
- [ ] `destroy()`에서 모든 구독 해제

#### Task 1.4: 통합 테스트
- [ ] main.ts에서 EventBus 생성 및 주입
- [ ] StateManager.addNode() 호출 시 이벤트 발행 확인
- [ ] Renderer에서 이벤트 수신 확인 (console.log)
- [ ] 플러그인 unload 시 구독 해제 확인

---

### Phase 3.2: History System 구축 (2주차)

**목표:** Undo/Redo 기능 구현

#### Task 2.1: History 인프라 구축
- [ ] `src/history/` 디렉토리 생성
- [ ] `historyTypes.ts` 작성
  - [ ] `UndoableCommand` 인터페이스 정의
  - [ ] `CommandSnapshot` 인터페이스 정의
- [ ] `CommandHistory.ts` 작성
  - [ ] undoStack/redoStack 필드 추가
  - [ ] `recordExecution()` 메서드 구현
  - [ ] `canUndo()` / `canRedo()` 메서드 구현
  - [ ] `popUndo()` / `popRedo()` 메서드 구현
  - [ ] `pushRedo()` 메서드 구현
  - [ ] `clear()` 메서드 구현
  - [ ] MAX_HISTORY 제한 구현

#### Task 2.2: HistoryManager 구현
- [ ] `HistoryManager.ts` 작성
  - [ ] StateManager 참조 주입
  - [ ] CommandHistory 인스턴스 생성
  - [ ] `execute()` 메서드 구현 (beforeState/afterState 캡처)
  - [ ] `undo()` 메서드 구현
  - [ ] `redo()` 메서드 구현
  - [ ] `getHistoryState()` 메서드 구현
  - [ ] EventBus 통합 (historyChanged 이벤트 발행)
- [ ] `Disposable` 구현

#### Task 2.3: Command 구현체 작성
- [ ] `src/history/commands/` 디렉토리 생성
- [ ] `CreateNodeCommand.ts` 작성
  - [ ] `execute()` 구현
  - [ ] `undo()` 구현
- [ ] `DeleteNodeCommand.ts` 작성
  - [ ] `execute()` 구현 (엣지 제거 포함)
  - [ ] `undo()` 구현 (노드 + 엣지 복원)
  - [ ] Phase 2.5 경고 해결
- [ ] `UpdateNodeCommand.ts` 작성
  - [ ] `execute()` 구현 (이전 값 백업)
  - [ ] `undo()` 구현 (이전 값 복원)
- [ ] `MoveNodeCommand.ts` 작성
  - [ ] `execute()` 구현
  - [ ] `undo()` 구현

#### Task 2.4: CommandFactory 구현
- [ ] `CommandFactory.ts` 작성
  - [ ] `createNode()` 정적 메서드
  - [ ] `deleteNode()` 정적 메서드
  - [ ] `updateNode()` 정적 메서드
  - [ ] `moveNode()` 정적 메서드
  - [ ] `composite()` 정적 메서드 (복합 Command)

#### Task 2.5: 통합 테스트
- [ ] main.ts에서 HistoryManager 생성
- [ ] InputManager 스텁 작성 (Command 생성 및 execute 호출)
- [ ] Undo/Redo 키보드 단축키 등록 (Ctrl+Z, Ctrl+Y)
- [ ] 노드 생성 → Undo → Redo 사이클 테스트
- [ ] 히스토리 스택 MAX_HISTORY 제한 테스트

---

### Phase 3.3: Persistence System 구축 (3주차)

**목표:** 자동 저장 및 파일 불러오기 구현

#### Task 3.1: Persistence 인프라 구축
- [ ] `src/persistence/` 디렉토리 생성
- [ ] `persistenceTypes.ts` 작성
  - [ ] `SerializedState` 인터페이스 정의
  - [ ] `SaveOptions` 인터페이스 정의
  - [ ] `LoadOptions` 인터페이스 정의

#### Task 3.2: Serializer 구현
- [ ] `Serializer.ts` 작성
  - [ ] `serialize()` 메서드 구현 (Map/Set → Array)
  - [ ] `deserialize()` 메서드 구현 (Array → Map/Set)
  - [ ] `parse()` 메서드 구현 (JSON → SerializedState)
  - [ ] `stringify()` 메서드 구현 (SerializedState → JSON)
  - [ ] 메타데이터 추가 (timestamp, version, counts)

#### Task 3.3: FileManager 구현
- [ ] `FileManager.ts` 작성
  - [ ] Obsidian App 주입
  - [ ] `save()` 메서드 구현 (vault.modify/create)
  - [ ] `load()` 메서드 구현 (vault.read)
  - [ ] `createBackup()` 메서드 구현 (타임스탬프 기반 백업)
  - [ ] `exists()` 메서드 구현

#### Task 3.4: ValidationManager 구현
- [ ] `ValidationManager.ts` 작성
  - [ ] 스키마 버전 검증
  - [ ] 필수 필드 검증
  - [ ] 데이터 타입 검증
  - [ ] 그래프 무결성 검증 (rootId 존재 여부 등)

#### Task 3.5: AutoSaveManager 구현
- [ ] `AutoSaveManager.ts` 작성
  - [ ] EventBus 'stateChanged' 구독
  - [ ] 디바운스 로직 구현 (1초)
  - [ ] `scheduleSave()` 메서드 구현
  - [ ] `saveNow()` 메서드 구현
  - [ ] `Disposable` 구현 (타이머 정리)

#### Task 3.6: PersistenceManager 구현
- [ ] `PersistenceManager.ts` 작성
  - [ ] Serializer, FileManager, ValidationManager 인스턴스 생성
  - [ ] AutoSaveManager 인스턴스 생성 및 활성화
  - [ ] `setFilePath()` 메서드 구현
  - [ ] `save()` 메서드 구현
  - [ ] `load()` 메서드 구현
  - [ ] `Disposable` 구현

#### Task 3.7: StateManager 수정
- [ ] `getPersistentState()` 메서드 추가
- [ ] `restorePersistentState()` 메서드 추가
- [ ] `serialize()`/`deserialize()` 메서드 deprecated 표시
- [ ] `restorePersistentState()` 호출 시 'stateChanged' 이벤트 발행

#### Task 3.8: 통합 테스트
- [ ] main.ts에서 PersistenceManager 생성
- [ ] 플러그인 onload 시 기본 파일 불러오기
- [ ] 노드 생성 후 1초 후 자동 저장 확인
- [ ] 플러그인 onunload 시 즉시 저장 확인
- [ ] 저장된 파일 수동 확인 (JSON 포맷 검증)
- [ ] 플러그인 재시작 후 상태 복원 확인

---

### Phase 3.4: 통합 및 최적화 (4주차)

**목표:** 모든 레이어 통합 및 안정화

#### Task 4.1: main.ts 초기화 로직 작성
- [ ] `initializePlugin()` 메서드 구현
  - [ ] EventBus 생성
  - [ ] StateManager 생성 및 EventBus 주입
  - [ ] HistoryManager 생성
  - [ ] PersistenceManager 생성
  - [ ] Renderer 생성 및 EventBus 주입
  - [ ] 모든 레이어를 disposables 배열에 추가
- [ ] 초기화 순서 문서화

#### Task 4.2: Disposable 체인 검증
- [ ] 역순 destroy 순서 확인
  - [ ] Renderer → PersistenceManager → HistoryManager → StateManager → EventBus
- [ ] 각 레이어의 destroy() 구현 검증
- [ ] 메모리 누수 테스트 (구독 해제 확인)

#### Task 4.3: 이벤트 흐름 최적화
- [ ] 불필요한 이벤트 발행 제거 (중복 방지)
- [ ] 이벤트 배치 처리 검토 (여러 노드 변경 시)
- [ ] Renderer의 RAF 기반 렌더링과 이벤트 통합

#### Task 4.4: 에러 처리 강화
- [ ] Command 실행 실패 시 롤백 로직
- [ ] 파일 I/O 실패 시 사용자 알림
- [ ] EventBus emit 중 에러 격리 검증
- [ ] 디버그 모드 추가 (console.log 토글)

#### Task 4.5: 문서화
- [ ] Phase 3 아키텍처 다이어그램 업데이트
- [ ] API 문서 작성 (각 레이어별)
- [ ] 사용 예시 작성 (Command 생성, 이벤트 구독 등)
- [ ] 트러블슈팅 가이드 작성

#### Task 4.6: 통합 테스트 시나리오
- [ ] 시나리오 1: 노드 생성 → 편집 → 삭제 → Undo → Redo
- [ ] 시나리오 2: 대량 노드 생성 (100개) → 성능 측정
- [ ] 시나리오 3: 플러그인 재시작 → 상태 복원 확인
- [ ] 시나리오 4: Obsidian 강제 종료 → 자동 저장 복구
- [ ] 시나리오 5: 여러 이벤트 동시 발생 → 순서 보장 확인

---

### Phase 3.5: 검증 및 배포 준비 (5주차)

**목표:** Phase 3 완료 및 Phase 4 준비

#### Task 5.1: Code Review
- [ ] 모든 Phase 3 코드 리뷰
- [ ] Phase 2.5 주석이 모두 해결되었는지 확인
- [ ] TypeScript 타입 안정성 검증
- [ ] ESLint/Prettier 규칙 준수 확인

#### Task 5.2: 성능 프로파일링
- [ ] Command 실행 시간 측정
- [ ] 이벤트 발행/구독 오버헤드 측정
- [ ] 직렬화/역직렬화 성능 측정
- [ ] RAF 렌더링 성능 측정
- [ ] 병목 지점 식별 및 최적화

#### Task 5.3: 사용자 테스트
- [ ] 실제 마인드맵 생성 테스트 (50+ 노드)
- [ ] Undo/Redo 직관성 테스트
- [ ] 자동 저장 체감 테스트
- [ ] 에러 발생 시 복구 테스트

#### Task 5.4: Phase 4 경계 설정
- [ ] Phase 4에서 추가할 기능 목록 확정
  - AutoAligner (자동 정렬)
  - MiniMap (미니맵)
  - LOD (Level of Detail)
  - Settings UI (설정 UI 완성)
- [ ] Phase 3 완료 체크포인트 문서 작성
- [ ] Phase 4 진입 조건 정의

#### Task 5.5: 릴리스 준비
- [ ] CHANGELOG.md 업데이트 (Phase 3 변경사항)
- [ ] README.md 업데이트 (Phase 3 기능 설명)
- [ ] 버전 번호 업데이트 (manifest.json)
- [ ] Git 태그 생성 (v0.3.0)

---

## 7. Phase 3 완료 조건

### 필수 조건 (Must-Have)
- [x] EventBus 구현 및 모든 레이어 통합
- [x] StateManager에서 6개 이벤트 발행 ('nodeCreated', 'nodeDeleted', 'nodeUpdated', 'nodeSelected', 'editingChanged', 'stateChanged')
- [x] Renderer에서 이벤트 구독 및 렌더링 업데이트
- [x] HistoryManager 구현 (Undo/Redo 동작)
- [x] 4개 기본 Command 구현 (CreateNode, DeleteNode, UpdateNode, MoveNode)
- [x] PersistenceManager 구현 (저장/불러오기)
- [x] AutoSave 동작 (1초 디바운스)
- [x] 플러그인 재시작 시 상태 복원
- [x] DeleteNodeCommand에서 연결된 엣지 제거 (Phase 2.5 경고 해결)

### 선택 조건 (Nice-to-Have)
- [ ] CompositeCommand 구현 (복합 명령)
- [ ] 스키마 마이그레이션 시스템
- [ ] 백업 파일 자동 생성 및 관리
- [ ] Command 실행 실패 시 자동 롤백
- [ ] 이벤트 디버그 모드 (로그 토글)

### 성능 기준
- [ ] 100개 노드 생성 시 < 100ms
- [ ] Command 실행 → 이벤트 발행 → 렌더링 < 16ms (60 FPS)
- [ ] 파일 저장 < 500ms (1000 노드 기준)
- [ ] 파일 불러오기 < 1000ms (1000 노드 기준)

---

## 8. 다이어그램: Phase 3 최종 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     Plugin Layer (main.ts)                   │
│  - 생명주기 관리 (onload, onunload)                           │
│  - Disposable 체인 관리                                        │
└────────────────┬───────────────────┬────────────────────────┘
                 │                   │
    ┌────────────▼──────────┐   ┌───▼─────────────────────────┐
    │   EventBus (NEW)      │   │  PersistenceManager (NEW)   │
    │  - 이벤트 중앙 관리    │   │  - AutoSave (1초 디바운스)  │
    │  - 타입 안전 dispatch  │   │  - Serializer               │
    └────────────┬───────────┘   │  - FileManager              │
                 │               │  - ValidationManager        │
                 │               └──┬──────────────────────────┘
                 │                  │
    ┌────────────▼──────────────────▼──────────────────────────┐
    │                    HistoryManager (NEW)                   │
    │  - CommandHistory (Undo/Redo 스택)                        │
    │  - execute() / undo() / redo()                            │
    │  - Snapshot 기반 복원                                      │
    └────────────┬──────────────────────────────────────────────┘
                 │
                 │ Wraps
                 ↓
    ┌────────────────────────────────────────────────────────┐
    │              StateManager (Phase 2.5)                   │
    │  - apply(command) 단방향 실행                            │
    │  - getSnapshot() 불변 스냅샷 제공                        │
    │  - EventEmitter 구현 (6개 이벤트 발행)                   │
    │  - getPersistentState() / restorePersistentState()      │
    └────────────┬───────────────────────────────────────────┘
                 │
                 │ Provides Snapshots
                 ↓
    ┌────────────────────────────────────────────────────────┐
    │                  Renderer (Phase 2)                     │
    │  - EventBus 구독 (6개 이벤트)                            │
    │  - RAF 기반 렌더링 루프                                   │
    │  - SVGNodeFactory / SVGEdgeFactory 활용                 │
    └────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   Command Implementations                     │
│  src/history/commands/                                        │
│  - CreateNodeCommand                                          │
│  - DeleteNodeCommand (엣지 제거 포함)                         │
│  - UpdateNodeCommand                                          │
│  - MoveNodeCommand                                            │
│  - CompositeCommand                                           │
└──────────────────────────────────────────────────────────────┘

                         Data Flow:

사용자 입력 (InputManager - Phase 4)
    ↓
CommandFactory.createNode(node)
    ↓
HistoryManager.execute(command)
    ├─ beforeSnapshot = StateManager.getSnapshot()
    ├─ StateManager.apply(command)
    │   ├─ command.execute(context)
    │   └─ EventBus.emit('nodeCreated', { node })
    │       └─ Renderer: renderNode(node)
    ├─ afterSnapshot = StateManager.getSnapshot()
    └─ CommandHistory.recordExecution(snapshot)
        └─ undoStack.push(snapshot)

AutoSave (1초 후)
    ↓
PersistenceManager.save()
    ├─ StateManager.getPersistentState()
    ├─ Serializer.serialize()
    └─ FileManager.save()
```

---

## 9. 결론

이 설계 문서는 Phase 2.5에서 추가한 타입 정리, 주석 보강, 인터페이스 경계 명확화를 기반으로 Phase 3 구현을 위한 구체적인 로드맵을 제공합니다.

### 핵심 설계 원칙

1. **StateManager는 히스토리를 모른다** - HistoryManager가 외부 래퍼로 감쌈
2. **이벤트는 중앙화된다** - EventBus가 모든 이벤트를 중재
3. **저장은 분리된다** - PersistenceManager가 파일 I/O 전담
4. **Phase 2.5 경계를 존중한다** - 모든 주석이 Phase 3 작업의 가이드

### 작업 순서 요약

1. **Week 1:** Event System (EventBus + StateManager EventEmitter + Renderer 구독)
2. **Week 2:** History System (HistoryManager + Commands + Undo/Redo)
3. **Week 3:** Persistence System (PersistenceManager + AutoSave + FileManager)
4. **Week 4:** Integration (통합 테스트 + 최적화)
5. **Week 5:** Validation (검증 + 문서화 + Phase 4 준비)

Phase 3 완료 후, Phase 4(AutoAligner, MiniMap, LOD, Settings UI)로 진행할 수 있는 안정적인 기반이 마련됩니다.

---

## 10. Phase 3 설계 비판적 검토 (Critical Analysis)

### 문서 정보
- **작성일**: 2026-01-12
- **분석 방법**: 10개 병렬 서브 에이전트를 통한 독립적 검토
- **목적**: 구현 전 설계 취약점 식별 및 개선 방안 제시

---

### 10.1 Executive Summary

Phase 3 설계 문서는 포괄적이고 체계적이지만, 실제 구현 시 다음과 같은 **5가지 주요 리스크**가 존재합니다:

1. **메모리 오버헤드**: CommandSnapshot이 beforeState + afterState를 저장하여 1000개 노드 × 100 히스토리 시 **90MB** 메모리 사용
2. **타입 안전성 부족**: EventBus의 문자열 기반 이벤트 이름은 컴파일 타임 검증 불가
3. **과도한 보일러플레이트**: 단순 작업에도 50+ 라인의 Command 클래스 작성 필요
4. **순환 의존성**: EventBus ↔ StateManager ↔ HistoryManager 간 의존성 사이클
5. **레이스 컨디션**: AutoSaveManager의 saveNow()와 scheduleSave() 동시 호출 시 충돌 가능

**권장 사항**: 설계를 폐기하기보다는 **전술적 개선**을 통해 리스크를 완화하고 단계적으로 구현.

---

### 10.2 Critical Issue #1: HistoryManager-StateManager 밀결합 (Tight Coupling)

#### 문제점

**설계 의도:**
```typescript
HistoryManager.execute(command)
    ├─ beforeSnapshot = StateManager.getSnapshot()  // Full snapshot
    ├─ StateManager.apply(command)
    └─ afterSnapshot = StateManager.getSnapshot()   // Full snapshot
```

**실제 문제:**
1. **메모리 폭발**: 단일 Command당 2개의 전체 스냅샷 저장
   - 1000 노드 시나리오: 450KB × 2 = 900KB per operation
   - MAX_HISTORY=100: 900KB × 100 = **90MB** (히스토리만)

2. **성능 병목**: getSnapshot()은 모든 노드/엣지를 deep clone
   ```typescript
   getSnapshot(): StateSnapshot {
       const nodes = Object.freeze(
           Array.from(this.persistentState.graph.nodes.values()).map(
               (node) => this.cloneNode(node)  // O(N) per node
           )
       );
       // ... edges, pinnedNodes 등도 동일
   }
   ```
   → 100개 노드 변경 시 100 × (100 노드 clone) = **10,000 cloning operations**

3. **불필요한 중복**: beforeState와 afterState는 대부분 동일 (1개 노드만 변경되어도 전체 저장)

#### 근본 원인

- **Snapshot 패턴 오용**: Snapshot은 "외부 소비자를 위한 읽기 전용 뷰"인데, 내부 히스토리 저장에도 사용
- **Command 역실행 무시**: UndoableCommand.undo()가 있는데도 스냅샷 기반 복원 사용

#### 개선 방안

**Option A: Delta-based Snapshots (추천)**
```typescript
interface CommandDelta {
    command: UndoableCommand;
    changes: Partial<PersistentState>;  // 변경된 부분만 저장
    timestamp: number;
}

// 예: UpdateNodeCommand는 1개 노드만 저장
{
    command: updateCmd,
    changes: {
        graph: {
            nodes: new Map([["node-123", changedNode]])  // 1개만
        }
    }
}
```
**메모리 절감**: 90MB → ~5MB (95% 감소)

**Option B: Inverse Operation Pattern**
```typescript
// Undo를 위한 역연산만 저장
class DeleteNodeCommand {
    private deletedNode: MindMapNode | null = null;

    undo(context: StateContext): void {
        // execute()에서 백업한 deletedNode 복원
        context.persistent.graph.nodes.set(this.nodeId, this.deletedNode);
    }
}
```
**장점**: 스냅샷 불필요, Command가 자체 Undo 데이터 관리

**Option C: Structural Sharing (고급)**
- Immer.js 같은 라이브러리 사용
- 변경되지 않은 부분은 참조 공유
- **메모리 오버헤드**: ~10MB (단, 복잡도 증가)

#### 구현 우선순위

1. **Phase 3.0**: Option B (Inverse Operation) - 가장 간단
2. **Phase 3.5**: Option A (Delta Snapshots) 추가 - 복잡한 Command 지원
3. **Phase 4+**: Option C (Structural Sharing) 검토 - 성능 최적화

---

### 10.3 Critical Issue #2: EventBus 타입 안전성 취약

#### 문제점

**현재 설계:**
```typescript
export interface EventPayloadMap {
  'nodeCreated': { node: MindMapNode };
  'nodeDeleted': { nodeId: NodeId };
  // ...
}

eventBus.on('nodeCreated', ({ node }) => { ... });  // ✅ OK
eventBus.on('nodeCreted', ({ node }) => { ... });   // ❌ Typo! 런타임 silent failure
```

**실제 문제:**
1. **컴파일 타임 검증 없음**: TypeScript가 이벤트 이름 오타를 잡지 못함
2. **Silent Failure**: 잘못된 이벤트 이름으로 구독하면 조용히 무시됨
3. **리팩토링 위험**: 이벤트 이름 변경 시 전체 검색 필요

#### 근본 원인

- **String Literal Type 한계**: 'nodeCreated'는 `string` 타입으로 캐스팅되면 검증 불가
- **Runtime Validation 부재**: EventBus.on()에서 이벤트 이름 유효성 검사 없음

#### 개선 방안

**Option A: Enum-based Events (추천)**
```typescript
export enum NeroMindEvent {
    NodeCreated = 'node:created',
    NodeDeleted = 'node:deleted',
    NodeUpdated = 'node:updated',
    // ...
}

export type EventPayloadMap = {
    [NeroMindEvent.NodeCreated]: { node: MindMapNode };
    [NeroMindEvent.NodeDeleted]: { nodeId: NodeId };
    // ...
};

// 사용
eventBus.on(NeroMindEvent.NodeCreated, ({ node }) => { ... });
eventBus.on(NeroMindEvent.NodeCreted, ...);  // ❌ 컴파일 에러!
```
**장점**: 오타 즉시 감지, IDE 자동완성 지원

**Option B: Symbol-based Events**
```typescript
export const Events = {
    NodeCreated: Symbol('nodeCreated'),
    NodeDeleted: Symbol('nodeDeleted'),
    // ...
} as const;

export type EventPayloadMap = {
    [Events.NodeCreated]: { node: MindMapNode };
    // ...
};
```
**장점**: 완전한 고유성 보장, 외부 충돌 방지
**단점**: JSON 직렬화 불가 (디버깅 시 문제)

**Option C: Runtime Validation**
```typescript
export class EventBus {
    on<K extends keyof EventPayloadMap>(event: K, listener: EventListener<K>): Unsubscribe {
        // Runtime validation
        if (!(event in EVENT_NAMES)) {
            throw new Error(`Unknown event: ${event}`);
        }
        // ...
    }
}

const EVENT_NAMES: Record<keyof EventPayloadMap, true> = {
    'nodeCreated': true,
    'nodeDeleted': true,
    // ...
};
```
**장점**: 최소 변경, 기존 코드 호환
**단점**: 컴파일 타임 검증은 여전히 없음

#### 구현 우선순위

1. **Phase 3.0**: Option C (Runtime Validation) - 빠른 안전망
2. **Phase 3.2**: Option A (Enum) 마이그레이션 - 장기 안정성

---

### 10.4 Critical Issue #3: Command Pattern 보일러플레이트 과다

#### 문제점

**단순 작업에도 과도한 코드:**
```typescript
// 노드 1개 업데이트하려면 50+ 라인 작성
export class UpdateNodeCommand implements UndoableCommand {
    description: string;
    private nodeId: NodeId;
    private updates: Partial<MindMapNode>;
    private previousValues: Partial<MindMapNode> = {};

    constructor(nodeId: NodeId, updates: Partial<MindMapNode>) {
        this.nodeId = nodeId;
        this.updates = updates;
        this.description = `Update Node: ${Object.keys(updates).join(', ')}`;
    }

    execute(context: StateContext): void {
        const node = context.persistent.graph.nodes.get(this.nodeId);
        if (!node) return;

        Object.keys(this.updates).forEach(key => {
            this.previousValues[key] = node[key];
        });

        Object.assign(node, this.updates);
        node.updatedAt = Date.now();
    }

    undo(context: StateContext): void {
        const node = context.persistent.graph.nodes.get(this.nodeId);
        if (!node) return;

        Object.assign(node, this.previousValues);
        node.updatedAt = Date.now();
    }
}

// 사용할 때마다:
const cmd = new UpdateNodeCommand(nodeId, { content: 'New Text' });
historyManager.execute(cmd);
```

**실제 문제:**
1. **생산성 저하**: 간단한 변경에도 클래스 작성 → 테스트 → 유지보수
2. **중복 로직**: execute()와 undo()가 서로 거울상 (예: UpdateNode는 단순 swap)
3. **디버깅 어려움**: 50개 Command 클래스를 넘나들며 추적해야 함

#### 근본 원인

- **Gang of Four 패턴 과용**: Command 패턴은 복잡한 작업(트랜잭션, 매크로)을 위해 설계됨
- **단순 CRUD에 부적합**: StateManager의 setter 메서드를 Command로 감싸는 것은 over-engineering

#### 개선 방안

**Option A: Event Sourcing (근본적 해결)**
```typescript
// Command 대신 Event를 저장
type StateEvent =
    | { type: 'NodeCreated', node: MindMapNode }
    | { type: 'NodeDeleted', nodeId: NodeId, deletedNode: MindMapNode }
    | { type: 'NodeUpdated', nodeId: NodeId, changes: Partial<MindMapNode>, previous: Partial<MindMapNode> };

export class EventStore {
    private events: StateEvent[] = [];

    record(event: StateEvent): void {
        this.events.push(event);
        this.applyEvent(event);  // 상태에 반영
    }

    undo(): void {
        const event = this.events.pop();
        this.reverseEvent(event);  // 역이벤트 자동 생성
    }

    private reverseEvent(event: StateEvent): void {
        if (event.type === 'NodeCreated') {
            // 생성 → 삭제
            this.applyEvent({ type: 'NodeDeleted', nodeId: event.node.id, deletedNode: event.node });
        } else if (event.type === 'NodeUpdated') {
            // 업데이트 → 이전 값으로 업데이트
            this.applyEvent({ type: 'NodeUpdated', nodeId: event.nodeId, changes: event.previous, previous: event.changes });
        }
    }
}

// 사용: Command 클래스 불필요
eventStore.record({ type: 'NodeUpdated', nodeId, changes: { content: 'New' }, previous: { content: 'Old' } });
```
**장점**: Command 클래스 제거, 자동 역실행, 이벤트 재생 가능
**단점**: 아키텍처 대규모 변경

**Option B: Functional Commands (추천)**
```typescript
// 팩토리 함수로 간소화
export const Commands = {
    updateNode: (nodeId: NodeId, updates: Partial<MindMapNode>): UndoableCommand => {
        let previous: Partial<MindMapNode> = {};

        return {
            description: `Update Node`,
            execute: (ctx) => {
                const node = ctx.persistent.graph.nodes.get(nodeId);
                if (!node) return;
                Object.keys(updates).forEach(k => { previous[k] = node[k]; });
                Object.assign(node, updates);
            },
            undo: (ctx) => {
                const node = ctx.persistent.graph.nodes.get(nodeId);
                if (!node) return;
                Object.assign(node, previous);
            }
        };
    },

    // 다른 Command들도 동일 패턴
};

// 사용
historyManager.execute(Commands.updateNode(nodeId, { content: 'New' }));
```
**장점**: 보일러플레이트 80% 감소, 클래스 없음
**단점**: 클로저 메모리 사용

**Option C: Macro Command + Primitives**
```typescript
// 기본 Primitive Commands만 클래스로 작성
class SetNodePropertyCommand { ... }
class AddNodeCommand { ... }
class RemoveNodeCommand { ... }

// 복잡한 작업은 Macro로 조합
const updateNodeContent = (nodeId, newContent) =>
    new MacroCommand([
        new SetNodePropertyCommand(nodeId, 'content', newContent),
        new SetNodePropertyCommand(nodeId, 'updatedAt', Date.now())
    ]);
```
**장점**: 기본 블록 재사용, 복잡한 Command는 조합
**단점**: Primitive 식별 필요

#### 구현 우선순위

1. **Phase 3.0**: 현재 설계 유지 (기본 4개 Command만 구현)
2. **Phase 3.3**: Option B (Functional Commands) 도입 - 생산성 개선
3. **Phase 4+**: Option A (Event Sourcing) 검토 - 장기 전략

---

### 10.5 Critical Issue #4: PersistenceManager 과도한 분리

#### 문제점

**설계:**
```
PersistenceManager
├─ Serializer          (~80 lines)
├─ FileManager         (~60 lines)
├─ ValidationManager   (~50 lines)
└─ AutoSaveManager     (~70 lines)
```
**총 5개 클래스, ~260 라인** → 실제 비즈니스 로직은 ~100 라인

**실제 문제:**
1. **과도한 추상화**: 단순한 JSON.stringify/parse를 5개 클래스로 분산
2. **복잡도 증가**: 저장 흐름 추적 시 5개 파일 왕복
3. **테스트 부담**: 각 클래스마다 mock/stub 작성 필요
4. **유지보수 비용**: 간단한 변경도 여러 파일 수정

#### 근본 원인

- **SOLID 원칙 과용**: Single Responsibility를 극단적으로 적용
- **미래 확장 대비**: "나중에 필요할 수도 있는" 분리 (YAGNI 위반)

#### 개선 방안

**Option A: 통합 클래스 (추천)**
```typescript
export class PersistenceManager implements Disposable {
    private stateManager: StateManager;
    private fileManager: FileManager;  // 유지 (Obsidian API 추상화 필요)
    private autoSaveTimerId: number | null = null;

    constructor(stateManager: StateManager, app: App, eventBus: EventBus) {
        this.stateManager = stateManager;
        this.fileManager = new FileManager(app);

        // AutoSave 구독 (내부)
        eventBus.on('stateChanged', () => this.scheduleSave());
    }

    // Serializer 로직 내장
    private serialize(state: PersistentState): string {
        const data = {
            version: "1.0.0",
            nodes: Array.from(state.graph.nodes.entries()),
            // ...
        };
        return JSON.stringify(data);
    }

    // ValidationManager 로직 내장
    private validate(data: any): void {
        if (!data.version || !data.nodes) {
            throw new Error('Invalid schema');
        }
    }

    // AutoSaveManager 로직 내장
    private scheduleSave(): void {
        if (this.autoSaveTimerId) clearTimeout(this.autoSaveTimerId);
        this.autoSaveTimerId = setTimeout(() => this.save(), 1000);
    }

    async save(): Promise<void> {
        const state = this.stateManager.getPersistentState();
        this.validate(state);  // 내부 메서드
        const json = this.serialize(state);  // 내부 메서드
        await this.fileManager.save(this.currentFilePath, json);
    }
}
```
**결과**: 5개 클래스 → **2개 클래스** (PersistenceManager + FileManager)

**Option B: 전략 패턴 (미래 확장용)**
```typescript
export class PersistenceManager {
    constructor(
        private serializationStrategy: ISerializationStrategy,  // JSON, MessagePack, Protobuf 등
        private storageStrategy: IStorageStrategy  // File, IndexedDB, Cloud 등
    ) {}
}

// 현재는 기본 구현만
const pm = new PersistenceManager(
    new JSONSerializer(),
    new ObsidianFileStorage(app)
);
```
**장점**: 확장 가능하되, 현재는 단순
**단점**: 인터페이스 오버헤드

#### 구현 우선순위

1. **Phase 3.0**: Option A (통합 클래스) - 간결함 우선
2. **Phase 4+**: Option B (전략 패턴) 검토 - Cloud Sync 등 추가 시

---

### 10.6 Critical Issue #5: Serializer Map/Set 변환 데이터 손실 위험

#### 문제점

**설계:**
```typescript
serialize(state: PersistentState): SerializedState {
    return {
        nodes: Array.from(state.graph.nodes.entries()),  // Map → Array
        pinnedNodes: Array.from(state.pinnedNodes),      // Set → Array
        // ...
    };
}
```

**실제 문제:**
1. **순서 보장 없음**: Map/Set은 삽입 순서를 보장하지만, 이 정보가 시맨틱인지 불명확
2. **중복 검증 없음**: Set → Array 변환 시 중복 제거되는지 확인 안 함
3. **타입 검증 부재**: Array.from() 실패 시 예외 처리 없음

#### 근본 원인

- **직렬화 가정**: "Map/Set은 항상 valid하다"는 낙관적 가정
- **역직렬화 취약**: 손상된 JSON 불러올 때 복원 실패 가능

#### 개선 방안

**Option A: Schema Validation (추천)**
```typescript
import Ajv from 'ajv';

const serializedStateSchema = {
    type: 'object',
    required: ['version', 'schemaVersion', 'nodes', 'edges'],
    properties: {
        version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
        schemaVersion: { type: 'number', minimum: 1 },
        nodes: {
            type: 'array',
            items: {
                type: 'array',
                minItems: 2,
                maxItems: 2,
                items: [
                    { type: 'string' },  // NodeId
                    { type: 'object' }   // MindMapNode
                ]
            }
        },
        // ...
    }
};

export class Serializer {
    private ajv = new Ajv();
    private validate = this.ajv.compile(serializedStateSchema);

    parse(jsonString: string): SerializedState {
        const data = JSON.parse(jsonString);

        if (!this.validate(data)) {
            throw new Error(`Invalid state: ${this.ajv.errorsText(this.validate.errors)}`);
        }

        return data as SerializedState;
    }
}
```
**장점**: 런타임 안전성, 명확한 에러 메시지
**단점**: 라이브러리 의존성 추가

**Option B: Fallback Values**
```typescript
deserialize(data: SerializedState): PersistentState {
    return {
        schemaVersion: data.schemaVersion || 1,  // Fallback
        graph: {
            nodes: new Map(data.nodes || []),    // 빈 배열 허용
            edges: new Map(data.edges || []),
            rootId: data.rootId || '',           // 빈 문자열 fallback
        },
        // ...
    };
}
```
**장점**: 부분 손상 허용
**단점**: Silent corruption 가능

**Option C: Checksums**
```typescript
interface SerializedState {
    // ...
    metadata: {
        checksum: string;  // SHA-256 of serialized data
        nodeCount: number;
        edgeCount: number;
    };
}

serialize(state: PersistentState): SerializedState {
    const data = { ... };
    const checksum = crypto.subtle.digest('SHA-256', JSON.stringify(data));
    data.metadata.checksum = checksum;
    return data;
}
```
**장점**: 무결성 검증
**단점**: 성능 오버헤드

#### 구현 우선순위

1. **Phase 3.0**: Option B (Fallback Values) - 빠른 구현
2. **Phase 3.5**: Option A (Schema Validation) - 안정성 강화
3. **Phase 4+**: Option C (Checksums) 검토 - Cloud Sync 등 필요 시

---

### 10.7 Critical Issue #6: AutoSaveManager 레이스 컨디션

#### 문제점

**설계:**
```typescript
export class AutoSaveManager {
    private saveTimerId: number | null = null;

    private scheduleSave(): void {
        if (this.saveTimerId) clearTimeout(this.saveTimerId);
        this.saveTimerId = setTimeout(() => {
            this.persistenceManager.save({ debounce: false });
        }, this.DEBOUNCE_MS);
    }

    async saveNow(): Promise<void> {
        if (this.saveTimerId) {
            clearTimeout(this.saveTimerId);
            this.saveTimerId = null;
        }
        await this.persistenceManager.save({ debounce: false });
    }
}
```

**실제 문제:**
1. **Race Condition**: scheduleSave() 타이머 실행 중 saveNow() 호출 시 동시 저장
   ```
   Time 0ms:  scheduleSave() → 1000ms 후 저장 예약
   Time 999ms: saveNow() 호출 → 즉시 저장 시작
   Time 1000ms: 예약된 저장 실행 → 동시에 2개 save() 호출!
   ```

2. **Debounce 시간 부적절**: 1초는 너무 짧음 (타이핑 중 계속 저장 트리거)
3. **저장 상태 추적 없음**: 현재 저장 중인지 확인 불가

#### 근본 원인

- **동시성 미고려**: async 작업의 중첩 실행 방지 안 함
- **상태 관리 부재**: `isSaving` 플래그 없음

#### 개선 방안

**Option A: Lock 메커니즘 (추천)**
```typescript
export class AutoSaveManager {
    private saveTimerId: number | null = null;
    private isSaving: boolean = false;  // NEW
    private pendingSave: boolean = false;  // NEW

    private scheduleSave(): void {
        if (this.isSaving) {
            this.pendingSave = true;  // 저장 중이면 대기
            return;
        }

        if (this.saveTimerId) clearTimeout(this.saveTimerId);
        this.saveTimerId = setTimeout(() => this.executeSave(), 3000);  // 3초로 증가
    }

    async saveNow(): Promise<void> {
        if (this.saveTimerId) {
            clearTimeout(this.saveTimerId);
            this.saveTimerId = null;
        }
        await this.executeSave();
    }

    private async executeSave(): Promise<void> {
        if (this.isSaving) return;  // 이미 저장 중이면 무시

        this.isSaving = true;
        try {
            await this.persistenceManager.save({ debounce: false });
        } finally {
            this.isSaving = false;

            // 대기 중인 저장이 있으면 재시도
            if (this.pendingSave) {
                this.pendingSave = false;
                this.scheduleSave();
            }
        }
    }
}
```
**장점**: Race condition 제거, 저장 손실 방지
**단점**: 약간의 복잡도 증가

**Option B: Debounce 라이브러리**
```typescript
import { debounce } from 'lodash-es';

export class AutoSaveManager {
    private debouncedSave = debounce(() => this.executeSave(), 3000, {
        leading: false,   // 첫 호출 즉시 실행 안 함
        trailing: true,   // 마지막 호출 후 실행
        maxWait: 10000    // 최대 10초 대기 (강제 저장)
    });

    private scheduleSave(): void {
        this.debouncedSave();
    }

    async saveNow(): Promise<void> {
        this.debouncedSave.cancel();  // 대기 취소
        await this.executeSave();
    }
}
```
**장점**: 검증된 debounce 로직
**단점**: 외부 의존성 추가

#### 구현 우선순위

1. **Phase 3.0**: Option A (Lock) - 의존성 없음
2. **Phase 3.2**: Option B (Lodash) 검토 - 코드 간소화

---

### 10.8 Critical Issue #7: EventEmitter 인터페이스 주입 문제

#### 문제점

**설계:**
```typescript
export interface EventEmitter {
    setEventBus(eventBus: EventBus): void;
    emit<K extends keyof EventPayloadMap>(event: K, payload: EventPayloadMap[K]): void;
}

export class StateManager implements EventEmitter {
    private eventBus: EventBus | null = null;

    setEventBus(eventBus: EventBus): void {
        this.eventBus = eventBus;
    }

    protected emit<K extends keyof EventPayloadMap>(event: K, payload: EventPayloadMap[K]): void {
        if (this.eventBus) {  // ⚠️ Null check 필요
            this.eventBus.emit(event, payload);
        }
    }

    addNode(node: MindMapNode): void {
        // ...
        this.emit('nodeCreated', { node });  // eventBus가 null이면 조용히 무시됨
    }
}
```

**실제 문제:**
1. **초기화 순서 의존**: setEventBus() 호출 전 emit() 호출 시 이벤트 손실
   ```typescript
   const stateManager = new StateManager();
   stateManager.addNode(node);  // ❌ 이벤트 발행 안 됨 (eventBus가 null)
   stateManager.setEventBus(eventBus);  // 늦음!
   ```

2. **Silent Failure**: 이벤트 발행 실패를 감지할 방법 없음

3. **생성자 주입 불가**: setEventBus()로 지연 주입 → 순환 의존성 회피 목적이지만 위험

#### 근본 원인

- **Setter Injection 남용**: 순환 의존성을 setter로 해결하려 함
- **Null 허용**: eventBus를 optional로 만들어 안전성 약화

#### 개선 방안

**Option A: 생성자 주입 강제 (추천)**
```typescript
export class StateManager {
    constructor(private readonly eventBus: EventBus) {  // Non-null
        // ...
    }

    protected emit<K extends keyof EventPayloadMap>(event: K, payload: EventPayloadMap[K]): void {
        this.eventBus.emit(event, payload);  // Null check 불필요
    }
}

// 초기화
const eventBus = new EventBus();
const stateManager = new StateManager(eventBus);  // 생성 시점에 주입
```
**장점**: 항상 valid, null check 제거
**단점**: 순환 의존성 해결 필요 (아래 참조)

**Option B: 이벤트 큐 (Fallback)**
```typescript
export class StateManager {
    private eventBus: EventBus | null = null;
    private pendingEvents: Array<{ event: string; payload: any }> = [];

    setEventBus(eventBus: EventBus): void {
        this.eventBus = eventBus;

        // 대기 중인 이벤트 발행
        this.pendingEvents.forEach(({ event, payload }) => {
            this.eventBus!.emit(event, payload);
        });
        this.pendingEvents = [];
    }

    protected emit<K extends keyof EventPayloadMap>(event: K, payload: EventPayloadMap[K]): void {
        if (this.eventBus) {
            this.eventBus.emit(event, payload);
        } else {
            this.pendingEvents.push({ event, payload });  // 큐에 저장
        }
    }
}
```
**장점**: 이벤트 손실 방지
**단점**: 메모리 오버헤드

**Option C: Initialization Guard**
```typescript
export class StateManager {
    private eventBus: EventBus | null = null;
    private isInitialized = false;

    setEventBus(eventBus: EventBus): void {
        this.eventBus = eventBus;
        this.isInitialized = true;
    }

    protected emit<K extends keyof EventPayloadMap>(event: K, payload: EventPayloadMap[K]): void {
        if (!this.isInitialized) {
            throw new Error('StateManager not initialized. Call setEventBus() first.');
        }
        this.eventBus!.emit(event, payload);
    }
}
```
**장점**: 명확한 에러
**단점**: 여전히 초기화 순서 의존

#### 구현 우선순위

1. **Phase 3.0**: Option C (Guard) - 빠른 에러 감지
2. **Phase 3.2**: Option A (생성자 주입) - 근본 해결 (순환 의존성 해결 필요)

---

### 10.9 Critical Issue #8: CommandSnapshot 메모리 중복 (Issue #1 재강조)

**이 이슈는 Issue #1 (HistoryManager-StateManager 밀결합)과 동일한 문제입니다.**

**메모리 계산 (재확인):**
```typescript
interface CommandSnapshot {
    command: UndoableCommand;          // ~100 bytes
    beforeState: StateSnapshot;        // ~450KB (1000 nodes)
    afterState: StateSnapshot;         // ~450KB (1000 nodes)
    timestamp: number;                 // 8 bytes
}
```

**1개 Snapshot**: 900KB
**MAX_HISTORY=100**: 90MB
**실제 메모리 (V8 엔진 오버헤드 포함)**: ~120MB

**권장 사항**: Issue #1의 개선 방안 적용 (Delta Snapshots 또는 Inverse Operations)

---

### 10.10 Critical Issue #9: 순환 의존성 (Circular Dependencies)

#### 문제점

**의존성 그래프:**
```
EventBus
  ↓ (주입)
StateManager ←──────────────┐
  ↓ (감쌈)                   │
HistoryManager               │
  ↓ (구독)                   │
EventBus.on('historyChanged') → StateManager.apply()
  ↓ (발행)
StateManager.emit('stateChanged')
  ↓ (구독)
PersistenceManager.save()
  ↓ (호출)
StateManager.getPersistentState() ──┘
```

**순환 경로:**
1. StateManager → EventBus (emit)
2. EventBus → HistoryManager (구독)
3. HistoryManager → StateManager (apply)
4. StateManager → EventBus (다시 emit)

**실제 문제:**
1. **초기화 순서 결정 불가**: 누가 먼저 생성되어야 하는가?
2. **테스트 어려움**: Mock 체인 복잡 (EventBus mock → StateManager mock → ...)
3. **리팩토링 위험**: 한 레이어 변경 시 전체 체인 영향

#### 근본 원인

- **양방향 통신**: StateManager와 EventBus가 서로 참조
- **Wrapper 패턴 한계**: HistoryManager가 StateManager를 감싸되, 같은 EventBus 사용

#### 개선 방안

**Option A: 의존성 계층화 (추천)**
```
Layer 3: UI/Application
         ├─ HistoryManager (EventBus 구독)
         └─ PersistenceManager (EventBus 구독)

Layer 2: Events
         └─ EventBus (중앙 허브)

Layer 1: Core
         └─ StateManager (EventBus에 발행만 함)
```

**규칙:**
- StateManager는 EventBus에 이벤트 발행만 (구독 금지)
- HistoryManager는 EventBus 구독만 (StateManager는 직접 래핑)
- 순환 경로 차단

**코드:**
```typescript
// StateManager: 발행만
export class StateManager {
    constructor(private readonly eventBus: EventBus) {}

    addNode(node: MindMapNode): void {
        // ...
        this.eventBus.emit('nodeCreated', { node });  // 발행만
    }
}

// HistoryManager: StateManager 래핑, EventBus 구독
export class HistoryManager {
    constructor(
        private stateManager: StateManager,
        private eventBus: EventBus
    ) {
        // StateManager를 직접 호출 (이벤트 통하지 않음)
    }

    execute(command: UndoableCommand): StateSnapshot {
        const before = this.stateManager.getSnapshot();
        this.stateManager.apply(command);  // 직접 호출
        const after = this.stateManager.getSnapshot();

        this.history.recordExecution({ command, beforeState: before, afterState: after });
        this.eventBus.emit('historyChanged', { canUndo: true, canRedo: false });

        return after;
    }
}

// PersistenceManager: EventBus 구독만
export class PersistenceManager {
    constructor(
        private stateManager: StateManager,
        private eventBus: EventBus
    ) {
        this.eventBus.on('stateChanged', () => this.scheduleSave());  // 구독만
    }
}
```

**Option B: 중재자 패턴 (Mediator)**
```typescript
export class AppMediator {
    private eventBus: EventBus;
    private stateManager: StateManager;
    private historyManager: HistoryManager;

    constructor() {
        this.eventBus = new EventBus();
        this.stateManager = new StateManager();  // EventBus 주입 안 함
        this.historyManager = new HistoryManager(this.stateManager);

        // Mediator가 이벤트 라우팅
        this.stateManager.onStateChanged = (snapshot) => {
            this.eventBus.emit('stateChanged', { snapshot });
        };

        this.eventBus.on('historyChanged', () => {
            // Mediator가 중재
        });
    }
}
```
**장점**: 완전한 순환 의존성 제거
**단점**: Mediator가 God Object화 위험

#### 구현 우선순위

1. **Phase 3.0**: Option A (계층화) - 규칙 문서화
2. **Phase 3.5**: 의존성 그래프 시각화 및 검증 도구 추가

---

### 10.11 Critical Issue #10: 테스트 가능성 (Testability)

#### 문제점

**현재 설계에서 Command 테스트:**
```typescript
describe('DeleteNodeCommand', () => {
    it('should delete node and connected edges', () => {
        // Setup: 5개 클래스 mock 필요
        const mockEventBus = createMockEventBus();
        const mockStateManager = createMockStateManager();
        const mockHistoryManager = createMockHistoryManager(mockStateManager);
        const mockPersistenceManager = createMockPersistenceManager();
        const mockAutoSaveManager = createMockAutoSaveManager();

        // Test
        const command = new DeleteNodeCommand('node-1');
        command.execute(mockStateManager.getContext());

        // Assert: 10+ assertions
        expect(mockStateManager.nodes.has('node-1')).toBe(false);
        expect(mockStateManager.edges.get('edge-1')).toBeUndefined();
        expect(mockEventBus.emit).toHaveBeenCalledWith('nodeDeleted', ...);
        expect(mockAutoSaveManager.scheduleSave).toHaveBeenCalled();
        // ...
    });
});
```

**실제 문제:**
1. **Mock 지옥**: 단일 Command 테스트에 4-5개 mock 필요
2. **Integration Test 편향**: 단위 테스트보다 통합 테스트가 더 쉬움 (역설)
3. **리팩토링 취약**: 한 레이어 변경 시 모든 테스트 수정

#### 근본 원인

- **높은 결합도**: Command가 StateContext에 직접 접근
- **EventBus 전역 의존**: 모든 레이어가 EventBus에 의존

#### 개선 방안

**Option A: StateContext Builder (추천)**
```typescript
// 테스트 헬퍼
export class StateContextBuilder {
    private nodes = new Map<NodeId, MindMapNode>();
    private edges = new Map<EdgeId, MindMapEdge>();

    withNode(node: MindMapNode): this {
        this.nodes.set(node.id, node);
        return this;
    }

    withEdge(edge: MindMapEdge): this {
        this.edges.set(edge.id, edge);
        return this;
    }

    build(): StateContext {
        return {
            persistent: {
                schemaVersion: 1,
                graph: {
                    nodes: this.nodes,
                    edges: this.edges,
                    rootId: 'root',
                },
                // ...
            },
            ephemeral: { ... }
        };
    }
}

// 테스트
describe('DeleteNodeCommand', () => {
    it('should delete node', () => {
        const context = new StateContextBuilder()
            .withNode({ id: 'node-1', content: 'Test' })
            .withEdge({ id: 'edge-1', fromNodeId: 'root', toNodeId: 'node-1' })
            .build();

        const command = new DeleteNodeCommand('node-1');
        command.execute(context);

        expect(context.persistent.graph.nodes.has('node-1')).toBe(false);
        expect(context.persistent.graph.edges.has('edge-1')).toBe(false);
    });
});
```
**장점**: Mock 없이 순수 단위 테스트
**단점**: Builder 유지보수 필요

**Option B: EventBus 주입 의무화**
```typescript
export class StateManager {
    constructor(
        private readonly eventBus: EventBus  // 필수
    ) {}
}

// 테스트
const mockEventBus = {
    emit: jest.fn(),
    on: jest.fn()
};
const stateManager = new StateManager(mockEventBus);
```
**장점**: 명확한 의존성
**단점**: 여전히 mock 필요

**Option C: 테스트 전용 No-op EventBus**
```typescript
export class NoopEventBus implements EventBus {
    emit(): void { /* no-op */ }
    on(): Unsubscribe { return () => {}; }
    // ...
}

// 테스트
const stateManager = new StateManager(new NoopEventBus());
```
**장점**: 이벤트 무시, 빠른 테스트
**단점**: 이벤트 관련 버그 감지 불가

#### 구현 우선순위

1. **Phase 3.0**: Option A (StateContextBuilder) 작성
2. **Phase 3.1**: 모든 Command에 단위 테스트 추가
3. **Phase 3.5**: Option C (NoopEventBus) 추가 - 성능 테스트용

---

### 10.12 종합 권장사항 (Consolidated Recommendations)

#### 우선순위 매트릭스

| Issue | 심각도 | 구현 난이도 | Phase 3.0 반영 | 비고 |
|---|---|---|---|---|
| #1: HistoryManager 메모리 | 🔴 Critical | Medium | ✅ Inverse Operations | 90MB → ~5MB |
| #2: EventBus 타입 안전성 | 🟡 High | Low | ✅ Runtime Validation | Enum은 Phase 3.2 |
| #3: Command 보일러플레이트 | 🟡 High | Medium | ❌ 기본 4개만 | Functional Cmd는 3.3 |
| #4: Persistence 과분리 | 🟢 Medium | Low | ✅ 통합 클래스 | 5개 → 2개 클래스 |
| #5: Serializer 검증 | 🟢 Medium | Medium | ✅ Fallback Values | Schema는 Phase 3.5 |
| #6: AutoSave 레이스 | 🔴 Critical | Low | ✅ Lock 메커니즘 | 필수 수정 |
| #7: EventEmitter 주입 | 🟡 High | Medium | ✅ Initialization Guard | 생성자는 Phase 3.2 |
| #8: CommandSnapshot 중복 | 🔴 Critical | - | ✅ Issue #1과 동일 | - |
| #9: 순환 의존성 | 🟢 Medium | Low | ✅ 계층화 규칙 | 문서화 필수 |
| #10: 테스트 가능성 | 🟡 High | Medium | ✅ ContextBuilder | 테스트 인프라 |

#### Phase 3.0 즉시 반영 사항

1. **HistoryManager**: Inverse Operation 패턴 사용 (beforeState/afterState 제거)
2. **AutoSaveManager**: isSaving 플래그 추가, debounce 3초로 증가
3. **EventBus**: Runtime validation 추가 (invalid event 감지)
4. **PersistenceManager**: Serializer/ValidationManager 통합 (단일 클래스로)
5. **StateManager**: setEventBus() 호출 전 emit() 시 에러 발생
6. **의존성 규칙**: StateManager는 발행만, HistoryManager는 구독만 (문서화)
7. **테스트 헬퍼**: StateContextBuilder 작성

#### Phase 3.2-3.5 점진적 개선

1. **EventBus**: Enum 기반 이벤트로 마이그레이션
2. **Command**: Functional Command 패턴 도입 (보일러플레이트 감소)
3. **Serializer**: Ajv 기반 Schema Validation 추가
4. **StateManager**: 생성자 주입 강제 (순환 의존성 해결 후)

#### 폐기하지 않는 이유

이 설계는 **근본적으로 건전**합니다:
- **책임 분리**: 각 레이어의 역할이 명확
- **확장 가능성**: 이벤트 기반 아키텍처는 미래 기능 추가 용이
- **Obsidian 통합**: PersistenceManager의 Vault API 추상화는 필수

**문제는 설계 자체가 아니라 세부 구현 전략**입니다. 위 권장사항을 반영하면 견고한 Phase 3 아키텍처를 구축할 수 있습니다.

---

### 10.13 구현 체크리스트 (Updated)

아래는 비판적 검토를 반영한 **수정된 Phase 3.0 체크리스트**입니다:

#### Event System (Week 1)
- [ ] EventBus 구현
  - [ ] **Runtime validation 추가** (Invalid event 감지)
  - [ ] Event name constants 정의
- [ ] StateManager EventEmitter 통합
  - [ ] **Initialization guard 추가** (setEventBus() 호출 검증)
- [ ] Renderer 이벤트 구독
  - [ ] Unsubscribe 누수 방지

#### History System (Week 2)
- [ ] HistoryManager 구현
  - [ ] **Inverse Operation 패턴 사용** (CommandSnapshot에서 beforeState/afterState 제거)
  - [ ] Command.undo()에 복원 로직 구현
- [ ] Command 구현
  - [ ] DeleteNodeCommand: 엣지 제거 + 복원 로직
  - [ ] UpdateNodeCommand: previousValues 백업
  - [ ] CreateNodeCommand/MoveNodeCommand

#### Persistence System (Week 3)
- [ ] PersistenceManager 구현
  - [ ] **Serializer 통합** (별도 클래스 제거)
  - [ ] **ValidationManager 통합** (Fallback values 적용)
- [ ] FileManager 구현 (Obsidian Vault API)
- [ ] AutoSaveManager 구현
  - [ ] **isSaving 플래그 추가** (Race condition 방지)
  - [ ] **Debounce 3초로 설정** (1초 → 3초)

#### Integration (Week 4)
- [ ] main.ts 초기화
  - [ ] **의존성 계층 준수** (EventBus → StateManager → HistoryManager)
  - [ ] 초기화 순서 문서화
- [ ] 테스트 인프라
  - [ ] **StateContextBuilder 작성**
  - [ ] 모든 Command 단위 테스트

#### Validation (Week 5)
- [ ] 성능 프로파일링
  - [ ] **메모리 사용량 측정** (목표: < 10MB for 1000 nodes)
- [ ] 문서화
  - [ ] **의존성 규칙 문서화** (순환 의존성 방지)
  - [ ] Critical issues 해결 내역 기록

---

## 11. 최종 결론

Phase 3 설계는 **구조적으로 타당하며 유지해야 합니다**. 다만 다음 **10가지 전술적 개선**을 즉시 반영하면 프로덕션 준비 완료:

1. ✅ Inverse Operation (메모리 90MB → 5MB)
2. ✅ Runtime Event Validation (타입 안전성)
3. ✅ AutoSave Lock (Race condition 제거)
4. ✅ Persistence 클래스 통합 (5개 → 2개)
5. ✅ Serializer Fallback Values (부분 손상 허용)
6. ✅ EventEmitter Initialization Guard (Silent failure 방지)
7. ✅ 의존성 계층화 규칙 (순환 의존성 차단)
8. ✅ StateContextBuilder (테스트 간소화)
9. ✅ Debounce 3초 (불필요한 저장 감소)
10. ✅ 문서화 강화 (초기화 순서, 제약사항)

이 개선사항들을 반영한 구현이 완료되면, **Phase 4 (AutoAligner, MiniMap, LOD)로 안전하게 진행 가능**합니다.

---

## 11. 구현 Task 분류: 지금 vs 나중 (Implementation Task Classification)

### 문서 정보
- **작성일**: 2026-01-12
- **목적**: 현재 Phase 2.5 완료 상태에서 즉시 구현 가능한 Task와 연기해야 할 Task 명확히 구분
- **기준**: Phase 3.0 MVP 범위 (최소 동작 버전)

---

### 11.1 ✅ 지금 구현해도 되는 Task (Phase 3.0 MVP)

#### 전제 조건 충족 확인
- ✅ Phase 2.5 완료 (StateManager Snapshot, DirectionManager, 타입 안정화)
- ✅ Phase 3 설계 문서 작성 완료
- ✅ 비판적 검토 완료 (Critical Issues 식별)
- ✅ 의존성 명확: EventBus → StateManager → HistoryManager → Renderer

---

#### Group A: Event System 최소 구현 (Week 1)

**Priority: 🔴 Critical - 가장 먼저 시작**

##### Task A-1: EventBus 핵심 클래스 구현
```
✅ 구현 가능
파일: src/events/EventBus.ts (신규 생성)
라인 수: ~50 lines
의존성: 없음 (독립적)
```

**구현할 메서드:**
- [x] `on<K>(event, listener): Unsubscribe` - 이벤트 구독
- [x] `emit<K>(event, payload): void` - 이벤트 발행
- [x] `isValidEvent(event): boolean` - Runtime validation (private)

**구현하지 말 것:**
- ❌ `once()` - Phase 3.1로 연기
- ❌ `off()` - Phase 3.1로 연기
- ❌ `clear()` - Phase 3.1로 연기

**핵심 로직:**
```typescript
export class EventBus {
    private listeners: Map<string, Set<Function>> = new Map();

    on<K extends keyof EventPayloadMap>(
        event: K,
        listener: EventListener<K>
    ): Unsubscribe {
        // ✅ Runtime validation 필수
        if (!this.isValidEvent(event)) {
            throw new Error(`Unknown event: ${event}`);
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);

        return () => this.listeners.get(event)?.delete(listener);
    }

    emit<K extends keyof EventPayloadMap>(
        event: K,
        payload: EventPayloadMap[K]
    ): void {
        const listeners = this.listeners.get(event);
        if (!listeners) return;

        listeners.forEach(listener => {
            try {
                listener(payload);
            } catch (error) {
                console.error(`EventBus error in ${event}:`, error);
            }
        });
    }

    private isValidEvent(event: string): boolean {
        // ✅ Phase 3.0: 하드코딩된 검증
        const validEvents = ['nodeCreated', 'nodeDeleted', 'nodeUpdated', 'stateChanged'];
        return validEvents.includes(event);
    }
}
```

**완료 조건:**
- TypeScript 컴파일 에러 없음
- Runtime validation 테스트 (유효하지 않은 이벤트 throw)

---

##### Task A-2: EventPayloadMap 타입 정의
```
✅ 구현 가능
파일: src/events/eventTypes.ts (신규 생성)
라인 수: ~30 lines
의존성: src/types/index.ts (이미 존재)
```

**구현할 타입:**
```typescript
export interface EventPayloadMap {
    // ✅ Phase 3.0 MVP: 4개 이벤트만
    'nodeCreated': { node: MindMapNode };
    'nodeDeleted': { nodeId: NodeId };
    'nodeUpdated': { node: MindMapNode };
    'stateChanged': { snapshot: StateSnapshot };

    // ❌ Phase 3.1로 연기
    // 'nodeMoved': { nodeId: NodeId; position: Position };
    // 'nodeSelected': { nodeId: NodeId | null };
    // 'historyChanged': { canUndo: boolean; canRedo: boolean };
}

export type EventListener<K extends keyof EventPayloadMap> = (
    payload: EventPayloadMap[K]
) => void;

export type Unsubscribe = () => void;
```

**완료 조건:**
- EventBus에서 타입 안전하게 사용 가능
- 존재하지 않는 이벤트 이름 사용 시 TypeScript 에러

---

##### Task A-3: StateManager EventEmitter 통합
```
✅ 구현 가능
파일: src/state/StateManager.ts (기존 수정)
추가 라인 수: ~30 lines
의존성: Task A-1, A-2 완료 후
```

**수정할 내용:**

1. **필드 추가:**
```typescript
export class StateManager implements Disposable {
    private readonly persistentState: PersistentState;
    private readonly ephemeralState: EphemeralState;

    // ✅ 추가
    private eventBus: EventBus | null = null;
    private isInitialized = false;
```

2. **setEventBus() 메서드 추가:**
```typescript
    setEventBus(eventBus: EventBus): void {
        this.eventBus = eventBus;
        this.isInitialized = true;
    }
```

3. **emit() 메서드 추가 (protected):**
```typescript
    protected emit<K extends keyof EventPayloadMap>(
        event: K,
        payload: EventPayloadMap[K]
    ): void {
        if (!this.isInitialized) {
            throw new Error('StateManager not initialized. Call setEventBus() first.');
        }
        this.eventBus!.emit(event, payload);
    }
```

4. **기존 메서드에서 주석 해제:**
```typescript
    addNode(node: MindMapNode): void {
        this.persistentState.graph.nodes.set(node.id, node);

        if (!this.persistentState.graph.rootId) {
            this.persistentState.graph.rootId = node.id;
        }

        // ✅ 주석 해제
        this.emit('nodeCreated', { node });
    }

    removeNode(nodeId: NodeId): void {
        this.persistentState.graph.nodes.delete(nodeId);

        // ✅ 주석 해제
        this.emit('nodeDeleted', { nodeId });
    }

    updateNode(nodeId: NodeId, updates: Partial<MindMapNode>): void {
        const node = this.getNode(nodeId);
        if (!node) return;

        Object.assign(node, updates);
        node.updatedAt = Date.now();

        // ✅ 주석 해제
        this.emit('nodeUpdated', { node: node as MindMapNode });
    }
```

**주의사항:**
- ⚠️ `selectNode()`, `setEditingNode()`의 이벤트는 Phase 3.1로 연기 (EventPayloadMap에 없음)
- ⚠️ 엣지 제거 로직은 아직 추가하지 않음 (Phase 3.0에서는 DeleteNodeCommand에서 처리)

**완료 조건:**
- 빌드 성공
- setEventBus() 호출 전 emit() 시 에러 발생 확인

---

##### Task A-4: Renderer 이벤트 구독
```
✅ 구현 가능
파일: src/rendering/Renderer.ts (기존 수정)
추가 라인 수: ~40 lines
의존성: Task A-1, A-2 완료 후
```

**수정할 내용:**

1. **생성자 수정:**
```typescript
export class Renderer implements Disposable {
    private svgElement: SVGSVGElement;
    private eventBus: EventBus;  // ✅ 추가
    private unsubscribers: Unsubscribe[] = [];  // ✅ 추가

    constructor(svgElement: SVGSVGElement, eventBus: EventBus) {
        this.svgElement = svgElement;
        this.eventBus = eventBus;  // ✅ 추가
        this.subscribeToEvents();  // ✅ 추가
    }
```

2. **subscribeToEvents() 메서드 추가 (private):**
```typescript
    private subscribeToEvents(): void {
        // ✅ Phase 3.0 MVP: 4개 이벤트만 구독
        this.unsubscribers.push(
            this.eventBus.on('nodeCreated', ({ node }) => {
                console.log('Renderer: nodeCreated', node.id);
                this.scheduleRender();
            })
        );

        this.unsubscribers.push(
            this.eventBus.on('nodeDeleted', ({ nodeId }) => {
                console.log('Renderer: nodeDeleted', nodeId);
                this.scheduleRender();
            })
        );

        this.unsubscribers.push(
            this.eventBus.on('nodeUpdated', ({ node }) => {
                console.log('Renderer: nodeUpdated', node.id);
                this.scheduleRender();
            })
        );

        this.unsubscribers.push(
            this.eventBus.on('stateChanged', ({ snapshot }) => {
                console.log('Renderer: stateChanged', snapshot.nodes.length, 'nodes');
                this.scheduleRender();
            })
        );
    }
```

3. **destroy() 메서드 수정:**
```typescript
    destroy(): void {
        // ✅ 모든 이벤트 구독 해제
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];

        this.stop();
    }
```

**완료 조건:**
- 노드 생성 시 콘솔에 'Renderer: nodeCreated' 로그 출력
- 플러그인 언로드 시 구독 해제 확인

---

#### Group B: History System 간소화 구현 (Week 2)

**Priority: 🟡 High - Group A 완료 후 시작**

##### Task B-1: UndoableCommand 인터페이스 정의
```
✅ 구현 가능
파일: src/history/historyTypes.ts (신규 생성)
라인 수: ~15 lines
의존성: src/state/stateTypes.ts (이미 존재)
```

**구현할 인터페이스:**
```typescript
import { StateCommand, StateContext } from '../state/stateTypes';

/**
 * Phase 3.0 MVP: Undo 가능한 Command
 * - StateCommand를 확장하여 undo 메서드 추가
 * - description 필수
 */
export interface UndoableCommand extends StateCommand {
    description: string;  // 필수 (optional에서 required로 변경)
    undo(context: StateContext): void;
}
```

**완료 조건:**
- StateCommand를 올바르게 확장
- TypeScript 컴파일 에러 없음

---

##### Task B-2: HistoryManager 간소화 구현
```
✅ 구현 가능
파일: src/history/HistoryManager.ts (신규 생성)
라인 수: ~60 lines
의존성: Task B-1 완료 후, StateManager 접근 필요
```

**구현할 클래스:**
```typescript
export class HistoryManager implements Disposable {
    private stateManager: StateManager;
    private undoStack: UndoableCommand[] = [];
    // ❌ Phase 3.0 MVP: redoStack 제외
    private readonly MAX_HISTORY = 10;  // ✅ Phase 3.0: 10으로 제한

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Command 실행
     * ✅ Phase 3.0: beforeState/afterState 저장 안 함 (Inverse Operation 사용)
     */
    execute(command: UndoableCommand): StateSnapshot {
        const snapshot = this.stateManager.apply(command);
        this.undoStack.push(command);

        // MAX_HISTORY 제한
        if (this.undoStack.length > this.MAX_HISTORY) {
            this.undoStack.shift();
        }

        return snapshot;
    }

    /**
     * Undo 실행
     * ✅ Phase 3.0: Command.undo() 호출만
     */
    undo(): StateSnapshot | null {
        const command = this.undoStack.pop();
        if (!command) return null;

        const context = this.getStateContext();
        command.undo(context);

        return this.stateManager.getSnapshot();
    }

    canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    // ❌ Phase 3.0 MVP: redo(), canRedo() 제외

    private getStateContext(): StateContext {
        // ⚠️ StateManager에 getContext() public 노출 필요
        return (this.stateManager as any).getContext();
    }

    destroy(): void {
        this.undoStack = [];
    }
}
```

**주의사항:**
- ⚠️ StateManager에 `getContext()` 메서드를 public으로 노출하거나 friend 접근 허용 필요
  ```typescript
  // StateManager.ts에 추가
  getContext(): StateContext {
      return {
          persistent: this.persistentState,
          ephemeral: this.ephemeralState
      };
  }
  ```

**완료 조건:**
- execute() 호출 시 undoStack에 추가
- undo() 호출 시 command.undo() 실행 및 snapshot 반환
- MAX_HISTORY 초과 시 오래된 command 제거

---

##### Task B-3: CreateNodeCommand 구현
```
✅ 구현 가능
파일: src/history/commands/CreateNodeCommand.ts (신규 생성)
라인 수: ~70 lines
의존성: Task B-1 완료 후
```

**구현할 Command:**
```typescript
export class CreateNodeCommand implements UndoableCommand {
    description = 'Create Node';
    private nodeId: NodeId;
    private node: MindMapNode;
    private parentId: NodeId | null;

    constructor(node: MindMapNode, parentId: NodeId | null) {
        this.nodeId = node.id;
        this.node = node;
        this.parentId = parentId;
    }

    execute(context: StateContext): void {
        // 1. 노드 추가
        context.persistent.graph.nodes.set(this.nodeId, this.node);

        // 2. 루트 노드 설정 (첫 노드)
        if (!context.persistent.graph.rootId) {
            context.persistent.graph.rootId = this.nodeId;
        }

        // 3. 부모의 childIds에 추가
        if (this.parentId) {
            const parent = context.persistent.graph.nodes.get(this.parentId);
            if (parent) {
                parent.childIds.push(this.nodeId);
            }
        }
    }

    undo(context: StateContext): void {
        // 1. 부모의 childIds에서 제거
        if (this.parentId) {
            const parent = context.persistent.graph.nodes.get(this.parentId);
            if (parent) {
                const index = parent.childIds.indexOf(this.nodeId);
                if (index !== -1) {
                    parent.childIds.splice(index, 1);
                }
            }
        }

        // 2. 노드 제거
        context.persistent.graph.nodes.delete(this.nodeId);

        // 3. rootId 복원 (필요시)
        if (context.persistent.graph.rootId === this.nodeId) {
            context.persistent.graph.rootId = '';
        }
    }
}
```

**완료 조건:**
- execute() 후 노드가 graph.nodes에 추가됨
- undo() 후 노드가 graph.nodes에서 제거됨
- 부모의 childIds가 올바르게 업데이트됨

---

##### Task B-4: DeleteNodeCommand 구현
```
✅ 구현 가능
파일: src/history/commands/DeleteNodeCommand.ts (신규 생성)
라인 수: ~100 lines
의존성: Task B-1 완료 후
```

**구현할 Command:**
```typescript
export class DeleteNodeCommand implements UndoableCommand {
    description = 'Delete Node';
    private nodeId: NodeId;
    private deletedNode: MindMapNode | null = null;
    private deletedEdges: MindMapEdge[] = [];
    private parentId: NodeId | null = null;
    private childIndex: number = -1;

    constructor(nodeId: NodeId) {
        this.nodeId = nodeId;
    }

    execute(context: StateContext): void {
        // 1. 노드 백업
        this.deletedNode = context.persistent.graph.nodes.get(this.nodeId) || null;
        if (!this.deletedNode) return;

        // 2. 부모의 childIds에서 제거 (복원용 정보 저장)
        this.parentId = this.deletedNode.parentId;
        if (this.parentId) {
            const parent = context.persistent.graph.nodes.get(this.parentId);
            if (parent) {
                this.childIndex = parent.childIds.indexOf(this.nodeId);
                if (this.childIndex !== -1) {
                    parent.childIds.splice(this.childIndex, 1);
                }
            }
        }

        // 3. 연결된 엣지 찾기 및 백업
        this.deletedEdges = [];
        context.persistent.graph.edges.forEach((edge, edgeId) => {
            if (edge.fromNodeId === this.nodeId || edge.toNodeId === this.nodeId) {
                this.deletedEdges.push({ ...edge });
                context.persistent.graph.edges.delete(edgeId);
            }
        });

        // 4. 노드 제거
        context.persistent.graph.nodes.delete(this.nodeId);

        // ✅ Phase 2.5 경고 해결: "연결된 엣지 제거" 구현됨
    }

    undo(context: StateContext): void {
        // 1. 노드 복원
        if (this.deletedNode) {
            context.persistent.graph.nodes.set(this.nodeId, this.deletedNode);
        }

        // 2. 부모의 childIds 복원
        if (this.parentId && this.childIndex !== -1) {
            const parent = context.persistent.graph.nodes.get(this.parentId);
            if (parent) {
                parent.childIds.splice(this.childIndex, 0, this.nodeId);
            }
        }

        // 3. 엣지 복원
        this.deletedEdges.forEach(edge => {
            context.persistent.graph.edges.set(edge.id, edge);
        });
    }
}
```

**완료 조건:**
- execute() 후 노드와 연결된 엣지 모두 제거
- undo() 후 노드와 엣지 복원
- 부모의 childIds 원래 순서대로 복원

---

##### Task B-5: UpdateNodeCommand 구현 (선택적)
```
✅ 구현 가능 (선택적)
파일: src/history/commands/UpdateNodeCommand.ts (신규 생성)
라인 수: ~60 lines
의존성: Task B-1 완료 후
우선순위: Low (Create/Delete만으로도 기본 테스트 가능)
```

**구현할 Command:**
```typescript
export class UpdateNodeCommand implements UndoableCommand {
    description: string;
    private nodeId: NodeId;
    private updates: Partial<MindMapNode>;
    private previousValues: Partial<MindMapNode> = {};

    constructor(nodeId: NodeId, updates: Partial<MindMapNode>) {
        this.nodeId = nodeId;
        this.updates = updates;
        this.description = `Update Node: ${Object.keys(updates).join(', ')}`;
    }

    execute(context: StateContext): void {
        const node = context.persistent.graph.nodes.get(this.nodeId);
        if (!node) return;

        // 이전 값 백업
        Object.keys(this.updates).forEach(key => {
            this.previousValues[key] = (node as any)[key];
        });

        // 업데이트 적용
        Object.assign(node, this.updates);
        node.updatedAt = Date.now();
    }

    undo(context: StateContext): void {
        const node = context.persistent.graph.nodes.get(this.nodeId);
        if (!node) return;

        // 이전 값 복원
        Object.assign(node, this.previousValues);
        node.updatedAt = Date.now();
    }
}
```

**완료 조건:**
- execute() 후 노드 속성 업데이트
- undo() 후 이전 값 복원
- updatedAt 자동 갱신

---

#### Group C: Integration (Week 2-3)

**Priority: 🟡 High - Group A, B 완료 후 시작**

##### Task C-1: main.ts 초기화 로직 작성
```
✅ 구현 가능
파일: src/main.ts (기존 수정)
추가 라인 수: ~30 lines
의존성: Task A-1~A-4, B-2 완료 후
```

**수정할 내용:**

1. **필드 추가:**
```typescript
class NeroMindPlugin extends Plugin {
    settings: NeroMindSettings;
    private disposables: Disposable[] = [];

    // ✅ 추가
    private eventBus: EventBus | null = null;
    private stateManager: StateManager | null = null;
    private historyManager: HistoryManager | null = null;
```

2. **initializePlugin() 수정:**
```typescript
    private initializePlugin(): void {
        console.log('NeroMind: Initializing plugin...');

        // ✅ Phase 3.0 MVP: 초기화 순서 중요!
        // 1. EventBus 생성 (독립)
        this.eventBus = new EventBus();

        // 2. StateManager 생성 및 EventBus 주입
        this.stateManager = new StateManager();
        this.stateManager.setEventBus(this.eventBus);

        // 3. HistoryManager 생성 (StateManager 래핑)
        this.historyManager = new HistoryManager(this.stateManager);

        // 4. Renderer는 NeroMindView에서 생성 시 EventBus 전달
        //    (NeroMindView.onOpen()에서 처리)

        // Disposable 등록 (역순 destroy)
        this.disposables.push(this.historyManager);
        this.disposables.push(this.stateManager);
        this.disposables.push(this.eventBus);

        console.log('NeroMind: Plugin initialized successfully');
    }
```

3. **Renderer 생성 시 EventBus 전달 (필요시):**
```typescript
// NeroMindView.ts의 onOpen()에서
const renderer = new Renderer(this.svgElement, this.plugin.eventBus);
```

**완료 조건:**
- 플러그인 로드 시 에러 없이 초기화
- 초기화 순서 준수: EventBus → StateManager → HistoryManager
- disposables 역순 등록 확인

---

##### Task C-2: 키보드 단축키 등록 (Ctrl+Z)
```
✅ 구현 가능
파일: src/main.ts (기존 수정)
추가 라인 수: ~20 lines
의존성: Task C-1 완료 후
```

**추가할 내용:**
```typescript
    async onload(): Promise<void> {
        await this.loadSettings();

        this.registerView(
            NeroMindView.VIEW_TYPE,
            (leaf) => new NeroMindView(leaf, this)
        );

        this.addRibbonIcon('brain', 'Open NeroMind', () => {
            this.activateView();
        });

        this.addSettingTab(new NeroMindSettingTab(this.app, this));

        // ✅ Phase 3.0 MVP: Undo 단축키 등록
        this.addCommand({
            id: 'undo',
            name: 'Undo',
            hotkeys: [{ modifiers: ['Mod'], key: 'z' }],
            callback: () => {
                if (this.historyManager && this.historyManager.canUndo()) {
                    this.historyManager.undo();
                    new Notice('Undo');
                } else {
                    new Notice('Nothing to undo');
                }
            }
        });

        // ❌ Phase 3.0 MVP: Redo 단축키 제외 (Phase 3.1)

        this.app.workspace.onLayoutReady(() => {
            this.initializePlugin();
        });
    }
```

**완료 조건:**
- Ctrl+Z (Windows) / Cmd+Z (Mac) 동작
- Undo 가능 시 Notice 표시
- Undo 불가능 시 "Nothing to undo" 표시

---

##### Task C-3: StateManager에 getContext() public 노출
```
✅ 구현 가능
파일: src/state/StateManager.ts (기존 수정)
추가 라인 수: ~5 lines
의존성: 없음 (Task B-2에서 필요)
```

**수정할 내용:**
```typescript
    /**
     * 현재 상태 컨텍스트 (Command 전용)
     * ✅ Phase 3.0: HistoryManager 접근을 위해 public으로 변경
     */
    getContext(): StateContext {  // ✅ private → public
        return {
            persistent: this.persistentState,
            ephemeral: this.ephemeralState,
        };
    }
```

**완료 조건:**
- HistoryManager에서 getContext() 호출 가능
- TypeScript 컴파일 에러 없음

---

#### Group D: Testing & Documentation (Week 3)

**Priority: 🟢 Medium - Group C 완료 후**

##### Task D-1: 수동 테스트 5개 항목
```
✅ 테스트 가능
의존성: Group A, B, C 모두 완료 후
```

**테스트 항목:**

1. **플러그인 로드 테스트**
   - [ ] 플러그인 활성화 시 에러 없이 초기화
   - [ ] 콘솔에 'NeroMind: Plugin initialized successfully' 출력
   - [ ] EventBus, StateManager, HistoryManager 생성 확인

2. **노드 생성 테스트**
   - [ ] 노드 생성 시 'Renderer: nodeCreated' 로그 출력
   - [ ] StateManager.getAllNodes()에 노드 추가 확인
   - [ ] Renderer 렌더링 업데이트 확인

3. **노드 삭제 테스트**
   - [ ] 노드 삭제 시 'Renderer: nodeDeleted' 로그 출력
   - [ ] 연결된 엣지도 함께 제거 확인
   - [ ] Renderer 렌더링 업데이트 확인

4. **Undo 테스트**
   - [ ] 노드 생성 후 Ctrl+Z → 노드 제거 확인
   - [ ] 노드 삭제 후 Ctrl+Z → 노드 복원 확인
   - [ ] Undo 가능 여부 (canUndo) 올바르게 동작
   - [ ] MAX_HISTORY=10 제한 동작 확인

5. **플러그인 언로드 테스트**
   - [ ] 플러그인 비활성화 시 에러 없이 정리
   - [ ] 이벤트 구독 해제 확인 (unsubscribers 호출)
   - [ ] disposables 역순 destroy 확인

**완료 조건:**
- 5개 테스트 모두 Pass
- 콘솔에 에러 없음
- 메모리 누수 없음 (구독 해제 확인)

---

##### Task D-2: Dev_Log.md 업데이트
```
✅ 작성 가능
의존성: Group A~D 완료 후
```

**업데이트할 내용:**
- Phase 3.0 MVP 완료 체크
- 구현된 파일 목록 (10+ 파일)
- 빌드 결과 (예상: ~20KB)
- 발견된 버그 및 해결 방법
- Phase 3.1 진입 준비

---

### 11.2 ❌ 지금 구현하면 안 되는 Task (Phase 3.1+)

#### Reason: MVP 범위 초과, 복잡도 증가, 의존성 미해결

---

#### Category 1: Event System 확장 기능 (Phase 3.1)

##### ❌ EventBus.once() 구현
**연기 이유:**
- MVP에서 불필요 (on() + 수동 unsubscribe로 충분)
- 추가 복잡도 (once 플래그 관리)

**Phase 3.1 구현 시점:**
- EventBus 기본 기능 안정화 후
- 실제 사용 사례 확인 후

---

##### ❌ EventBus.off() 구현
**연기 이유:**
- MVP에서 불필요 (unsubscribe 함수 반환으로 충분)
- off()는 특정 이벤트의 모든 리스너 제거 (위험)

**Phase 3.1 구현 시점:**
- 디버깅 도구 필요 시
- 플러그인 재시작 없이 리스너 초기화 필요 시

---

##### ❌ EventBus.clear() 구현
**연기 이유:**
- MVP에서 불필요 (destroy()에서 cleanup 충분)
- clear()는 전체 리스너 제거 (파괴적)

**Phase 3.1 구현 시점:**
- 테스트 환경에서 필요 시
- 플러그인 hot reload 지원 시

---

##### ❌ Enum 기반 이벤트 이름 마이그레이션
**연기 이유:**
- Runtime validation으로 충분
- 대규모 리팩토링 (모든 이벤트 이름 변경)

**Phase 3.1 구현 시점:**
- 이벤트 종류가 10개 이상으로 증가 시
- 타입 안전성 강화 필요 시

```typescript
// ❌ Phase 3.0에서 하지 말 것
export enum NeroMindEvent {
    NodeCreated = 'node:created',
    NodeDeleted = 'node:deleted',
    // ...
}
```

---

##### ❌ 추가 이벤트 타입 정의
**연기할 이벤트:**
- `'nodeMoved'` - Phase 3.1 (MoveNodeCommand 구현 후)
- `'nodeSelected'` - Phase 3.1 (선택 UI 구현 후)
- `'nodeDeselected'` - Phase 3.1
- `'editingChanged'` - Phase 3.1 (편집 모드 구현 후)
- `'historyChanged'` - Phase 3.1 (Redo 추가 후)
- `'viewportChanged'` - Phase 3.2 (ViewportManager 구현 후)

**연기 이유:**
- 해당 기능이 아직 구현되지 않음
- 사용되지 않는 이벤트는 혼란 초래

---

#### Category 2: History System 확장 기능 (Phase 3.1)

##### ❌ Redo 기능 구현
**연기할 내용:**
- `HistoryManager.redoStack` 필드
- `HistoryManager.redo()` 메서드
- `HistoryManager.canRedo()` 메서드
- Ctrl+Shift+Z (Redo) 단축키

**연기 이유:**
- MVP 검증에 불필요 (Undo만으로 충분)
- Redo는 Undo보다 복잡 (redoStack 동기화)

**Phase 3.1 구현 시점:**
- Undo 동작 안정화 후
- 사용자 피드백 수집 후

---

##### ❌ MAX_HISTORY=100으로 증가
**연기 이유:**
- MVP에서는 10개로 충분 (메모리 절약)
- Phase 3.1에서 성능 테스트 후 조정

**Phase 3.1 구현 시점:**
- 메모리 사용량 프로파일링 후
- Inverse Operation 패턴 검증 후

---

##### ❌ CommandFactory 패턴 구현
**연기할 내용:**
```typescript
// ❌ Phase 3.0에서 하지 말 것
export class CommandFactory {
    static createNode(node: MindMapNode): UndoableCommand {
        return new CreateNodeCommand(node, null);
    }
    // ...
}
```

**연기 이유:**
- MVP에서 직접 `new XxxCommand()` 사용 충분
- 추가 추상화 레이어 불필요

**Phase 3.1 구현 시점:**
- Command 종류가 5개 이상으로 증가 시
- Command 생성 로직이 복잡해질 때

---

##### ❌ CompositeCommand 구현
**연기할 내용:**
```typescript
// ❌ Phase 3.0에서 하지 말 것
export class CompositeCommand implements UndoableCommand {
    private commands: UndoableCommand[];

    execute(context: StateContext): void {
        this.commands.forEach(cmd => cmd.execute(context));
    }

    undo(context: StateContext): void {
        // 역순 실행
        [...this.commands].reverse().forEach(cmd => cmd.undo(context));
    }
}
```

**연기 이유:**
- MVP에서 복합 작업 없음
- 단일 Command만으로 충분

**Phase 3.1 구현 시점:**
- "여러 노드 동시 이동" 같은 배치 작업 필요 시
- 트랜잭션 개념 필요 시

---

##### ❌ MoveNodeCommand 구현
**연기 이유:**
- MVP에서 노드 드래그 기능 미구현
- position 업데이트는 UpdateNodeCommand로 가능

**Phase 3.1 구현 시점:**
- MouseManager 구현 후
- 노드 드래그 기능 추가 시

---

##### ❌ 추가 Command 구현
**연기할 Command:**
- `ReparentNodeCommand` - 부모 변경
- `ToggleCollapseCommand` - 접기/펼치기
- `PinNodeCommand` - 핀 고정
- `LinkNoteCommand` - 노트 연결

**연기 이유:**
- 해당 기능이 아직 구현되지 않음
- MVP 범위 초과

---

#### Category 3: Persistence 레이어 (Phase 3.1~3.2)

##### ❌ PersistenceManager 전체 구현
**연기할 내용:**
- `PersistenceManager` 클래스
- `Serializer` 로직
- `FileManager` (Obsidian Vault API)
- `ValidationManager`
- `AutoSaveManager`

**연기 이유:**
- MVP에서 상태 저장 불필요 (플러그인 재시작 시 초기화)
- Phase 2.5의 serialize/deserialize로 충분

**Phase 3.1 구현 시점:**
- Event System + History System 안정화 후
- 사용자가 상태 저장 요청 시

---

##### ❌ AutoSave 기능
**연기할 내용:**
- AutoSaveManager 클래스
- Debounce 로직 (3초)
- isSaving 플래그
- 'stateChanged' 이벤트 구독

**연기 이유:**
- MVP에서 자동 저장 불필요
- Race condition 처리 복잡도

**Phase 3.2 구현 시점:**
- PersistenceManager 기본 기능 구현 후
- 수동 저장 동작 검증 후

---

##### ❌ Schema Validation (Ajv)
**연기할 내용:**
- Ajv 라이브러리 의존성 추가
- SerializedState 스키마 정의
- validate() 메서드 구현

**연기 이유:**
- MVP에서 JSON 파싱 실패 가능성 낮음
- Fallback values로 충분

**Phase 3.2 구현 시점:**
- 프로덕션 배포 전
- 파일 손상 사례 보고 시

---

##### ❌ 백업 시스템
**연기할 내용:**
- createBackup() 메서드
- 타임스탬프 기반 백업 파일
- 백업 파일 관리 (최대 10개)

**연기 이유:**
- MVP에서 백업 불필요
- Obsidian 자체 버전 관리 존재

**Phase 3.2 구현 시점:**
- 사용자 데이터 손실 사례 발생 시
- 프로덕션 배포 전

---

#### Category 4: 고급 기능 (Phase 4)

##### ❌ AutoAligner (자동 정렬)
**연기 이유:**
- Phase 4 영역
- LayoutEngine 구현 필요

---

##### ❌ MiniMap (미니맵)
**연기 이유:**
- Phase 4 영역
- Canvas 렌더링 복잡도

---

##### ❌ LOD (Level of Detail)
**연기 이유:**
- Phase 4 영역
- 성능 최적화 범주

---

##### ❌ Settings UI 확장
**연기 이유:**
- Phase 4 영역
- 기본 설정만으로 충분

---

#### Category 5: 테스트 자동화 (Phase 3.1)

##### ❌ 자동화 단위 테스트
**연기할 내용:**
- Jest/Vitest 설정
- Command 단위 테스트 (10+ 테스트)
- EventBus 단위 테스트
- StateManager 단위 테스트

**연기 이유:**
- MVP에서 수동 테스트로 충분
- 테스트 인프라 구축 시간 소요

**Phase 3.1 구현 시점:**
- MVP 동작 검증 후
- 리팩토링 전 안전망 필요 시

---

##### ❌ StateContextBuilder 작성
**연기 이유:**
- 자동화 테스트 없으면 불필요
- Phase 3.1에서 테스트 인프라와 함께 구현

---

##### ❌ 통합 테스트
**연기 이유:**
- MVP 검증은 수동 테스트로 충분
- 자동화된 E2E 테스트는 Phase 3.1

---

##### ❌ 성능 테스트
**연기 이유:**
- MVP에서 성능 측정 불필요
- Phase 3.2에서 프로파일링

---

### 11.3 Phase별 구현 로드맵 요약

#### Phase 3.0 MVP (지금 구현)
```
Week 1: Event System
  ✅ EventBus (on, emit, Runtime validation)
  ✅ eventTypes.ts (4개 이벤트)
  ✅ StateManager EventEmitter 통합
  ✅ Renderer 이벤트 구독

Week 2: History System
  ✅ UndoableCommand 인터페이스
  ✅ HistoryManager (execute, undo만)
  ✅ CreateNodeCommand
  ✅ DeleteNodeCommand
  ✅ UpdateNodeCommand (선택적)

Week 3: Integration & Testing
  ✅ main.ts 초기화
  ✅ Ctrl+Z 단축키
  ✅ 수동 테스트 5개
  ✅ Dev_Log.md 업데이트
```

**완료 조건:**
- 빌드 성공
- 노드 생성/삭제 동작
- Undo 동작
- 플러그인 로드/언로드 정상

---

#### Phase 3.1 (MVP 이후)
```
Week 4-5: 기능 확장
  ❌→✅ Redo 기능
  ❌→✅ EventBus 확장 (once, off)
  ❌→✅ MoveNodeCommand
  ❌→✅ CompositeCommand
  ❌→✅ Persistence 기본 (수동 저장/불러오기)
  ❌→✅ 자동화 테스트 인프라
```

---

#### Phase 3.2 (안정화)
```
Week 6-7: 최적화 & 안정화
  ❌→✅ AutoSave
  ❌→✅ Functional Commands 패턴
  ❌→✅ Schema Validation
  ❌→✅ Enum 기반 이벤트
  ❌→✅ 성능 프로파일링
  ❌→✅ 문서화
```

---

#### Phase 4 (고급 기능)
```
Week 8+: 고급 기능
  ❌→✅ AutoAligner
  ❌→✅ MiniMap
  ❌→✅ LOD
  ❌→✅ Settings UI 완성
  ❌→✅ Export/Import
```

---

### 11.4 구현 시작 체크리스트

#### 구현 시작 전 확인사항
- [ ] Phase 2.5 완료 확인 (StateManager, DirectionManager, 타입 안정화)
- [ ] Phase 3 설계 문서 숙지 (phase3_Design_Data.md)
- [ ] 비판적 검토 내용 숙지 (Section 10)
- [ ] Git 브랜치 생성 (예: feature/phase3-mvp)
- [ ] 개발 환경 준비 (TypeScript, Obsidian 플러그인 개발 환경)

#### 구현 순서 (엄수)
1. ✅ **Group A: Event System** (가장 먼저, 다른 것에 의존성 없음)
2. ✅ **Group B: History System** (Group A 완료 후)
3. ✅ **Group C: Integration** (Group A, B 완료 후)
4. ✅ **Group D: Testing** (Group A, B, C 완료 후)

#### 각 Task 완료 시 체크
- [ ] TypeScript 컴파일 에러 없음
- [ ] 빌드 성공 (`npm run build`)
- [ ] 콘솔에 에러 로그 없음
- [ ] 기존 기능 정상 동작 (회귀 테스트)
- [ ] Dev_Log.md 업데이트

---

### 11.5 주의사항 및 함정

#### ⚠️ 반드시 피해야 할 실수

1. **EventBus 구현 전에 StateManager 수정하지 말 것**
   - StateManager.emit() 호출 시 EventBus가 없으면 에러 발생
   - 순서: EventBus 구현 → StateManager 수정

2. **HistoryManager 구현 전에 Command 먼저 만들지 말 것**
   - Command는 HistoryManager.execute()를 통해 실행됨
   - 순서: HistoryManager 구현 → Command 구현

3. **Redo 기능을 MVP에 포함하지 말 것**
   - Redo는 복잡도 2배 (redoStack 동기화)
   - Phase 3.0에서는 Undo만

4. **AutoSave를 MVP에 포함하지 말 것**
   - Race condition 처리 필수
   - Phase 3.2로 연기

5. **테스트 자동화를 MVP에 포함하지 말 것**
   - 수동 테스트로 충분
   - Phase 3.1로 연기

6. **새 기능 추가 전 기존 기능 회귀 테스트**
   - 매 Task 완료 시 플러그인 로드/언로드 테스트
   - 빌드 사이즈 확인 (~20KB 예상)

7. **의존성 순서 위반하지 말 것**
   - 상위 레이어가 하위 레이어 의존 금지
   - StateManager는 EventBus에만 의존, HistoryManager에 의존하지 않음

---

### 11.6 문제 발생 시 대응 방법

#### 빌드 실패 시
1. TypeScript 에러 메시지 확인
2. 타입 정의 누락 확인 (EventPayloadMap, UndoableCommand 등)
3. import 경로 확인 (상대 경로 vs 절대 경로)
4. `npm run build` 재시도

#### EventBus 동작하지 않을 시
1. StateManager.setEventBus() 호출 확인
2. Initialization Guard 에러 확인
3. Runtime validation 에러 확인 (유효하지 않은 이벤트 이름)
4. 콘솔 로그 추가 (emit() 호출 시점 확인)

#### Undo 동작하지 않을 시
1. HistoryManager.canUndo() 반환값 확인
2. undoStack에 Command 추가 확인
3. Command.undo() 호출 확인
4. StateManager.getContext() 접근 가능 확인

#### 메모리 누수 의심 시
1. unsubscribe() 호출 확인 (Renderer.destroy())
2. disposables 역순 destroy 확인
3. Chrome DevTools Memory Profiler 사용

---

### 11.7 최종 확인 (Phase 3.0 MVP 완료 조건)

#### 기능 검증
- [ ] 플러그인 로드 성공
- [ ] 노드 생성 시 Renderer 업데이트
- [ ] 노드 삭제 시 엣지도 함께 제거
- [ ] Ctrl+Z로 Undo 동작
- [ ] MAX_HISTORY=10 제한 동작
- [ ] 플러그인 언로드 시 에러 없음

#### 코드 품질
- [ ] TypeScript 컴파일 에러 0개
- [ ] ESLint 경고 0개
- [ ] 콘솔 에러 0개
- [ ] 빌드 사이즈 ~20KB (14KB → 20KB 예상)

#### 문서화
- [ ] Dev_Log.md 업데이트
- [ ] phase3_Design_Data.md 완료 표시
- [ ] Git commit 메시지 명확

#### 다음 단계 준비
- [ ] Phase 3.1 Task 목록 확인
- [ ] 사용자 피드백 수집 계획
- [ ] 성능 측정 기준 설정

---

**문서 끝**

**최종 업데이트:** 2026-01-12 (Phase 3.0 MVP 구현 Task 분류 완료)

---

## 12. Phase 3 MVP 구현 작업 단위 (Task Breakdown)

### 문서 정보
- **작성일**: 2026-01-12
- **목적**: Phase 3 MVP 실제 구현을 위한 1~2시간 단위 작업 정의
- **범위**: EventBus + HistoryManager + 기본 Commands + Persistence (최소 구현)

---

### 작업 분류 체계

| 카테고리 | 설명 | 예상 소요 시간 |
|---------|------|---------------|
| **신규 파일 생성** | 새로운 TypeScript 파일 작성 | 1~2시간 |
| **기존 파일 수정** | 기존 파일에 기능 추가/수정 | 0.5~1.5시간 |
| **테스트 작성** | 단위 테스트 파일 작성 | 0.5~1시간 |
| **통합 작업** | 여러 모듈 연결 | 1~2시간 |

---

## Week 1: Event System 구축

### 🔷 Task 1.1: EventBus 타입 정의
**분류**: 신규 파일 생성  
**소요 시간**: 1시간  
**파일**: `src/events/eventTypes.ts`

**작업 내용**:
```typescript
// src/events/eventTypes.ts
export interface EventPayloadMap {
  'nodeCreated': { node: MindMapNode };
  'nodeDeleted': { nodeId: NodeId };
  'nodeUpdated': { node: MindMapNode; changes: Partial<MindMapNode> };
  'stateChanged': { snapshot: StateSnapshot };
}

export type EventListener<K extends keyof EventPayloadMap> = (
  payload: EventPayloadMap[K]
) => void;

export type Unsubscribe = () => void;
```

**완료 기준 (Done Definition)**:
- [ ] `EventPayloadMap` 인터페이스 정의 (4개 이벤트)
- [ ] `EventListener<K>` 제네릭 타입 정의
- [ ] `Unsubscribe` 타입 정의
- [ ] TypeScript 컴파일 에러 없음
- [ ] 파일 저장 및 git stage

---

### 🔷 Task 1.2: EventBus 클래스 구현
**분류**: 신규 파일 생성  
**소요 시간**: 1.5시간  
**파일**: `src/events/EventBus.ts`

**작업 내용**:
```typescript
export class EventBus implements Disposable {
  private listeners: Map<string, Set<Function>> = new Map();

  on<K extends keyof EventPayloadMap>(
    event: K,
    listener: EventListener<K>
  ): Unsubscribe {
    // Runtime validation 추가
    if (!this.isValidEvent(event)) {
      throw new Error(`Unknown event: ${event}`);
    }
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => this.listeners.get(event)?.delete(listener);
  }

  emit<K extends keyof EventPayloadMap>(
    event: K,
    payload: EventPayloadMap[K]
  ): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    listeners.forEach(listener => {
      try {
        listener(payload);
      } catch (error) {
        console.error(`EventBus error in ${event}:`, error);
      }
    });
  }

  private isValidEvent(event: string): boolean {
    const validEvents: Record<keyof EventPayloadMap, true> = {
      'nodeCreated': true,
      'nodeDeleted': true,
      'nodeUpdated': true,
      'stateChanged': true,
    };
    return event in validEvents;
  }

  destroy(): void {
    this.listeners.clear();
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `on()` 메서드 구현 (구독)
- [ ] `emit()` 메서드 구현 (발행)
- [ ] Runtime validation 추가 (`isValidEvent()`)
- [ ] 에러 격리 (try-catch) 추가
- [ ] `destroy()` 메서드 구현
- [ ] TypeScript 컴파일 에러 없음
- [ ] `eventTypes.ts` import 확인

---

### 🔷 Task 1.3: StateManager EventEmitter 통합 - 타입 정의
**분류**: 기존 파일 수정  
**소요 시간**: 0.5시간  
**파일**: `src/state/StateManager.ts`

**작업 내용**:
1. `EventBus` import 추가
2. `eventBus` 필드 추가 (private, nullable)
3. `isInitialized` 필드 추가
4. `setEventBus()` 메서드 추가
5. `emit()` 메서드 추가 (protected)

```typescript
import { EventBus, EventPayloadMap } from '../events/EventBus';

export class StateManager implements Disposable {
  private readonly persistentState: PersistentState;
  private readonly ephemeralState: EphemeralState;
  private eventBus: EventBus | null = null;  // NEW
  private isInitialized = false;  // NEW

  setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus;
    this.isInitialized = true;
  }

  protected emit<K extends keyof EventPayloadMap>(
    event: K,
    payload: EventPayloadMap[K]
  ): void {
    if (!this.isInitialized) {
      throw new Error('StateManager not initialized. Call setEventBus() first.');
    }
    this.eventBus!.emit(event, payload);
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `eventBus` 필드 추가 (`EventBus | null`)
- [ ] `isInitialized` 필드 추가 (`boolean`)
- [ ] `setEventBus()` 메서드 추가
- [ ] `emit()` 메서드 추가 (Initialization Guard 포함)
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 1.4: StateManager 이벤트 발행 활성화
**분류**: 기존 파일 수정  
**소요 시간**: 1시간  
**파일**: `src/state/StateManager.ts`

**작업 내용**:
주석 처리된 `this.emit()` 호출을 활성화

```typescript
addNode(node: MindMapNode): void {
  this.persistentState.graph.nodes.set(node.id, node);

  if (!this.persistentState.graph.rootId) {
    this.persistentState.graph.rootId = node.id;
  }

  // Phase 3: 이벤트 발행 활성화
  this.emit('nodeCreated', { node });
}

removeNode(nodeId: NodeId): void {
  this.persistentState.graph.nodes.delete(nodeId);

  // Phase 3: 이벤트 발행 활성화
  this.emit('nodeDeleted', { nodeId });
}

updateNode(nodeId: NodeId, updates: Partial<MindMapNode>): void {
  const node = this.getNode(nodeId);
  if (!node) return;

  Object.assign(node, updates);
  node.updatedAt = Date.now();

  // Phase 3: 이벤트 발행 활성화
  this.emit('nodeUpdated', { node, changes: updates });
}
```

**완료 기준 (Done Definition)**:
- [ ] `addNode()` 메서드에서 `emit('nodeCreated')` 활성화
- [ ] `removeNode()` 메서드에서 `emit('nodeDeleted')` 활성화
- [ ] `updateNode()` 메서드에서 `emit('nodeUpdated')` 활성화
- [ ] 모든 주석 제거 (`// Phase 2+:` 제거)
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 1.5: Renderer 이벤트 구독 추가
**분류**: 기존 파일 수정  
**소요 시간**: 1.5시간  
**파일**: `src/rendering/Renderer.ts`

**작업 내용**:
1. `EventBus` 생성자 파라미터 추가
2. `unsubscribers` 배열 추가
3. `subscribeToEvents()` 메서드 추가
4. `destroy()` 메서드에서 구독 해제

```typescript
import { EventBus, Unsubscribe } from '../events/EventBus';

export class Renderer implements Disposable {
  private svgElement: SVGSVGElement;
  private eventBus: EventBus;
  private unsubscribers: Unsubscribe[] = [];  // NEW

  constructor(svgElement: SVGSVGElement, eventBus: EventBus) {
    this.svgElement = svgElement;
    this.eventBus = eventBus;
    this.subscribeToEvents();  // NEW
  }

  private subscribeToEvents(): void {
    this.unsubscribers.push(
      this.eventBus.on('nodeCreated', ({ node }) => {
        this.scheduleRender();
      })
    );

    this.unsubscribers.push(
      this.eventBus.on('nodeDeleted', ({ nodeId }) => {
        this.scheduleRender();
      })
    );

    this.unsubscribers.push(
      this.eventBus.on('nodeUpdated', ({ node }) => {
        this.scheduleRender();
      })
    );
  }

  destroy(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.stop();
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `eventBus` 생성자 파라미터 추가
- [ ] `unsubscribers` 배열 추가
- [ ] `subscribeToEvents()` 메서드 구현 (3개 이벤트 구독)
- [ ] `destroy()` 메서드에서 구독 해제 구현
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 1.6: main.ts EventBus 초기화
**분류**: 기존 파일 수정  
**소요 시간**: 0.5시간  
**파일**: `src/main.ts`

**작업 내용**:
```typescript
import { EventBus } from './events/EventBus';

class NeroMindPlugin extends Plugin {
  private eventBus: EventBus | null = null;
  private stateManager: StateManager | null = null;

  private initializePlugin(): void {
    console.log('NeroMind: Initializing plugin...');

    // 1. EventBus 생성
    this.eventBus = new EventBus();

    // 2. StateManager 생성 및 EventBus 주입
    this.stateManager = new StateManager();
    this.stateManager.setEventBus(this.eventBus);

    // ... 기타 초기화

    // Disposable 등록
    this.disposables.push(this.stateManager);
    this.disposables.push(this.eventBus);

    console.log('NeroMind: Plugin initialized successfully');
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `EventBus` import 추가
- [ ] `eventBus` 필드 추가
- [ ] `initializePlugin()` 메서드에서 `EventBus` 생성
- [ ] `StateManager.setEventBus()` 호출
- [ ] `disposables` 배열에 추가
- [ ] TypeScript 컴파일 에러 없음
- [ ] 빌드 성공 (`npm run build`)

---

### 🔷 Task 1.7: Week 1 통합 테스트
**분류**: 통합 작업  
**소요 시간**: 1시간  

**작업 내용**:
1. Obsidian에서 플러그인 로드
2. 노드 생성 테스트
3. 이벤트 발행 확인 (console.log)
4. 에러 없이 초기화 확인

**완료 기준 (Done Definition)**:
- [ ] 플러그인 로드 시 에러 없음
- [ ] `StateManager.addNode()` 호출 시 `nodeCreated` 이벤트 발행 확인
- [ ] `Renderer`에서 이벤트 수신 확인 (console.log)
- [ ] 플러그인 언로드 시 구독 해제 확인
- [ ] 브라우저 콘솔에 에러 없음

---

## Week 2: History System 구축

### 🔷 Task 2.1: History 타입 정의
**분류**: 신규 파일 생성  
**소요 시간**: 1시간  
**파일**: `src/history/historyTypes.ts`

**작업 내용**:
```typescript
import { StateCommand, StateContext } from '../state/stateTypes';

export interface UndoableCommand extends StateCommand {
  description: string;  // 필수
  undo(context: StateContext): void;
}
```

**완료 기준 (Done Definition)**:
- [ ] `UndoableCommand` 인터페이스 정의
- [ ] `StateCommand` 확장
- [ ] `undo()` 메서드 시그니처 추가
- [ ] `description` 필수 필드 추가
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 2.2: HistoryManager 기본 구조
**분류**: 신규 파일 생성  
**소요 시간**: 1.5시간  
**파일**: `src/history/HistoryManager.ts`

**작업 내용**:
```typescript
import { StateManager } from '../state/StateManager';
import { UndoableCommand } from './historyTypes';
import { StateSnapshot } from '../state/stateTypes';

export class HistoryManager implements Disposable {
  private stateManager: StateManager;
  private undoStack: UndoableCommand[] = [];
  private readonly MAX_HISTORY = 10;  // Phase 3.0 MVP: 10으로 제한

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  execute(command: UndoableCommand): StateSnapshot {
    const snapshot = this.stateManager.apply(command);
    this.undoStack.push(command);

    if (this.undoStack.length > this.MAX_HISTORY) {
      this.undoStack.shift();
    }

    return snapshot;
  }

  undo(): StateSnapshot | null {
    const command = this.undoStack.pop();
    if (!command) return null;

    const context = this.getStateContext();
    command.undo(context);

    return this.stateManager.getSnapshot();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  private getStateContext(): StateContext {
    return (this.stateManager as any).getContext();
  }

  destroy(): void {
    this.undoStack = [];
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `HistoryManager` 클래스 생성
- [ ] `undoStack` 필드 추가
- [ ] `execute()` 메서드 구현 (Inverse Operation 패턴)
- [ ] `undo()` 메서드 구현
- [ ] `canUndo()` 메서드 구현
- [ ] `MAX_HISTORY=10` 제한 구현
- [ ] `destroy()` 메서드 구현
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 2.3: CreateNodeCommand 구현
**분류**: 신규 파일 생성  
**소요 시간**: 1시간  
**파일**: `src/history/commands/CreateNodeCommand.ts`

**작업 내용**:
```typescript
import { UndoableCommand } from '../historyTypes';
import { StateContext, NodeId, MindMapNode } from '../../types/index';

export class CreateNodeCommand implements UndoableCommand {
  description = 'Create Node';
  private nodeId: NodeId;
  private node: MindMapNode;
  private parentId: NodeId | null;

  constructor(node: MindMapNode, parentId: NodeId | null) {
    this.nodeId = node.id;
    this.node = node;
    this.parentId = parentId;
  }

  execute(context: StateContext): void {
    context.persistent.graph.nodes.set(this.nodeId, this.node);

    if (!context.persistent.graph.rootId) {
      context.persistent.graph.rootId = this.nodeId;
    }

    if (this.parentId) {
      const parent = context.persistent.graph.nodes.get(this.parentId);
      if (parent) {
        parent.childIds.push(this.nodeId);
      }
    }
  }

  undo(context: StateContext): void {
    context.persistent.graph.nodes.delete(this.nodeId);

    if (this.parentId) {
      const parent = context.persistent.graph.nodes.get(this.parentId);
      if (parent) {
        const index = parent.childIds.indexOf(this.nodeId);
        if (index !== -1) {
          parent.childIds.splice(index, 1);
        }
      }
    }

    if (context.persistent.graph.rootId === this.nodeId) {
      context.persistent.graph.rootId = '';
    }
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `CreateNodeCommand` 클래스 생성
- [ ] `execute()` 메서드 구현 (노드 추가 + 부모의 childIds 업데이트)
- [ ] `undo()` 메서드 구현 (노드 제거 + 부모의 childIds 복원)
- [ ] rootId 설정/복원 로직 추가
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 2.4: DeleteNodeCommand 구현
**분류**: 신규 파일 생성  
**소요 시간**: 1.5시간  
**파일**: `src/history/commands/DeleteNodeCommand.ts`

**작업 내용**:
```typescript
import { UndoableCommand } from '../historyTypes';
import { StateContext, NodeId, MindMapNode, MindMapEdge } from '../../types/index';

export class DeleteNodeCommand implements UndoableCommand {
  description = 'Delete Node';
  private nodeId: NodeId;
  private deletedNode: MindMapNode | null = null;
  private deletedEdges: MindMapEdge[] = [];
  private parentId: NodeId | null = null;
  private childIndex: number = -1;

  constructor(nodeId: NodeId) {
    this.nodeId = nodeId;
  }

  execute(context: StateContext): void {
    // 1. 노드 백업
    this.deletedNode = context.persistent.graph.nodes.get(this.nodeId) || null;
    if (!this.deletedNode) return;

    // 2. 부모의 childIds에서 제거 (복원용 정보 저장)
    this.parentId = this.deletedNode.parentId;
    if (this.parentId) {
      const parent = context.persistent.graph.nodes.get(this.parentId);
      if (parent) {
        this.childIndex = parent.childIds.indexOf(this.nodeId);
        if (this.childIndex !== -1) {
          parent.childIds.splice(this.childIndex, 1);
        }
      }
    }

    // 3. 연결된 엣지 찾기 및 백업
    this.deletedEdges = [];
    context.persistent.graph.edges.forEach((edge, edgeId) => {
      if (edge.fromNodeId === this.nodeId || edge.toNodeId === this.nodeId) {
        this.deletedEdges.push({ ...edge });
        context.persistent.graph.edges.delete(edgeId);
      }
    });

    // 4. 노드 제거
    context.persistent.graph.nodes.delete(this.nodeId);
  }

  undo(context: StateContext): void {
    // 1. 노드 복원
    if (this.deletedNode) {
      context.persistent.graph.nodes.set(this.nodeId, this.deletedNode);
    }

    // 2. 부모의 childIds 복원
    if (this.parentId && this.childIndex !== -1) {
      const parent = context.persistent.graph.nodes.get(this.parentId);
      if (parent) {
        parent.childIds.splice(this.childIndex, 0, this.nodeId);
      }
    }

    // 3. 엣지 복원
    this.deletedEdges.forEach(edge => {
      context.persistent.graph.edges.set(edge.id, edge);
    });
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `DeleteNodeCommand` 클래스 생성
- [ ] `execute()` 메서드 구현 (노드 백업 + 엣지 제거 + 부모 childIds 업데이트)
- [ ] `undo()` 메서드 구현 (노드 복원 + 엣지 복원 + 부모 childIds 복원)
- [ ] Phase 2.5 경고 해결 (연결된 엣지 제거)
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 2.5: UpdateNodeCommand 구현
**분류**: 신규 파일 생성  
**소요 시간**: 1시간  
**파일**: `src/history/commands/UpdateNodeCommand.ts`

**작업 내용**:
```typescript
import { UndoableCommand } from '../historyTypes';
import { StateContext, NodeId, MindMapNode } from '../../types/index';

export class UpdateNodeCommand implements UndoableCommand {
  description: string;
  private nodeId: NodeId;
  private updates: Partial<MindMapNode>;
  private previousValues: Partial<MindMapNode> = {};

  constructor(nodeId: NodeId, updates: Partial<MindMapNode>) {
    this.nodeId = nodeId;
    this.updates = updates;
    this.description = `Update Node: ${Object.keys(updates).join(', ')}`;
  }

  execute(context: StateContext): void {
    const node = context.persistent.graph.nodes.get(this.nodeId);
    if (!node) return;

    // 이전 값 백업
    Object.keys(this.updates).forEach(key => {
      this.previousValues[key] = (node as any)[key];
    });

    // 업데이트 적용
    Object.assign(node, this.updates);
    node.updatedAt = Date.now();
  }

  undo(context: StateContext): void {
    const node = context.persistent.graph.nodes.get(this.nodeId);
    if (!node) return;

    // 이전 값 복원
    Object.assign(node, this.previousValues);
    node.updatedAt = Date.now();
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `UpdateNodeCommand` 클래스 생성
- [ ] `execute()` 메서드 구현 (이전 값 백업 + 업데이트 적용)
- [ ] `undo()` 메서드 구현 (이전 값 복원)
- [ ] 동적 description 생성
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 2.6: StateManager getContext() 메서드 추가
**분류**: 기존 파일 수정  
**소요 시간**: 0.5시간  
**파일**: `src/state/StateManager.ts`

**작업 내용**:
```typescript
export class StateManager implements Disposable {
  // ...

  /**
   * Command 실행을 위한 컨텍스트 제공
   * Phase 3: HistoryManager가 사용
   */
  getContext(): StateContext {
    return {
      persistent: this.persistentState,
      ephemeral: this.ephemeralState
    };
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `getContext()` 메서드 추가
- [ ] `StateContext` 반환 (persistent + ephemeral)
- [ ] 주석 추가 (사용 목적 명시)
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 2.7: main.ts HistoryManager 초기화
**분류**: 기존 파일 수정  
**소요 시간**: 0.5시간  
**파일**: `src/main.ts`

**작업 내용**:
```typescript
import { HistoryManager } from './history/HistoryManager';

class NeroMindPlugin extends Plugin {
  private eventBus: EventBus | null = null;
  private stateManager: StateManager | null = null;
  private historyManager: HistoryManager | null = null;

  private initializePlugin(): void {
    console.log('NeroMind: Initializing plugin...');

    // 1. EventBus 생성
    this.eventBus = new EventBus();

    // 2. StateManager 생성 및 EventBus 주입
    this.stateManager = new StateManager();
    this.stateManager.setEventBus(this.eventBus);

    // 3. HistoryManager 생성
    this.historyManager = new HistoryManager(this.stateManager);

    // Disposable 등록
    this.disposables.push(this.historyManager);
    this.disposables.push(this.stateManager);
    this.disposables.push(this.eventBus);

    console.log('NeroMind: Plugin initialized successfully');
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `HistoryManager` import 추가
- [ ] `historyManager` 필드 추가
- [ ] `initializePlugin()` 메서드에서 `HistoryManager` 생성
- [ ] `disposables` 배열에 추가 (올바른 순서)
- [ ] TypeScript 컴파일 에러 없음
- [ ] 빌드 성공

---

### 🔷 Task 2.8: Week 2 통합 테스트
**분류**: 통합 작업  
**소요 시간**: 1시간  

**작업 내용**:
1. 노드 생성 Command 테스트
2. 노드 삭제 Command 테스트
3. Undo 기능 테스트
4. Ctrl+Z 단축키 등록 (임시)

**완료 기준 (Done Definition)**:
- [ ] `CreateNodeCommand` 실행 → 노드 추가 확인
- [ ] `DeleteNodeCommand` 실행 → 노드 + 엣지 제거 확인
- [ ] `HistoryManager.undo()` 호출 → 노드 복원 확인
- [ ] Undo 스택 MAX_HISTORY 제한 동작 확인
- [ ] 브라우저 콘솔에 에러 없음

---

## Week 3: Persistence System 구축 (최소 구현)

### 🔷 Task 3.1: Persistence 타입 정의
**분류**: 신규 파일 생성  
**소요 시간**: 1시간  
**파일**: `src/persistence/persistenceTypes.ts`

**작업 내용**:
```typescript
import { NodeId, EdgeId, MindMapNode, MindMapEdge, Position, UserSettings } from '../types/index';

export interface SerializedState {
  version: string;  // "1.0.0"
  schemaVersion: number;
  timestamp: number;

  graph: {
    nodes: [NodeId, MindMapNode][];
    edges: [EdgeId, MindMapEdge][];
    rootId: NodeId;
  };

  layout: {
    viewport: { x: number; y: number; zoom: number };
  };

  settings: UserSettings;
  pinnedNodes: NodeId[];

  metadata: {
    lastModified: number;
    nodeCount: number;
    edgeCount: number;
  };
}

export interface SaveOptions {
  validate?: boolean;
}

export interface LoadOptions {
  validate?: boolean;
}
```

**완료 기준 (Done Definition)**:
- [ ] `SerializedState` 인터페이스 정의
- [ ] `SaveOptions` 인터페이스 정의
- [ ] `LoadOptions` 인터페이스 정의
- [ ] metadata 필드 추가
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 3.2: FileManager 구현
**분류**: 신규 파일 생성  
**소요 시간**: 1.5시간  
**파일**: `src/persistence/FileManager.ts`

**작업 내용**:
```typescript
import { App, TFile } from 'obsidian';

export class FileManager {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  async save(filePath: string, content: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    
    if (file instanceof TFile) {
      await this.app.vault.modify(file, content);
    } else {
      await this.app.vault.create(filePath, content);
    }
  }

  async load(filePath: string): Promise<string> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    
    if (file instanceof TFile) {
      return await this.app.vault.read(file);
    }
    
    throw new Error(`File not found: ${filePath}`);
  }

  async exists(filePath: string): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    return file instanceof TFile;
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `FileManager` 클래스 생성
- [ ] `save()` 메서드 구현 (create/modify)
- [ ] `load()` 메서드 구현
- [ ] `exists()` 메서드 구현
- [ ] 에러 처리 추가
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 3.3: PersistenceManager 구현 (통합)
**분류**: 신규 파일 생성  
**소요 시간**: 2시간  
**파일**: `src/persistence/PersistenceManager.ts`

**작업 내용**:
```typescript
import { App } from 'obsidian';
import { StateManager } from '../state/StateManager';
import { FileManager } from './FileManager';
import { SerializedState, SaveOptions, LoadOptions } from './persistenceTypes';
import { PersistentState } from '../state/stateTypes';

export class PersistenceManager implements Disposable {
  private stateManager: StateManager;
  private fileManager: FileManager;
  private currentFilePath: string | null = null;

  constructor(stateManager: StateManager, app: App) {
    this.stateManager = stateManager;
    this.fileManager = new FileManager(app);
  }

  setFilePath(filePath: string): void {
    this.currentFilePath = filePath;
  }

  async save(options: SaveOptions = {}): Promise<void> {
    if (!this.currentFilePath) {
      throw new Error('No file path set for saving');
    }

    const persistentState = this.stateManager.getPersistentState();
    const serialized = this.serialize(persistentState);
    const jsonString = JSON.stringify(serialized, null, 2);
    
    await this.fileManager.save(this.currentFilePath, jsonString);
  }

  async load(filePath: string, options: LoadOptions = {}): Promise<void> {
    const jsonString = await this.fileManager.load(filePath);
    const serialized = JSON.parse(jsonString) as SerializedState;
    
    const persistentState = this.deserialize(serialized);
    this.stateManager.restorePersistentState(persistentState);
    
    this.currentFilePath = filePath;
  }

  private serialize(state: PersistentState): SerializedState {
    return {
      version: "1.0.0",
      schemaVersion: state.schemaVersion,
      timestamp: Date.now(),
      graph: {
        nodes: Array.from(state.graph.nodes.entries()),
        edges: Array.from(state.graph.edges.entries()),
        rootId: state.graph.rootId
      },
      layout: {
        viewport: state.layout.viewport
      },
      settings: state.settings,
      pinnedNodes: Array.from(state.pinnedNodes),
      metadata: {
        lastModified: Date.now(),
        nodeCount: state.graph.nodes.size,
        edgeCount: state.graph.edges.size
      }
    };
  }

  private deserialize(data: SerializedState): PersistentState {
    return {
      schemaVersion: data.schemaVersion || 1,
      graph: {
        nodes: new Map(data.graph.nodes || []),
        edges: new Map(data.graph.edges || []),
        rootId: data.graph.rootId || ''
      },
      layout: {
        viewport: data.layout.viewport || { x: 0, y: 0, zoom: 1 },
        nodePositions: new Map()
      },
      settings: data.settings || {},
      pinnedNodes: new Set(data.pinnedNodes || [])
    };
  }

  destroy(): void {
    // 정리 작업 없음 (AutoSave는 Phase 3.2)
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `PersistenceManager` 클래스 생성
- [ ] `save()` 메서드 구현 (serialize + JSON.stringify + FileManager.save)
- [ ] `load()` 메서드 구현 (FileManager.load + JSON.parse + deserialize)
- [ ] `serialize()` 메서드 구현 (Map/Set → Array)
- [ ] `deserialize()` 메서드 구현 (Array → Map/Set, Fallback values)
- [ ] `setFilePath()` 메서드 구현
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 3.4: StateManager getPersistentState/restorePersistentState 추가
**분류**: 기존 파일 수정  
**소요 시간**: 1시간  
**파일**: `src/state/StateManager.ts`

**작업 내용**:
```typescript
export class StateManager implements Disposable {
  // ...

  /**
   * PersistentState 직접 접근 (Persistence 레이어용)
   */
  getPersistentState(): PersistentState {
    return this.persistentState;
  }

  /**
   * PersistentState 복원 (Persistence 레이어용)
   */
  restorePersistentState(state: PersistentState): void {
    // 1. 기존 상태 초기화
    this.persistentState.graph.nodes.clear();
    this.persistentState.graph.edges.clear();

    // 2. 새 상태 복사
    this.persistentState.schemaVersion = state.schemaVersion;
    this.persistentState.graph = state.graph;
    this.persistentState.layout = state.layout;
    this.persistentState.settings = state.settings;
    this.persistentState.pinnedNodes = state.pinnedNodes;

    // 3. 이벤트 발행
    this.emit('stateChanged', { snapshot: this.getSnapshot() });
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `getPersistentState()` 메서드 추가
- [ ] `restorePersistentState()` 메서드 추가
- [ ] 상태 초기화 로직 추가
- [ ] `stateChanged` 이벤트 발행
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 3.5: main.ts PersistenceManager 초기화
**분류**: 기존 파일 수정  
**소요 시간**: 0.5시간  
**파일**: `src/main.ts`

**작업 내용**:
```typescript
import { PersistenceManager } from './persistence/PersistenceManager';

class NeroMindPlugin extends Plugin {
  private eventBus: EventBus | null = null;
  private stateManager: StateManager | null = null;
  private historyManager: HistoryManager | null = null;
  private persistenceManager: PersistenceManager | null = null;

  private initializePlugin(): void {
    console.log('NeroMind: Initializing plugin...');

    // 1. EventBus 생성
    this.eventBus = new EventBus();

    // 2. StateManager 생성 및 EventBus 주입
    this.stateManager = new StateManager();
    this.stateManager.setEventBus(this.eventBus);

    // 3. HistoryManager 생성
    this.historyManager = new HistoryManager(this.stateManager);

    // 4. PersistenceManager 생성
    this.persistenceManager = new PersistenceManager(this.stateManager, this.app);

    // Disposable 등록
    this.disposables.push(this.persistenceManager);
    this.disposables.push(this.historyManager);
    this.disposables.push(this.stateManager);
    this.disposables.push(this.eventBus);

    console.log('NeroMind: Plugin initialized successfully');
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `PersistenceManager` import 추가
- [ ] `persistenceManager` 필드 추가
- [ ] `initializePlugin()` 메서드에서 `PersistenceManager` 생성
- [ ] `disposables` 배열에 추가 (올바른 순서)
- [ ] TypeScript 컴파일 에러 없음
- [ ] 빌드 성공

---

### 🔷 Task 3.6: Week 3 통합 테스트
**분류**: 통합 작업  
**소요 시간**: 1시간  

**작업 내용**:
1. 노드 생성 후 수동 저장 테스트
2. 파일 불러오기 테스트
3. JSON 파일 수동 확인

**완료 기준 (Done Definition)**:
- [ ] `PersistenceManager.save()` 호출 → JSON 파일 생성 확인
- [ ] JSON 파일 열어서 형식 확인 (nodes, edges, metadata)
- [ ] `PersistenceManager.load()` 호출 → 상태 복원 확인
- [ ] 플러그인 재시작 후 상태 복원 확인
- [ ] 브라우저 콘솔에 에러 없음

---

## Week 4: 통합 및 안정화

### 🔷 Task 4.1: Renderer 초기화 순서 수정
**분류**: 기존 파일 수정  
**소요 시간**: 0.5시간  
**파일**: `src/views/NeroMindView.ts`

**작업 내용**:
NeroMindView.onOpen()에서 Renderer 생성 시 EventBus 전달

```typescript
async onOpen(): Promise<void> {
  const container = this.containerEl.children[1];
  container.empty();

  // SVG 캔버스 초기화
  this.initializeSVGCanvas(container);

  // Renderer 생성 (EventBus 전달)
  this.renderer = new Renderer(this.svgElement, this.plugin.getEventBus());
  this.plugin.registerDisposable(this.renderer);

  // ...
}
```

**완료 기준 (Done Definition)**:
- [ ] `Renderer` 생성자에 `EventBus` 전달
- [ ] `plugin.getEventBus()` 메서드 추가 (main.ts)
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 4.2: Disposable 체인 검증
**분류**: 통합 작업  
**소요 시간**: 1시간  

**작업 내용**:
1. 모든 레이어의 `destroy()` 메서드 구현 확인
2. 역순 destroy 순서 검증
3. 메모리 누수 테스트 (구독 해제 확인)

**완료 기준 (Done Definition)**:
- [ ] `EventBus.destroy()` 구현 확인
- [ ] `StateManager.destroy()` 구현 확인
- [ ] `HistoryManager.destroy()` 구현 확인
- [ ] `PersistenceManager.destroy()` 구현 확인
- [ ] `Renderer.destroy()` 구현 확인 (unsubscribe)
- [ ] 플러그인 언로드 시 에러 없음
- [ ] 브라우저 콘솔에 메모리 누수 경고 없음

---

### 🔷 Task 4.3: 에러 처리 강화
**분류**: 기존 파일 수정  
**소요 시간**: 1시간  

**작업 내용**:
각 레이어에 try-catch 추가 및 사용자 알림

**파일**:
- `src/persistence/PersistenceManager.ts`
- `src/history/HistoryManager.ts`

```typescript
// PersistenceManager
async save(options: SaveOptions = {}): Promise<void> {
  try {
    // ... 기존 코드
  } catch (error) {
    console.error('Save failed:', error);
    new Notice('저장에 실패했습니다.');
    throw error;
  }
}

// HistoryManager
undo(): StateSnapshot | null {
  try {
    // ... 기존 코드
  } catch (error) {
    console.error('Undo failed:', error);
    new Notice('되돌리기에 실패했습니다.');
    return null;
  }
}
```

**완료 기준 (Done Definition)**:
- [ ] `PersistenceManager.save()` 에러 처리 추가
- [ ] `PersistenceManager.load()` 에러 처리 추가
- [ ] `HistoryManager.execute()` 에러 처리 추가
- [ ] `HistoryManager.undo()` 에러 처리 추가
- [ ] 사용자 알림 (Notice) 추가
- [ ] TypeScript 컴파일 에러 없음

---

### 🔷 Task 4.4: 초기화 순서 문서화
**분류**: 문서 작성  
**소요 시간**: 0.5시간  
**파일**: `Dev_Log.md`

**작업 내용**:
초기화 순서 및 제약사항 문서화

```markdown
## Phase 3 초기화 순서

### 필수 초기화 순서:
1. EventBus 생성 (독립)
2. StateManager 생성 → setEventBus() 호출
3. HistoryManager 생성 (StateManager 전달)
4. PersistenceManager 생성 (StateManager, App 전달)
5. Renderer 생성 (SVGElement, EventBus 전달)

### Disposable 해제 순서 (역순):
1. Renderer
2. PersistenceManager
3. HistoryManager
4. StateManager
5. EventBus

### 제약사항:
- StateManager.setEventBus() 호출 전 emit() 시 에러 발생
- HistoryManager는 StateManager 래핑만 (직접 수정 금지)
- PersistenceManager는 getPersistentState() 통해서만 접근
```

**완료 기준 (Done Definition)**:
- [ ] 초기화 순서 문서 작성
- [ ] Disposable 해제 순서 문서 작성
- [ ] 제약사항 문서 작성
- [ ] Dev_Log.md에 추가

---

### 🔷 Task 4.5: Week 4 통합 시나리오 테스트
**분류**: 통합 작업  
**소요 시간**: 1.5시간  

**작업 내용**:
시나리오 기반 통합 테스트

**시나리오 1: 노드 생성 → 삭제 → Undo**
1. 노드 생성
2. 노드 삭제
3. Undo 호출
4. 노드 복원 확인

**시나리오 2: 저장 → 재시작 → 불러오기**
1. 노드 여러 개 생성
2. 수동 저장
3. 플러그인 재시작
4. 자동 불러오기
5. 상태 복원 확인

**완료 기준 (Done Definition)**:
- [ ] 시나리오 1 통과 (노드 생성/삭제/Undo)
- [ ] 시나리오 2 통과 (저장/재시작/불러오기)
- [ ] 모든 이벤트 발행/구독 정상 동작
- [ ] 에러 없이 완료

---

## Week 5: 검증 및 배포 준비

### 🔷 Task 5.1: Code Review 체크리스트
**분류**: 리뷰 작업  
**소요 시간**: 1시간  

**작업 내용**:
모든 Phase 3 코드 리뷰

**체크리스트**:
- [ ] 모든 Phase 2.5 주석 해결 여부 확인
- [ ] TypeScript 타입 안정성 검증 (any 사용 최소화)
- [ ] ESLint 규칙 준수 확인
- [ ] Prettier 포맷팅 확인
- [ ] 모든 파일에 주석 추가 (책임, 제약사항)
- [ ] import 순서 정리

**완료 기준 (Done Definition)**:
- [ ] 모든 파일 리뷰 완료
- [ ] 발견된 이슈 목록 작성
- [ ] 우선순위 높은 이슈 수정

---

### 🔷 Task 5.2: 성능 프로파일링
**분류**: 테스트 작업  
**소요 시간**: 1시간  

**작업 내용**:
성능 측정 및 병목 지점 식별

**측정 항목**:
- Command 실행 시간
- 이벤트 발행/구독 오버헤드
- 직렬화/역직렬화 시간
- Snapshot 생성 시간

**완료 기준 (Done Definition)**:
- [ ] 100개 노드 생성 < 100ms
- [ ] Command 실행 → 이벤트 발행 → 렌더링 < 16ms (60 FPS)
- [ ] 저장 (100 nodes) < 500ms
- [ ] 불러오기 (100 nodes) < 1000ms
- [ ] 병목 지점 문서화

---

### 🔷 Task 5.3: Phase 3 완료 체크포인트 문서 작성
**분류**: 문서 작업  
**소요 시간**: 1시간  
**파일**: `Dev_Log.md`

**작업 내용**:
Phase 3 완료 상태 문서화

```markdown
## Phase 3.0 완료 체크포인트 (2026-01-XX)

### ✅ 완료된 작업
- [ ] EventBus 구현 (Runtime validation)
- [ ] StateManager EventEmitter 통합
- [ ] Renderer 이벤트 구독
- [ ] HistoryManager 구현 (Inverse Operation)
- [ ] 3개 기본 Command 구현 (Create, Delete, Update)
- [ ] PersistenceManager 구현 (통합)
- [ ] 수동 저장/불러오기 기능

### 📊 성능 기준 달성
- [ ] 100개 노드 생성 < 100ms
- [ ] Command → Render < 16ms
- [ ] 저장/불러오기 < 1초

### 🐛 알려진 이슈
- 없음 (또는 이슈 목록)

### 📝 다음 단계 (Phase 3.1)
- Redo 기능 추가
- AutoSave 구현
- Enum 기반 Events 마이그레이션
```

**완료 기준 (Done Definition)**:
- [ ] 완료 작업 목록 작성
- [ ] 성능 기준 달성 여부 확인
- [ ] 알려진 이슈 목록 작성
- [ ] 다음 단계 계획 작성

---

### 🔷 Task 5.4: CHANGELOG 업데이트
**분류**: 문서 작업  
**소요 시간**: 0.5시간  
**파일**: `CHANGELOG.md` (신규 생성)

**작업 내용**:
```markdown
# Changelog

## [0.3.0] - 2026-01-XX

### Added
- EventBus 시스템 (타입 안전 이벤트 디스패치)
- HistoryManager (Undo 기능, Inverse Operation 패턴)
- 기본 Commands (CreateNode, DeleteNode, UpdateNode)
- PersistenceManager (JSON 저장/불러오기)
- Runtime event validation

### Changed
- StateManager에 EventEmitter 통합
- Renderer 이벤트 구독 방식으로 변경

### Fixed
- Phase 2.5 경고 해결 (DeleteNode의 엣지 제거)
```

**완료 기준 (Done Definition)**:
- [ ] CHANGELOG.md 파일 생성
- [ ] Added/Changed/Fixed 섹션 작성
- [ ] 버전 번호 확인 (0.3.0)

---

### 🔷 Task 5.5: 버전 번호 업데이트
**분류**: 기존 파일 수정  
**소요 시간**: 0.5시간  
**파일**: `manifest.json`, `package.json`

**작업 내용**:
```json
// manifest.json
{
  "id": "kk-neromind",
  "name": "KK-NeroMind",
  "version": "0.3.0",
  "minAppVersion": "0.15.0",
  "description": "Apple-style mindmap plugin with event-driven architecture",
  "author": "Nero-kk"
}

// package.json
{
  "name": "kk-neromind",
  "version": "0.3.0",
  "description": "KK-NeroMind Obsidian Plugin"
}
```

**완료 기준 (Done Definition)**:
- [ ] manifest.json 버전 업데이트
- [ ] package.json 버전 업데이트
- [ ] minAppVersion 확인
- [ ] 빌드 성공

---

### 🔷 Task 5.6: 최종 빌드 및 검증
**분류**: 빌드 작업  
**소요 시간**: 0.5시간  

**작업 내용**:
1. 최종 빌드
2. 빌드 파일 크기 확인
3. Obsidian에서 최종 테스트

**완료 기준 (Done Definition)**:
- [ ] `npm run build` 성공
- [ ] main.js 파일 크기 < 50KB
- [ ] Obsidian에서 플러그인 로드 성공
- [ ] 모든 기능 정상 동작
- [ ] 에러 없음

---

## 작업 요약

### 총 Task 수: 30개
### 예상 총 소요 시간: 30~40시간

### Week별 분류:
- **Week 1 (Event System)**: 7 Tasks, ~8시간
- **Week 2 (History System)**: 8 Tasks, ~9시간
- **Week 3 (Persistence)**: 6 Tasks, ~8시간
- **Week 4 (통합/안정화)**: 5 Tasks, ~6시간
- **Week 5 (검증/배포)**: 6 Tasks, ~5시간

### 파일 분류:
- **신규 파일 생성**: 15개
- **기존 파일 수정**: 10개
- **통합/테스트 작업**: 5개

---

## 다음 작업 (After Phase 3.0 MVP)

### Phase 3.1 추가 기능:
- [ ] Redo 기능 (redoStack 추가)
- [ ] AutoSave 구현 (3초 debounce)
- [ ] Enum 기반 Events 마이그레이션
- [ ] MoveNodeCommand 추가

### Phase 3.2 고도화:
- [ ] Functional Commands 패턴 도입
- [ ] Schema Validation (Ajv)
- [ ] StateContextBuilder (테스트 헬퍼)

---

**문서 끝**

**최종 업데이트**: 2026-01-12
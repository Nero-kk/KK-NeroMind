# KK-NeroMind

**Apple-Style Intelligent Mindmap for Obsidian**
_Based on Architecture v4.2.3_

## 🚀 Current Status: Phase 10 Complete

**Stable Build (v0.1.0) - TypeScript Type System Fixed**

This project has reached a major milestone with the completion of **Phase 10 (Visual Integration & Multi-Window Stability)**. All core infrastructure including rendering, state management, File-Node synchronization, and the settings system is now fully operational.

---

## 🛠️ Critical Technical Fixes (TS2322 & TS2740)

We have permanently resolved the persistent type mismatch errors in the renderer chain by enforcing a consistent interface across the entire system.

### 1. MindMapRenderer Interface (`src/rendering/MindMapRenderer.ts`)

The return type of `getSurfaceElement` was expanded to support both HTML and SVG backends.

```typescript
// BEFORE: Invalid for SVG backends
getSurfaceElement?(): HTMLElement | null;

// AFTER: Supports SVGSVGElement (SVG) and HTMLCanvasElement (Canvas)
getSurfaceElement?(): Element | null;
```

### 2. DomRenderer Implementation (`src/rendering/DomRenderer.ts`)

Updated the implementation to return `SVGSVGElement` correctly.

```typescript
// Implements MindMapRenderer interface
getSurfaceElement(): Element | null {
    return this.svgElement; // Returns SVGSVGElement
}
```

### 3. NeroMindView Integration (`src/views/NeroMindView.ts`)

Relaxed the property type to accept the generic `Element` type, resolving the assignment error.

```typescript
// Phase 10 Fix: Relaxed type from HTMLElement to Element
private renderSurfaceEl: Element | null = null;

// Assignment now works perfectly via type inference
this.renderSurfaceEl = this.renderer.getSurfaceElement?.() ?? this.mindmapContainerEl;
```

---

## ✨ Key Features (Phase 9 & 10)

### 1. Visual Customization System

- **Real-time Style Updates**: Change colors, blur strength, and line thickness instantly without reloading.
- **Glassmorphism Engine**: Configurable `backdrop-filter` blur (0-20px).
- **Edge Rendering**: Switch between Bezier curves and Straight lines.

### 2. Advanced Conflict Management

- **Timestamp Tracking**: Tracks `lastSyncTime` for every node to detect external file modifications.
- **Conflict Guard**: Prevents overwriting local changes if the external file has been modified more recently.
- **Conflict UI**: Emits `CONFLICT_DETECTED` events to trigger warning icons (Phase 9).

### 3. Multi-Window Stability

- **DPI Awareness**: Automatically detects window movement between monitors (e.g., Retina to Standard display).
- **Resize Observer**: Re-renders coordinates instantly when the view container resizes or zooms.
- **Independent Camera**: Each view maintains its own camera state (pan/zoom level).

---

## 🗺️ Roadmap & Progress

### ✅ Completed

- **Phase 1**: Core Infrastructure & EventBus
- **Phase 2**: Node Operations (CRUD)
- **Phase 3**: History Manager (Undo/Redo)
- **Phase 4**: Bidirectional File Sync (Node ↔ MD File)
- **Phase 5**: Content Body Sync
- **Phase 8**: Keyboard Navigation & Search
- **Phase 9**: Persistent Settings & Conflict Logic
- **Phase 10**: Visual Integration & Stability

### 🔄 In Progress / Next Steps

- **Drag & Drop Support**: Implement physical node dragging in `InteractionManager` (Phase 7).
- **Canvas Rendering Backend**: Complete the HTML5 Canvas renderer for high-performance mode.
- **Performance Optimization**: Virtual scrolling for large maps (>1000 nodes).

---

## 🏗️ Architecture

Adheres strictly to **KK-NeroMind Architecture v4.2.3**:

- **Unidirectional Data Flow**: Action → Command → State → Event → Renderer.
- **Disposable Pattern**: Strict cleanup of all observers and listeners on view close.
- **Type Safety**: Full TypeScript strict mode compliance.

### How to Build

```bash
npm install
npm run build
```

---

<<<<<<< HEAD
1. Open Obsidian Settings
2. Go to Community Plugins
3. Click "Reload" button
4. Enable "KK-NeroMind"
5. Click the brain icon in left sidebar

### Architecture

Based on **Architecture v4.0** design document:
- **Disposable Pattern**: All components implement destroy()
- **State Management**: PersistentState (Undo) vs EphemeralState
- **Rendering Pipeline**: Renderer → NodeFactory → EdgeFactory
- **Apple Style**: Glassmorphism, SF Pro Text font, blur effects

### Development Phases

- ✅ **Phase 1**: Core Infrastructure
- ✅ **Phase 2**: StateManager Snapshot Pattern
- ✅ **Phase 3**: HistoryManager & Undo/Redo
- ✅ **Phase 4**: Layout System & Command Pattern
- ✅ **Phase 5**: Drag Interaction & Node Rendering
- ✅ **Phase 6.1**: Coordinate System Fix & Initial Layout Optimization
- 🔄 **Phase 6+**: Advanced Features (Next)

---

## Phase 4.x: Layout System & Command Pattern ✅

### 구현 완료 파일

```
src/
├── layout/
│   └── CenterRootLayout.ts          ✅ 중앙 루트 + 좌우 분기 레이아웃
├── history/
│   ├── MoveNodeCommand.ts           ✅ 노드 이동 Command
│   ├── SelectNodeCommand.ts         ✅ 노드 선택 Command (수정)
│   └── ClearSelectionCommand.ts     ✅ 선택 해제 Command
├── state/
│   └── StateManager.ts              ✅ selectNode, clearSelection, moveNode 추가
└── types/
    └── index.ts                     ✅ PersistentState.ui 추가
```

### 핵심 함수 및 로직

#### 1. CenterRootLayout.ts

**computeCenterRootLayout(nodes, viewport)**
- 입력: `MindMapNode[]`, `{ width, height }`
- 출력: `Record<NodeId, { x: number; y: number }>`
- 알고리즘:
  1. Root 노드를 viewport 중앙에 배치
  2. Depth 1 자식들을 좌우 교차 배치 (짝수: 우측, 홀수: 좌측)
  3. 각 subtree를 재귀적으로 배치 (부모와 같은 side 유지)
- 시간 복잡도: **O(n)**
- 순수 함수 (side-effect 없음)

#### 2. MoveNodeCommand.ts

**execute(context: StateContext)**
```typescript
// 노드 위치를 to로 이동
node.position.x = this.to.x;
node.position.y = this.to.y;
node.updatedAt = Date.now();
```

**undo(context: StateContext)**
```typescript
// 노드 위치를 from으로 복원
node.position.x = this.from.x;
node.position.y = this.from.y;
node.updatedAt = Date.now();
```

- from/to 좌표는 생성자에서 확정 (immutable)
- Inverse Operation 패턴
- StateManager.moveNode()이 현재 위치를 자동 캡처

#### 3. SelectNodeCommand.ts (수정)

**주요 변경: ephemeral → persistent.ui**
```typescript
// BEFORE: context.ephemeral.selectedNodeId
// AFTER: context.persistent.ui.selectedNodeId
```

**execute(context: StateContext)**
```typescript
// 이전 값 저장 (undo용)
if (this.isFirstExecution) {
    this.previousNodeId = context.persistent.ui.selectedNodeId;
    this.isFirstExecution = false;
}

// lastSelectedNodeId 업데이트 (ephemeral, Undo 비대상)
if (context.persistent.ui.selectedNodeId !== null) {
    context.ephemeral.lastSelectedNodeId = context.persistent.ui.selectedNodeId;
}

// 새 선택 상태 설정 (persistent, Undo 대상)
context.persistent.ui.selectedNodeId = this.newNodeId;
```

**undo(context: StateContext)**
```typescript
context.persistent.ui.selectedNodeId = this.previousNodeId;
```

- selectedNodeId가 Undo/Redo 대상이 됨
- persistentState.ui.selectedNodeId로 관리

#### 4. ClearSelectionCommand.ts

**execute(context: StateContext)**
```typescript
// 이전 값 저장
if (this.isFirstExecution) {
    this.previousNodeId = context.persistent.ui.selectedNodeId;
    this.isFirstExecution = false;
}

// 선택 해제
context.persistent.ui.selectedNodeId = null;
```

**undo(context: StateContext)**
```typescript
context.persistent.ui.selectedNodeId = this.previousNodeId;
```

- SelectNodeCommand(null)과 의미적으로 구분
- Canvas background 클릭 시 사용

#### 5. StateManager.ts

**selectNode(nodeId: NodeId | null)**
```typescript
const { SelectNodeCommand } = require('../history/SelectNodeCommand');
const command = new SelectNodeCommand(nodeId);
this.apply(command);
```

**clearSelection()**
```typescript
const { ClearSelectionCommand } = require('../history/ClearSelectionCommand');
const command = new ClearSelectionCommand();
this.apply(command);
```

**moveNode(nodeId: NodeId, toX: number, toY: number)**
```typescript
// 현재 위치 캡처 (undo용)
const node = this.persistentState.graph.nodes.get(nodeId);
const from = { x: node.position.x, y: node.position.y };
const to = { x: toX, y: toY };

// MoveNodeCommand 생성 후 apply()
const { MoveNodeCommand } = require('../history/MoveNodeCommand');
const command = new MoveNodeCommand(nodeId, from, to);
this.apply(command);
```

- 모든 상태 변경은 Command 패턴을 통해서만 수행
- 직접 state 수정 금지

---

## Phase 5: Drag Interaction & Node Rendering ✅

### 구현 완료 파일

```
src/
└── rendering/
    └── Renderer.ts                  ✅ Drag 이벤트, Rounded-rect 노드
```

### 핵심 함수 및 로직

#### 1. Drag → MoveNodeCommand 연결

**handlePointerDown(e, nodeId, nodePosition)**
```typescript
// 1. 노드 선택 (Command 패턴)
if (this.stateManager) {
    this.stateManager.selectNode(nodeId);
}

// 2. 드래그 상태 설정
this.draggingNodeId = nodeId;
this.dragStartPosition = { x: nodePosition.x, y: nodePosition.y };

// 3. dragOffset 계산 (포인터 - 노드 위치)
const svgP = pt.matrixTransform(this.svgElement.getScreenCTM()?.inverse());
this.dragOffset = {
    x: svgP.x - nodePosition.x,
    y: svgP.y - nodePosition.y,
};

// 4. 전역 리스너 등록
document.addEventListener('pointermove', this.handlePointerMove);
document.addEventListener('pointerup', this.handlePointerUp);

// 5. cursor 변경
document.body.style.cursor = 'grabbing';
```

**handlePointerMove(e)**
```typescript
// 포인터 위치 계산
const newX = svgP.x - this.dragOffset.x;
const newY = svgP.y - this.dragOffset.y;

// DOM transform만 변경 (state 변경 없음)
nodeGroup.setAttribute('transform', `translate(${newX}, ${newY})`);
```

**핵심: StateManager 호출 ❌, Command 생성 ❌**

**handlePointerUp(e)**
```typescript
// 최종 위치 계산
const finalX = svgP.x - this.dragOffset.x;
const finalY = svgP.y - this.dragOffset.y;

// StateManager.moveNode() 호출 (단 1회 Command 생성)
// ★ MoveNodeCommand 생성 지점 ★
if (this.stateManager) {
    this.stateManager.moveNode(this.draggingNodeId, finalX, finalY);
}

// 드래그 상태 초기화
this.draggingNodeId = null;
// 전역 리스너 제거
document.removeEventListener('pointermove', this.handlePointerMove);
document.removeEventListener('pointerup', this.handlePointerUp);
```

**핵심: pointerup에서만 Command 생성**

#### 2. CenterRootLayout 연결

**render(snapshot: StateSnapshot)**
```typescript
// 1. viewport 측정
const rect = this.svgElement.getBoundingClientRect();
const viewport = { width: rect.width || 800, height: rect.height || 600 };

// 2. CenterRootLayout 계산 (단일 기준)
// snapshot.nodes.position은 무시됨
const layout = computeCenterRootLayout(Array.from(snapshot.nodes), viewport);

// 3. 엣지 먼저 렌더링 (뒤에 그려짐)
this.renderEdges(snapshot, layout);

// 4. 노드 나중에 렌더링 (앞에 그려짐)
this.renderNodes(snapshot, layout);
```

**renderEdges(snapshot, layout)**
```typescript
for (const node of snapshot.nodes) {
    if (node.parentId !== null) {
        const parentPosition = layout[node.parentId];  // layout에서 참조
        const nodePosition = layout[node.id];
        if (parentPosition && nodePosition) {
            const line = this.createLine(parentPosition, nodePosition);
            edgeLayer.appendChild(line);
        }
    }
}
```

**renderNodes(snapshot, layout)**
```typescript
for (const node of snapshot.nodes) {
    const position = layout[node.id];  // layout에서 참조
    if (!position) continue;

    const nodeGroup = this.createNodeGroup(node.id, position.x, position.y);
    const rect = this.createRect(node.content, isSelected, isDragging);
    const text = this.createText(node.content);

    nodeGroup.addEventListener('pointerdown', (e) =>
        this.handlePointerDown(e, node.id, position)  // layout 좌표 전달
    );

    nodeGroup.appendChild(rect);
    nodeGroup.appendChild(text);
    nodeLayer.appendChild(nodeGroup);
}
```

**핵심: snapshot.nodes.position 완전히 무시, layout이 단일 기준**

#### 3. Rounded-rect 노드 렌더링

**createRect(content, isSelected, isDragging)**
```typescript
// 텍스트 너비 추정
const textWidth = this.estimateTextWidth(content);
const padding = 24; // 좌우 패딩
const width = Math.max(80, textWidth + padding);
const height = 36;

const rect = document.createElementNS(SVG_NS, 'rect');
rect.setAttribute('x', String(-width / 2));  // 중심 기준
rect.setAttribute('y', String(-height / 2)); // 중심 기준
rect.setAttribute('width', String(width));
rect.setAttribute('height', String(height));
rect.setAttribute('rx', '10');
rect.setAttribute('ry', '10');
rect.setAttribute('fill', '#ffffff');

if (isSelected) {
    rect.setAttribute('stroke', 'rgba(0, 122, 255, 1)');
    rect.setAttribute('stroke-width', '3');
} else {
    rect.setAttribute('stroke', '#d0d0d0');
    rect.setAttribute('stroke-width', '1.5');
}

if (isDragging) {
    rect.setAttribute('opacity', '0.85');
}

return rect;
```

**estimateTextWidth(text)**
```typescript
const avgCharWidth = 8; // font-size 12 기준 평균 너비
return text.length * avgCharWidth;
```

**핵심:**
- Circle → Rect 변경
- 텍스트 길이에 따라 가로 크기 자동 조정
- min-width: 80px, height: 36px (고정)
- rx/ry: 10px (rounded corners)
- 중심 기준 좌표: x = -width/2, y = -height/2

#### 4. Canvas Background 클릭 핸들러

**setupCanvasBackgroundHandler()**
```typescript
this.svgElement.addEventListener('pointerdown', (e) => {
    const target = e.target as SVGElement;
    if (target === this.svgElement || target.id === 'transform-layer') {
        // 선택 해제 (Command 패턴)
        if (this.stateManager) {
            this.stateManager.clearSelection();
        }
    }
});
```

**핵심: SVG 빈 공간 클릭 시 ClearSelectionCommand 실행**

### State Type 변경

#### PersistentState.ui 추가

```typescript
export interface PersistentState {
    schemaVersion: number;
    graph: NodeGraph;
    layout: LayoutData;
    settings: UserSettings;
    pinnedNodes: Set<NodeId>;
    ui: UIState; // Phase 5.1: 선택 상태 등 Undo 대상 UI 상태
}

export interface UIState {
    selectedNodeId: NodeId | null; // 선택된 노드 ID
}
```

**핵심: selectedNodeId가 persistent state로 이동 → Undo/Redo 대상**

### Drag 중 선택 유지 정책

```
1. pointerdown (node-A)
   → SelectNodeCommand('node-A') 실행
   → selectedNodeId = 'node-A'
   → draggingNodeId = 'node-A'

2. pointermove (drag 중)
   → selectedNodeId = 'node-A' 유지
   → DOM transform만 변경 (state 변경 없음)

3. pointerup (drag 완료)
   → MoveNodeCommand 생성
   → selectedNodeId = 'node-A' 유지

4. canvas background 클릭
   → ClearSelectionCommand 실행
   → selectedNodeId = null
```

**핵심: Drag는 선택 상태에 영향을 주지 않음, 명시적 해제만 가능**

---

## Phase 6.1: 좌표계 불일치 해결 및 초기 배치 최적화 ✅

### 문제 진단

- 초기 로딩 시 루트 노드가 중앙이 아님
- 화면 resize 시 루트 노드 위치가 상대적으로 이동
- y축 하단 약 2/3 지점에서 노드가 사라짐 (clip 현상)

### 원인 분석

1. **viewBox 좌표계 vs DOM 좌표계 불일치**
   - `getViewportSize()`가 viewBox 좌표계를 우선 반환
   - viewBox의 "중앙"과 사용자가 보는 DOM viewport의 "시각적 중앙"이 불일치

2. **render() 호출마다 viewport 재계산**
   - 매 렌더링마다 viewport 크기를 다시 계산
   - resize 시 노드의 절대 위치가 변경됨

3. **SVG overflow 미설정**
   - 기본값 `overflow: hidden` 적용
   - viewBox 영역 밖의 노드가 clip됨

### 구현 완료 파일

```
src/
├── rendering/
│   └── Renderer.ts                  ✅ viewport 캐싱, 좌표계 일치
└── views/
    └── NeroMindView.ts              ✅ overflow 설정, viewBox 제거
```

### 핵심 함수 및 로직

#### 1. Renderer.ts - 초기 viewport 캐싱

**initialViewport 필드 추가**
```typescript
private initialViewport: { width: number; height: number } | null = null;
```

**render(snapshot: StateSnapshot) - 수정**
```typescript
// 초기 1회만 viewport 계산
if (this.initialViewport === null) {
    this.initialViewport = this.getViewportSize();
    console.log('[Renderer.render] 🎯 초기 viewport 캐싱 (1회만):', this.initialViewport);
}

// 항상 초기 viewport 기준으로 layout 계산
const layout = computeCenterRootLayout(snapshot.nodes, this.initialViewport);
```

**핵심:**
- 플러그인 최초 로딩 시 1회만 viewport 크기 계산
- 이후 resize/pan/zoom 시 viewport 재계산 금지
- 노드의 절대 위치를 고정하여 transform-layer만 변경

**getViewportSize() - 수정**
```typescript
private getViewportSize(): { width: number; height: number } {
    // viewBox 읽기 로직 완전 제거
    // 항상 DOM 좌표계 기준 사용
    const rect = this.svgElement.getBoundingClientRect();
    return {
        width: rect.width || 800,  // fallback: 800px
        height: rect.height || 600, // fallback: 600px
    };
}
```

**핵심:**
- viewBox 우선 읽기 로직 제거
- 항상 `getBoundingClientRect()` 사용 (DOM 좌표계 기준)
- viewBox 좌표계와 DOM viewport 좌표계를 일치시킴

#### 2. NeroMindView.ts - SVG 설정 수정

**initializeSVGCanvas() - 수정**
```typescript
// overflow: visible 설정 추가 (y축 하단 clip 방지)
this.svgElement.style.overflow = 'visible';

// viewBox 제거 (DOM 좌표계와 1:1 매칭)
// 이전: this.svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
// 이후: 완전 제거
```

**핵심:**
- `overflow: visible` 설정으로 clip 현상 제거
- viewBox 제거하여 SVG 좌표계 = DOM 좌표계로 일치
- 좌표계 불일치 원인 근본 해결

**renderWelcomeMessage() - 수정**
```typescript
// viewBox 읽기 로직 제거
// 이전: viewBoxAttr.split() → width/2, height/2
// 이후: getBoundingClientRect() 사용

const boundingRect = this.svgElement.getBoundingClientRect();
const centerX = boundingRect.width / 2 || 400;
const centerY = boundingRect.height / 2 || 300;
```

**initializeStateManagement() - 수정**
```typescript
// Renderer에 StateManager 주입
if (this.svgElement) {
    this.renderer = new Renderer(this.svgElement);
    this.renderer.setStateManager(this.stateManager); // ← 추가
    this.addDisposable(this.renderer);
}
```

**핵심:**
- 드래그 기능 완성 (setStateManager 호출)
- Renderer와 동일한 좌표계 사용 (getBoundingClientRect)

### 동작 흐름

```
┌─────────────────────────────────────┐
│ 플러그인 최초 로딩                    │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ NeroMindView.initializeSVGCanvas()  │
│ - overflow: visible 설정             │
│ - viewBox 제거                       │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Renderer.render() - 첫 호출          │
│ - initialViewport === null 확인      │
│ - getViewportSize() 호출 (1회만)    │
│ - initialViewport 캐싱 ✅            │
│ - CenterRootLayout 계산              │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ 이후 모든 render() 호출              │
│ - initialViewport 재사용             │
│ - viewport 재계산 SKIP ❌            │
│ - 노드 절대 위치 유지 ✅              │
└─────────────────────────────────────┘
```

### 해결된 문제

| 문제 | 원인 | 해결 방법 |
|------|------|----------|
| 루트 노드가 중앙이 아님 | viewBox 좌표계 ≠ DOM 좌표계 | viewBox 제거, DOM 좌표계로 일치 |
| resize 시 노드 위치 변경 | render()마다 viewport 재계산 | initialViewport 캐싱 (1회만 계산) |
| y축 하단 노드 clip | overflow: hidden (기본값) | overflow: visible 명시 설정 |

---

## 다음 구현 예정 (Phase 6+)

### 우선순위 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| NodeTextLayout.ts | 🔄 다음 | 텍스트 측정 및 노드 크기 계산 모듈 |
| 노드 생성 UI | 🔄 다음 | 더블클릭/단축키로 노드 생성 |
| 베지어 곡선 Edge | ⏳ 대기 | 직선 → 베지어 곡선 변경 |
| 노드 삭제 | ⏳ 대기 | DeleteNodeCommand 구현 |
| 노드 편집 | ⏳ 대기 | 인라인 텍스트 편집 |
| Minimap | ⏳ 대기 | 전체 마인드맵 미니맵 |
| Zoom/Pan | ⏳ 대기 | 뷰포트 확대/축소/이동 |
| 파일 저장/로드 | ⏳ 대기 | JSON 직렬화/역직렬화 |

### Author

Nero-kk

### License

MIT
=======
**Author**: Nero-kk
**Repository**: [GitHub](https://github.com/Nero-kk)
**Blog**: [Nero's Tech Blog](http://nero-k.tistory.com)
>>>>>>> 716aaf29f214722774332272c3eb53176c7e4546

# KK-NeroMind

Intelligent mind map plugin for Obsidian based on A.C.E Framework.

## Author

**Nero-kk**

- GitHub: [https://github.com/Nero-kk](https://github.com/Nero-kk)
- YouTube: [https://www.youtube.com/@Nero-kk](https://www.youtube.com/@Nero-kk)
- Buy Me a Coffee: [https://buymeacoffee.com/nerokk](https://buymeacoffee.com/nerokk)

---

## 프로젝트 개요

NeroMind는 Obsidian 내에서 마인드맵을 생성하고 관리할 수 있는 플러그인입니다. React Flow를 기반으로 무한 캔버스 위에 노드를 배치하고, 키보드 단축키로 빠르게 아이디어를 정리할 수 있습니다.

---

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| React | ^18.2.0 | UI 프레임워크 |
| @xyflow/react | ^12.x | 노드 기반 캔버스 (React Flow v12) |
| TailwindCSS | ^3.4.0 | 스타일링 |
| Lucide React | ^0.303.0 | 아이콘 |
| TypeScript | ^5.3.3 | 타입 시스템 |

---

## 프로젝트 구조

```
kk-neromind/
├── src/
│   ├── main.ts                    # Obsidian 플러그인 진입점
│   ├── components/
│   │   ├── index.ts               # 컴포넌트 export
│   │   ├── NeroMindCanvas.tsx     # 메인 컨테이너 (상태 관리)
│   │   ├── Canvas.tsx             # React Flow 캔버스 (핵심 로직)
│   │   ├── MindMapNode.tsx        # 커스텀 노드 컴포넌트
│   │   ├── MindMapEdge.tsx        # 커스텀 엣지 컴포넌트
│   │   ├── Toolbar.tsx            # 상단 툴바
│   │   └── ToolbarButton.tsx      # 툴바 버튼
│   ├── types/
│   │   ├── index.ts
│   │   └── mindmap.ts             # 타입 정의
│   ├── utils/
│   │   ├── index.ts
│   │   └── mindmap-utils.ts       # 유틸리티 함수
│   ├── views/
│   │   └── NeroMindView.ts        # Obsidian View
│   └── styles/
│       └── input.css              # Tailwind 입력 CSS
├── styles.css                      # 빌드된 CSS
├── main.js                         # 빌드된 JS
├── manifest.json
├── package.json
└── README.md
```

---

## Phase 1 완료 (UI 뼈대)

- [x] Obsidian 플러그인 기본 구조
- [x] React + TypeScript 설정
- [x] TailwindCSS 설정 (`nm-` prefix)
- [x] 상단 Toolbar UI
- [x] 빈 캔버스 화면

---

## Phase 2 구현 현황

### 구현된 기능

| 기능 | 상태 | 파일 | 함수/로직 |
|------|------|------|----------|
| 캔버스 더블클릭으로 노드 생성 | ✅ 동작 | `Canvas.tsx` | `handlePaneDoubleClick()` |
| Tab 키로 자식 노드 생성 | ⚠️ 부분 | `Canvas.tsx` | `addChildNode()` |
| Enter 키로 형제 노드 생성 | ⚠️ 부분 | `Canvas.tsx` | `addSiblingNode()` |
| Glassmorphism 노드 스타일 | ✅ 동작 | `MindMapNode.tsx` | inline style |

### 미해결 문제 (2024-01-07 기준)

| 문제 | 상태 | 관련 파일 | 원인 분석 |
|------|------|----------|----------|
| **노드 선택 안됨** | ❌ | `Canvas.tsx` | `onNodesChange` 또는 selection 로직 문제 |
| **연결선(Edge) 안 보임** | ❌ | `Canvas.tsx`, `mindmap-utils.ts` | `setEdges` 호출은 되나 렌더링 안됨 |
| **자식 노드 위치 랜덤** | ❌ | `mindmap-utils.ts` | `calculateChildPosition()` 로직 확인 필요 |
| **Space 편집모드 안됨** | ❌ | `Canvas.tsx` | `startEditingNode()` 호출 안됨 |
| **노드 드래그 안됨** | ❌ | `Canvas.tsx` | `nodesDraggable` prop 동작 안함 |
| **Controls/MiniMap 위치** | ❌ | `Canvas.tsx` | `position` prop 무시됨 (좌측 상단에 모여있음) |

---

## 핵심 함수 및 로직 설명

### 1. `Canvas.tsx` - 메인 캔버스 컴포넌트

#### 상태 관리
```typescript
const [nodes, setNodes, onNodesChange] = useNodesState<MindMapNode>(externalNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState<MindMapEdge>([]);
```
- `useNodesState`: React Flow의 노드 상태 훅
- `useEdgesState`: React Flow의 엣지 상태 훅
- **문제점**: 노드 선택 상태가 `onNodesChange`를 통해 업데이트되어야 하는데 동작 안함

#### `handlePaneDoubleClick()` - 캔버스 더블클릭으로 노드 생성
```typescript
const handlePaneDoubleClick = useCallback((event: React.MouseEvent) => {
  const position = reactFlowInstance.current.screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });
  const newNode = createNode({ position, label: 'New Idea', level: 0, parentId: null });
  setNodes((nds) => [...nds, newNode].map((n) => ({ ...n, selected: n.id === newNode.id })));
}, [setNodes]);
```
- **동작**: 클릭 위치를 Flow 좌표로 변환하여 노드 생성
- **상태**: ✅ 동작함

#### `addChildNode()` - Tab 키로 자식 노드 생성
```typescript
const addChildNode = useCallback(() => {
  if (!selectedNodeId) return;  // 선택된 노드 없으면 리턴

  const parentNode = findNodeById(selectedNodeId, nodes);
  const existingChildren = getChildNodes(selectedNodeId, nodes);
  const position = calculateChildPosition(parentNode, existingChildren);

  const newNode = createNode({
    position,
    label: 'New Node',
    level: parentNode.data.level + 1,
    parentId: selectedNodeId,
  });

  const newEdge = createEdge(selectedNodeId, newNode.id);

  setNodes((nds) => [...nds, newNode].map((n) => ({ ...n, selected: n.id === newNode.id })));
  setEdges((eds) => [...eds, newEdge]);
}, [selectedNodeId, nodes, setNodes, setEdges]);
```
- **문제점 1**: `selectedNodeId`가 항상 null (노드 선택이 안되기 때문)
- **문제점 2**: `setEdges`는 호출되나 엣지가 화면에 안 보임
- **문제점 3**: `calculateChildPosition()`의 좌표 계산이 부정확

#### `addSiblingNode()` - Enter 키로 형제 노드 생성
```typescript
const addSiblingNode = useCallback(() => {
  if (!selectedNodeId) return;

  const currentNode = findNodeById(selectedNodeId, nodes);
  if (!currentNode || !currentNode.data.parentId) {
    addChildNode();  // 루트 노드면 자식으로 생성
    return;
  }

  const parentId = currentNode.data.parentId;
  const siblings = getSiblingNodes(currentNode, nodes);
  const position = calculateSiblingPosition(currentNode, siblings);

  const newNode = createNode({ position, label: 'New Node', level: currentNode.data.level, parentId });
  const newEdge = createEdge(parentId, newNode.id);

  setNodes((nds) => [...nds, newNode].map((n) => ({ ...n, selected: n.id === newNode.id })));
  setEdges((eds) => [...eds, newEdge]);
}, [selectedNodeId, nodes, setNodes, setEdges, addChildNode]);
```
- **문제점**: `selectedNodeId` null 문제로 루트 노드가 아닌 경우 동작 안함

#### `startEditingNode()` - Space 키로 편집 모드
```typescript
const startEditingNode = useCallback(() => {
  if (!selectedNodeId) return;
  setNodes((nds) => setNodeEditing(selectedNodeId, true, nds));
}, [selectedNodeId, setNodes]);
```
- **문제점**: `selectedNodeId`가 null이라 항상 early return

#### 키보드 이벤트 핸들러
```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    const wrapper = reactFlowWrapper.current;
    if (!wrapper) return;

    const target = event.target as HTMLElement;
    if (!wrapper.contains(target)) return;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    switch (event.key) {
      case 'Tab': addChildNode(); break;
      case 'Enter': addSiblingNode(); break;
      case 'Delete':
      case 'Backspace': deleteSelectedNode(); break;
      case ' ': startEditingNode(); break;
    }
  };

  document.addEventListener('keydown', handleKeyDown, true);  // capture phase
  return () => document.removeEventListener('keydown', handleKeyDown, true);
}, [addChildNode, addSiblingNode, deleteSelectedNode, startEditingNode]);
```
- **변경사항**: wrapper 레벨에서 document 레벨로 변경, capture phase 사용
- **문제점**: 이벤트는 잡히나 `selectedNodeId`가 null

#### 선택된 노드 ID 계산
```typescript
const selectedNodeId = useMemo(() => {
  const selectedNode = nodes.find((n) => n.selected);
  return selectedNode?.id || null;
}, [nodes]);
```
- **문제점**: `n.selected`가 항상 false (React Flow의 selection이 동작 안함)

---

### 2. `MindMapNode.tsx` - 커스텀 노드 컴포넌트

```typescript
export const MindMapNode: React.FC<MindMapNodeComponentProps> = memo(({ id, data, selected, dragging }) => {
  // ...
});
```

#### Props
- `id`: 노드 고유 ID (React Flow에서 전달)
- `data`: `MindMapNodeData` (label, parentId, level, isEditing)
- `selected`: 선택 상태 (React Flow에서 전달) - **항상 false**
- `dragging`: 드래그 중 상태 (React Flow에서 전달) - **항상 false**

#### Glassmorphism 스타일
```typescript
style={{
  background: `linear-gradient(135deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.1) 100%)`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `1px solid rgba(255, 255, 255, 0.3)`,
  boxShadow: selected
    ? `0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 2px ${levelColor}`
    : `0 4px 16px rgba(0, 0, 0, 0.1)`,
}}
```

---

### 3. `mindmap-utils.ts` - 유틸리티 함수

#### `createNode()` - 노드 생성
```typescript
export const createNode = (options: CreateNodeOptions): MindMapNode => {
  const id = generateId();
  return {
    id,
    type: 'mindmap',
    position: options.position,
    data: {
      label: options.label || 'New Node',
      parentId: options.parentId || null,
      level: options.level ?? 0,
      isEditing: true,
    },
  };
};
```

#### `createEdge()` - 엣지 생성
```typescript
export const createEdge = (sourceId: string, targetId: string): MindMapEdge => {
  return {
    id: `edge-${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    type: 'smoothstep',
    style: { stroke: 'rgba(99, 102, 241, 0.6)', strokeWidth: 2 },
  };
};
```

#### `calculateChildPosition()` - 자식 노드 위치 계산
```typescript
export const calculateChildPosition = (
  parentNode: MindMapNode,
  existingChildren: MindMapNode[]
): NodePosition => {
  const childX = parentNode.position.x + NODE_WIDTH + HORIZONTAL_SPACING;  // +360
  if (existingChildren.length === 0) {
    return { x: childX, y: parentNode.position.y };
  }
  const lowestY = Math.max(...existingChildren.map((c) => c.position.y));
  return { x: childX, y: lowestY + VERTICAL_SPACING };
};
```

#### 상수값
```typescript
export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 44;
export const HORIZONTAL_SPACING = 200;
export const VERTICAL_SPACING = 80;
```

---

## 앞으로 해결해야 할 문제

### 우선순위 1: 핵심 기능 수정 (Critical)

1. **노드 선택 문제 해결**
   - `onNodeClick` 콜백 추가하여 직접 selection 처리
   - 또는 `onSelectionChange` 훅 사용

2. **엣지 렌더링 문제 해결**
   - console.log로 edges 배열 상태 확인
   - edge type을 'default'로 변경하여 테스트

3. **자식 노드 위치 계산 수정**
   - `parentNode.position` 값 디버깅
   - `findNodeById`가 올바른 노드 반환하는지 확인

### 우선순위 2: UI/UX 개선 (High)

4. **Space 키 편집 모드 동작** - 노드 선택 해결 후 자동 해결
5. **노드 드래그 활성화** - `onNodeDrag` 콜백 추가
6. **Controls/MiniMap 위치 수정** - CSS 또는 Panel 컴포넌트 사용

---

## 빌드 명령어

```bash
npm run build      # JavaScript 빌드
npm run build:css  # CSS 빌드
npm run dev        # 개발 모드 (watch)
```

---

## 다음 작업 체크리스트

### 필수 (Must Have)
- [ ] 노드 클릭 시 선택 상태 업데이트
- [ ] 엣지 렌더링 디버깅 및 수정
- [ ] 자식 노드 위치 계산 로직 수정

### 중요 (Should Have)
- [ ] Space 키 편집 모드 동작
- [ ] 노드 드래그 이동 활성화
- [ ] Controls 좌측 하단 배치
- [ ] MiniMap 우측 하단 배치

### 선택 (Nice to Have)
- [ ] Delete 키 노드 삭제
- [ ] 노드 더블클릭 편집 모드
- [ ] Auto Arrange 기능
- [ ] 파일 저장/불러오기

---

## License

MIT

---

Made with ❤️ by [Nero-kk](https://github.com/Nero-kk)

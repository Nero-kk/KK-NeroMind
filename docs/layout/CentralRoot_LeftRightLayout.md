## 1️⃣ 중앙 루트 + 좌우 분기 레이아웃 알고리즘
### 목적
- 중앙에 Root 노드를 고정 배치
- 자식 노드를 좌/우로 분기 배치
- Renderer와 분리된 순수 레이아웃 알고리즘 정의

### 입력

```ts
nodes: MindMapNode[] // parentId 관계 포함
viewport: { width: number; height: number }
```
---

### 출력

```ts
Record<NodeId, { x: number; y: number }>
```

---

### 핵심 규칙

- root: parentId === null
- root.x = viewportCenterX
- root.y = viewportCenterY
- 첫 번째 depth 자식부터 좌/우 교차 배치
- 왼쪽 가지: x 감소
- 오른쪽 가지: x 증가
- y는 sibling index 기준으로 일정 간격 배치

### 좌/우 분기 결정 규칙

```ts
index % 2 === 0 → right
index % 2 === 1 → left
```

### 간격 상수 (예시)

```ts
const HORIZONTAL_GAP = 220;
const VERTICAL_GAP = 90;
```

### 레이아웃 계산 의사코드

```ts
function layout(nodes, viewport) {
  root = find node where parentId === null
  set root at center

  children = getChildren(root)

  for each child with index i:
    side = i % 2 === 0 ? 'right' : 'left'
    x = root.x + (side === 'right' ? HORIZONTAL_GAP : -HORIZONTAL_GAP)
    y = root.y + (i * VERTICAL_GAP)

    layoutSubtree(child, x, y, side)
}
```


### 비고
- 이 알고리즘은 Renderer / Command / History와 완전히 무관
- 결과는 좌표만 반환
- 드래그/Undo와 충돌 없음
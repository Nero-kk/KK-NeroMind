# NodeLayoutEngine 설계 명세 (Mind Map 전용)

## 0️⃣ 역할 정의

### NodeLayoutEngine의 책임
- 노드 간 **좌표(x, y)** 계산
- 부모-자식 관계 기반 **트리 레이아웃 생성**
- 노드 크기(width, height) 반영

### 하지 않는 것
- ❌ SVG 생성
- ❌ 스타일 결정
- ❌ 이벤트 처리
- ❌ Edge 렌더링

---

## 1️⃣ 입력 / 출력 인터페이스

### 입력

```ts
type LayoutInput = {
  nodes: {
    id: string
    parentId: string | null
    text: string
    width: number
    height: number
  }[]
}
```

### 출력

```ts
type LayoutOutput = {
  nodes: {
    id: string
    x: number
    y: number
    width: number
    height: number
  }[]
}
```

## 2️⃣ 레이아웃 기본 규칙 (Mind Map)
### 구조 규칙
- root는 반드시 1개
- 모든 node는 parentId를 가진다 (root 제외)
- 사이클 ❌

### 방향 규칙 (초기 Phase)
- 좌 → 우 (Left to Right)
- y축은 형제 간 간격 기반 자동 배치


## 3️⃣ 간격 규칙 (Spacing Tokens)

```ts
export const LayoutTokens = {
  horizontalGap: 80,   // 부모 ↔ 자식 거리
  verticalGap: 24,     // 형제 간 거리
  rootOffset: {
    x: 0,
    y: 0,
  },
};
```

## 4️⃣ 레이아웃 계산 단계
### STEP 1. 트리 구성

```ts
parent → children[] 맵 생성
```

### STEP 2. 서브트리 높이 계산

```ts
subtreeHeight(node) =
  max(
    node.height,
    sum(children.subtreeHeight) + verticalGap * (n - 1)
  )
```

### STEP 3. 좌표 배치 (DFS)

```ts
function layout(node, x, yCenter) {
  node.x = x
  node.y = yCenter

  let cursorY = yCenter - subtreeHeight(node)/2

  for child in children:
    const childCenterY =
      cursorY + subtreeHeight(child)/2

    layout(
      child,
      x + node.width + horizontalGap,
      childCenterY
    )

    cursorY += subtreeHeight(child) + verticalGap
}
```

## 5️⃣ 루트 배치 규칙

```ts
root.x = LayoutTokens.rootOffset.x
root.y = LayoutTokens.rootOffset.y
```

- 전체 맵 이동은 Renderer가 처리
- LayoutEngine은 상대 좌표만 계산

## 6️⃣ Edge 렌더를 위한 보조 데이터

LayoutEngine은 Edge 좌표를 계산하지 않는다
Renderer에서 다음 규칙으로 처리:

```ts
edge.from = {
  x: parent.x + parent.width,
  y: parent.y
}

edge.to = {
  x: child.x,
  y: child.y
}
```

## 7️⃣ 확장 포인트 (Phase 5+)

- 좌/우 분기 (중앙 루트)

- 자동 방향 전환

- 충돌 회피 (overlap resolver)

- 가상 레이아웃 (large tree)

## 8️⃣ 절대 규칙

- ❌ LayoutEngine에서 텍스트 측정

- ❌ Renderer에서 좌표 계산

- ❌ Edge가 레이아웃에 영향

- ❌ UI 토큰 참조

LayoutEngine은 수학 엔진이다.



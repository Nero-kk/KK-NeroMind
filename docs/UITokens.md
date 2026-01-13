마인드맵 노드 UI 최소 스펙 정의서
(Apple macOS / iOS Button Style 기반)
1. 디자인 철학 (Non-Negotiable)

콘텐츠가 형태를 결정한다

장식 ❌, 정보 전달 ⭕

iOS 버튼처럼 가볍고 떠 있는 느낌

사용자는 “노드”가 아니라 생각 덩어리를 누른다고 느껴야 함

2. 노드 기본 형태 (Shape)
❌ 금지

원(circle)

타원(ellipse)

고정 크기 노드

⭕ 필수

Rounded Rectangle

Corner Radius: 8~12px

가로 자동 확장 / 세로 최소 고정

┌─────────────────────┐
│   생각이 길어지면   │  ← 가로만 늘어남
└─────────────────────┘

3. 크기 규칙 (Auto Layout)
기본 수치

Min Height: 32px (iOS 버튼 기준)

Padding:

X: 12~16px

Y: 6~8px

계산식 (개념)
width  = textWidth + paddingX * 2
height = max(minHeight, textHeight + paddingY * 2)


👉 줄바꿈 없음 (1줄 원칙)
👉 길어지면 옆으로만 증가

4. 타이포그래피 (Apple 감성 핵심)
폰트

macOS/iOS:

SF Pro

Web fallback:

system-ui, -apple-system

텍스트 규칙

Font Size: 13~15px

Font Weight:

기본: Regular

선택됨: Medium

색상:

기본: #1C1C1E

비활성: #8E8E93

5. 색상 & 표면 (Surface)
기본 노드

Background: #FFFFFF

Border: ❌ 없음

Shadow: ⭕ 필수

Shadow (Apple 스타일 핵심)

```css
box-shadow:
  0 1px 2px rgba(0,0,0,0.08),
  0 4px 12px rgba(0,0,0,0.06);
```


👉 “카드가 살짝 떠 있음”
👉 절대 진하면 안 됨 (구글 머티리얼 ❌)

6. 상태 정의 (States)
Default

흰 배경

미세 그림자

Hover

Shadow 살짝 강화

Background 변화 ❌

Active / Drag

Shadow 감소

살짝 눌린 느낌

Selected

Outline 1px

색상: #0A84FF (iOS Blue)

7. 인터랙션 규칙 (UX 핵심)
클릭

리플 없음

scale 애니메이션 ❌

Shadow 변화만 ⭕

드래그

노드 전체가 손잡이

커서: grab → grabbing

편집

더블클릭 → 텍스트 인플레이스 편집

엔터 → 확정

ESC → 취소

8. 연결선과의 관계 (미리 정의)

연결선은 노드 중앙이 아니라

좌/우 edge 중앙에서 출발

선은 노드 뒤로 깔림

노드를 방해하면 ❌

9. “이게 마인드맵이다”를 결정하는 최소 조건
항목	필수
콘텐츠 기반 리사이즈	⭕
사각형 노드	⭕
부모-자식 연결	⭕
자동 레이아웃	⭕
버튼 같은 촉감	⭕
원형 노드	❌
10. 지금 상태와의 냉정한 비교
항목	현재	목표
노드 형태	원	Rounded Rect
크기	고정	텍스트 기반
UX	없음	버튼 감성
마인드맵성	❌	⭕
한 줄 요약 (중요)

“노드는 도형이 아니라 버튼이다.”
애플처럼 만들려면, 먼저 도형 생각부터 버려야 한다.


## 1️⃣ Node 렌더 구조 분해도 (Renderer 설계)

### Renderer의 유일한 책임
- StateSnapshot → SVG 요소 생성
- 계산된 **layout 결과만 소비**
- UI 규칙 / 스타일 결정 ❌

### 권장 구조
Renderer
├─ render(snapshot)
│  ├─ renderEdges(layout)
│  └─ renderNodes(layout)
│
├─ NodeLayoutEngine (외부)
│  └─ node → { width, height, x, y }
│
└─ TextMeasurer (외부)
   └─ text → { textWidth, textHeight }

### 핵심 원칙
- Renderer는 **“그리기만” 한다**
- 크기 계산 / 줄바꿈 / 패딩 로직은 Renderer 밖

---

## 2️⃣ 텍스트 측정 → 크기 계산 실제 코드 전략

### SVG 기반 텍스트 측정 (권장)

```ts
function measureText(
  svg: SVGSVGElement,
  text: string,
  font: string
): { width: number; height: number } {
  const tempText = document.createElementNS(SVG_NS, 'text');
  tempText.setAttribute('font', font);
  tempText.textContent = text;
  tempText.setAttribute('visibility', 'hidden');

  svg.appendChild(tempText);
  const bbox = tempText.getBBox();
  svg.removeChild(tempText);

  return { width: bbox.width, height: bbox.height };
}
```

노드 크기 계산 공식 (사각형)

```ini
nodeWidth  = textWidth  + paddingX * 2
nodeHeight = textHeight + paddingY * 2
```

줄바꿈 기준
- 단일 줄 기본
- maxWidth 초과 시 줄바꿈 (Phase 5 이후)


## 3️⃣ Figma 없이 바로 쓰는 UI 토큰 정의
### Node 기본 토큰 (Apple-like)

```ts
export const NodeTokens = {
  font: {
    family: 'system-ui, -apple-system',
    size: 14,
    weight: 500,
  },

  padding: {
    x: 16,
    y: 10,
  },

  radius: 10,

  color: {
    background: '#FFFFFF',
    border: '#D0D0D0',
    text: '#1C1C1E',
  },

  shadow: {
    enabled: true,
    blur: 8,
    offsetY: 2,
    color: 'rgba(0,0,0,0.08)',
  },
};
```

### SVG 표현 방식

<rect rx="radius" ry="radius">

<text dominant-baseline="middle">

## 4️⃣ 마인드맵 vs 마인드그래프 구조 차이
### 마인드맵 (Mind Map)
- 트리 구조
- 단일 parent
- 중앙 기준 방사형
- parentId 필수

```ts
node: {
  id: string
  parentId: string | null
}
```

### 마인드그래프 (Mind Graph)
- DAG 또는 Graph
- 다중 parent 가능
- edge가 1급 객체

```ts
edge: {
  from: string
  to: string
}
```

현재 프로젝트 규칙

Phase 4까지: 마인드맵

edge는 parentId로 유도

snapshot.edges 사용 ❌

---

### 요약 규칙 (절대 금지)
- ❌ Renderer에서 텍스트 측정
- ❌ Renderer에서 padding 계산
- ❌ 원형 노드 자동 복귀
- ❌ UI 토큰 하드코딩 분산

Renderer는 결과를 그리는 도구다.
UI는 규칙으로 고정한다.


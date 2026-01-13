# NodeTextLayout.md
## MindMap Node 텍스트 줄바꿈 & 크기 계산 규칙

본 문서는 **마인드맵 노드 UI에서 텍스트를 기준으로 노드 크기를 계산하기 위한
순수 알고리즘 정의서**이다.

Renderer / Layout / State 와 독립적이며  
SVG, Canvas, HTML 어디서든 동일한 규칙을 적용할 수 있어야 한다.

---

## 1. 기본 전제 (Non-Negotiable)

- 노드 크기는 **텍스트 내용에 의해 자동 결정**된다
- 고정 width / height 사용 금지
- 텍스트는 반드시 **줄바꿈(wrapping)** 가능
- 결과 노드는:
  - 내용이 짧으면 작은 캡슐
  - 길어지면 **가로로 늘어나는 rounded-rectangle**
- 원(circle) 노드는 사용하지 않는다

---

## 2. 입력 / 출력 정의

### 입력

```ts
interface NodeTextLayoutInput {
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: number | string
  maxLineWidth: number   // px, 강제 줄바꿈 기준
  paddingX: number       // 좌우 패딩
  paddingY: number       // 상하 패딩
  lineHeight: number     // px
}
```

### 출력

```ts
interface NodeTextLayoutResult {
  lines: string[]        // 줄바꿈된 텍스트 배열
  width: number          // 노드 최종 width
  height: number         // 노드 최종 height
  textBlockWidth: number // 텍스트 영역 width
  textBlockHeight: number
}
```

## 3. 텍스트 측정 전략 (필수 구현 규칙)
### 3.1 측정 방식
SVG 환경 기준:
- <text> 요소를 임시로 생성
- getComputedTextLength() 사용
- 화면에 보이지 않는 상태로 측정

```ts
function measureTextWidth(
  text: string,
  font: FontSpec
): number
```

HTML / Canvas로 이식 시에도 실제 렌더 기준 측정을 원칙으로 한다
(문자 수 × 추정 폭 금지)

---

## 4. 줄바꿈 알고리즘 (핵심)
### 4.1 기본 정책
- 줄바꿈 단위: 단어(word) 기준
- 공백 기준 split
- 단어 하나가 maxLineWidth를 초과할 경우:
    - 강제 문자 단위 분해 허용

### 4.2 알고리즘 (의사코드)

```ts
lines = []
currentLine = ""

for word in words:
  testLine = currentLine == ""
    ? word
    : currentLine + " " + word

  if measureWidth(testLine) <= maxLineWidth:
    currentLine = testLine
  else:
    if currentLine != "":
      lines.push(currentLine)
    currentLine = word

if currentLine != "":
  lines.push(currentLine)
```

### 4.3 단어 자체가 maxLineWidth 초과 시

```ts
if measureWidth(word) > maxLineWidth:
  splitWordByCharacter(word)
```

```ts
function splitWordByCharacter(word):
  temp = ""
  for char in word:
    if measureWidth(temp + char) <= maxLineWidth:
      temp += char
    else:
      lines.push(temp)
      temp = char
  if temp != "":
    lines.push(temp)
```

---

## 5. 텍스트 블록 크기 계산

```ts
textBlockWidth = max(
  measureWidth(line) for line in lines
)

textBlockHeight = lines.length * lineHeight
```

## 6. 노드 최종 크기 계산

```ts
nodeWidth  = textBlockWidth  + paddingX * 2
nodeHeight = textBlockHeight + paddingY * 2
```

### 최소 권장값 (하드코딩 가능)

```ts
MIN_NODE_HEIGHT = 32
MIN_NODE_WIDTH  = 48
```

```ts
nodeWidth  = max(nodeWidth,  MIN_NODE_WIDTH)
nodeHeight = max(nodeHeight, MIN_NODE_HEIGHT)
```

## 7. 텍스트 정렬 규칙

- horizontal-align: center

- vertical-align: middle

- 각 line은 dominant-baseline: middle

- multi-line 텍스트는 전체 블록 기준 중앙 정렬

## 8. Renderer 연계 규칙 (중요)

- Renderer는:
    - ❌ 텍스트 줄바꿈 로직을 직접 가지지 않는다
    - ❌ width/height 계산을 임의로 하지 않는다
- Renderer는 NodeTextLayoutResult만 소비한다

```ts
layout = layoutText(node.content)

drawRoundedRect(
  width = layout.width,
  height = layout.height
)

drawTextLines(
  lines = layout.lines
)
```

## 9. 이 문서에서 의도적으로 하지 않는 것

- 폰트 선택 정책

- 색상 / 테마

- 애니메이션

- 선택 / 포커스 UI

- 편집 모드

## 10. 문서 성격 요약

- 구현 기준 문서 (Spec)

- UI 가이드 ❌

- 디자인 문서 ❌

- 알고리즘 정의서 ⭕


---
### (노드 줄바꿈 + 크기 계산 알고리즘 명세 & 실제 구현 코드)
### 목적
- 노드 내부 텍스트 길이에 따라
- 자동 줄바꿈
- 가로로 늘어나는 rounded-rect 크기 계산
- Renderer와 완전히 분리된 순수 계산 모듈

### 핵심 설계 원칙
- 줄바꿈은 단어 단위
- 최대 줄 너비 초과 시 다음 줄로 이동
- 전체 노드 크기는 텍스트 영역 + padding * 2
- SVG 기준 (Canvas/HTML로도 이식 가능)

### 입력 / 출력 정의

```ts
export interface TextLayoutInput {
  text: string;
  maxLineWidth: number;   // px
  fontSize: number;       // px
  fontFamily: string;
  lineHeight: number;     // px
  paddingX: number;       // px
  paddingY: number;       // px
}

export interface TextLayoutResult {
  lines: string[];
  width: number;   // 최종 노드 width
  height: number;  // 최종 노드 height
}
```

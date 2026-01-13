
### (Renderer 원 → rounded-rect 교체 정확한 변경 diff)
### 변경 목표
- ❌ circle 기반 노드
- ✅ 텍스트 길이에 따라 가로 확장되는 rounded-rect
- Apple-style 버튼 느낌
- Renderer 책임 범위 유지

### Renderer 변경 핵심 diff
❌ 제거

```ts
private createCircle(): SVGCircleElement
```

---

### ✅ 추가

```ts
private createRoundedRect(
  width: number,
  height: number
): SVGRectElement {
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('width', String(width));
  rect.setAttribute('height', String(height));
  rect.setAttribute('rx', '12');
  rect.setAttribute('ry', '12');
  rect.setAttribute('fill', 'rgba(255,255,255,0.9)');
  rect.setAttribute('stroke', 'rgba(0,0,0,0.1)');
  return rect;
}
```

### renderNodes() 정확한 변경 포인트

```ts
const layout = NodeTextLayout.layout({
  text: node.content,
  maxLineWidth: 240,
  fontSize: 14,
  fontFamily: 'system-ui',
  lineHeight: 20,
  paddingX: 16,
  paddingY: 10,
});

const group = this.createNodeGroup(
  node.id,
  node.position.x - layout.width / 2,
  node.position.y - layout.height / 2
);

const rect = this.createRoundedRect(
  layout.width,
  layout.height
);

group.appendChild(rect);

// 줄 단위 text 생성
layout.lines.forEach((line, index) => {
  const text = document.createElementNS(SVG_NS, 'text');
  text.textContent = line;
  text.setAttribute('x', String(layout.width / 2));
  text.setAttribute(
    'y',
    String(16 + index * 20)
  );
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'middle');
  group.appendChild(text);
});
```


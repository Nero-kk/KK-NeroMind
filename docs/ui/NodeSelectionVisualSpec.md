## 2️⃣ 선택 상태(SelectedNode) 시각화
### 목적
- 선택된 노드를 명확히 구분
- 상태(State)와 표현(Renderer) 분리

### 입력 상태

```ts
selectedNodeId: NodeId | null
```

### 시각적 변화 (허용 항목)
- stroke 색상 변경
- stroke 두께 증가
- z-order 상승 (맨 앞으로)

### 금지 사항
- 크기 변경 ❌
- 위치 변경 ❌
- 애니메이션 ❌ (Phase 4 범위 초과)

### Renderer 입력 조건

```ts
render(snapshot: StateSnapshot, selectedNodeId?: NodeId)
```

### 시각화 규칙
선택된 노드에만 아래 스타일 적용:
- stroke 색상 강조
- stroke width 증가
- 약한 shadow 또는 outline

### SVG 스타일 예시

```ts
if (node.id === selectedNodeId) {
  rect.setAttribute('stroke', '#007AFF')
  rect.setAttribute('stroke-width', '2')
} else {
  rect.setAttribute('stroke', 'rgba(0,0,0,0.1)')
  rect.setAttribute('stroke-width', '1')
}
```

### 금지 사항
- Renderer가 selectedNodeId를 저장 ❌
- Renderer가 클릭 이벤트 처리 ❌
- Renderer가 StateManager 접근 ❌


| 역할       | 책임                |
| -------- | ----------------- |
| View     | 선택 상태 변경          |
| State    | selectedNodeId 저장 |
| Renderer | 시각화만              |


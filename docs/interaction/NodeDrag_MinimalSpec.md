## 3️⃣ 노드 드래그 최소 구현
### 목적
- 노드 위치 이동
- History / Undo 시스템과 충돌 방지
- Undo/Redo, History 구조를 깨지 않는다

### 핵심 원칙
- drag 중: 상태 변경 없음
- drag 종료(mouseup) 시에만 Command 실행

### 이벤트 흐름

```ts
mousedown → drag start
mousemove → 임시 transform (시각적 이동)
mouseup → MoveNodeCommand 실행
```

### drag 중 처리
- SVG transform만 변경
- snapshot/state 미변경

```ts
nodeGroup.setAttribute(
  'transform',
  `translate(${x}, ${y})`
)
```

### mouseup 처리

```ts
const command = new MoveNodeCommand(nodeId, finalPosition)
historyManager.execute(command)
```

### MoveNodeCommand 요약

```ts
execute(): position 변경
undo(): 이전 position 복원
```

### 최소 구현 체크리스트
- [ ] drag 중 state 접근 없음
- [ ] mouseup에서만 command 생성
- [ ] HistoryManager 경유
- [ ] Renderer는 좌표만 소비

### 의도적으로 제외한 것
- 관성 / 애니메이션
- 다중 선택 드래그
- snap / grid
- edge 재배치 애니메이션

### 문서 상태 요약
- 목적: 구현 가이드 + 아키텍처 가드
- 대상: Claude Code / Cursor / 인간 개발자
- 수정 시점: 기능 추가 전 설계 고정용







drag 종료 처리

```ts
onMouseUp() {
execute(new MoveNodeCommand(nodeId, finalPosition))
}
```

## 금지 사항
- drag 중 StateManager 호출 ❌
- drag 중 HistoryManager 호출 ❌
- drag 중 snapshot 수정 ❌

## 구현 순서 권장
1. 중앙 루트 레이아웃
2. 선택 시각화
3. 드래그 (가장 마지막)

드래그는 항상 마지막에 한다. 먼저 하면 아키텍처가 무너진다.
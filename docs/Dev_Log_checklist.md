🧪 Codex Dev_Log 해석 검증 체크 질문 세트 (Phase 2 전용)
A. Phase 경계 인식 검사 (가장 중요)
Q1.

Dev_Log 기준으로 Phase 2의 시작 조건과 종료 조건을 각각 한 문장으로 설명해라.

✅ 합격 기준

“노드 조작 & 인터랙션 구현”

State / Direction / Input 분리 유지

Renderer / History 언급 ❌

❌ 실패 신호

“undo/redo 준비”

“view 업데이트”

“이벤트 전파”

Q2.

Phase 2에서 절대 구현하면 안 되는 책임 3가지를 명시해라.

✅ 정답에 반드시 포함되어야 할 것

undo / redo / history

renderer / layout

event system

❌ 하나라도 빠지면 위험

B. State 철학 오해 탐지
Q3.

StateManager가 알고 있어도 되는 것 3가지와
절대 몰라야 할 것 3가지를 구분해서 써라.

✅ 합격 예시

알고 있음: 현재 노드 상태, 방향 정보, snapshot 생성

몰라야 함: 과거 상태, 입력 이벤트, 렌더 타이밍

❌ 실패 신호

“undo 스택”

“selection history”

“emit change event”

Q4.

Snapshot은 언제 생성되며, 무엇을 위해 사용되는가?

✅ 정답 핵심

Command 실행 결과

읽기 전용

Renderer 소비용

❌ 실패 신호

“이전 상태 저장”

“되돌리기용”

C. DirectionManager 역할 침범 검사
Q5.

DirectionManager가 결정할 수 있는 것과
절대 결정하면 안 되는 것을 구분해 설명해라.

✅ 합격

결정 가능: 부모 방향 상속, 자식 생성 방향

금지: 노드 추가/삭제, 좌표 계산, State 변경

❌ 실패

“노드 생성”

“레이아웃 계산”

“position”

Q6.

“4방향 자식 생성 규칙”이란 무엇이며,
이것이 레이아웃 로직이 아닌 이유를 설명해라.

✅ 합격

방향은 의미적 관계

실제 위치는 Renderer 책임

❌ 실패

“좌표 배치”

“시각적 정렬”

D. Command / Input 경계 테스트
Q7.

Input Layer가 State를 변경할 때
직접 호출하면 안 되는 이유를 설명해라.

✅ 정답 키워드

단방향 흐름

의도 전달

테스트 가능성

❌ 실패

“편해서”

“간단해서”

Q8.

Phase 2에서 Command는 왜 undo()를 가지면 안 되는가?

✅ 합격

단일 책임

History Layer 미도입

Phase 3 확장성

❌ 실패

“아직 구현 안 해서”

“나중에 추가 가능”

E. Dev_Log 해석 정확도 최종 판별
Q9.

Dev_Log 기준으로 지금 당장 생성해도 되는 파일과
절대 생성하면 안 되는 파일을 각각 3개씩 써라.

✅ 생성 가능 예

StateManager.ts

DirectionManager.ts

(순수 인터페이스 파일)

❌ 생성 금지 예

HistoryManager.ts

UndoManager.ts

RendererController.ts

Q10. (결정타)

Phase 3가 와도 Phase 2 코드를 단 한 줄도 수정하지 않으려면,
지금 무엇을 “의도적으로 비워둬야” 하는가?

✅ 정답

History / undo / redo

event propagation

renderer coupling

❌ 실패

“추후 리팩토링”

“확장 포인트를 미리 구현”

🟥 판정 기준 (중요)

Q1~Q4 중 1개라도 실패 → Dev_Log 오해 ❌

Q5~Q8 중 2개 이상 실패 → 구조 침범 위험 ⚠️

Q10 실패 → Phase 개념 미정립 ❌❌
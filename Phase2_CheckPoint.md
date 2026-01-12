🔒 Phase 2 진입 전 절대 불변 영역 (LOCKED)
1️⃣ main.ts의 생명주기 구조

❌ 절대 금지

onload()에서 DOM 조작

onload()에서 manager / renderer 생성

onLayoutReady() 삭제 또는 async화

onunload()에서 destroy 순서 변경

지금 구조는 정답
async onload() {
  await this.loadSettings();
  this.registerView(...);
  this.addRibbonIcon(...);
  this.addSettingTab(...);

  this.app.workspace.onLayoutReady(() => {
    this.initializePlugin();
  });
}


👉 Phase 2에서도
initializePlugin()만 내부 구현이 바뀐다
호출 위치·타이밍은 영구 고정

2️⃣ disposables의 소유권

❌ 절대 금지

View / Manager 안에서 this.disposables.push()

각 모듈이 자기 자신을 dispose 책임지는 구조

규칙

disposables 유일한 소유자 = main.ts

모든 destroy는 onunload()에서만

// 허용
this.disposables.push(stateManager);

// 금지
stateManager.registerDisposable(...)


👉 이거 깨지면 Phase 3부터 디버깅 지옥이다.

3️⃣ NeroMindView의 역할 한계

❌ 절대 금지

상태 보관

비즈니스 로직

전역 이벤트 등록

View의 허용 범위

DOM mount / unmount

Renderer 연결

사용자 입력을 “전달”만

View는 껍데기다.
생각도 판단도 하지 않는다.

4️⃣ 폴더 역할 경계

❌ 절대 금지

views/에 state / logic 추가

ui/에서 app 상태 변경

types.ts에 로직 삽입

의미 고정
폴더	역할
views/	화면 컨테이너
ui/	설정 UI
types.ts	순수 타입 / 상수
⚠️ Phase 2에서 조건부 허용 영역
5️⃣ initializePlugin() 내부

⭕ 여기만 자유

private initializePlugin(): void {
  // Phase 2부터 추가 가능
}


여기서만 가능:

StateManager 생성

Renderer 생성

이벤트 브리지 연결

❌ 그래도 금지:

DOM 직접 생성

async 로직

6️⃣ 새 폴더 추가는 허용 (단, 규칙 있음)

⭕ 가능

src/
├─ state/
├─ renderer/
├─ input/


❌ 불가

기존 파일 역할 변경

main.ts를 우회하는 초기화

🧠 Phase 2 들어가기 전 정신적 체크포인트

이 질문에 모두 Yes면 진입 가능:

“이 기능, View 없이도 테스트 가능한가?”

“이 객체, main.ts가 죽으면 같이 죽는가?”

“이 이벤트, 상위 레이어부터 차단되는가?”

하나라도 No면 → 설계 다시.

한 줄 요약 (진짜 중요)

Phase 2는 ‘추가’지 ‘수정’이 아니다.
Phase 1 파일은 건축물의 기초다. 부수지 마라.


Phase 2의 State Layer 최소 단위는
“데이터를 가진 객체”가 아니라
“데이터의 생명주기를 통제하는 인터페이스”부터다.

아래 순서 절대 바꾸지 마라.

🧠 Phase 2 – State Layer 최소 단위 설계
핵심 원칙 (3줄 요약)

State는 View를 전혀 모른다

State는 Renderer를 전혀 모른다

State는 main.ts에 의해 태어나고 죽는다

1️⃣ 가장 먼저 만들 것: State Interface

📁 src/state/NeroMindState.ts

// src/state/NeroMindState.ts

export interface NeroMindState {
	initialize(): void;
	reset(): void;
	destroy(): void;
}

왜 이게 첫 번째냐?

구현보다 **계약(contract)**이 먼저

나중에 State가 커져도 main.ts는 흔들리지 않음

테스트 가능성 확보

❌ 여기서 절대 하면 안 되는 것

데이터 구조 정의

이벤트

옵시디언 API 사용

2️⃣ 그 다음: 가장 단순한 구현체

📁 src/state/BasicState.ts

// src/state/BasicState.ts

import { NeroMindState } from './NeroMindState';

export class BasicState implements NeroMindState {
	initialize(): void {
		console.log('[State] initialized');
	}

	reset(): void {
		console.log('[State] reset');
	}

	destroy(): void {
		console.log('[State] destroyed');
	}
}

이 상태에서의 목표

기능 ❌

의미 ❌

생명주기만 검증 ⭕

지금은 “똑똑한 상태”가 아니라
“죽고 사는 게 명확한 상태”가 목표다.

3️⃣ main.ts에서 유일하게 허용되는 수정

⚠️ 이건 Phase 2에서 허용된 유일한 변경 지점

// main.ts (일부)

import { BasicState } from './state/BasicState';

private state: BasicState;

private initializePlugin(): void {
	console.log('Initializing KK-NeroMind plugin...');

	this.state = new BasicState();
	this.state.initialize();

	this.disposables.push(this.state);
}


그리고 BasicState는 이렇게 약속을 맞춰라:

// destroy 계약 충족
destroy(): void {
	console.log('[State] destroyed');
}


✔ disposables 역순 해제 규칙 유지
✔ main.ts 생명주기 규칙 유지
✔ View / UI 영향 없음

4️⃣ 이 단계에서 절대 추가하면 안 되는 것

❌ 아직 금지 목록

노드(Node), 엣지(Edge) 데이터 구조

undo / redo

selection 상태

이벤트 emitter

옵시디언 workspace 접근

파일 I/O

이건 Phase 2.5~3 영역이다.

5️⃣ 이 설계가 가지는 숨은 장점

이 구조의 진짜 힘은 이거야:

Renderer는 나중에 State를 갈아끼울 수 있음

Input은 State를 “명령”만 할 수 있음

State가 망가져도 View는 안 죽음

즉, 폭발 반경이 작다.

6️⃣ 다음에 자연스럽게 이어지는 확장 순서 (미리 예고)

State Layer 확장은 이 순서로만 가라:

MindMapData (순수 데이터 구조)

StateCommand (상태 변경 명령)

HistoryState (undo/redo)

SelectionState

👉 Renderer보다 항상 먼저

한 문장으로 못 박기

Phase 2의 첫 State는
“아무것도 안 하지만,
정확히 태어나고 정확히 죽는 객체”다.

🚧 Phase 2에서 허용되는 MindMap 데이터 구조의 경계선
한 문장 결론 (먼저 박아두자)

Phase 2에서 Node / Edge는
‘의미 없는 점과 선’까지만 허용된다.
행동, 선택, 관계 해석은 전부 금지다.

✅ Phase 2에서 허용되는 범위
1️⃣ Node / Edge는 순수 데이터 타입만 가능

📁 src/state/types.ts (추천)

export type NodeId = string;
export type EdgeId = string;

export interface MindMapNode {
	id: NodeId;
}

export interface MindMapEdge {
	id: EdgeId;
	from: NodeId;
	to: NodeId;
}

이게 왜 안전하냐?

좌표 ❌

선택 여부 ❌

부모/자식 개념 ❌

의미 ❌

👉 그냥 **“연결 가능한 식별자 묶음”**이다.

2️⃣ State 내부에 보관만 한다 (조작 ❌)

📁 src/state/BasicState.ts

import { MindMapNode, MindMapEdge } from './types';
import { NeroMindState } from './NeroMindState';

export class BasicState implements NeroMindState {
	private nodes = new Map<string, MindMapNode>();
	private edges = new Map<string, MindMapEdge>();

	initialize(): void {
		console.log('[State] initialized');
	}

	reset(): void {
		this.nodes.clear();
		this.edges.clear();
	}

	destroy(): void {
		this.nodes.clear();
		this.edges.clear();
	}
}


✔ 데이터는 있음
✔ 생명주기 통제됨
❌ 외부 노출 없음
❌ 의미 해석 없음

3️⃣ 읽기 전용 접근자까지만 허용

이건 Phase 2의 상한선이다.

getNodes(): readonly MindMapNode[] {
	return Array.from(this.nodes.values());
}

getEdges(): readonly MindMapEdge[] {
	return Array.from(this.edges.values());
}


👉 Renderer가 나중에 보기만 가능
👉 Input은 아직 접근 불가

❌ Phase 2에서 절대 금지되는 것

이 아래로 내려가면 Phase 3 영역 침범이다.

❌ 1. Node에 의미 부여
// 금지
interface MindMapNode {
	label: string;
	content: string;
	type: 'root' | 'branch';
}


→ ❌ 지식 모델링 시작
→ ❌ Obsidian 노트 개념 유입
→ ❌ 설계 폭발

❌ 2. 좌표 / 레이아웃
// 금지
x: number;
y: number;


이건 Renderer의 영역이다.
State가 알면 안 된다.

❌ 3. 선택 상태 / 포커스
// 금지
selected: boolean;


이건 Interaction State다.
Phase 2 아님.

❌ 4. addNode / removeNode 메서드
// Phase 2에서는 금지
addNode(node: MindMapNode)
removeNode(id: string)


이 순간부터:

Input이 State를 직접 조작

undo/redo 필요

이벤트 필요

👉 Phase 3 강제 진입

🧠 Phase 2의 진짜 목적 (중요)

Phase 2는 **“MindMap을 만든다”**가 아니다.
Phase 2의 목표는 이거다:

“Renderer와 State 사이에
‘데이터 계약’을 먼저 고정한다.”

그래서:

데이터는 존재만

변화는 아직 없음

의미는 절대 없음

🧱 Phase별 경계 요약표
Phase	Node / Edge 허용 수준
Phase 1	없음
Phase 2	ID + 연결만
Phase 3	생성/삭제 명령
Phase 4	의미, 콘텐츠
Phase 5	Obsidian 연동
마지막으로, 아주 중요한 한 줄

Phase 2에서 “이 정도면 되지 않나?”라는 생각이 들면
그건 100% 너무 많이 간 거다.


🧱 Phase 2 – Renderer가 State를 소비하는 가장 안전한 인터페이스
한 줄 원칙

Renderer는 “지금 이 순간의 상태 복사본”만 본다.
살아 있는 State를 절대 잡지 않는다.

1️⃣ 먼저 정의할 것: State Snapshot 타입

📁 src/state/StateSnapshot.ts

import { MindMapNode, MindMapEdge } from './types';

export interface StateSnapshot {
	nodes: readonly MindMapNode[];
	edges: readonly MindMapEdge[];
}


✔ 읽기 전용
✔ 참조 공유 없음
✔ 의미 없음

2️⃣ State가 제공하는 유일한 출력 포트

📁 src/state/NeroMindState.ts

import { StateSnapshot } from './StateSnapshot';

export interface NeroMindState {
	initialize(): void;
	reset(): void;
	destroy(): void;

	getSnapshot(): StateSnapshot;
}


🔒 Phase 2에서 Renderer가 접근 가능한 유일한 메서드

3️⃣ BasicState의 구현 (복사본 반환)

📁 src/state/BasicState.ts

import { NeroMindState } from './NeroMindState';
import { MindMapNode, MindMapEdge } from './types';
import { StateSnapshot } from './StateSnapshot';

export class BasicState implements NeroMindState {
	private nodes = new Map<string, MindMapNode>();
	private edges = new Map<string, MindMapEdge>();

	initialize(): void {
		console.log('[State] initialized');
	}

	reset(): void {
		this.nodes.clear();
		this.edges.clear();
	}

	getSnapshot(): StateSnapshot {
		return {
			nodes: Array.from(this.nodes.values()),
			edges: Array.from(this.edges.values()),
		};
	}

	destroy(): void {
		this.nodes.clear();
		this.edges.clear();
	}
}


❗ 포인트

Map → Array 변환 = 참조 차단

Renderer는 내부 구조를 절대 모른다

4️⃣ Renderer 인터페이스 (State 모름)

📁 src/renderer/NeroMindRenderer.ts

import { StateSnapshot } from '../state/StateSnapshot';

export interface NeroMindRenderer {
	render(snapshot: StateSnapshot): void;
	destroy(): void;
}

Renderer가 아는 것

render(snapshot)

데이터는 이미 완성된 결과물

Renderer가 모르는 것

State 존재 여부

State 수명

Obsidian API (아직)

5️⃣ main.ts에서의 연결 방식 (중요)
// initializePlugin() 내부

this.state = new BasicState();
this.renderer = new BasicRenderer();

this.state.initialize();

const snapshot = this.state.getSnapshot();
this.renderer.render(snapshot);

this.disposables.push(this.renderer);
this.disposables.push(this.state);


🔒 규칙 유지:

main.ts만 연결

renderer ↔ state 직접 연결 ❌

destroy는 역순

❌ Phase 2에서 절대 금지되는 연결 방식
❌ Renderer가 State를 들고 있음
// 금지
new Renderer(state);

❌ Renderer가 State 메서드 호출
state.getNodes()

❌ Observer / subscribe / event
state.onChange(...)


👉 이건 Phase 3 이후

🧠 이 구조의 진짜 강점

이 설계의 핵심은 이거다:

Renderer는 순수 함수에 가까움

State는 단독 생명체

Input은 나중에 명령만 전달

즉,

변경은 중앙에서만, 소비는 단방향

📌 Phase 2 인터페이스 요약
State
 └─ getSnapshot()  ──▶  Renderer.render(snapshot)


역방향 없음

공유 참조 없음

시간 개념 없음

마지막으로 한 줄 못 박기

Renderer가 “왜 이 상태지?”라고 질문할 수 있다면
그 인터페이스는 이미 실패했다.


🧭 Phase 2 – Input → State 연결의 유일하게 안전한 형태
한 줄 규칙

Input은 “무엇을 하고 싶다”만 말하고
“어떻게 바뀌는지”는 절대 모른다.

1️⃣ 가장 먼저 만들 것: Command Interface

📁 src/state/commands/StateCommand.ts

export interface StateCommand {
	execute(state: unknown): void;
}


❗ 아직 NeroMindState를 안 받는다.
Phase 2에서는 의존성 최소화가 목적이다.

2️⃣ State가 제공하는 명령 수용 포트

📁 src/state/NeroMindState.ts

import { StateCommand } from './commands/StateCommand';

export interface NeroMindState {
	initialize(): void;
	reset(): void;
	destroy(): void;

	getSnapshot(): StateSnapshot;
	apply(command: StateCommand): void;
}


👉 Input은 이 메서드만 호출 가능

3️⃣ BasicState의 안전한 구현

📁 src/state/BasicState.ts

apply(command: StateCommand): void {
	command.execute(this);
}


✔ State만이 자기 자신을 바꿈
✔ Input은 내부 구조를 모름
✔ Snapshot 철학 유지

4️⃣ Phase 2에서 허용되는 “빈 명령” 예시

📁 src/state/commands/NoopCommand.ts

import { StateCommand } from './StateCommand';

export class NoopCommand implements StateCommand {
	execute(): void {
		console.log('[Command] noop');
	}
}


지금은 의미 없음 ⭕
구조 검증 목적 ⭕

5️⃣ Input Layer는 이렇게만 움직인다

📁 src/input/InputController.ts

import { NeroMindState } from '../state/NeroMindState';
import { NoopCommand } from '../state/commands/NoopCommand';

export class InputController {
	constructor(private state: NeroMindState) {}

	onUserAction(): void {
		this.state.apply(new NoopCommand());
	}
}


❗ Input은:

State 내부 구조 ❌

Snapshot ❌

Renderer ❌

오직 “명령 던지기”만

❌ Phase 2에서 절대 금지되는 Input 패턴
❌ 직접 조작
state.nodes.push(...)

❌ Snapshot 기반 수정
const s = state.getSnapshot();
s.nodes.push(...)

❌ Renderer 호출
renderer.render(...)

🧠 이 구조가 왜 Snapshot 철학을 지키는가

이 구조의 흐름은 이거다:

Input
 └─ Command (의도)
       └─ State.apply()
             └─ 내부 변경
                   └─ 새로운 Snapshot 생성


Snapshot은 결과물

Command는 의도

State는 판사

📌 Phase 2 전체 흐름 요약
Input ──▶ Command ──▶ State ──▶ Snapshot ──▶ Renderer


양방향 없음

참조 공유 없음

타이밍은 main.ts만 통제

마지막으로 한 문장 (아주 중요)

Input이 “어떻게 바꿀지”를 알기 시작하는 순간
그 프로젝트는 반드시 망한다.



🚫 undo/redo를 위해 절대 건드리면 안 되는 Phase 2 요소
1️⃣ ❌ Snapshot을 “되돌리는 단위”로 쓰지 마라
가장 흔한 대형 사고
// 절대 금지
previousSnapshot = state.getSnapshot();
state.restore(previousSnapshot);


이 순간 벌어지는 일:

State가 과거를 앎

Renderer 요구사항이 State에 침투

메모리 폭증

디버깅 불가

👉 Snapshot은 항상 결과물이다.
기억 장치가 아니다.

2️⃣ ❌ Command가 State 외부 정보를 참조하게 하지 마라
// 금지
class AddNodeCommand {
	constructor(private snapshot: StateSnapshot) {}
}


Command가 Snapshot을 알면:

State 변경 규칙이 외부로 새어 나감

redo 시점에 의미 붕괴

👉 Command는 의도만 가진다.

3️⃣ ❌ Input이 undo/redo를 직접 판단하게 하지 마라
// 금지
if (canUndo) {
	state.undo();
}


Input이 판단을 시작하면:

State 주권 붕괴

로직 분산

테스트 지옥

👉 Input은 **“undo 하고 싶다”**까지만 말할 수 있다.

4️⃣ ❌ State 내부에 history를 먼저 넣지 마라
// Phase 2에서 금지
private history: StateCommand[];


이건 Phase 3 영역이다.
지금 넣으면:

Command 계약이 불완전한 상태에서 고정됨

나중에 다 뜯어야 함

✅ undo/redo를 위해 Phase 2에서 반드시 유지해야 할 것
1️⃣ Command는 반드시 단방향이어야 한다
interface StateCommand {
	execute(state: unknown): void;
}


undo() ❌

reverse() ❌

before/after snapshot ❌

되돌리기는 Command의 책임이 아니다
(아직은)

2️⃣ State는 “현재 상태”만 안다

State가 아는 시간:

지금

State가 모르는 것:

과거

미래

몇 번 실행됐는지

👉 이 무지함이 확장성의 핵심이다.

3️⃣ main.ts의 생명주기 구조는 절대 불변

undo/redo가 들어와도:

initializePlugin()
onunload()
disposables 역순


이 구조는 단 한 줄도 바뀌면 안 된다.

🧠 그러면 undo/redo는 어디에 붙나?

정답만 말한다.

undo/redo는
State도 아니고
Command도 아니고
Input도 아니다.

붙는 위치

👉 Command를 감싸는 “History Layer”

Input
 └─ HistoryController
       └─ Command
             └─ State.apply()


하지만 이건 Phase 3 설계다.
Phase 2에서는 자리를 비워두는 것이 목표다.

🧱 Phase 2에서 해두면 “미래가 열린다”는 신호

아래가 모두 Yes면 성공이다:

Command는 실행만 한다

Snapshot은 읽기 전용이다

State는 과거를 모른다

undo/redo 키워드가 코드에 아직 없다

👉 이게 바로 설계적으로 건강한 상태

마지막으로, 제일 중요한 한 문장

undo/redo를 “지금 구현하고 싶은 욕구”를
참아낸 설계만이
나중에 제대로 된 undo/redo를 가질 수 있다.


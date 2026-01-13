# KK-NeroMind 개발 로그 (Dev_Log.md)

---

## 📋 문서 개요

| 항목 | 내용 |
|------|------|
| **플러그인명** | KK-NeroMind |
| **Author** | Nero-kk |
| **현재 Phase** | Phase 3.0 MVP 구현 진행 중 (EventBus 완료, History 준비) |
| **최종 수정일** | 2026-01-12 |
| **Phase 1 완료일** | 2026-01-12 |
| **Phase 2.5 완료일** | 2026-01-12 |
| **빌드 상태** | ✅ 성공 (14KB) |

---

## 🎯 현재 상태

### ✅ 완료된 작업
- [x] 아키텍처 설계서 v4.0 작성 완료
- [x] 코딩 주의사항 가이드 작성 완료
- [x] 개발 로드맵 & 작업 명세서 작성 완료
- [x] Phase2_CheckPoint.md 작성 완료 (Snapshot 철학 명시)
- [x] **Phase 1 완료** - 코어 인프라 구축 (2026-01-12)
  - main.ts 완성 (생명주기 관리, disposables 역순 해제)
  - NeroMindView 완성 (SVG 캔버스 초기화)
  - StateManager 기본 골격 (Phase 1 버전)
  - Renderer 모듈 (SVGNodeFactory, SVGEdgeFactory)
  - 빌드 성공 (14KB)
- [x] **Phase 2 완료** - State Layer Snapshot 패턴 적용
  - StateManager에 `getSnapshot()` 메서드 추가
  - `StateSnapshot` 타입 정의 (readonly 배열)
  - `StateCommand` 인터페이스 정의 (execute only, undo 제외)
  - `StateContext` 인터페이스 정의 (persistent + ephemeral)
  - `NoopCommand` 구조 검증용 더미 구현
- [x] **Phase 2.5 완료** - 타입 안정화 & 주석 보강 (2026-01-12)
  - NodeId/EdgeId 타입 별칭 추가 (컴파일 타임 안전성)
  - StateManager 모든 필드에 readonly 추가
  - Readonly<> 반환 타입 명시
  - Object.freeze() 추가 (deep freeze for snapshots)
  - 책임 경계 주석 추가 ("❌ 하지 않는 것" 명시)
  - Phase 3 준비를 위한 주석 ("// Phase 2+: 이벤트 발행" 등)
  - DirectionManager 완전 구현 및 주석화
- [x] **Phase 3 설계 문서 작성** (2026-01-12)
  - `phase3_Design_Data.md` 작성 완료 (1743 lines)
  - Undo/Redo 레이어 설계 (HistoryManager 외부 래퍼 패턴)
  - Command 패턴 최소 인터페이스 설계
  - Event Bus 아키텍처 설계 (타입 안전 이벤트 디스패치)
  - Persistence 레이어 분리 전략
  - Phase 2.5 주석 → Phase 3 구현 매핑 테이블
  - 5주 구현 체크리스트 (Week 1-5)
- [x] **Phase 3 설계 비판적 검토** (2026-01-12)
  - 10개 병렬 에이전트로 독립 분석 완료
  - 10가지 Critical Issues 식별 및 해결 방안 제시
  - 메모리 오버헤드 문제 (90MB → 5MB 개선 방안)
  - 타입 안전성, 보일러플레이트, 순환 의존성 등 분석
  - 우선순위 매트릭스 및 Phase 3.0 즉시 반영 사항 정리
  - `phase3_Design_Data.md`에 Section 10 추가 (1000+ lines)
- [x] **Phase 3.0 MVP 초기 구현** (2026-01-12)
  - EventBus.ts 단일 파일 구현 완료 (60 lines)
    - `on()`: 이벤트 구독, 런타임 검증 (eventName, handler)
    - `emit()`: 이벤트 발행, 런타임 검증 (eventName, payload undefined 체크)
    - 핸들러 에러 처리 (조용히 삼킴)
    - 구독 해제 함수 반환 (클로저 기반)
  - StateManager.ts EventBus 통합 완료
    - `setEventBus()`: 선택적 주입 메서드 (setter 기반)
    - `emitSafe()`: 방어적 이벤트 발행 (private 헬퍼)
    - `addNode()`/`removeNode()`/`updateNode()`에서 emitSafe 호출
    - Phase 2.5 경계 준수 (생성자 변경 없음, public API 변경 없음)
  - 통합 가능성 심사 완료 (허용 판정)
  - History 레이어 진입 심사 완료 (허용 판정)

### 🔄 진행 중인 작업
- **Phase 3.0 MVP 구현 진행 중** (2026-01-12)
  - ✅ EventBus 단일 파일 구현 완료
  - ✅ StateManager EventBus 통합 완료
  - 🔄 HistoryManager 구현 준비 중 (진입 허가 완료)
  - ⏳ 기본 Command 구현 대기 중
  - ⏳ Renderer 이벤트 구독 대기 중

### ❌ 미완료 작업
- Phase 3.0 MVP 구현 (진행 중)
  - ✅ EventBus 최소 구현 완료 (Runtime validation 포함)
  - ✅ StateManager EventBus 통합 완료 (setEventBus, emitSafe)
  - ⏳ HistoryManager 간소화 구현 (Inverse Operation 패턴)
  - ⏳ 기본 Command 2-3개 구현 (CreateNode, DeleteNode, UpdateNode)
  - ⏳ Renderer 이벤트 구독
  - ⏳ main.ts 초기화 로직 (EventBus → StateManager → HistoryManager)
- Phase 3.1~3.2 점진적 개선
- Phase 4 고급 기능 (AutoAligner, MiniMap, LOD)
- Phase 3.1~3.2 점진적 개선
- Phase 4 고급 기능 (AutoAligner, MiniMap, LOD)

---

## 📝 Phase별 구현 예정 기능 상세

---

### 🔴 Phase 1: 코어 인프라

#### 1.1 플러그인 진입점 (`main.ts`)

**구현 예정 함수/클래스**:

```typescript
// 메인 플러그인 클래스
class NeroMindPlugin extends Plugin {
  // 설정 데이터
  settings: NeroMindSettings;
  
  // Disposable 모듈 관리 배열
  private disposables: Disposable[] = [];
  
  // 플러그인 로드 시 호출
  async onload(): Promise<void> {
    // 1. 설정 로드
    // 2. 뷰 타입 등록
    // 3. 리본 아이콘 추가
    // 4. 설정 탭 추가
  }
  
  // 플러그인 언로드 시 호출
  async onunload(): Promise<void> {
    // 모든 Disposable 역순 destroy
  }
  
  // 마인드맵 뷰 활성화
  async activateView(): Promise<void> {
    // 기존 뷰 찾기 또는 새로 생성
  }
  
  // 설정 로드
  async loadSettings(): Promise<void>;
  
  // 설정 저장
  async saveSettings(): Promise<void>;
}
```

**핵심 로직**:
- `onLayoutReady()` 내부에서 초기화 수행
- `disposables` 배열에 등록된 순서의 역순으로 `destroy()` 호출

---

#### 1.2 Disposable 인터페이스 (`types/Disposable.ts`)

**구현 예정**:

```typescript
// 리소스 정리 인터페이스
interface Disposable {
  destroy(): void;
}

// 헬퍼 함수
function registerDisposable(disposables: Disposable[], target: Disposable): void;
function destroyAll(disposables: Disposable[]): void;
```

**적용 대상**:
- `Renderer`
- `KeyboardManager`
- `MouseManager`
- `SyncManager`
- `StateManager`
- `MiniMap`

---

#### 1.3 마인드맵 뷰 (`NeroMindView.ts`)

**구현 예정 클래스**:

```typescript
class NeroMindView extends ItemView {
  // 뷰 타입 식별자
  static VIEW_TYPE = 'neromind-view';
  
  // 플러그인 참조
  plugin: NeroMindPlugin;
  
  // 뷰 타입 반환
  getViewType(): string;
  
  // 뷰 이름 반환
  getDisplayText(): string;
  
  // 뷰 아이콘 반환
  getIcon(): string;
  
  // 뷰 컨텐츠 생성
  async onOpen(): Promise<void> {
    // 1. 컨테이너 생성
    // 2. SVG 캔버스 초기화
    // 3. Renderer 초기화
    // 4. 루트노드 생성
  }
  
  // 뷰 정리
  async onClose(): Promise<void> {
    // 모든 리소스 정리
  }
}
```

---

#### 1.4 SVGNodeFactory (`rendering/SVGNodeFactory.ts`)

**구현 예정 클래스**:

```typescript
class SVGNodeFactory {
  private readonly SVG_NS = 'http://www.w3.org/2000/svg';
  
  // 노드 SVG 요소 생성
  create(node: MindMapNode, theme: Theme): SVGGElement {
    // 1. 그룹 요소 생성
    // 2. 배경 사각형 생성 (라운드 모서리)
    // 3. 텍스트 요소 생성
    // 4. +/- 버튼 생성 (방향에 따라)
    // 5. Glassmorphism 스타일 적용
  }
  
  // 배경 사각형 생성
  private createBackground(width: number, height: number): SVGRectElement;
  
  // 텍스트 요소 생성
  private createText(content: string): SVGTextElement;
  
  // +/- 버튼 생성
  private createExpandButton(direction: Direction, state: ButtonState): SVGGElement;
  
  // 노드 업데이트 (내용, 상태)
  update(element: SVGGElement, node: MindMapNode, theme: Theme): void;
  
  // 선택 상태 적용
  applySelection(element: SVGGElement, isSelected: boolean): void;
  
  // 핀 고정 상태 적용
  applyPinned(element: SVGGElement, isPinned: boolean): void;
}
```

**핵심 로직**:
- 모든 SVG 요소는 `document.createElementNS(SVG_NS, ...)` 사용
- `innerHTML` 사용 금지
- +버튼 위치: 루트노드는 4방향, 일반노드는 부모 방향만

---

#### 1.5 SVGEdgeFactory (`rendering/SVGEdgeFactory.ts`)

**구현 예정 클래스**:

```typescript
class SVGEdgeFactory {
  private readonly SVG_NS = 'http://www.w3.org/2000/svg';
  
  // 엣지 SVG 요소 생성
  create(from: Position, to: Position, direction: Direction): SVGPathElement {
    // Cubic Bezier 경로 생성
  }
  
  // Bezier 경로 문자열 생성
  private createBezierPath(from: Position, to: Position, direction: Direction): string {
    // M from.x from.y C cp1.x cp1.y, cp2.x cp2.y, to.x to.y
  }
  
  // 제어점 계산
  private calculateControlPoints(from: Position, to: Position, direction: Direction): {cp1: Position, cp2: Position};
}
```

**핵심 로직**:
- 수평 방향 (left/right): 수평 제어점 (x 중간, y 동일)
- 수직 방향 (up/down): 수직 제어점 (x 동일, y 중간)

---

#### 1.6 Renderer (`rendering/Renderer.ts`)

**구현 예정 클래스**:

```typescript
class Renderer implements Disposable {
  // 팩토리 참조
  private nodeFactory: SVGNodeFactory;
  private edgeFactory: SVGEdgeFactory;
  
  // SVG 루트 요소
  private svgRoot: SVGSVGElement;
  
  // 뷰포트 상태
  private viewport: {
    panX: number;
    panY: number;
    zoom: number;
  };
  
  // 초기화
  init(container: HTMLElement): void {
    // SVG 루트 생성 및 삽입
  }
  
  // 전체 렌더링
  render(state: MindMapState): void {
    // 1. 뷰포트 변환 적용
    // 2. 엣지 렌더링
    // 3. 노드 렌더링
  }
  
  // 노드 렌더링
  private renderNode(node: MindMapNode): void;
  
  // 엣지 렌더링
  private renderEdge(parentId: string, childId: string): void;
  
  // 뷰포트 변환
  applyViewport(): void;
  
  // 줌
  setZoom(zoom: number): void;
  
  // 팬
  pan(dx: number, dy: number): void;
  
  // 리소스 정리
  destroy(): void;
}
```

---

#### 1.7 루트노드 초기 배치 및 스타일

**구현 예정 로직**:

```typescript
// 루트노드 생성 및 배치
function createRootNode(containerWidth: number, containerHeight: number): MindMapNode {
  return {
    id: generateUUID(),
    content: '',
    position: {
      x: containerWidth / 2,
      y: containerHeight / 2
    },
    parentId: null,
    childIds: [],
    direction: null,  // 루트노드는 방향 없음
    isPinned: false,
    isCollapsed: false,
    linkedNotePath: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

// Glassmorphism 스타일 (CSS)
.neromind-node {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
```

---

### 🟠 Phase 2: 노드 조작 & 인터랙션

#### 2.1 DirectionManager (`core/DirectionManager.ts`)

**구현 예정 함수**:

```typescript
class DirectionManager {
  // 루트노드에서 특정 방향으로 자식 생성
  createChildFromRoot(
    root: MindMapNode, 
    direction: Direction, 
    existingChildren: MindMapNode[]
  ): { position: Position; direction: Direction };
  
  // 일반 노드에서 자식 생성 (방향 상속)
  createChildFromNode(
    parent: MindMapNode,
    siblings: MindMapNode[]
  ): { position: Position; direction: Direction };
  
  // 형제 노드 생성 위치 계산
  createSiblingPosition(
    node: MindMapNode,
    siblings: MindMapNode[]
  ): Position;
  
  // 다음 자식 위치 계산 (기존 자식 고려)
  private calculateNextChildPosition(
    parent: MindMapNode,
    direction: Direction,
    existingSiblings: MindMapNode[]
  ): Position;
  
  // 방향에 수직인 오프셋 (형제 배치용)
  private getPerpendicularOffset(direction: Direction): Position;
}
```

**핵심 로직 상세**:
- 루트노드의 +버튼 클릭 → 해당 방향으로 첫 자식 생성
- 이후 자식들은 부모의 `direction`을 상속
- 형제 배치: 방향에 수직으로 일정 간격

---

#### 2.2 KeyboardManager (`input/KeyboardManager.ts`)

**구현 예정 함수**:

```typescript
class KeyboardManager implements Disposable {
  // 키 이벤트 핸들러 등록
  init(container: HTMLElement): void;
  
  // 메인 키 핸들러
  private handleKeyDown(e: KeyboardEvent): void {
    // 1. 모드 확인 (탐색/편집)
    // 2. 단축키 매칭
    // 3. 커맨드 발행
  }
  
  // 탐색 모드 키 처리
  private handleNavigationKey(e: KeyboardEvent): boolean;
  
  // 편집 모드 키 처리
  private handleEditingKey(e: KeyboardEvent): boolean;
  
  // 전역 키 처리 (모드 무관)
  private handleGlobalKey(e: KeyboardEvent): boolean;
  
  // 자식 노드 생성 (Tab)
  private createChildNode(): void;
  
  // 형제 노드 생성 (Enter)
  private createSiblingNode(): void;
  
  // 노드 탐색 (방향키)
  private navigateToNode(direction: 'up' | 'down' | 'left' | 'right'): void;
  
  // 편집 모드 진입 (Space)
  private enterEditMode(): void;
  
  // 편집 모드 종료 (Escape, Enter)
  private exitEditMode(save: boolean): void;
  
  // 노드 삭제 (Delete)
  private deleteSelectedNode(): void;
  
  destroy(): void;
}
```

---

#### 2.3 MouseManager (`input/MouseManager.ts`)

**구현 예정 함수**:

```typescript
class MouseManager implements Disposable {
  // 마우스 이벤트 핸들러 등록
  init(container: HTMLElement): void;
  
  // 클릭 핸들러
  private handleClick(e: MouseEvent): void;
  
  // 더블클릭 핸들러
  private handleDoubleClick(e: MouseEvent): void;
  
  // 드래그 시작
  private handleDragStart(e: MouseEvent): void;
  
  // 드래그 중
  private handleDrag(e: MouseEvent): void;
  
  // 드래그 종료
  private handleDragEnd(e: MouseEvent): void;
  
  // 휠 (줌)
  private handleWheel(e: WheelEvent): void;
  
  // 미들 버튼 (팬)
  private handleMiddleMouseDown(e: MouseEvent): void;
  private handleMiddleMouseUp(e: MouseEvent): void;
  
  // 노드 위에서 클릭 감지
  private getNodeAtPosition(x: number, y: number): MindMapNode | null;
  
  // 노드 드래그 → 서브트리 이동
  private moveNodeWithSubtree(nodeId: string, delta: Position): void;
  
  // 노드 드롭 → 부모 변경
  private reparentNode(nodeId: string, newParentId: string): void;
  
  destroy(): void;
}
```

---

#### 2.4 CommandHistory (`state/CommandHistory.ts`)

**구현 예정 함수**:

```typescript
class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private readonly MAX_HISTORY = 100;
  
  // 명령 실행 및 기록
  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    this.trimHistory();
  }
  
  // 되돌리기
  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;
    command.undo();
    this.redoStack.push(command);
    return true;
  }
  
  // 되살리기
  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;
    command.execute();
    this.undoStack.push(command);
    return true;
  }
  
  // Undo 가능 여부
  canUndo(): boolean;
  
  // Redo 가능 여부
  canRedo(): boolean;
  
  // 히스토리 제한
  private trimHistory(): void;
  
  // 초기화
  clear(): void;
}

// Command 인터페이스
interface Command {
  execute(): void;
  undo(): void;
  description: string;
}
```

**구현 예정 Command 목록**:
- `CreateNodeCommand`
- `DeleteNodeCommand`
- `MoveNodeCommand`
- `EditNodeCommand`
- `ToggleCollapseCommand`
- `ReparentNodeCommand`
- `BatchCommand` (여러 명령 묶음)

---

#### 2.5 StateManager (`state/StateManager.ts`)

**구현 예정 함수**:

```typescript
class StateManager implements Disposable {
  // 영속 상태 (Undo 대상)
  private persistentState: PersistentState;
  
  // 휘발 상태 (Undo 비대상)
  private ephemeralState: EphemeralState;
  
  // 상태 변경 이벤트
  private eventEmitter: EventEmitter;
  
  // 노드 조회
  getNode(id: string): MindMapNode | undefined;
  getRootNode(): MindMapNode;
  getAllNodes(): MindMapNode[];
  getChildren(nodeId: string): MindMapNode[];
  getSubtree(nodeId: string): MindMapNode[];
  
  // 노드 조작
  addNode(node: MindMapNode, parentId: string | null): void;
  removeNode(nodeId: string): MindMapNode;  // 삭제된 노드 반환 (undo용)
  updateNode(nodeId: string, updates: Partial<MindMapNode>): void;
  
  // 선택 상태
  selectNode(nodeId: string | null): void;
  getSelectedNodeId(): string | null;
  
  // 편집 상태
  startEditing(nodeId: string): void;
  stopEditing(): void;
  isEditing(): boolean;
  
  // 접기/펼치기
  toggleCollapse(nodeId: string): void;
  
  // 상태 이벤트 구독
  on(event: StateEvent, callback: Function): void;
  off(event: StateEvent, callback: Function): void;
  
  destroy(): void;
}
```

---

### 🟡 Phase 3: 동기화 & 내보내기

#### 3.1 ExportManager (`export/ExportManager.ts`)

**구현 예정 함수**:

```typescript
class ExportManager {
  // Markdown 내보내기
  async exportToMarkdown(): Promise<string> {
    // 루트부터 DFS로 순회
    // 각 노드를 "- 내용" 형식으로
    // 들여쓰기로 계층 표현
  }
  
  // 노드를 Markdown으로 변환 (재귀)
  private nodeToMarkdown(node: MindMapNode, depth: number): string;
  
  // 이미지 내보내기
  async exportToImage(): Promise<Blob> {
    // SVG → Canvas → PNG
  }
  
  // PDF 내보내기
  async exportToPdf(): Promise<Blob> {
    // Canvas → PDF
  }
  
  // SVG를 Canvas로 변환
  private svgToCanvas(svg: SVGSVGElement): Promise<HTMLCanvasElement>;
}
```

---

#### 3.2 ImportManager (`export/ImportManager.ts`)

**구현 예정 함수**:

```typescript
class ImportManager {
  // Markdown 파싱하여 마인드맵 생성
  parseMarkdownToMindMap(markdown: string): MindMapNode[] {
    // 1. 줄 단위 분리
    // 2. 들여쓰기 깊이 계산
    // 3. 계층 구조 생성
  }
  
  // 들여쓰기 깊이 계산 (탭/스페이스 모두 지원)
  private calculateDepth(indent: string): number;
  
  // 리스트 마커 제거
  private extractContent(line: string): string | null;
}
```

---

#### 3.3 SyncManager (`sync/SyncManager.ts`)

**구현 예정 함수**:

```typescript
class SyncManager implements Disposable {
  // nodeId ↔ filePath 매핑
  private virtualPathMap: Map<string, string>;
  
  // 동기화 진행 중 플래그 (순환 방지)
  private isSyncing: boolean = false;
  
  // 초기화
  init(): void {
    // FileWatcher 연동
    // VirtualPathMap 빌드
  }
  
  // 노드 제목 변경 → 파일명 변경
  async onNodeTitleChange(nodeId: string, newTitle: string): Promise<void>;
  
  // 파일 변경 → 노드 업데이트
  onFileChange(file: TFile): void;
  
  // 파일 삭제 → Orphan 감지
  onFileDelete(file: TFile): void;
  
  // 노트 드래그앤드롭 → 링크 생성
  linkNoteToNode(nodeId: string, file: TFile): void;
  
  // 링크 해제
  unlinkNoteFromNode(nodeId: string): void;
  
  destroy(): void;
}
```

---

#### 3.4 IntegrityChecker (`sync/IntegrityChecker.ts`)

**구현 예정 함수**:

```typescript
class IntegrityChecker {
  // Orphan 감지
  detectOrphans(): OrphanReport {
    // Node-Orphan: 노드는 있으나 파일 없음
    // File-Orphan: 파일은 있으나 노드 없음
  }
  
  // Orphan 분류
  classifyOrphan(id: string): 'Node-Orphan' | 'File-Orphan';
  
  // 사용자에게 알림
  notifyUser(report: OrphanReport): void;
  
  // 사용자 선택에 따른 복구
  async repair(report: OrphanReport, choice: RepairChoice): Promise<void>;
}

interface OrphanReport {
  nodeOrphans: string[];   // 파일 없는 노드 ID 목록
  fileOrphans: string[];   // 노드 없는 파일 경로 목록
  hasOrphans(): boolean;
}
```

---

#### 3.5 EssayComposer (`sync/EssayComposer.ts`)

**구현 예정 함수**:

```typescript
class EssayComposer {
  // 마인드맵을 통합 문서로 변환
  async composeEssay(): Promise<string> {
    // DFS로 순회
    // 각 노드 → Markdown Heading
    // 노트 링크 있으면 내용 삽입
  }
  
  // 노드를 문서 섹션으로 변환 (재귀)
  private async composeNode(node: MindMapNode, headingLevel: number): Promise<string>;
  
  // 연결된 노트 내용 가져오기
  private async getLinkedNoteContent(path: string): Promise<string>;
  
  // 노트 링크에서 제목 추출
  private extractTitle(content: string): string;
}
```

---

### 🟢 Phase 4: 고급 기능 & 최적화

#### 4.1 AutoAligner (`layout/AutoAligner.ts`)

**구현 예정 함수**:

```typescript
class AutoAligner {
  private readonly NODE_GAP_H = 100;
  private readonly NODE_GAP_V = 60;
  
  // 전체 자동 정렬
  alignAll(nodes: MindMapNode[], pinnedIds: Set<string>): void;
  
  // 서브트리 정렬 (재귀)
  private alignSubtree(node: MindMapNode, pinnedIds: Set<string>): BoundingBox;
  
  // 수평 방향 서브트리 정렬
  private alignHorizontal(parent: MindMapNode, children: MindMapNode[], pinnedIds: Set<string>): BoundingBox;
  
  // 수직 방향 서브트리 정렬
  private alignVertical(parent: MindMapNode, children: MindMapNode[], pinnedIds: Set<string>): BoundingBox;
  
  // 충돌 감지
  detectCollisions(nodes: MindMapNode[]): Array<[MindMapNode, MindMapNode]>;
  
  // 충돌 해결
  resolveCollisions(nodes: MindMapNode[], pinnedIds: Set<string>): void;
  
  // 두 노드 겹침 여부
  private isOverlapping(a: MindMapNode, b: MindMapNode): boolean;
  
  // 최소 탈출 벡터 계산
  private calculateEscapeVector(movable: MindMapNode, fixed: MindMapNode): Position;
}
```

---

#### 4.2 MiniMap (`ui/MiniMap.ts`)

**구현 예정 함수**:

```typescript
class MiniMap implements Disposable {
  // 미니맵 컨테이너
  private container: HTMLElement;
  
  // 캔버스
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // 변경 플래그
  private needsUpdate: boolean = true;
  
  // 초기화
  init(parentEl: HTMLElement): void;
  
  // 렌더링
  render(nodes: MindMapNode[], viewport: Viewport): void;
  
  // 노드 그리기 (축소)
  private drawNodes(nodes: MindMapNode[]): void;
  
  // 현재 뷰포트 영역 표시
  private drawViewport(viewport: Viewport): void;
  
  // 클릭 → 해당 위치로 이동
  private handleClick(e: MouseEvent): void;
  
  // 크기 조절
  setSize(size: 'small' | 'medium' | 'large'): void;
  
  // 투명도 조절
  setOpacity(opacity: number): void;
  
  // 표시/숨김
  setVisible(visible: boolean): void;
  
  destroy(): void;
}
```

---

#### 4.3 LODStrategy (`rendering/LODStrategy.ts`)

**구현 예정 함수**:

```typescript
class LODStrategy {
  // 노드의 LOD 레벨 결정
  getLODLevel(
    node: MindMapNode, 
    zoom: number, 
    selectedId: string | null, 
    editingId: string | null
  ): LODLevel {
    // 1. 강제 승격 체크
    // 2. 화면 크기 기반 판정
  }
  
  // 화면상 노드 크기 계산
  private getNodeScreenSize(node: MindMapNode, zoom: number): number;
  
  // LOD 레벨별 렌더링 설정
  getRenderOptions(level: LODLevel): RenderOptions;
}

type LODLevel = 'minimal' | 'basic' | 'standard' | 'full';

interface RenderOptions {
  showLabel: boolean;
  showButtons: boolean;
  editable: boolean;
  simplifiedShape: boolean;
}
```

---

#### 4.4 ThemeRegistry (`theme/ThemeRegistry.ts`)

**구현 예정 함수**:

```typescript
class ThemeRegistry {
  private themes: Map<string, Theme> = new Map();
  private currentTheme: string = 'light';
  
  // 기본 테마 등록
  constructor() {
    this.register(LIGHT_THEME);
    this.register(DARK_THEME);
  }
  
  // 테마 등록 (확장용)
  register(theme: Theme): void;
  
  // 테마 목록 조회
  getAvailableThemes(): string[];
  
  // 테마 적용
  apply(themeName: string): void;
  
  // 현재 테마 조회
  getCurrentTheme(): Theme;
  
  // CSS 변수 업데이트
  private updateCSSVariables(theme: Theme): void;
}
```

---

## 🧪 테스트 체크리스트 템플릿

```markdown
## Phase N 테스트 결과

### 유닛 테스트
- [ ] 테스트명 1: 결과
- [ ] 테스트명 2: 결과
커버리지: ___%

### UI/UX 테스트
- [ ] 항목 1: Pass/Fail
- [ ] 항목 2: Pass/Fail

### 발견된 버그
1. 버그 설명
   - 재현 방법:
   - 예상 동작:
   - 실제 동작:
   - 수정 상태: 미해결/해결

### 개선 사항
1. 개선 항목
   - 현재 상태:
   - 개선 방향:
```

---

## 📅 개발 일지

### 2026-01-12 (Phase 1 완료 & Phase 2 진입)

#### ✅ Phase 1 완료 - 코어 인프라 구축

**구현된 파일 목록:**
```
src/
├── main.ts                      ✅ 183 lines - Plugin entry point
├── types/index.ts               ✅ 350 lines - Type system
├── views/NeroMindView.ts        ✅ 207 lines - Mindmap view
├── state/StateManager.ts        ✅ 268 lines - State management
├── rendering/
│   ├── Renderer.ts              ✅  58 lines - Renderer orchestrator
│   ├── SVGNodeFactory.ts        ✅ 100 lines - Node factory
│   └── SVGEdgeFactory.ts        ✅  67 lines - Edge factory
└── ui/NeroMindSettingTab.ts     ✅ 118 lines - Settings tab
```

**핵심 구현 내용:**

1. **main.ts - 플러그인 생명주기 관리**
   - `async onload()`: 설정 로드 → 뷰 등록 → onLayoutReady 대기
   - `initializePlugin()`: DOM 준비 후 모듈 초기화 (확장 가능한 구조)
   - `async onunload()`: disposables 역순 destroy (배열 복사 후 reverse)
   - `activateView()`: 뷰 생성 또는 기존 뷰 활성화

   **핵심 로직:**
   ```typescript
   // 역순 destroy (중요!)
   const disposablesToDestroy = [...this.disposables].reverse();
   for (const disposable of disposablesToDestroy) {
       disposable.destroy();
   }
   ```

2. **NeroMindView.ts - SVG 캔버스 초기화**
   - `onOpen()`: 컨테이너 생성 → SVG 캔버스 초기화
   - `initializeSVGCanvas()`: SVG_NS 네임스페이스 사용, 레이어 구조 생성
     - background-layer
     - transform-layer (줌/팬용)
       - edge-layer
       - node-layer
   - `renderWelcomeMessage()`: Phase 1 테스트용 환영 노드 렌더링
   - `onClose()`: disposables 역순 정리, SVG 요소 제거

   **핵심 로직:**
   ```typescript
   const SVG_NS = 'http://www.w3.org/2000/svg';
   this.svgElement = document.createElementNS(SVG_NS, 'svg');
   // innerHTML 사용 금지, 모든 요소는 createElementNS
   ```

3. **StateManager.ts - 상태 관리 기본 골격**
   - `PersistentState`: Undo 대상 (graph, layout, settings, pinnedNodes)
   - `EphemeralState`: Undo 비대상 (selection, editing, collapsed, drag)
   - Getters: `getNode()`, `getAllNodes()`, `getRootNode()`, `getEdge()`
   - Setters: `addNode()`, `removeNode()`, `updateNode()`, `selectNode()`, `setEditingNode()`
   - 직렬화: `serialize()`, `deserialize()`

   **⚠️ Phase 2 수정 필요:**
   - 현재는 직접 조작 방식 (Phase 1 스타일)
   - Phase 2에서 Snapshot 패턴으로 전환 필요
   - Command 인터페이스 추가 필요

4. **Renderer, SVGNodeFactory, SVGEdgeFactory**
   - 기본 골격 완성 (Phase 1)
   - Phase 2에서 StateSnapshot 연결 예정

**빌드 결과:**
```bash
$ npm run build
✓ Build completed successfully
✓ main.js: 14KB
```

**Phase 1 주의사항 준수 체크:**
- ✅ onLayoutReady 사용 (DOM 조작 타이밍)
- ✅ Disposables 역순 해제
- ✅ async/await 일관성
- ✅ SVG 네임스페이스 사용
- ✅ innerHTML 지양
- ✅ 좌표계 구분 준비
- ✅ 이벤트 리스너 cleanup 구조
- ✅ Glassmorphism 호환성
- ✅ 로딩 순서 준수
- ✅ 역순 destroy 패턴

---

#### 🔄 Phase 2 진입 - State Layer 최소 단위 설계

**Phase2_CheckPoint.md 핵심 원칙 확인:**

1. **Snapshot 철학**
   - Renderer는 "지금 이 순간의 상태 복사본"만 본다
   - State를 직접 참조하지 않음
   - `getSnapshot()`: 읽기 전용 데이터 반환

2. **Command 패턴 (undo/redo 없이)**
   - Input → Command → State.apply() → Snapshot
   - Command는 실행만 함 (undo() 금지)
   - undo/redo는 Phase 3 영역

3. **State는 "현재"만 안다**
   - 과거 상태 저장 금지
   - history 배열 금지
   - 이벤트는 나중에 (Phase 2에서는 선택적)

4. **절대 불변 영역 (LOCKED)**
   - main.ts 생명주기 구조
   - disposables 소유권 (main.ts만)
   - NeroMindView 역할 (껍데기만)
   - 폴더 역할 경계

**Phase 2 계획:**

1. **StateManager 재설계** (진행 중)
   - `getSnapshot(): StateSnapshot` 추가
   - `StateSnapshot` 타입 정의 (readonly)
   - 기존 직접 조작 메서드는 내부용으로만 사용

2. **DirectionManager 구현** (설계 단계)
   - 4방향 확장 로직 (left, right, up, down)
   - 루트 노드: 4방향 모두 가능
   - 일반 노드: 부모 방향 상속
   - 형제 노드 배치: 방향에 수직으로 오프셋

   **핵심 함수 (예정):**
   ```typescript
   class DirectionManager {
       // 루트에서 특정 방향으로 자식 생성
       createChildFromRoot(root, direction, existingChildren): Position

       // 일반 노드에서 자식 생성 (방향 상속)
       createChildFromNode(parent, siblings): Position

       // 형제 노드 생성 위치
       createSiblingPosition(node, siblings): Position
   }
   ```

3. **Command 인터페이스 정의** (설계 단계)
   ```typescript
   interface StateCommand {
       execute(state: unknown): void;
   }

   // State에 추가
   interface NeroMindState {
       getSnapshot(): StateSnapshot;
       apply(command: StateCommand): void;
   }
   ```

**다음 작업:**
1. StateManager에 `getSnapshot()` 메서드 추가
2. `StateSnapshot` 타입 정의
3. DirectionManager 클래스 구현
4. NoopCommand 구현 (구조 검증용)
5. 테스트 빌드

---

### 2026-01-12 (Phase 2 완료)

#### ✅ Phase 2 완료 - Snapshot 패턴 적용

**구현된 핵심 기능:**

1. **StateManager Snapshot 패턴 구현**

   **추가된 메서드:**
   ```typescript
   class StateManager {
       // 현재 상태의 읽기 전용 스냅샷 반환
       getSnapshot(): StateSnapshot {
           // nodes/edges를 복제하고 Object.freeze()
           // 외부에서 수정해도 내부 상태에 영향 없음
       }

       // 커맨드 적용 후 스냅샷 반환
       apply(command: StateCommand): StateSnapshot {
           command.execute(this.getContext());
           return this.getSnapshot();
       }

       // 커맨드 실행을 위한 컨텍스트 제공 (private)
       private getContext(): StateContext {
           return {
               persistent: this.persistentState,
               ephemeral: this.ephemeralState
           };
       }
   }
   ```

   **핵심 로직:**
   - `getSnapshot()`: 모든 nodes/edges를 deep clone 후 Object.freeze()
   - `apply(command)`: 단방향 흐름 (Command → State → Snapshot)
   - Snapshot은 불변 (immutable) - 외부에서 수정 불가

2. **StateSnapshot 타입 정의**
   ```typescript
   // src/state/stateTypes.ts
   export interface StateSnapshot {
       readonly nodes: ReadonlyArray<MindMapNode>;
       readonly edges: ReadonlyArray<MindMapEdge>;
       readonly rootId: NodeId;
       readonly pinnedNodeIds: ReadonlyArray<NodeId>;
       readonly collapsedNodeIds: ReadonlyArray<NodeId>;
       readonly selectedNodeId: NodeId | null;
       readonly editingNodeId: NodeId | null;
   }
   ```
   - 모든 필드 readonly
   - 배열도 ReadonlyArray<>로 래핑
   - 외부 소비자는 읽기만 가능

3. **StateCommand & StateContext 인터페이스**
   ```typescript
   // Phase 2 Command: execute만 (undo 없음)
   export interface StateCommand {
       description?: string;
       execute(context: StateContext): void;
   }

   // Command가 상태를 조작할 때 사용하는 컨텍스트
   export interface StateContext {
       persistent: PersistentState;
       ephemeral: EphemeralState;
   }

   // 구조 검증용 Noop Command
   export class NoopCommand implements StateCommand {
       description = 'no-op';
       execute(): void {
           // 의도적으로 아무것도 하지 않음
       }
   }
   ```

4. **DirectionManager 구현**
   ```typescript
   // src/core/DirectionManager.ts
   export class DirectionManager {
       // 루트 노드에서 특정 방향으로 자식 생성
       createChildFromRoot(
           root: MindMapNode,
           direction: Direction,
           existingChildren: MindMapNode[]
       ): DirectionPlan {
           return {
               direction,
               laneIndex: this.getNextLane(existingChildren, direction)
           };
       }

       // 일반 노드에서 자식 생성 (방향 상속)
       createChildFromNode(
           parent: MindMapNode,
           siblings: MindMapNode[]
       ): DirectionPlan {
           const inheritedDirection = parent.direction ?? 'right';
           return {
               direction: inheritedDirection,
               laneIndex: this.getNextLane(siblings, inheritedDirection)
           };
       }

       // 형제 노드 생성 위치
       createSiblingPosition(
           node: MindMapNode,
           siblings: MindMapNode[]
       ): DirectionPlan {
           const direction = node.direction ?? 'right';
           return {
               direction,
               laneIndex: this.getNextLane(
                   siblings.filter(s => s.id !== node.id),
                   direction
               )
           };
       }

       // 다음 레인 인덱스 계산 (Private)
       private getNextLane(siblings: MindMapNode[], direction: Direction): number {
           return siblings.filter(
               sibling => (sibling.direction ?? direction) === direction
           ).length;
       }
   }

   // DirectionPlan: 레이아웃 엔진에 전달할 힌트
   export interface DirectionPlan {
       direction: Direction;  // 의미적 방향
       laneIndex: number;     // 동일 방향 내 순번
   }
   ```

   **핵심 원칙:**
   - DirectionManager는 "의미적 방향"만 결정
   - 실제 좌표 계산은 LayoutEngine 책임
   - DirectionPlan은 레이아웃 힌트일 뿐

---

### 2026-01-12 (Phase 2.5 완료)

#### ✅ Phase 2.5 완료 - 타입 안정화 & 주석 보강

Phase 2 구현 후 Phase 3 진입 전 안정화 작업 수행.

**수정된 파일 및 핵심 변경사항:**

1. **src/types/index.ts - 타입 시스템 강화**

   **추가된 타입 별칭:**
   ```typescript
   // 의미적 구분을 위한 타입 alias
   export type NodeId = string;  // 컴파일 타임 타입 안전성
   export type EdgeId = string;
   ```

   **변경 사유:**
   - 런타임에는 string이지만 컴파일 타임에 NodeId와 EdgeId 구분
   - 실수로 NodeId 자리에 EdgeId 전달 시 TypeScript 에러

2. **src/state/StateManager.ts - Readonly 보강 및 주석 추가**

   **readonly 필드 추가:**
   ```typescript
   export class StateManager implements Disposable {
       private readonly persistentState: PersistentState;  // ✅ readonly
       private readonly ephemeralState: EphemeralState;    // ✅ readonly

       // 노드 조회 - Readonly 반환으로 직접 수정 방지
       getNode(nodeId: NodeId): Readonly<MindMapNode> | undefined {
           return this.persistentState.graph.nodes.get(nodeId);
       }

       getAllNodes(): ReadonlyArray<Readonly<MindMapNode>> {
           return Array.from(this.persistentState.graph.nodes.values());
       }

       getRootNode(): Readonly<MindMapNode> | null {
           const rootId = this.persistentState.graph.rootId;
           if (!rootId) return null;
           return this.getNode(rootId) || null;
       }
   }
   ```

   **책임 경계 주석 추가:**
   ```typescript
   /**
    * StateManager
    *
    * === 책임 (Responsibilities) ===
    * - PersistentState (Undo 대상): 그래프, 레이아웃, 설정, 핀 고정 상태 관리
    * - EphemeralState (Undo 비대상): 선택, 편집, 접힘, 드래그 상태 관리
    * - Snapshot 제공: 외부 소비자에게 불변 읽기 전용 뷰 제공
    * - Command 실행: apply(command)를 통한 상태 변경 단방향 흐름
    *
    * === 하지 않는 것 (Non-Responsibilities) ===
    * - ❌ 렌더링: SVG/DOM 조작은 Renderer 책임
    * - ❌ 레이아웃 계산: 좌표 계산은 LayoutEngine 책임
    * - ❌ Undo/Redo: Phase 3에서 별도 레이어로 분리 예정
    * - ❌ 파일 저장: Phase 3에서 Persistence 레이어로 분리 예정
    * - ❌ 이벤트 발행: Phase 2+에서 추가 예정 (현재 주석 처리)
    * - ❌ 그래프 유효성 검증: 연결된 엣지 제거, 고아 노드 처리 등 미구현
    */
   ```

   **Phase 3 준비 주석:**
   ```typescript
   addNode(node: MindMapNode): void {
       this.persistentState.graph.nodes.set(node.id, node);

       if (!this.persistentState.graph.rootId) {
           this.persistentState.graph.rootId = node.id;
       }

       // Phase 2+: 이벤트 발행
       // this.emit('nodeCreated', node);
   }

   removeNode(nodeId: NodeId): void {
       this.persistentState.graph.nodes.delete(nodeId);

       // Phase 2+: 연결된 엣지도 제거
       // Phase 2+: 이벤트 발행
       // this.emit('nodeDeleted', nodeId);
   }

   updateNode(nodeId: NodeId, updates: Partial<MindMapNode>): void {
       const node = this.getNode(nodeId);
       if (!node) return;

       Object.assign(node, updates);
       node.updatedAt = Date.now();

       // Phase 2+: 이벤트 발행
       // this.emit('nodeUpdated', node);
   }
   ```

3. **src/core/DirectionManager.ts - 주석 상세화**

   **책임 경계 주석:**
   ```typescript
   /**
    * DirectionManager
    *
    * === 책임 (Responsibilities) ===
    * - 의미적 방향 결정: 노드가 어느 방향에 배치되어야 하는지 계산
    * - Lane 인덱스 계산: 동일 방향 내에서 몇 번째 위치인지 계산
    * - 방향 상속 규칙: 부모의 direction을 자식이 상속하는 로직
    *
    * === 하지 않는 것 (Non-Responsibilities) ===
    * - ❌ 좌표 계산: X/Y 위치는 LayoutEngine 책임
    * - ❌ 간격 계산: 노드 사이 거리는 LayoutEngine 책임
    * - ❌ 렌더링: SVG/DOM 조작은 Renderer 책임
    * - ❌ 상태 관리: 방향 값 저장은 StateManager 책임
    *
    * === 핵심 원칙 ===
    * 이 클래스는 "의미적 방향"만 다룬다.
    * "up"은 "위쪽에 배치한다"는 의도일 뿐, 실제 Y 좌표는 알지 못한다.
    * 반환하는 DirectionPlan은 레이아웃 엔진이 좌표를 계산할 때 사용하는 힌트.
    */
   ```

4. **getSnapshot() deep freeze 구현**
   ```typescript
   getSnapshot(): StateSnapshot {
       const nodes = Object.freeze(
           Array.from(this.persistentState.graph.nodes.values()).map(
               (node) => this.cloneNode(node)  // ✅ deep clone
           )
       );
       const edges = Object.freeze(
           Array.from(this.persistentState.graph.edges.values()).map(
               (edge) => ({ ...edge })  // ✅ shallow clone (edge는 단순 객체)
           )
       );
       const pinnedNodeIds = Object.freeze(
           Array.from(this.persistentState.pinnedNodes)
       );
       const collapsedNodeIds = Object.freeze(
           Array.from(this.ephemeralState.collapsedNodes)
       );

       return Object.freeze({  // ✅ 최상위도 freeze
           nodes,
           edges,
           rootId: this.persistentState.graph.rootId,
           pinnedNodeIds,
           collapsedNodeIds,
           selectedNodeId: this.ephemeralState.selectedNodeId,
           editingNodeId: this.ephemeralState.editingNodeId,
       });
   }

   // 노드 deep clone helper
   private cloneNode(node: MindMapNode): MindMapNode {
       return {
           ...node,
           position: { ...node.position },    // ✅ position 객체도 복제
           childIds: [...node.childIds],      // ✅ 배열도 복제
       };
   }
   ```

**Phase 2.5 완료 체크:**
- ✅ NodeId/EdgeId 타입 별칭
- ✅ readonly 필드 명시
- ✅ Readonly<> 반환 타입
- ✅ Object.freeze() deep freeze
- ✅ 책임 경계 주석 ("❌ 하지 않는 것")
- ✅ Phase 3 준비 주석 ("// Phase 2+:")
- ✅ DirectionManager 주석 상세화

---

### 2026-01-12 (Phase 3 설계 문서 작성)

#### ✅ Phase 3 설계 문서 작성 완료

**작성된 문서: `phase3_Design_Data.md` (1743 lines)**

**문서 구조:**

**Section 1: Undo/Redo 레이어 설계**
- HistoryManager 외부 래퍼 패턴 (StateManager를 감쌈)
- CommandHistory 스택 관리 (undoStack, redoStack)
- UndoableCommand 인터페이스 (execute + undo)
- CommandSnapshot 구조 (beforeState, afterState, timestamp)
- 설계 원칙: "StateManager는 히스토리를 모른다"

**핵심 아키텍처:**
```
Input Layer → HistoryManager → StateManager → Snapshot
                    ↓
              CommandHistory
              (undo/redo stacks)
```

**Section 2: Command 패턴 최소 인터페이스 설계**
- UndoableCommand extends StateCommand
- 기본 Command 구현 예시:
  - CreateNodeCommand
  - DeleteNodeCommand (엣지 제거 포함)
  - UpdateNodeCommand (previousValues 백업)
  - MoveNodeCommand
- CommandFactory 패턴
- CompositeCommand (여러 Command 묶음)

**Section 3: Event Bus 아키텍처 설계**
- EventBus 중앙 이벤트 관리자
- EventPayloadMap 타입 안전 이벤트 정의
```typescript
export interface EventPayloadMap {
    'nodeCreated': { node: MindMapNode };
    'nodeDeleted': { nodeId: NodeId };
    'nodeUpdated': { node: MindMapNode; changes: Partial<MindMapNode> };
    'historyChanged': { canUndo: boolean; canRedo: boolean };
    'stateChanged': { snapshot: StateSnapshot };
    // ...
}
```
- EventEmitter 인터페이스 (setEventBus, emit)
- StateManager EventEmitter 구현
- Renderer 이벤트 구독

**Section 4: Persistence 레이어 분리 전략**
- PersistenceManager 오케스트레이터
- Serializer (Map/Set → Array 변환)
- FileManager (Obsidian Vault API 래퍼)
- ValidationManager (스키마 검증)
- AutoSaveManager (1초 디바운스)
- StateManager에서 serialize/deserialize 제거

**Section 5: Phase 2.5 주석 → Phase 3 구현 매핑**
- StateManager 주석 매핑 테이블 (12개 주석)
- DirectionManager 주석 매핑
- Renderer 주석 매핑
- Phase 2.5 → Phase 3 전환 체크리스트 (30+ 항목)

**Section 6: Phase 3 작업 순서 체크리스트**
- **Week 1**: Event System 구축
  - EventBus 구현
  - StateManager EventEmitter 통합
  - Renderer 이벤트 구독
- **Week 2**: History System 구축
  - HistoryManager 구현
  - Command 구현체 작성
  - CommandFactory 구현
- **Week 3**: Persistence System 구축
  - Serializer 구현
  - FileManager 구현
  - AutoSaveManager 구현
- **Week 4**: 통합 및 최적화
  - main.ts 초기화 로직
  - Disposable 체인 검증
  - 에러 처리 강화
- **Week 5**: 검증 및 배포 준비
  - Code Review
  - 성능 프로파일링
  - Phase 4 경계 설정

**Section 7: Phase 3 완료 조건**
- 필수 조건 (Must-Have): EventBus, HistoryManager, 4개 Command, Persistence, AutoSave
- 선택 조건 (Nice-to-Have): CompositeCommand, 스키마 마이그레이션, 백업
- 성능 기준: 100 nodes < 100ms, Command → Render < 16ms

**Section 8: 최종 아키텍처 다이어그램**
```
Plugin Layer (main.ts)
  ↓
EventBus ←→ PersistenceManager
  ↓              ↓
HistoryManager   ↓
  ↓              ↓
StateManager ←───┘
  ↓
Renderer
```

---

### 2026-01-12 (Phase 3 설계 비판적 검토)

#### ✅ Phase 3 설계 비판적 검토 완료

**분석 방법:**
- 10개 병렬 서브 에이전트 독립 분석
- 각 에이전트가 특정 이슈 집중 검토
- 결과 통합 후 `phase3_Design_Data.md` Section 10에 추가 (1000+ lines)

**식별된 10가지 Critical Issues:**

**Issue #1: HistoryManager-StateManager 밀결합 (Critical)**
- **문제**: CommandSnapshot이 beforeState + afterState 전체 저장
- **메모리 오버헤드**: 1000 nodes × 100 history = **90MB**
  - 1개 snapshot: 450KB
  - beforeState + afterState = 900KB
  - MAX_HISTORY=100 → 90MB
- **해결 방안**: Inverse Operation 패턴
  - Command.undo()에 복원 로직 구현
  - 스냅샷 불필요, Command가 자체 Undo 데이터 관리
  - 메모리: 90MB → ~5MB (95% 감소)

**Issue #2: EventBus 타입 안전성 취약 (High)**
- **문제**: 문자열 기반 이벤트 이름, 컴파일 타임 검증 불가
  ```typescript
  eventBus.on('nodeCreated', ...);   // ✅ OK
  eventBus.on('nodeCreted', ...);    // ❌ Typo! Silent failure
  ```
- **해결 방안**: Enum 기반 Events
  ```typescript
  export enum NeroMindEvent {
      NodeCreated = 'node:created',
      NodeDeleted = 'node:deleted',
      // ...
  }

  eventBus.on(NeroMindEvent.NodeCreated, ...);  // ✅ 타입 안전
  ```

**Issue #3: Command Pattern 보일러플레이트 과다 (High)**
- **문제**: 단순 작업에도 50+ 라인 Command 클래스 작성
- **해결 방안**: Functional Commands
  ```typescript
  export const Commands = {
      updateNode: (nodeId, updates): UndoableCommand => {
          let previous = {};
          return {
              description: 'Update Node',
              execute: (ctx) => { /* ... */ },
              undo: (ctx) => { /* ... */ }
          };
      }
  };
  ```
  - 보일러플레이트 80% 감소

**Issue #4: PersistenceManager 과도한 분리 (Medium)**
- **문제**: 5개 클래스(PM, Serializer, FileManager, ValidationManager, AutoSaveManager)로 ~200 lines 로직 분산
- **해결 방안**: 통합 클래스
  - 5개 → 2개 클래스 (PersistenceManager + FileManager)
  - Serializer/ValidationManager/AutoSaveManager 로직을 PM 내부로 통합

**Issue #5: Serializer Map/Set 변환 데이터 손실 위험 (Medium)**
- **문제**: Map/Set → Array 변환 시 검증 없음
- **해결 방안**: Schema Validation (Ajv)
  ```typescript
  const serializedStateSchema = { /* JSON Schema */ };
  const validate = ajv.compile(serializedStateSchema);

  if (!validate(data)) {
      throw new Error(`Invalid state: ${ajv.errorsText()}`);
  }
  ```

**Issue #6: AutoSaveManager 레이스 컨디션 (Critical)**
- **문제**: saveNow()와 scheduleSave() 동시 호출 시 충돌
  ```
  Time 0ms:   scheduleSave() → 1000ms 후 저장 예약
  Time 999ms: saveNow() 호출 → 즉시 저장 시작
  Time 1000ms: 예약된 저장 실행 → 동시에 2개 save()!
  ```
- **해결 방안**: Lock 메커니즘
  ```typescript
  private isSaving: boolean = false;  // ✅ 추가
  private pendingSave: boolean = false;  // ✅ 추가

  private async executeSave(): Promise<void> {
      if (this.isSaving) return;  // ✅ 중복 방지

      this.isSaving = true;
      try {
          await this.persistenceManager.save();
      } finally {
          this.isSaving = false;

          if (this.pendingSave) {  // ✅ 대기 중인 저장 재시도
              this.pendingSave = false;
              this.scheduleSave();
          }
      }
  }
  ```

**Issue #7: EventEmitter 인터페이스 주입 문제 (High)**
- **문제**: setEventBus() 호출 전 emit() 시 Silent Failure
  ```typescript
  const stateManager = new StateManager();
  stateManager.addNode(node);  // ❌ eventBus가 null, 이벤트 손실
  stateManager.setEventBus(eventBus);  // 늦음!
  ```
- **해결 방안**: Initialization Guard
  ```typescript
  protected emit<K extends keyof EventPayloadMap>(...): void {
      if (!this.isInitialized) {
          throw new Error('StateManager not initialized. Call setEventBus() first.');
      }
      this.eventBus!.emit(event, payload);
  }
  ```

**Issue #8: CommandSnapshot 메모리 중복**
- Issue #1과 동일 (beforeState + afterState 중복 저장)

**Issue #9: 순환 의존성 (Circular Dependencies) (Medium)**
- **문제**: EventBus ↔ StateManager ↔ HistoryManager 순환
  ```
  StateManager → EventBus (emit)
  EventBus → HistoryManager (구독)
  HistoryManager → StateManager (apply)
  StateManager → EventBus (다시 emit)
  ```
- **해결 방안**: 의존성 계층화
  ```
  Layer 3: HistoryManager, PersistenceManager (EventBus 구독)
  Layer 2: EventBus (중앙 허브)
  Layer 1: StateManager (EventBus에 발행만)
  ```
  - 규칙: StateManager는 발행만, HistoryManager는 구독만

**Issue #10: 테스트 가능성 (Testability) (High)**
- **문제**: Command 테스트에 4-5개 mock 필요
- **해결 방안**: StateContextBuilder
  ```typescript
  export class StateContextBuilder {
      private nodes = new Map<NodeId, MindMapNode>();

      withNode(node: MindMapNode): this {
          this.nodes.set(node.id, node);
          return this;
      }

      build(): StateContext { /* ... */ }
  }

  // 테스트
  const context = new StateContextBuilder()
      .withNode({ id: 'node-1', content: 'Test' })
      .build();

  command.execute(context);
  expect(context.persistent.graph.nodes.has('node-1')).toBe(false);
  ```

**우선순위 매트릭스:**

| Issue | 심각도 | Phase 3.0 반영 |
|---|---|---|
| #1: 메모리 오버헤드 | 🔴 Critical | ✅ Inverse Operations |
| #2: 타입 안전성 | 🟡 High | ✅ Runtime Validation |
| #3: 보일러플레이트 | 🟡 High | ❌ Phase 3.3 |
| #4: Persistence 과분리 | 🟢 Medium | ✅ 통합 클래스 |
| #5: Serializer 검증 | 🟢 Medium | ✅ Fallback Values |
| #6: AutoSave 레이스 | 🔴 Critical | ✅ Lock 메커니즘 |
| #7: EventEmitter 주입 | 🟡 High | ✅ Init Guard |
| #9: 순환 의존성 | 🟢 Medium | ✅ 계층화 규칙 |
| #10: 테스트 가능성 | 🟡 High | ✅ ContextBuilder |

**Phase 3.0 즉시 반영 사항 (10개):**
1. ✅ Inverse Operation 패턴 (메모리 90MB → 5MB)
2. ✅ Runtime Event Validation
3. ✅ AutoSave Lock 메커니즘 (isSaving 플래그)
4. ✅ Persistence 클래스 통합 (5개 → 2개)
5. ✅ Serializer Fallback Values
6. ✅ EventEmitter Initialization Guard
7. ✅ 의존성 계층화 규칙 문서화
8. ✅ StateContextBuilder 작성
9. ✅ Debounce 3초로 증가 (1초 → 3초)
10. ✅ 초기화 순서 문서화

**최종 결론:**
- 설계는 근본적으로 건전 (폐기 불필요)
- 10가지 전술적 개선으로 프로덕션 준비 완료
- Phase 4로 안전하게 진행 가능

---

### 2026-01-12 (Phase 3.0 MVP 초기 구현 시작)

#### ✅ Phase 3.0 MVP 초기 구현 완료 - EventBus 및 StateManager 통합

**구현된 파일 목록:**
```
src/
├── events/
│   └── EventBus.ts              ✅ 60 lines - 이벤트 구독/발행 최소 구현
└── state/
    └── StateManager.ts          ✅ 수정 - EventBus 통합 (emitSafe 추가)
```

**핵심 구현 내용:**

1. **EventBus.ts - 이벤트 구독/발행 최소 구현**

   **구현된 클래스:**
   ```typescript
   export class EventBus {
       private listeners: Map<string, Set<(payload: unknown) => void>> = new Map();
   }
   ```

   **핵심 메서드:**

   **`on(eventName: string, handler: Function): () => void`**
   - 이벤트 구독 메서드
   - **런타임 검증**: eventName이 비어있지 않은 문자열인지 확인
   - **런타임 검증**: handler가 함수인지 확인
   - **내부 구조**: `Map<eventName, Set<handlers>>` 형태로 중복 핸들러 방지
   - **반환값**: 구독 해제 함수 (클로저로 핸들러 참조 유지)
   - **자동 정리**: 핸들러가 0개가 되면 Map에서 해당 이벤트 키 제거

   **`emit(eventName: string, payload: unknown): void`**
   - 이벤트 발행 메서드
   - **런타임 검증**: eventName이 비어있지 않은 문자열인지 확인
   - **런타임 검증**: payload가 undefined가 아닌지 확인 (Phase 3.0 MVP 요구사항)
   - **에러 처리**: 핸들러 실행 중 예외 발생 시 조용히 삼킴 (StateManager 동작에 영향 없음)
   - **안전성**: 핸들러가 없으면 조용히 반환 (에러 없음)

   **설계 원칙:**
   - **최소 연결부**: 시스템이 아닌 "연결부"로 설계
   - **실패 시 즉시 제거 가능**: 파일 삭제만으로 롤백 가능
   - **외부 상태 접근 금지**: in-memory 구조만 사용
   - **비책임 명시**: once/off/clear, 타입 정의, 로깅, 외부 연동 모두 제외

2. **StateManager.ts - EventBus 선택적 통합**

   **추가된 필드:**
   ```typescript
   private eventBus?: EventBus;  // 선택적 주입 (optional)
   ```

   **추가된 메서드:**

   **`setEventBus(eventBus: EventBus): void`**
   - EventBus 선택적 주입 메서드
   - **설계 철학**: 주입되지 않아도 기존 동작 유지 (optional)
   - **통합 방식**: setter 기반 주입 (생성자 시그니처 변경 없음)
   - **Phase 2.5 경계 준수**: Snapshot 철학 훼손 없음

   **`emitSafe(eventName: string, payload: unknown): void` (private)**
   - EventBus에 안전하게 발행하는 내부 헬퍼 메서드
   - **방어적 호출**: eventBus가 설정되지 않았으면 조용히 반환
   - **에러 격리**: emit() 호출 시 예외 발생해도 StateManager 동작에 영향 없음
   - **핵심 로직**:
     ```typescript
     if (!this.eventBus) return;  // 주입 안 됨 → 무시
     try {
         this.eventBus.emit(eventName, payload);
     } catch {
         // swallow to keep StateManager behavior unaffected
     }
     ```

   **이벤트 발행 위치 (3곳만 허용):**

   **`addNode(node: MindMapNode): void`**
   - 노드 추가 후 `emitSafe('nodeCreated', { node })` 호출
   - **발행 시점**: 상태 변경 직후 (루트 노드 설정 포함)
   - **payload 구조**: `{ node: MindMapNode }`

   **`removeNode(nodeId: NodeId): void`**
   - 노드 제거 후 `emitSafe('nodeDeleted', { nodeId })` 호출
   - **발행 시점**: 상태 변경 직후
   - **payload 구조**: `{ nodeId: NodeId }`

   **`updateNode(nodeId: NodeId, updates: Partial<MindMapNode>): void`**
   - 노드 업데이트 후 `emitSafe('nodeUpdated', { node })` 호출
   - **발행 시점**: 상태 변경 직후 (updatedAt 갱신 포함)
   - **payload 구조**: `{ node: MindMapNode }` (업데이트된 전체 노드)

   **절대 금지 사항 준수:**
   - ✅ 생성자 시그니처 변경 없음
   - ✅ 기존 public 메서드 파라미터/반환 타입 변경 없음
   - ✅ getSnapshot(), 조회 메서드에서 emit 호출 없음
   - ✅ EphemeralState 관련 메서드(selectNode, setEditingNode)에서 emit 호출 없음
   - ✅ EventBus import 외 새로운 의존성 추가 없음

3. **통합 가능성 심사 및 허가**

   **심사 결과: 허용**
   - StateManager의 Snapshot 철학 훼손 없음
   - 기존 public API 수정 없음
   - 실패 시 통합 코드만 제거하면 롤백 가능

   **허용된 최소 형태:**
   - setter 기반 선택적 주입
   - 노드 추가/삭제/업데이트 3곳에만 emit 호출
   - emitSafe로 방어적 호출

4. **History 레이어 진입 심사 및 허가**

   **심사 결과: 허용**
   - StateManager 책임 침범 없음 (외부 래퍼 패턴)
   - EventBus/StateManager 통합 확장 불필요
   - 실패 시 History 관련 코드만 제거하면 롤백 가능
   - Undo-only로도 의미 성립

   **허용된 최소 범위:**
   - Undo-only History 레이어 (redo 제외)
   - Inverse Operation 패턴 (Command.undo()로 복원)
   - StateManager의 apply()/getContext() 활용
   - 외부 래퍼로 StateManager 감싸기

**Phase 3.0 초기 구현 체크리스트:**
- ✅ EventBus.ts 단일 파일 구현 완료
- ✅ StateManager.setEventBus() 추가 완료
- ✅ StateManager.emitSafe() 추가 완료
- ✅ addNode/removeNode/updateNode에서 emitSafe 호출 완료
- ✅ 통합 가능성 심사 완료 (허용)
- ✅ History 레이어 진입 심사 완료 (허용)
- ⏳ HistoryManager 구현 대기 중
- ⏳ UndoableCommand 인터페이스 정의 대기 중
- ⏳ 기본 Command 구현 대기 중

**다음 작업:**
1. HistoryManager 간소화 구현 (Undo-only, Inverse Operation)
2. UndoableCommand 인터페이스 정의
3. CreateNodeCommand, DeleteNodeCommand 구현
4. Renderer 이벤트 구독 구현
5. main.ts 초기화 로직 작성

---

### 2026-01-12 (Phase 0)
- **완료**: 아키텍처 설계서 v4.0 작성
- **완료**: 코딩 주의사항 가이드 작성
- **완료**: 개발 로드맵 작성
- **완료**: Dev_Log.md 초기화
- **완료**: Phase2_CheckPoint.md 작성 (Snapshot 철학 명시)

---

## 🚀 앞으로 구현해야 할 기능

### Phase 3.0 MVP (다음 작업)

**목표:** Phase 3 설계의 최소 동작 버전 (Minimal Viable Product)
**예상 기간:** 2-3주
**조건:**
- Phase 2.5 코드 수정 최소화
- Undo/Redo 1단계 단순 버전만
- Event 시스템은 내부 소비만 (Renderer만 구독)
- Persistence는 JSON 직렬화 수준 (AutoSave 제외)

#### 1. EventBus 최소 구현 ✅ 완료

**구현 완료된 파일:**
- ✅ `src/events/EventBus.ts` (신규, 60 lines) - 완료
- ❌ `src/events/eventTypes.ts` (신규) - Phase 3.0 MVP에서 제외 (타입 안전성은 Phase 3.1)

**핵심 기능:**
```typescript
// src/events/eventTypes.ts
export interface EventPayloadMap {
    'nodeCreated': { node: MindMapNode };
    'nodeDeleted': { nodeId: NodeId };
    'nodeUpdated': { node: MindMapNode };
    'stateChanged': { snapshot: StateSnapshot };
}

export type EventListener<K extends keyof EventPayloadMap> = (
    payload: EventPayloadMap[K]
) => void;

export type Unsubscribe = () => void;
```

```typescript
// src/events/EventBus.ts
export class EventBus {
    private listeners: Map<string, Set<Function>> = new Map();

    // ✅ Phase 3.0 MVP: on()만 구현
    on<K extends keyof EventPayloadMap>(
        event: K,
        listener: EventListener<K>
    ): Unsubscribe {
        // Runtime validation 추가
        if (!this.isValidEvent(event)) {
            throw new Error(`Unknown event: ${event}`);
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);

        return () => this.listeners.get(event)?.delete(listener);
    }

    emit<K extends keyof EventPayloadMap>(
        event: K,
        payload: EventPayloadMap[K]
    ): void {
        const listeners = this.listeners.get(event);
        if (!listeners) return;

        listeners.forEach(listener => {
            try {
                listener(payload);
            } catch (error) {
                console.error(`EventBus error in ${event}:`, error);
            }
        });
    }

    // ❌ Phase 3.0 MVP: once(), off(), clear() 제외 (Phase 3.1)
}
```

**변경 완료된 파일:**
- ✅ `src/state/StateManager.ts` - 완료
  - ✅ `setEventBus(eventBus: EventBus)` 메서드 추가 완료
  - ✅ `emitSafe()` 메서드 추가 완료 (private, 방어적 호출)
  - ✅ `addNode()`/`removeNode()`/`updateNode()`에서 emitSafe 호출 완료 (3곳)
  - ✅ 선택적 주입 방식 (Initialization Guard 대신 emitSafe로 처리)

```typescript
// StateManager 수정 예시
export class StateManager {
    private eventBus: EventBus | null = null;
    private isInitialized = false;

    setEventBus(eventBus: EventBus): void {
        this.eventBus = eventBus;
        this.isInitialized = true;
    }

    protected emit<K extends keyof EventPayloadMap>(
        event: K,
        payload: EventPayloadMap[K]
    ): void {
        if (!this.isInitialized) {
            throw new Error('StateManager not initialized. Call setEventBus() first.');
        }
        this.eventBus!.emit(event, payload);
    }

    addNode(node: MindMapNode): void {
        this.persistentState.graph.nodes.set(node.id, node);

        if (!this.persistentState.graph.rootId) {
            this.persistentState.graph.rootId = node.id;
        }

        // ✅ Phase 3.0 MVP: 이벤트 발행 활성화
        this.emit('nodeCreated', { node });
    }

    // removeNode, updateNode도 동일하게 활성화
}
```

#### 2. HistoryManager 간소화 구현 ⏳ 진행 예정

**구현할 파일:**
- ⏳ `src/history/HistoryManager.ts` (신규) - 진입 허가 완료, 구현 대기
- ⏳ `src/history/historyTypes.ts` (신규) - UndoableCommand 인터페이스 정의 필요

**핵심 기능:**
```typescript
// src/history/historyTypes.ts
export interface UndoableCommand extends StateCommand {
    description: string;  // 필수
    undo(context: StateContext): void;
}
```

```typescript
// src/history/HistoryManager.ts
export class HistoryManager {
    private stateManager: StateManager;
    private undoStack: UndoableCommand[] = [];
    // ❌ Phase 3.0 MVP: redoStack 제외 (Phase 3.1)
    // ❌ Phase 3.0 MVP: CommandSnapshot 제외 (Inverse Operation 사용)
    private readonly MAX_HISTORY = 10;  // ✅ Phase 3.0 MVP: 10으로 제한

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
    }

    // ✅ Phase 3.0 MVP: execute + undo만
    execute(command: UndoableCommand): StateSnapshot {
        const snapshot = this.stateManager.apply(command);
        this.undoStack.push(command);

        // MAX_HISTORY 제한
        if (this.undoStack.length > this.MAX_HISTORY) {
            this.undoStack.shift();
        }

        return snapshot;
    }

    undo(): StateSnapshot | null {
        const command = this.undoStack.pop();
        if (!command) return null;

        const context = this.getStateContext();
        command.undo(context);

        return this.stateManager.getSnapshot();
    }

    canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    private getStateContext(): StateContext {
        // StateManager에서 context 가져오기 (Phase 3.0에서 추가 필요)
        return (this.stateManager as any).getContext();
    }

    // ❌ Phase 3.0 MVP: redo(), canRedo() 제외
}
```

#### 3. 기본 Command 2-3개 구현

**구현할 파일:**
- `src/history/commands/CreateNodeCommand.ts` (신규)
- `src/history/commands/DeleteNodeCommand.ts` (신규)
- `src/history/commands/UpdateNodeCommand.ts` (신규, 선택적)

**CreateNodeCommand:**
```typescript
export class CreateNodeCommand implements UndoableCommand {
    description = 'Create Node';
    private nodeId: NodeId;
    private node: MindMapNode;
    private parentId: NodeId | null;

    constructor(node: MindMapNode, parentId: NodeId | null) {
        this.nodeId = node.id;
        this.node = node;
        this.parentId = parentId;
    }

    execute(context: StateContext): void {
        context.persistent.graph.nodes.set(this.nodeId, this.node);

        if (!context.persistent.graph.rootId) {
            context.persistent.graph.rootId = this.nodeId;
        }

        // 부모의 childIds에 추가
        if (this.parentId) {
            const parent = context.persistent.graph.nodes.get(this.parentId);
            if (parent) {
                parent.childIds.push(this.nodeId);
            }
        }
    }

    undo(context: StateContext): void {
        // 노드 제거
        context.persistent.graph.nodes.delete(this.nodeId);

        // 부모의 childIds에서 제거
        if (this.parentId) {
            const parent = context.persistent.graph.nodes.get(this.parentId);
            if (parent) {
                const index = parent.childIds.indexOf(this.nodeId);
                if (index !== -1) {
                    parent.childIds.splice(index, 1);
                }
            }
        }

        // rootId 복원 (필요시)
        if (context.persistent.graph.rootId === this.nodeId) {
            context.persistent.graph.rootId = '';
        }
    }
}
```

**DeleteNodeCommand:**
```typescript
export class DeleteNodeCommand implements UndoableCommand {
    description = 'Delete Node';
    private nodeId: NodeId;
    private deletedNode: MindMapNode | null = null;
    private deletedEdges: MindMapEdge[] = [];
    private parentId: NodeId | null = null;
    private childIndex: number = -1;

    constructor(nodeId: NodeId) {
        this.nodeId = nodeId;
    }

    execute(context: StateContext): void {
        // 1. 노드 백업
        this.deletedNode = context.persistent.graph.nodes.get(this.nodeId) || null;
        if (!this.deletedNode) return;

        // 2. 부모의 childIds에서 제거 (복원용 정보 저장)
        this.parentId = this.deletedNode.parentId;
        if (this.parentId) {
            const parent = context.persistent.graph.nodes.get(this.parentId);
            if (parent) {
                this.childIndex = parent.childIds.indexOf(this.nodeId);
                if (this.childIndex !== -1) {
                    parent.childIds.splice(this.childIndex, 1);
                }
            }
        }

        // 3. 연결된 엣지 찾기 및 백업
        this.deletedEdges = [];
        context.persistent.graph.edges.forEach((edge, edgeId) => {
            if (edge.fromNodeId === this.nodeId || edge.toNodeId === this.nodeId) {
                this.deletedEdges.push({ ...edge });
                context.persistent.graph.edges.delete(edgeId);
            }
        });

        // 4. 노드 제거
        context.persistent.graph.nodes.delete(this.nodeId);
    }

    undo(context: StateContext): void {
        // 1. 노드 복원
        if (this.deletedNode) {
            context.persistent.graph.nodes.set(this.nodeId, this.deletedNode);
        }

        // 2. 부모의 childIds 복원
        if (this.parentId && this.childIndex !== -1) {
            const parent = context.persistent.graph.nodes.get(this.parentId);
            if (parent) {
                parent.childIds.splice(this.childIndex, 0, this.nodeId);
            }
        }

        // 3. 엣지 복원
        this.deletedEdges.forEach(edge => {
            context.persistent.graph.edges.set(edge.id, edge);
        });
    }
}
```

**UpdateNodeCommand (선택적):**
```typescript
export class UpdateNodeCommand implements UndoableCommand {
    description: string;
    private nodeId: NodeId;
    private updates: Partial<MindMapNode>;
    private previousValues: Partial<MindMapNode> = {};

    constructor(nodeId: NodeId, updates: Partial<MindMapNode>) {
        this.nodeId = nodeId;
        this.updates = updates;
        this.description = `Update Node: ${Object.keys(updates).join(', ')}`;
    }

    execute(context: StateContext): void {
        const node = context.persistent.graph.nodes.get(this.nodeId);
        if (!node) return;

        // 이전 값 백업
        Object.keys(this.updates).forEach(key => {
            this.previousValues[key] = (node as any)[key];
        });

        // 업데이트 적용
        Object.assign(node, this.updates);
        node.updatedAt = Date.now();
    }

    undo(context: StateContext): void {
        const node = context.persistent.graph.nodes.get(this.nodeId);
        if (!node) return;

        // 이전 값 복원
        Object.assign(node, this.previousValues);
        node.updatedAt = Date.now();
    }
}
```

**❌ Phase 3.0 MVP 제외:**
- MoveNodeCommand (Phase 3.1)
- CompositeCommand (Phase 3.1)
- CommandFactory (직접 new XxxCommand() 사용)

#### 4. Renderer 이벤트 구독 ⏳ 진행 예정

**변경할 파일:**
- ⏳ `src/rendering/Renderer.ts` - EventBus 구독 로직 추가 필요

```typescript
export class Renderer {
    private svgElement: SVGSVGElement;
    private eventBus: EventBus;
    private unsubscribers: Unsubscribe[] = [];

    constructor(svgElement: SVGSVGElement, eventBus: EventBus) {
        this.svgElement = svgElement;
        this.eventBus = eventBus;
        this.subscribeToEvents();
    }

    private subscribeToEvents(): void {
        // ✅ Phase 3.0 MVP: 4개 이벤트만 구독
        this.unsubscribers.push(
            this.eventBus.on('nodeCreated', ({ node }) => {
                this.scheduleRender();  // RAF로 렌더링 예약
            })
        );

        this.unsubscribers.push(
            this.eventBus.on('nodeDeleted', ({ nodeId }) => {
                this.scheduleRender();
            })
        );

        this.unsubscribers.push(
            this.eventBus.on('nodeUpdated', ({ node }) => {
                this.scheduleRender();
            })
        );

        this.unsubscribers.push(
            this.eventBus.on('stateChanged', ({ snapshot }) => {
                this.scheduleRender();
            })
        );
    }

    destroy(): void {
        // 모든 이벤트 구독 해제
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];

        this.stop();
    }
}
```

#### 5. main.ts 초기화 로직 ⏳ 진행 예정

**변경할 파일:**
- ⏳ `src/main.ts` - EventBus → StateManager → HistoryManager 초기화 순서 구현 필요

```typescript
class NeroMindPlugin extends Plugin {
    private eventBus: EventBus | null = null;
    private stateManager: StateManager | null = null;
    private historyManager: HistoryManager | null = null;

    private initializePlugin(): void {
        console.log('NeroMind: Initializing plugin...');

        // ✅ Phase 3.0 MVP: 초기화 순서
        // 1. EventBus 생성 (독립)
        this.eventBus = new EventBus();

        // 2. StateManager 생성 및 EventBus 주입
        this.stateManager = new StateManager();
        this.stateManager.setEventBus(this.eventBus);

        // 3. HistoryManager 생성 (StateManager 래핑)
        this.historyManager = new HistoryManager(this.stateManager);

        // 4. Renderer는 NeroMindView에서 생성 시 EventBus 전달
        //    (NeroMindView.onOpen()에서 처리)

        // Disposable 등록 (역순 destroy)
        this.disposables.push(this.historyManager);
        this.disposables.push(this.stateManager);
        this.disposables.push(this.eventBus);

        console.log('NeroMind: Plugin initialized successfully');
    }
}
```

#### 6. 테스트 계획 (간소화)

**✅ Phase 3.0 MVP: 수동 테스트만**
1. 플러그인 로드 → 에러 없이 초기화
2. 노드 생성 → Renderer 업데이트 확인
3. 노드 삭제 → Renderer 업데이트 확인
4. Ctrl+Z → Undo 동작 확인
5. 플러그인 언로드 → 에러 없이 정리

**❌ Phase 3.0 MVP 제외:**
- 자동화 테스트 (Phase 3.1)
- 성능 테스트 (Phase 3.2)
- 통합 테스트 (Phase 3.2)

#### 7. Phase 3.0 MVP 체크리스트

**Event System:**
- [x] EventBus 클래스 구현 (on, emit만) ✅ 완료
- [ ] eventTypes.ts 정의 (4개 이벤트) - Phase 3.0 MVP에서 제외 (타입 안전성은 Phase 3.1)
- [x] Runtime validation 추가 ✅ 완료 (eventName, payload undefined 체크)
- [x] StateManager.setEventBus() 추가 ✅ 완료
- [x] StateManager.emitSafe() 추가 ✅ 완료 (private, 방어적 호출)
- [x] StateManager 3개 메서드에서 emitSafe() 활성화 ✅ 완료 (addNode, removeNode, updateNode)
- [ ] Renderer 이벤트 구독 (subscribeToEvents) ⏳ 대기 중
- [ ] Renderer unsubscribe 구현 ⏳ 대기 중

**History System:**
- [ ] UndoableCommand 인터페이스 정의 ⏳ 대기 중 (진입 허가 완료)
- [ ] HistoryManager 클래스 구현 (execute, undo만) ⏳ 대기 중 (진입 허가 완료)
- [ ] CreateNodeCommand 구현 ⏳ 대기 중
- [ ] DeleteNodeCommand 구현 (엣지 제거 포함) ⏳ 대기 중
- [ ] UpdateNodeCommand 구현 (선택적) ⏳ 대기 중
- [ ] StateManager.getContext() 접근 방법 결정 ⏳ 대기 중 (private이므로 HistoryManager에서 접근 방법 필요)

**Integration:**
- [ ] main.ts 초기화 로직 작성 (EventBus → StateManager → HistoryManager) ⏳ 대기 중
- [ ] Disposable 등록 순서 확인 ⏳ 대기 중
- [ ] 빌드 성공 확인 ⏳ 대기 중
- [ ] 수동 테스트 5개 항목 통과 ⏳ 대기 중

**Documentation:**
- [x] Dev_Log.md 업데이트 ✅ 완료
- [ ] Phase 3.0 완료 체크포인트 작성 ⏳ 진행 중

---

### Phase 3.1 (Phase 3.0 이후)

**Phase 3.0 완료 후 추가할 기능:**

1. **Redo 기능 추가**
   - HistoryManager.redoStack 추가
   - redo() 메서드 구현
   - canRedo() 메서드 구현
   - 'historyChanged' 이벤트 발행

2. **EventBus 기능 확장**
   - once() 메서드 추가
   - off() 메서드 추가
   - clear() 메서드 추가
   - Enum 기반 Events 마이그레이션

3. **Command 추가**
   - MoveNodeCommand 구현
   - CompositeCommand 구현
   - CommandFactory 패턴 도입

4. **Persistence 기본 구현**
   - PersistenceManager 클래스 (통합 버전)
   - FileManager 클래스 (Obsidian Vault API)
   - StateManager.getPersistentState() 추가
   - StateManager.restorePersistentState() 추가
   - 수동 save/load 기능

5. **테스트 추가**
   - StateContextBuilder 작성
   - Command 단위 테스트 (3개)
   - EventBus 단위 테스트
   - 통합 테스트 1개 (create → undo → redo)

---

### Phase 3.2 (Phase 3.1 이후)

**Phase 3.1 완료 후 추가할 기능:**

1. **AutoSave 구현**
   - AutoSaveManager 로직 (PersistenceManager 내부로 통합)
   - Debounce 3초
   - isSaving 플래그 (Race condition 방지)
   - 'stateChanged' 이벤트 구독

2. **Functional Commands 패턴**
   - Commands 팩토리 함수 작성
   - 기존 Command 클래스 일부를 함수형으로 변환
   - 보일러플레이트 감소

3. **Schema Validation**
   - Ajv 라이브러리 추가
   - SerializedState 스키마 정의
   - Fallback values 구현

4. **성능 최적화**
   - 이벤트 배치 처리 검토
   - RAF 렌더링 최적화
   - 메모리 프로파일링

5. **문서화**
   - API 문서 작성
   - 사용 예시 작성
   - 트러블슈팅 가이드

---

### Phase 4 (Phase 3 완료 후)

**고급 기능 구현:**

1. **AutoAligner** (자동 정렬)
   - 서브트리 정렬 알고리즘
   - 충돌 감지 및 해결
   - 핀 고정 노드 존중

2. **MiniMap** (미니맵)
   - Canvas 기반 렌더링
   - 클릭 → 이동
   - 크기/투명도 조절

3. **LOD (Level of Detail)**
   - 줌 레벨에 따른 렌더링 최적화
   - 4단계 LOD (minimal, basic, standard, full)
   - 강제 승격 규칙

4. **Settings UI 완성**
   - 테마 선택
   - 단축키 커스터마이징
   - 고급 설정

5. **Export/Import**
   - Markdown 내보내기
   - 이미지 내보내기
   - PDF 내보내기

---

## 📌 중요 결정 사항 로그

| 날짜 | 결정 사항 | 이유 |
|------|-----------|------|
| 2026-01-12 | Glassmorphism은 HTML 오버레이로 구현 | SVG 내부 backdrop-filter 미지원 |
| 2026-01-12 | Command 패턴으로 Undo/Redo 구현 (Phase 3) | 상태 변경 추적 및 복원 용이 |
| 2026-01-12 | 방향성은 부모로부터 상속 | 일관된 레이아웃 유지 |
| 2026-01-12 | **Snapshot 철학 채택** | Renderer가 State를 직접 참조하지 않고 복사본만 사용 |
| 2026-01-12 | **Phase 2에서 undo/redo 금지** | Command 계약이 불완전한 상태에서 history 구현 시 나중에 전체 재작업 필요 |
| 2026-01-12 | **State는 "현재"만 안다** | 과거 상태를 모르게 하여 확장성 보장 (무지함이 힘) |
| 2026-01-12 | **disposables 소유권은 main.ts만** | 모듈이 자기 자신을 등록하면 Phase 3부터 디버깅 지옥 |
| 2026-01-12 | **main.ts 생명주기 구조는 영구 불변** | initializePlugin(), onunload(), disposables 역순 - 절대 변경 금지 |
| 2026-01-12 | **Phase 3: HistoryManager는 StateManager 외부 래퍼** | StateManager는 히스토리를 모르게 하여 책임 분리 |
| 2026-01-12 | **Phase 3: Inverse Operation 패턴 채택** | CommandSnapshot (90MB) 대신 Command.undo()로 복원 (5MB) |
| 2026-01-12 | **Phase 3: EventBus Runtime Validation** | 문자열 이벤트 이름 오타 방지, Phase 3.1에서 Enum으로 전환 |
| 2026-01-12 | **Phase 3: PersistenceManager 통합 클래스** | 5개 클래스를 2개로 통합 (과도한 추상화 지양) |
| 2026-01-12 | **Phase 3: AutoSave Lock 메커니즘 필수** | isSaving 플래그로 Race condition 방지 |
| 2026-01-12 | **Phase 3: 의존성 계층화 규칙** | StateManager는 발행만, HistoryManager는 구독만 (순환 의존성 차단) |
| 2026-01-12 | **Phase 3.0 MVP: Redo 제외** | Undo만 구현, Redo는 Phase 3.1로 연기 |
| 2026-01-12 | **Phase 3.0 MVP: MAX_HISTORY=10** | 메모리 절약, Phase 3.1에서 100으로 증가 |
| 2026-01-12 | **Phase 3.0 MVP: AutoSave 제외** | 수동 저장만, AutoSave는 Phase 3.2로 연기 |
| 2026-01-12 | **Phase 3.0: EventBus 단일 파일 구현 완료** | 최소 연결부로 설계, 실패 시 즉시 제거 가능 |
| 2026-01-12 | **Phase 3.0: StateManager EventBus 통합 완료** | setter 기반 선택적 주입, emitSafe로 방어적 호출 |
| 2026-01-12 | **Phase 3.0: History 레이어 진입 허가** | Undo-only, Inverse Operation 패턴, 외부 래퍼 구조 |
| 2026-01-13 | **Phase 3.0 MVP 완료: HistoryManager 구현** | Wrapper Pattern, Inverse Operation, MAX_HISTORY=10 |
| 2026-01-13 | **Phase 3.0 MVP 완료: UndoableCommand 인터페이스** | execute + undo 쌍, Inverse Operation 패턴 |
| 2026-01-13 | **Phase 3.1 완료: NeroMindView History 통합** | StateManager + HistoryManager 초기화, Undo UI, 단축키 |
| 2026-01-13 | **Phase 3.2 완료: CreateNodeCommand 연결** | historyManager.execute(command) 호출, 테스트 코드 |
| 2026-01-13 | **Phase 3.3 완료: 실제 사용자 액션 연결** | 더블클릭으로 노드 생성, 테스트 코드 제거 |

---

## 🔵 Phase 3.0 MVP - HistoryManager & UndoableCommand (2026-01-13)

### ✅ 완료된 구현

#### 1. **UndoableCommand 인터페이스** (`src/history/UndoableCommand.ts`)

**구조:**
```typescript
interface UndoableCommand {
  execute(context: StateContext): void;  // 순방향: 작업 실행
  undo(context: StateContext): void;     // 역방향: 작업 취소 (Inverse Operation)
  description: string;                   // 사용자 라벨 ("Add node" 등)
}
```

**핵심 설계:**
- Inverse Operation 패턴: `execute()`와 `undo()`는 정확한 역관계
- StateContext만 접근: EventBus, Renderer 참조 금지
- 메모리 스냅샷 금지: 필요한 데이터만 커맨드에 보존

---

#### 2. **HistoryManager 클래스** (`src/history/HistoryManager.ts`)

**핵심 메서드:**

```typescript
// execute(command): 커맨드 실행 및 히스토리 저장
execute(command: UndoableCommand): StateSnapshot {
  const snapshot = this.stateManager.apply(command);  // StateManager.apply() 호출
  this.commandQueue.push(command);                     // 히스토리 저장
  if (this.commandQueue.length > this.MAX_HISTORY) {   // MAX_HISTORY=10 제한
    this.commandQueue.shift();                         // FIFO로 가장 오래된 것 제거
  }
  return snapshot;
}

// undo(): 마지막 작업 취소
undo(): StateSnapshot {
  if (!this.canUndo()) throw new Error('No history to undo');

  const command = this.commandQueue.pop();             // 히스토리에서 제거
  const undoWrapper = {
    description: `Undo: ${command.description}`,
    execute: (context) => command.undo(context)        // Inverse Operation
  };

  return this.stateManager.apply(undoWrapper);         // StateManager.apply()로 실행
}

// canUndo(): 취소 가능 여부
canUndo(): boolean {
  return this.commandQueue.length > 0;
}
```

**Wrapper Pattern:**
- `constructor(stateManager: StateManager)`: StateManager를 외부에서 감싼다
- `apply(command)` 호출로만 상호작용 (StateManager 내부 상태 직접 조작 금지)
- HistoryManager 제거 시 StateManager는 독립적으로 작동

**제약사항:**
- EventBus 통합 금지 (Phase 3.0 범위 초과)
- Redo 기능 금지 (Undo-only 정책)
- 메모리 스냅샷 저장 금지 (5MB 절약)

---

#### 3. **예제 커맨드 5개** (`src/history/examples.ts`)

**1. AddNodeCommand** - 노드 추가
```typescript
execute(context): context.graph.nodes.set(id, node)
undo(context):    context.graph.nodes.delete(id)
```

**2. RemoveNodeCommand** - 노드 제거
```typescript
execute(context): savedNode = get(); delete()
undo(context):    set(savedNode)
```

**3. UpdateNodeCommand** - 노드 업데이트
```typescript
execute(context): savedValues = get(); assign(updates)
undo(context):    assign(savedValues)
```

**4. MoveNodeCommand** - 노드 이동
```typescript
execute(context): oldPosition = position; position = newPosition
undo(context):    position = oldPosition
```

**5. SelectNodeCommand** - 노드 선택 (Ephemeral)
```typescript
execute(context): selectedNodeId = nodeId (히스토리 미대상)
undo(context):    selectedNodeId = previousId
```

---

### 📚 문서화

- **INTEGRATION_GUIDE.md** (500+ lines): 설계 원칙, API, 통합 방법, FAQ
- **SELF_VALIDATION_CHECKLIST.md** (400+ lines): 11개 섹션 검증
- **README.md**: 개요, 빠른 시작, 체크리스트
- **QUICK_REFERENCE.md**: 1페이지 치트시트

---

## 🟣 Phase 3.1 - NeroMindView History 통합 (2026-01-13)

### ✅ 추가된 함수

#### 1. **initializeStateManagement()** - State Management 초기화

**목적:** EventBus → StateManager → HistoryManager → Renderer 순서로 초기화

**핵심 로직:**
```typescript
private initializeStateManagement(): void {
  // 1. EventBus 초기화 (선택적)
  this.eventBus = new EventBus();

  // 2. StateManager 초기화 및 EventBus 주입
  this.stateManager = new StateManager();
  this.stateManager.setEventBus(this.eventBus);  // 선택적 주입
  this.addDisposable(this.stateManager);

  // 3. HistoryManager 초기화 (Wrapper Pattern)
  this.historyManager = new HistoryManager(this.stateManager);
  this.addDisposable(this.historyManager);

  // 4. Renderer 초기화
  if (this.svgElement) {
    this.renderer = new Renderer(this.svgElement);
    this.addDisposable(this.renderer);
  }
}
```

**책임:**
- StateManager 래핑을 HistoryManager로만 수행
- disposables 배열에 모두 등록 (onClose에서 역순 정리)

---

#### 2. **createUndoButton()** - Undo 버튼 생성

**목적:** SVG 오버레이에 Undo 버튼 추가

**핵심 로직:**
```typescript
private createUndoButton(): void {
  const overlayEl = this.containerEl.querySelector('.neromind-overlay');

  this.undoButtonEl = overlayEl.createEl('button', {
    text: 'Undo',
    cls: 'neromind-undo-button'
  });

  // 스타일 적용 (우하단 고정)
  this.undoButtonEl.style.position = 'absolute';
  this.undoButtonEl.style.bottom = '20px';
  this.undoButtonEl.style.right = '20px';
  this.undoButtonEl.style.pointerEvents = 'auto';  // overlay는 pointer-events: none

  // 클릭 이벤트 연결
  this.undoButtonEl.addEventListener('click', () => this.handleUndo());

  // 초기 상태 설정
  this.updateUndoButton();
}
```

**위치:** 화면 우하단, overlay 위에 띄움

---

#### 3. **handleUndo()** - Undo 처리

**목적:** canUndo() 확인 후 undo() 호출

**핵심 로직:**
```typescript
private handleUndo(): void {
  if (!this.historyManager || !this.historyManager.canUndo()) {
    console.log('Cannot undo: no history available');
    return;
  }

  try {
    const snapshot = this.historyManager.undo();  // Inverse Operation 실행
    this.renderSnapshot(snapshot);                // 스냅샷 렌더링
    this.updateUndoButton();                      // UI 갱신
    console.log('Undo successful');
  } catch (error) {
    console.error('Undo failed:', error);
  }
}
```

**안전성:**
- null 체크 (historyManager)
- canUndo() 확인 (에러 방지)
- try-catch 에러 처리

---

#### 4. **updateUndoButton()** - Undo 버튼 상태 갱신

**목적:** canUndo() 결과에 따라 버튼 활성화/비활성화

**핵심 로직:**
```typescript
private updateUndoButton(): void {
  if (!this.undoButtonEl || !this.historyManager) return;

  const canUndo = this.historyManager.canUndo();
  this.undoButtonEl.disabled = !canUndo;

  // 비활성화 시 스타일 변경
  if (!canUndo) {
    this.undoButtonEl.style.opacity = '0.5';
    this.undoButtonEl.style.cursor = 'not-allowed';
  } else {
    this.undoButtonEl.style.opacity = '1';
    this.undoButtonEl.style.cursor = 'pointer';
  }
}
```

**시각적 피드백:**
- canUndo=true: 활성화 (opacity 1, cursor: pointer)
- canUndo=false: 비활성화 (opacity 0.5, cursor: not-allowed)

---

#### 5. **registerShortcuts()** - 단축키 등록

**목적:** Ctrl/Cmd + Z로 Undo 트리거

**핵심 로직:**
```typescript
private registerShortcuts(): void {
  this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
    // Ctrl/Cmd + Z (Shift 없음 = Undo만, Redo 차단)
    if ((evt.ctrlKey || evt.metaKey) && evt.key === 'z' && !evt.shiftKey) {
      evt.preventDefault();
      this.handleUndo();
    }
  });
}
```

**교차 플랫폼:**
- Windows/Linux: Ctrl + Z
- macOS: Cmd + Z
- Redo는 Shift 키 체크로 차단

---

## 🟠 Phase 3.2 - CreateNodeCommand 연결 (2026-01-13)

### ✅ 추가된 함수

#### **createTestNode()** - 테스트 노드 자동 생성

**목적:** Undo 동작 검증용 테스트 코드

**핵심 로직:**
```typescript
private createTestNode(): void {
  if (!this.historyManager) return;

  // 테스트 노드 생성 (고정 위치)
  const testNode: MindMapNode = {
    id: 'test-node-1',
    content: 'Test Node (Press Ctrl/Cmd+Z to undo)',
    position: { x: 400, y: 350 },
    // ...
  };

  // CreateNodeCommand 사용
  const command = new CreateNodeCommand(testNode);

  try {
    // historyManager.execute() → commandQueue.push()
    const snapshot = this.historyManager.execute(command);
    console.log('Test node created via historyManager.execute():', {
      nodeCount: snapshot.nodes.length,
      canUndo: this.historyManager.canUndo()
    });

    this.updateUndoButton();
  } catch (error) {
    console.error('Failed to create test node:', error);
  }
}
```

**용도:**
- Phase 3.2 Undo 동작 검증
- 뷰 열 때 자동으로 1개 노드 생성
- Ctrl/Cmd+Z로 노드 제거 확인 가능

**Phase 3.3에서 제거됨** (실제 사용자 액션으로 대체)

---

## 🟢 Phase 3.3 - 실제 사용자 액션 연결 (2026-01-13)

### ❌ 제거된 함수

**createTestNode()** (52줄) - 자동 테스트 노드 생성 제거
- 테스트용 하드코딩 제거
- 실제 사용자 인터랙션으로 대체

---

### ✅ 추가된 함수

#### 1. **registerCanvasEvents()** - 캔버스 이벤트 등록

**목적:** SVG 캔버스 더블클릭 이벤트 핸들러 등록

**핵심 로직:**
```typescript
private registerCanvasEvents(): void {
  if (!this.svgElement) {
    console.warn('SVG element not initialized');
    return;
  }

  // 더블클릭 이벤트: 클릭 위치에 노드 생성
  this.registerDomEvent(this.svgElement, 'dblclick', (evt: MouseEvent) => {
    this.handleCanvasDoubleClick(evt);
  });
}
```

**책임:**
- DOM 이벤트 리스닝 (Obsidian API registerDomEvent 사용)
- handleCanvasDoubleClick 콜백 연결

---

#### 2. **handleCanvasDoubleClick()** - 실제 사용자 액션 처리 (핵심)

**목적:** 캔버스 더블클릭 위치에 노드 생성 및 히스토리 기록

**핵심 로직:**
```typescript
private handleCanvasDoubleClick(evt: MouseEvent): void {
  if (!this.historyManager || !this.svgElement) return;

  // 1. 더블클릭 위치 계산 (SVG 좌표계)
  const rect = this.svgElement.getBoundingClientRect();
  const x = evt.clientX - rect.left;    // 상대 좌표
  const y = evt.clientY - rect.top;

  // 2. 노드 ID 생성 (타임스탬프 기반, 유니크성 보장)
  const nodeId = `node-${Date.now()}`;

  // 3. MindMapNode 객체 생성 (동적)
  const newNode: MindMapNode = {
    id: nodeId,
    content: 'New Node',
    position: { x, y },              // 클릭 위치
    parentId: null,
    childIds: [],
    direction: null,
    isPinned: false,
    isCollapsed: false,
    linkedNotePath: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // 4. CreateNodeCommand 생성 (Phase 3.0)
  const command = new CreateNodeCommand(newNode);

  try {
    // 5. historyManager.execute(command)
    //    → StateManager.apply(command)
    //    → command.execute(context)
    //    → context.persistent.graph.nodes.set(nodeId, newNode)
    //    → commandQueue.push(command)
    const snapshot = this.historyManager.execute(command);
    console.log('Node created at position:', {
      x, y, nodeId,
      canUndo: this.historyManager.canUndo()
    });

    // 6. Undo 버튼 활성화
    this.updateUndoButton();
  } catch (error) {
    console.error('Failed to create node:', error);
  }
}
```

**핵심 포인트:**
- **좌표계 변환**: evt.clientX - rect.left (화면 좌표 → SVG 로컬 좌표)
- **유니크 ID**: `node-${Date.now()}` (타임스탬프 기반)
- **Wrapper Pattern 준수**: historyManager.execute()만 호출, StateManager 직접 조작 금지
- **Inverse Operation 보증**: CreateNodeCommand.undo()로 정확히 역작동

**사용자 흐름:**
1. 사용자: SVG 캔버스 임의의 위치 더블클릭
2. handleCanvasDoubleClick() 트리거
3. MindMapNode 생성 → CreateNodeCommand 래핑 → historyManager.execute()
4. StateManager.apply(command) → command.execute(context)
5. context.persistent.graph.nodes.set() → 노드 추가됨
6. commandQueue.push(command) → 히스토리 저장
7. updateUndoButton() → Undo 버튼 활성화
8. 사용자: Ctrl/Cmd+Z 입력
9. handleUndo() → historyManager.undo()
10. command.undo(context) → context.persistent.graph.nodes.delete()
11. 노드 제거됨

---

## 📊 Phase 3.0~3.3 통합 요약

| Phase | 담당 파일 | 추가 함수 | 제거 함수 | 핵심 기능 |
|-------|----------|---------|---------|---------|
| **3.0** | HistoryManager.ts, UndoableCommand.ts, examples.ts | `execute(), undo(), canUndo()` | - | Wrapper Pattern, Inverse Operation, MAX_HISTORY=10 |
| **3.1** | NeroMindView.ts | `initializeStateManagement()`, `createUndoButton()`, `handleUndo()`, `updateUndoButton()`, `registerShortcuts()` | - | State 초기화, Undo UI, 단축키 |
| **3.2** | NeroMindView.ts | `createTestNode()` | - | 테스트 노드 자동 생성 (검증용) |
| **3.3** | NeroMindView.ts | `registerCanvasEvents()`, `handleCanvasDoubleClick()` | `createTestNode()` | 실제 사용자 액션(더블클릭) 연결 |

---

## 🚀 앞으로 구현해야 할 기능

### Phase 3.4 - Renderer 통합 (예정)
- `Renderer.render(snapshot)` 메서드 구현
- 노드 시각화 (SVG 렌더링)
- 엣지 시각화 (연결선 렌더링)
- 실시간 업데이트 (RAF 루프)

### Phase 3.5 - 더 많은 커맨드 추가 (예정)
- `DeleteNodeCommand` - 노드 삭제 (엣지 처리)
- `CreateEdgeCommand` - 엣지 생성
- `DeleteEdgeCommand` - 엣지 삭제
- `PinNodeCommand` - 노드 핀 고정
- `RenameNodeCommand` - 노드 텍스트 변경

### Phase 3.6 - 다중 선택 및 배치 작업 (예정)
- `SelectMultipleNodesCommand` - 여러 노드 선택
- `BatchMoveNodesCommand` - 여러 노드 한 번에 이동
- `BatchDeleteNodesCommand` - 여러 노드 한 번에 삭제

### Phase 4 - 고급 기능 (예정)
- **AutoAligner**: 노드 자동 정렬
- **MiniMap**: 미니맵 뷰
- **LOD (Level of Detail)**: 줌 레벨 별 렌더링 최적화
- **Persistence**: 파일 저장/로드
- **Keyboard Shortcuts**: 단축키 커스터마이징
- **Themes**: 다크모드, 라이트모드

---

**문서 끝**

**최종 업데이트:** 2026-01-13 (Phase 3.3 완료 - 실제 사용자 액션 연결, 더블클릭으로 노드 생성)




  ---

  ## Phase 3.4 - Renderer 최소 구현 (2026-01-14)

  ### 목표
  - StateSnapshot을 입력으로 받아 SVG에 노드를 시각화
  - Renderer는 StateManager, HistoryManager, EventBus에 의존하지 않음
  - View는 `Renderer.render(snapshot)`만 호출

  ### 변경 파일
  | 파일 | 변경 유형 |
  |------|-----------|
  | `src/rendering/Renderer.ts` | 수정 |
  | `src/views/NeroMindView.ts` | 수정 |

  ### Renderer.ts 구현 함수

  #### `render(snapshot: StateSnapshot): void`
  ```typescript
  render(snapshot: StateSnapshot): void {
      const nodeLayer = this.getOrCreateNodeLayer();
      this.clearLayer(nodeLayer);

      for (const node of snapshot.nodes) {
          const nodeGroup = this.createNodeGroup(node.id, node.position.x, node.position.y);
          const circle = this.createCircle();
          const text = this.createText(node.content);

          nodeGroup.appendChild(circle);
          nodeGroup.appendChild(text);
          nodeLayer.appendChild(nodeGroup);
      }
  }
  - StateSnapshot을 SVG로 렌더링하는 public 메서드
  - node-layer 획득 → clear → 노드 순회 렌더링

  getOrCreateNodeLayer(): SVGGElement

  - #node-layer 획득 또는 생성
  - #transform-layer 내부에 추가

  clearLayer(layer: SVGGElement): void

  - 레이어 내 모든 자식 요소 제거
  - while (layer.firstChild) 패턴 사용

  createNodeGroup(id: string, x: number, y: number): SVGGElement

  - 노드 그룹 <g> 생성
  - transform: translate(x, y) 적용
  - data-node-id 속성 설정

  createCircle(): SVGCircleElement

  - 반지름 30, 흰색 배경(rgba(255, 255, 255, 0.9))
  - 회색 테두리(rgba(0, 0, 0, 0.15))

  createText(content: string): SVGTextElement

  - 텍스트 중앙 정렬 (text-anchor: middle)
  - Apple 시스템 폰트, 12px

  NeroMindView.ts 수정 함수

  renderSnapshot(snapshot: StateSnapshot): void

  private renderSnapshot(snapshot: StateSnapshot): void {
      console.log('Rendering snapshot:', { nodeCount: snapshot.nodes.length, ... });

      if (this.renderer) {
          this.renderer.render(snapshot);
      }
  }
  - 기존: 주석 처리된 this.renderer.render(snapshot)
  - 변경: 주석 해제하여 실제 렌더링 호출

  handleCanvasDoubleClick(evt: MouseEvent): void

  const snapshot = this.historyManager.execute(command);
  this.renderSnapshot(snapshot);  // Phase 3.4 추가
  this.updateUndoButton();
  - 노드 생성 후 renderSnapshot(snapshot) 호출 추가

  빌드 결과

  - TypeScript 컴파일 성공 (에러 0개)

  ---
  Phase 4.0 - Edge 렌더링 추가 (2026-01-14)

  목표

  - 부모-자식 노드 간 연결선(Edge) 시각화
  - parentId 기반 edge 도출 (snapshot.edges 미사용)
  - Renderer 내부 구현만 변경
  - Phase 3 아키텍처 무변경

  변경 파일
  ┌───────────────────────────┬───────────┐
  │           파일            │ 변경 유형 │
  ├───────────────────────────┼───────────┤
  │ src/rendering/Renderer.ts │ 수정      │
  └───────────────────────────┴───────────┘
  Renderer.ts 추가/수정 함수

  render(snapshot: StateSnapshot): void (수정)

  render(snapshot: StateSnapshot): void {
      this.renderEdges(snapshot);  // 엣지 먼저 (뒤에 그려짐)
      this.renderNodes(snapshot);  // 노드 나중에 (앞에 그려짐)
  }
  - 렌더링 순서: edge-layer → node-layer
  - 노드가 엣지 위에 표시됨

  renderEdges(snapshot: StateSnapshot): void (추가)

  private renderEdges(snapshot: StateSnapshot): void {
      const edgeLayer = this.getOrCreateEdgeLayer();
      this.clearLayer(edgeLayer);

      // 노드 위치 맵 구축 (O(n))
      const nodePositionMap = new Map<string, Position>();
      for (const node of snapshot.nodes) {
          nodePositionMap.set(node.id, node.position);
      }

      // parentId 기반 엣지 렌더링 (O(n))
      for (const node of snapshot.nodes) {
          if (node.parentId !== null) {
              const parentPosition = nodePositionMap.get(node.parentId);
              if (parentPosition) {
                  const line = this.createLine(parentPosition, node.position);
                  edgeLayer.appendChild(line);
              }
          }
      }
  }
  - parentId 기반 부모-자식 연결선 렌더링
  - 시간복잡도: O(2n)

  renderNodes(snapshot: StateSnapshot): void (추가)

  - Phase 3.4 노드 렌더링 로직을 별도 메서드로 분리

  getOrCreateEdgeLayer(): SVGGElement (추가)

  private getOrCreateEdgeLayer(): SVGGElement {
      let edgeLayer = this.svgElement.querySelector('#edge-layer') as SVGGElement | null;

      if (!edgeLayer) {
          edgeLayer = document.createElementNS(SVG_NS, 'g') as SVGGElement;
          edgeLayer.setAttribute('id', 'edge-layer');

          const transformLayer = this.svgElement.querySelector('#transform-layer');
          if (transformLayer) {
              const nodeLayer = transformLayer.querySelector('#node-layer');
              if (nodeLayer) {
                  transformLayer.insertBefore(edgeLayer, nodeLayer);
              } else {
                  transformLayer.appendChild(edgeLayer);
              }
          }
      }
      return edgeLayer;
  }
  - #edge-layer 획득 또는 생성
  - #node-layer보다 먼저 삽입 (z-order: 뒤에 렌더링)

  createLine(from: Position, to: Position): SVGLineElement (추가)

  private createLine(from: Position, to: Position): SVGLineElement {
      const line = document.createElementNS(SVG_NS, 'line') as SVGLineElement;
      line.setAttribute('x1', String(from.x));
      line.setAttribute('y1', String(from.y));
      line.setAttribute('x2', String(to.x));
      line.setAttribute('y2', String(to.y));
      line.setAttribute('stroke', 'rgba(0, 0, 0, 0.2)');
      line.setAttribute('stroke-width', '2');
      return line;
  }
  - SVG <line> 요소 생성
  - 부모 위치 → 자식 위치 직선

  제약 조건 준수
  ┌────────────────────────────────┬───────────┐
  │              항목              │ 준수 여부 │
  ├────────────────────────────────┼───────────┤
  │ StateManager import 금지       │ ✅        │
  ├────────────────────────────────┼───────────┤
  │ HistoryManager import 금지     │ ✅        │
  ├────────────────────────────────┼───────────┤
  │ EventBus import 금지           │ ✅        │
  ├────────────────────────────────┼───────────┤
  │ main.ts 수정 금지              │ ✅        │
  ├────────────────────────────────┼───────────┤
  │ 새로운 UI 요소 추가 금지       │ ✅        │
  ├────────────────────────────────┼───────────┤
  │ render(snapshot) 시그니처 유지 │ ✅        │
  └────────────────────────────────┴───────────┘
  빌드 결과

  - TypeScript 컴파일 성공 (에러 0개)

  ---
  다음 구현 예정 (Phase 4.1+)
  ┌──────────────────────┬───────────┐
  │         기능         │ 우선순위  │
  ├──────────────────────┼───────────┤
  │ Edge 선택/하이라이트 │ Phase 4.1 │
  ├──────────────────────┼───────────┤
  │ 노드 드래그 이동     │ Phase 4.2 │
  ├──────────────────────┼───────────┤
  │ 베지어 곡선 Edge     │ Phase 4.3 │
  ├──────────────────────┼───────────┤
  │ 노드 클릭 선택       │ Phase 4.2 │
  ├──────────────────────┼───────────┤
  │ ```                  │           │
  └──────────────────────┴───────────┘

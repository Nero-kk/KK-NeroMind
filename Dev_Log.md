# KK-NeroMind 개발 로그 (Dev_Log.md)

---

## 📋 문서 개요

| 항목 | 내용 |
|------|------|
| **플러그인명** | KK-NeroMind |
| **Author** | Nero-kk |
| **현재 Phase** | Phase 2 (State Layer 설계 중) |
| **최종 수정일** | 2026-01-12 |
| **Phase 1 완료일** | 2026-01-12 |
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

### 🔄 진행 중인 작업
- **Phase 2 진행 중** - State Layer 최소 단위 설계
  - StateManager를 Snapshot 철학으로 재설계 준비
  - DirectionManager 설계 (방향 계산 로직)
  - Command 인터페이스 설계 (undo/redo는 Phase 3)

### ❌ 미완료 작업
- Phase 2 완료
  - StateManager Snapshot 패턴 적용
  - DirectionManager 구현
  - Command 인터페이스 정의
- Phase 3~4 전체 구현

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

### 2026-01-12 (Phase 0)
- **완료**: 아키텍처 설계서 v4.0 작성
- **완료**: 코딩 주의사항 가이드 작성
- **완료**: 개발 로드맵 작성
- **완료**: Dev_Log.md 초기화
- **완료**: Phase2_CheckPoint.md 작성 (Snapshot 철학 명시)

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

---

**문서 끝**

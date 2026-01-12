# KK-NeroMind 플러그인 아키텍처 설계서 v4.0

---

## 📋 문서 개요

| 항목 | 내용 |
|------|------|
| **플러그인명** | KK-NeroMind |
| **Author** | Nero-kk |
| **버전** | v4.0 |
| **기반 문서** | KK-NeroMind-Architecture-v3.3.md |
| **최종 수정일** | 2026-01-12 |
| **디자인 컨셉** | Apple-Style Clean & Simple Mindmap |

---

## 1️⃣ 시스템 아키텍처 개요

### 1.1 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         KK-NeroMind Plugin                               │
├─────────────────────────────────────────────────────────────────────────┤
│                        Presentation Layer                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         Renderer                                 │    │
│  │  ├─ NodeRenderer (RoundedRectNode + 4방향 +/- 버튼)            │    │
│  │  ├─ EdgeRenderer (Cubic Bezier 곡선)                           │    │
│  │  ├─ UIRenderer (툴바, 미니맵, 설정창)                          │    │
│  │  ├─ ViewportCuller ("그릴지 말지" 판단)                        │    │
│  │  └─ LODStrategy ("어떻게 그릴지" 판단)                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         StyleManager                             │    │
│  │  ├─ ThemeRegistry (Light/Dark/Custom 테마)                      │    │
│  │  ├─ GlassmorphismRenderer (노드 스타일)                        │    │
│  │  └─ FontManager (San Francisco 서체)                           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────┐            ┌───────────────┐           ┌─────────────┐
│  Renderer   │            │  InputManager │           │ SyncManager │
│   (조립자)  │            │               │           │             │
│┌───────────┐│            │┌─────────────┐│           │┌───────────┐│
││NodeRdr    ││            ││GlobalShortcut││          ││SyncContext││
││EdgeRdr    ││            ││Interceptor   ││          ││+timestamp ││
││UIRdr      ││            ││+Failsafe     ││          │└───────────┘│
│└───────────┘│            │└─────────────┘│           │┌───────────┐│
│┌───────────┐│            │┌─────────────┐│           ││Integrity  ││
││Viewport   ││            ││Interaction  ││           ││Checker    ││
││Culler     ││            ││Bridge       ││           ││(비파괴)   ││
│└───────────┘│            │└─────────────┘│           │└───────────┘│
│┌───────────┐│            │┌─────────────┐│           │┌───────────┐│
││LODStrategy││            ││KeyboardMgr  ││           ││Essay      ││
│└───────────┘│            │└─────────────┘│           ││Composer   ││
│┌───────────┐│            │┌─────────────┐│           │└───────────┘│
││MiniMapRdr ││            ││MouseManager ││           │┌───────────┐│
│└───────────┘│            │└─────────────┘│           ││ExportMgr  ││
└──────┬──────┘            └───────┬───────┘           │└───────────┘│
       │                           │                   └──────┬──────┘
       │                           ▼                          │
       │                   ┌──────────────┐                   │
       │                   │   Command    │                   │
       │                   │  Dispatcher  │                   │
       │                   └──────┬───────┘                   │
       │                          │                           │
       ▼                          ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            StateManager                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  PersistentState (Undo ✅)                                      │    │
│  │  - schemaVersion: number                                        │    │
│  │  - graph: NodeGraph (nodes, edges, rootId)                      │    │
│  │  - layout: LayoutData (positions, viewport, zoom)               │    │
│  │  - settings: UserSettings (autoAlign, minimap, centerOnCreate)  │    │
│  │  - pinnedNodes: Set<string>                                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  EphemeralState (Undo ❌)                                       │    │
│  │  - selectedNodeId: string | null                                │    │
│  │  - editingNodeId: string | null                                 │    │
│  │  - collapsedNodes: Set<string>                                  │    │
│  │  - dragState: DragContext | null                                │    │
│  │  - lastSelectedNodeId: string | null                            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   EdgeCache     │  │ VirtualPathMap  │  │  CommandHistory │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
          │                        │                        │
          ▼                        ▼                        ▼
  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
  │ GraphEngine │          │LayoutEngine │          │ AutoAligner │
  │+CycleDetect │          └──────┬──────┘          └─────────────┘
  └─────────────┘                 │
                                  ▼
                          ┌─────────────┐
                          │DirectionMgr │
                          │(4방향 확장) │
                          └─────────────┘
```

---

### 1.2 핵심 설계 원칙

| 원칙 | 설명 |
|------|------|
| **단일 책임** | 각 모듈은 하나의 명확한 역할만 수행 |
| **비파괴적 변경** | IntegrityChecker는 진단만, 수정은 사용자 승인 필요 |
| **방향성 유지** | 루트노드 기준 4방향 확장, 자식은 부모 방향 유지 |
| **자동 정렬** | 노드 겹침 방지, 설정으로 토글 가능 |
| **Undo/Redo 경계** | PersistentState만 히스토리 대상 |
| **Dispose 패턴** | 모든 이벤트/구독은 destroy()로 정리 |

---

## 2️⃣ 노드 시스템 설계

### 2.1 노드 데이터 구조

```typescript
interface MindMapNode {
  id: string;                    // UUID
  content: string;               // 노드 텍스트 또는 노트 링크 (예: [[김진원]])
  position: { x: number; y: number };
  
  // 계층 구조
  parentId: string | null;       // 루트노드는 null
  childIds: string[];            // 자식 노드 ID 배열
  
  // 방향성 (루트노드에서만 설정, 자식은 상속)
  direction: 'up' | 'down' | 'left' | 'right' | null;
  
  // 상태
  isPinned: boolean;             // 핀 고정 여부
  isCollapsed: boolean;          // 자식 접힘 여부
  linkedNotePath: string | null; // 연결된 노트 경로
  
  // 메타데이터
  createdAt: number;
  updatedAt: number;
}

interface RootNode extends MindMapNode {
  parentId: null;
  direction: null;  // 루트노드는 방향 없음
  availableDirections: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
}
```

### 2.2 노드 렌더링 사양

```typescript
interface NodeStyle {
  // 기본 형태
  width: number;                 // 동적 (텍스트 길이 기반)
  minWidth: 120;                 // 최소 너비
  height: 40;                    // 기본 높이
  borderRadius: 12;              // 라운드 모서리
  
  // Apple Style Glassmorphism
  background: 'rgba(255, 255, 255, 0.72)';
  backdropFilter: 'blur(20px) saturate(180%)';
  border: '1px solid rgba(0, 0, 0, 0.08)';
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)';
  
  // 텍스트
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
  fontSize: 14;
  fontWeight: 400;
  color: '#1d1d1f';
  
  // 선택 상태
  selectedBorder: '2px solid #007AFF';
  selectedShadow: '0 0 0 4px rgba(0, 122, 255, 0.2)';
  
  // 핀 고정 상태
  pinnedBackground: 'rgba(255, 149, 0, 0.15)';
  pinnedBorder: '1px solid rgba(255, 149, 0, 0.3)';
}
```

### 2.3 +/- 버튼 시스템

```typescript
interface ExpandButton {
  size: 24;                      // 버튼 크기
  offset: 12;                    // 노드 가장자리에서의 거리
  
  // 상태별 스타일
  states: {
    // 기본 + 버튼 (자식 없음)
    default: {
      background: '#ffffff';
      border: '1px solid #d2d2d7';
      icon: '+';
      iconColor: '#86868b';
    };
    
    // - 버튼 (자식 펼침)
    expanded: {
      background: '#ffffff';
      border: '1px solid #d2d2d7';
      icon: '−';
      iconColor: '#86868b';
    };
    
    // + 버튼 (자식 숨김) - 빨간색 강조
    collapsed: {
      background: '#ff3b30';
      border: 'none';
      icon: '+';
      iconColor: '#ffffff';
    };
  };
}

// 루트노드: 4방향 모두 버튼 표시
// 자식노드: 부모로부터 상속받은 방향에만 버튼 표시
```

### 2.4 방향성 관리 (DirectionManager)

```typescript
class DirectionManager {
  /**
   * 루트노드의 특정 방향에 자식 생성
   * @param rootNode 루트노드
   * @param direction 생성 방향
   * @returns 새 자식 노드의 초기 위치
   */
  createChildFromRoot(rootNode: RootNode, direction: Direction): Position {
    // 방향별 오프셋 계산
    const offsets = {
      up: { x: 0, y: -NODE_VERTICAL_GAP },
      down: { x: 0, y: NODE_VERTICAL_GAP },
      left: { x: -NODE_HORIZONTAL_GAP, y: 0 },
      right: { x: NODE_HORIZONTAL_GAP, y: 0 }
    };
    
    return {
      x: rootNode.position.x + offsets[direction].x,
      y: rootNode.position.y + offsets[direction].y
    };
  }
  
  /**
   * 일반 노드에서 자식 생성 (부모 방향 유지)
   * @param parentNode 부모 노드
   * @returns 새 자식 노드의 초기 위치
   */
  createChildFromNode(parentNode: MindMapNode): Position {
    const direction = parentNode.direction!;
    // 부모의 방향을 따라 자식 배치
    return this.calculateNextPosition(parentNode, direction);
  }
  
  /**
   * 형제 노드 생성 위치 계산
   * 방향에 수직인 축으로 오프셋
   */
  createSiblingPosition(node: MindMapNode): Position {
    const direction = node.direction!;
    const perpendicularOffset = this.getPerpendicularOffset(direction);
    // ...
  }
}
```

---

## 3️⃣ 엣지 시스템 설계

### 3.1 Cubic Bezier 곡선 사양

```typescript
interface EdgeStyle {
  strokeWidth: 2;
  strokeColor: '#d2d2d7';
  
  // Cubic Bezier 제어점 계산
  bezier: {
    // 수평 연결 (left/right 방향)
    horizontal: {
      controlPointOffset: 0.5;  // 노드 간 거리의 50%
    };
    // 수직 연결 (up/down 방향)
    vertical: {
      controlPointOffset: 0.5;
    };
  };
}

class EdgeRenderer {
  /**
   * Cubic Bezier 경로 생성
   */
  createBezierPath(from: Position, to: Position, direction: Direction): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    let cp1: Position, cp2: Position;
    
    if (direction === 'left' || direction === 'right') {
      // 수평 방향: 수평 제어점
      cp1 = { x: from.x + dx * 0.5, y: from.y };
      cp2 = { x: to.x - dx * 0.5, y: to.y };
    } else {
      // 수직 방향: 수직 제어점
      cp1 = { x: from.x, y: from.y + dy * 0.5 };
      cp2 = { x: to.x, y: to.y - dy * 0.5 };
    }
    
    return `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;
  }
}
```

---

## 4️⃣ 자동 정렬 시스템

### 4.1 AutoAligner 설계

```typescript
class AutoAligner {
  private readonly NODE_GAP_H = 100;  // 수평 간격
  private readonly NODE_GAP_V = 60;   // 수직 간격
  
  /**
   * 전체 노드 자동 정렬
   * @param excludePinned 핀 고정 노드 제외
   */
  alignAll(nodes: MindMapNode[], excludePinned: boolean = true): void {
    const pinnedIds = excludePinned 
      ? nodes.filter(n => n.isPinned).map(n => n.id)
      : [];
    
    // BFS로 루트부터 정렬
    this.alignSubtree(this.getRootNode(nodes), pinnedIds);
  }
  
  /**
   * 서브트리 정렬 (재귀)
   */
  private alignSubtree(node: MindMapNode, pinnedIds: string[]): BoundingBox {
    if (pinnedIds.includes(node.id)) {
      return this.getBoundingBox(node);
    }
    
    const children = this.getChildren(node);
    if (children.length === 0) {
      return this.getBoundingBox(node);
    }
    
    // 자식들의 방향에 따라 배치
    const direction = children[0].direction;
    
    if (direction === 'left' || direction === 'right') {
      return this.alignHorizontal(node, children, pinnedIds);
    } else {
      return this.alignVertical(node, children, pinnedIds);
    }
  }
  
  /**
   * 충돌 감지 및 회피
   */
  detectAndResolveCollisions(nodes: MindMapNode[]): void {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (this.isOverlapping(nodes[i], nodes[j])) {
          this.resolveCollision(nodes[i], nodes[j]);
        }
      }
    }
  }
}
```

### 4.2 충돌 회피 알고리즘

```typescript
interface CollisionResolver {
  /**
   * 두 노드가 겹치는지 확인
   */
  isOverlapping(a: MindMapNode, b: MindMapNode): boolean {
    const boxA = this.getBoundingBox(a);
    const boxB = this.getBoundingBox(b);
    
    const padding = 20;  // 최소 간격
    
    return !(
      boxA.right + padding < boxB.left ||
      boxB.right + padding < boxA.left ||
      boxA.bottom + padding < boxB.top ||
      boxB.bottom + padding < boxA.top
    );
  }
  
  /**
   * 충돌 해결: 핀 고정 노드 우선
   */
  resolveCollision(a: MindMapNode, b: MindMapNode): void {
    // 핀 고정 노드는 움직이지 않음
    if (a.isPinned && b.isPinned) return;
    
    const movable = a.isPinned ? b : (b.isPinned ? a : b);
    const fixed = a.isPinned ? a : (b.isPinned ? b : a);
    
    // 가장 짧은 탈출 벡터 계산
    const escapeVector = this.calculateEscapeVector(movable, fixed);
    
    movable.position.x += escapeVector.x;
    movable.position.y += escapeVector.y;
  }
}
```

---

## 5️⃣ 입력 시스템 설계

### 5.1 키보드 매핑

```typescript
interface KeyboardShortcuts {
  // 노드 조작
  'Tab': 'createChild';           // 자식 노드 추가
  'Enter': 'createSibling';       // 형제 노드 추가
  'Space': 'editNode';            // 노드 편집 모드
  'Delete': 'deleteNode';         // 노드 삭제
  
  // 노드 탐색
  'ArrowUp': 'selectUp';
  'ArrowDown': 'selectDown';
  'ArrowLeft': 'selectLeft';
  'ArrowRight': 'selectRight';
  
  // 뷰포트 조작
  'Ctrl+Home': 'viewAll';         // 전체 보기
  'Ctrl++': 'zoomIn';             // 화면 확대
  'Ctrl+-': 'zoomOut';            // 화면 축소
  'Ctrl+ArrowUp': 'panUp';        // 화면 위로 이동
  'Ctrl+ArrowDown': 'panDown';
  'Ctrl+ArrowLeft': 'panLeft';
  'Ctrl+ArrowRight': 'panRight';
  
  // 특수
  'Home': 'focusLastSelected';    // 마지막 선택 노드로 이동
  'Escape': 'cancelEdit';         // 편집 취소 / 포커스 해제
  
  // Fail-safe (항상 작동)
  'Ctrl+Escape': 'forceFocusRelease';  // 강제 포커스 해제
}
```

### 5.2 마우스 인터랙션

```typescript
interface MouseInteractions {
  // 뷰포트 조작
  'middleMouseDown + drag': 'panViewport';      // 화면 이동
  'middleMouseDoubleClick': 'fitToScreen';      // 전체 화면 맞춤
  'wheel': 'zoom';                               // 줌 인/아웃
  
  // 노드 조작
  'click': 'selectNode';
  'doubleClick': 'editNode';
  'drag': 'moveNodeWithSubtree';                // 노드 + 하위 이동
  'dragAndDropOnNode': 'reparentNode';          // 다른 노드에 놓기 → 부모 변경
  
  // 파일 드래그앤드롭
  'dragFileOnNode': 'linkNote';                 // 노트 파일을 노드에 드롭 → 링크
}

class MouseManager {
  /**
   * 노드 드래그 시 서브트리 함께 이동
   */
  handleNodeDrag(nodeId: string, delta: Position): void {
    const node = this.getNode(nodeId);
    const subtree = this.getSubtree(nodeId);  // 하위 모든 노드
    
    for (const child of subtree) {
      child.position.x += delta.x;
      child.position.y += delta.y;
    }
    
    this.emit('subtreeMoved', { rootId: nodeId, delta });
  }
  
  /**
   * 노트 파일 드래그앤드롭 → 링크 생성
   */
  handleNoteDrop(nodeId: string, file: TFile): void {
    const node = this.getNode(nodeId);
    
    // 노드명을 노트 링크로 변경
    node.content = `[[${file.basename}]]`;
    node.linkedNotePath = file.path;
    
    this.emit('noteLinkCreated', { nodeId, filePath: file.path });
  }
}
```

### 5.3 GlobalShortcutInterceptor

```typescript
class GlobalShortcutInterceptor implements Disposable {
  private focusStartTime: number = 0;
  private readonly FOCUS_TIMEOUT = 2000;  // 2초
  
  /**
   * Fail-safe: 포커스 갇힘 방지
   */
  private checkFocusTimeout(): void {
    if (Date.now() - this.focusStartTime > this.FOCUS_TIMEOUT) {
      this.forceFocusRelease();
    }
  }
  
  /**
   * Ctrl+Escape: 항상 포커스 해제
   */
  handleCtrlEscape(): void {
    this.forceFocusRelease();
    this.emit('focusReleased');
  }
  
  destroy(): void {
    // 모든 이벤트 리스너 해제
    this.removeAllListeners();
  }
}
```

---

## 6️⃣ 툴바 시스템 설계

### 6.1 툴바 레이아웃 (좌측 상단)

> **스크린샷 참조**: 좌측 상단에 가로로 배치된 아이콘 버튼들

```typescript
interface ToolbarConfig {
  position: 'top-left';
  orientation: 'horizontal';
  
  buttons: [
    { id: 'back', icon: 'chevron-left', tooltip: '뒤로가기' },
    { id: 'undo', icon: 'undo', tooltip: '되돌리기', shortcut: 'Ctrl+Z' },
    { id: 'redo', icon: 'redo', tooltip: '되살리기', shortcut: 'Ctrl+Y' },
    { id: 'fullNote', icon: 'file-text', tooltip: 'Full Note (통합하기)' },
    { id: 'export', icon: 'share', tooltip: 'Export MD (내보내기)' },
    { id: 'load', icon: 'folder-open', tooltip: 'Load (불러오기)' }  // MD → 마인드맵
  ];
  
  style: {
    background: 'rgba(255, 255, 255, 0.9)';
    backdropFilter: 'blur(20px)';
    borderRadius: 12;
    padding: 8;
    gap: 4;
  };
}

// 자동 저장 설정
autoSave: {
  enabled: true;
  debounceMs: 1000;  // 변경 후 1초 뒤 자동 저장
  onStateChange: () => this.saveToFile();
}
```

### 6.2 내보내기 기능 (ExportManager) - Export MD

> **핵심**: 마인드맵을 마크다운 형식으로 내보내기
> - `—` 로 루트 노드 표시
> - `•` 불릿과 세로선(`│`)으로 계층 구조 표현
> - 노드 내용에서 `[[`, `]]` 제거하여 순수 텍스트로 출력

```typescript
class ExportManager {
  /**
   * Markdown 내보내기 (Export MD)
   * 스크린샷 형식: 세로선 + 불릿 구조
   */
  async exportToMarkdown(): Promise<string> {
    const root = this.stateManager.getRootNode();
    let result = '';
    
    // 루트 노드: — 로 시작
    result += `— ${this.cleanNodeContent(root.content)}\n`;
    
    // 자식 노드들
    const children = this.getChildNodes(root);
    for (let i = 0; i < children.length; i++) {
      const isLast = i === children.length - 1;
      result += this.nodeToMarkdown(children[i], 1, '', isLast);
    }
    
    return result;
  }
  
  /**
   * 노드 → 마크다운 변환 (재귀)
   * @param node 현재 노드
   * @param depth 깊이 (1부터)
   * @param prefix 앞에 붙을 세로선 문자열
   * @param isLastChild 마지막 자식 여부
   */
  private nodeToMarkdown(
    node: MindMapNode, 
    depth: number, 
    prefix: string,
    isLastChild: boolean
  ): string {
    let result = '';
    
    // 현재 노드 출력
    const connector = isLastChild ? '└' : '├';
    const content = this.cleanNodeContent(node.content);
    result += `${prefix}${connector}─ • ${content}\n`;
    
    // 자식 노드용 prefix 계산
    const childPrefix = prefix + (isLastChild ? '    ' : '│   ');
    
    // 자식 노드들 재귀 처리
    const children = this.getChildNodes(node);
    for (let i = 0; i < children.length; i++) {
      const isLast = i === children.length - 1;
      result += this.nodeToMarkdown(children[i], depth + 1, childPrefix, isLast);
    }
    
    return result;
  }
  
  /**
   * 노드 내용 정리
   * - [[노트명]] → 노트명 (대괄호 제거)
   * - [[경로|별칭]] → 별칭
   */
  private cleanNodeContent(content: string): string {
    // [[노트|별칭]] → 별칭, [[노트]] → 노트
    return content.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_, path, __, alias) => {
      return alias || path;
    });
  }
  
  private getChildNodes(node: MindMapNode): MindMapNode[] {
    return node.childIds.map(id => this.stateManager.getNode(id));
  }
}
```

#### Export MD 출력 예시

**마인드맵 구조:**
```
사람들 (루트, 핑크)
├── [[옵시디안 CSS 바꾸기]]
├── 할아버지
│   ├── [[PDF 판매 올해 목표 달성]]
│   └── 아저씨
└── [[옵시디언 잘 쓰는 법]]
    ├── [[옵시디언 설치]]
    └── [[메모 연결]]
```

**출력 파일:**
```
— 사람들
├─ • 옵시디안 CSS 바꾸기
├─ • 할아버지
│   ├─ • PDF 판매 올해 목표 달성
│   └─ • 아저씨
└─ • 옵시디언 잘 쓰는 법
    ├─ • 옵시디언 설치
    └─ • 메모 연결
```

### 6.3 불러오기 기능 (ImportManager) - Load

> **핵심**: Export MD로 내보낸 파일이나 마크다운 형식 문서를 마인드맵으로 변환
> - `—` 로 시작하는 줄: 루트 노드
> - `•` 불릿이 있는 줄: 일반 노드
> - 들여쓰기/세로선으로 부모-자식 관계 파악

```typescript
class ImportManager {
  /**
   * Markdown 파일 선택 다이얼로그 열기
   */
  async openLoadDialog(): Promise<void> {
    // Obsidian 파일 선택 모달
    const modal = new FileSuggestModal(this.app, '.md');
    modal.onChoose = async (file: TFile) => {
      await this.loadFromMarkdown(file);
    };
    modal.open();
  }
  
  /**
   * Markdown → 마인드맵 변환
   */
  async loadFromMarkdown(file: TFile): Promise<void> {
    const content = await this.app.vault.read(file);
    const lines = content.split('\n').filter(line => line.trim());
    
    // 루트 노드 찾기
    const rootLine = lines.find(line => line.startsWith('—'));
    if (!rootLine) {
      new Notice('유효한 마인드맵 마크다운이 아닙니다.');
      return;
    }
    
    // 파싱
    const rootContent = rootLine.replace(/^—\s*/, '').trim();
    const rootNode = this.createNode(rootContent, null);
    
    // 나머지 노드들 파싱
    let currentParents: { depth: number; node: MindMapNode }[] = [
      { depth: 0, node: rootNode }
    ];
    
    for (const line of lines.slice(1)) {
      const parsed = this.parseLine(line);
      if (!parsed) continue;
      
      const { depth, content } = parsed;
      
      // 적절한 부모 찾기
      while (currentParents.length > 1 && 
             currentParents[currentParents.length - 1].depth >= depth) {
        currentParents.pop();
      }
      
      const parent = currentParents[currentParents.length - 1].node;
      const newNode = this.createNode(content, parent.id);
      
      currentParents.push({ depth, node: newNode });
    }
    
    // 마인드맵 뷰에 적용
    this.stateManager.setGraph(rootNode);
    new Notice(`마인드맵 불러오기 완료: ${file.basename}`);
  }
  
  /**
   * 라인 파싱
   * @returns { depth: number, content: string } 또는 null
   */
  private parseLine(line: string): { depth: number; content: string } | null {
    // 패턴: 세로선/공백 + 연결자 + • + 내용
    // 예: "│   ├─ • 노드내용" 또는 "    └─ • 노드내용"
    
    // 깊이 계산 (세로선 또는 4칸 공백 = 1레벨)
    let depth = 0;
    let index = 0;
    
    while (index < line.length) {
      if (line.substring(index, index + 4) === '│   ' || 
          line.substring(index, index + 4) === '    ') {
        depth++;
        index += 4;
      } else {
        break;
      }
    }
    
    // 불릿 내용 추출
    const bulletMatch = line.match(/[├└]─\s*•\s*(.+)$/);
    if (bulletMatch) {
      return { depth: depth + 1, content: bulletMatch[1].trim() };
    }
    
    // 단순 불릿 형식도 지원 (• 로 시작)
    const simpleBullet = line.match(/^\s*•\s*(.+)$/);
    if (simpleBullet) {
      const spaces = line.match(/^(\s*)/)?.[1].length || 0;
      return { depth: Math.floor(spaces / 2) + 1, content: simpleBullet[1].trim() };
    }
    
    return null;
  }
  
  private createNode(content: string, parentId: string | null): MindMapNode {
    const node: MindMapNode = {
      id: generateId(),
      content,
      parentId,
      childIds: [],
      position: { x: 0, y: 0 },  // AutoAligner가 나중에 배치
      direction: parentId ? this.inheritDirection(parentId) : null
    };
    
    if (parentId) {
      const parent = this.stateManager.getNode(parentId);
      parent.childIds.push(node.id);
    }
    
    this.stateManager.addNode(node);
    return node;
  }
}
```

### 6.4 자동 저장 시스템 (AutoSave)

> **핵심**: 별도의 Save 버튼 없이 변경사항 자동 저장

```typescript
class AutoSaveManager implements Disposable {
  private saveTimeout: number | null = null;
  private readonly DEBOUNCE_MS = 1000;  // 1초
  
  constructor(
    private app: App,
    private stateManager: StateManager,
    private mindmapFile: TFile
  ) {
    // 상태 변경 구독
    this.stateManager.onChange(() => this.scheduleSave());
  }
  
  /**
   * 변경 감지 시 저장 예약
   */
  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = window.setTimeout(() => {
      this.save();
    }, this.DEBOUNCE_MS);
  }
  
  /**
   * 실제 저장 수행
   */
  private async save(): Promise<void> {
    try {
      const data = this.stateManager.serialize();
      await this.app.vault.modify(this.mindmapFile, data);
      // 조용히 저장 (토스트 없음)
    } catch (e) {
      console.error('자동 저장 실패:', e);
      new Notice('자동 저장에 실패했습니다.');
    }
  }
  
  destroy(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }
}
```

### 6.5 기존 내보내기 기능 (이미지/PDF)

```typescript
class ExportManager {
  // ... (6.2의 exportToMarkdown 외 추가 메서드)
  
  /**
   * 이미지 내보내기 (PNG)
   */
  async exportToImage(): Promise<Blob> {
    const svgElement = this.renderer.getSvgElement();
    const canvas = await this.svgToCanvas(svgElement);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }
  
  /**
   * PDF 내보내기
   */
  async exportToPdf(): Promise<Blob> {
    const imageBlob = await this.exportToImage();
    return this.imageToPdf(imageBlob);
  }
}
```

### 6.6 통합하기 기능 (EssayComposer) - Full Note

> **핵심 기능**: 마인드맵의 모든 노드를 DFS 순회하여 하나의 통합 문서로 병합
> - 노드에 `[[노트 링크]]`가 있으면 해당 노트의 **전체 내용**을 삽입
> - 출력 파일명: `Full-{마인드맵이름}.md`
> - 출력 위치: 마인드맵 파일과 동일한 폴더

```typescript
interface ComposeOptions {
  outputFolder?: string;       // 출력 폴더 (기본: 마인드맵과 동일 폴더)
  includeEmptyNodes?: boolean; // 링크 없는 노드도 포함 (기본: true)
  preserveNodeStructure?: boolean; // 노드 계층을 들여쓰기로 표현 (기본: true)
}

class EssayComposer {
  private app: App;
  private stateManager: StateManager;
  private mindmapFile: TFile;
  
  constructor(app: App, stateManager: StateManager, mindmapFile: TFile) {
    this.app = app;
    this.stateManager = stateManager;
    this.mindmapFile = mindmapFile;
  }
  
  /**
   * 마인드맵 → 통합 문서 생성 및 저장
   * @returns 생성된 파일 경로
   */
  async composeAndSave(options: ComposeOptions = {}): Promise<string> {
    const content = await this.compose(options);
    const outputPath = this.getOutputPath(options.outputFolder);
    
    // 파일 생성 또는 덮어쓰기
    const existingFile = this.app.vault.getAbstractFileByPath(outputPath);
    if (existingFile instanceof TFile) {
      await this.app.vault.modify(existingFile, content);
    } else {
      await this.app.vault.create(outputPath, content);
    }
    
    // 토스트 알림 표시
    new Notice(`Full ObsiMap exported: ${outputPath}`);
    
    return outputPath;
  }
  
  /**
   * 출력 파일 경로 생성
   * 형식: {폴더}/Full-{마인드맵이름}.md
   */
  private getOutputPath(customFolder?: string): string {
    const mindmapName = this.mindmapFile.basename; // 확장자 제외
    const folder = customFolder || this.mindmapFile.parent?.path || '';
    const fileName = `Full-${mindmapName}.md`;
    
    return folder ? `${folder}/${fileName}` : fileName;
  }
  
  /**
   * 마인드맵 → 마크다운 문서 생성
   */
  async compose(options: ComposeOptions = {}): Promise<string> {
    const root = this.stateManager.getRootNode();
    const includeEmpty = options.includeEmptyNodes ?? true;
    const preserveStructure = options.preserveNodeStructure ?? true;
    
    let result = '';
    
    // 루트 노드 처리 (최상위 제목)
    result += `— ${root.content}\n`;
    
    // 자식 노드들 재귀 처리 (들여쓰기 1단계부터 시작)
    for (const childId of root.childIds) {
      const child = this.stateManager.getNode(childId);
      result += await this.composeNode(child, 1, includeEmpty, preserveStructure);
    }
    
    return result;
  }
  
  /**
   * 개별 노드 처리 (재귀)
   * @param node 현재 노드
   * @param depth 들여쓰기 깊이 (1부터 시작)
   */
  private async composeNode(
    node: MindMapNode, 
    depth: number,
    includeEmpty: boolean,
    preserveStructure: boolean
  ): Promise<string> {
    let content = '';
    const indent = '\t'.repeat(depth);  // 탭으로 들여쓰기
    
    // 노드에 [[노트 링크]]가 있는지 확인
    const linkedNotePath = this.extractLinkedNotePath(node.content);
    
    if (linkedNotePath) {
      // [[노트 링크]]가 있으면 노트 제목 + 노트 전체 내용 삽입
      const noteTitle = this.extractNoteTitleFromLink(node.content);
      const noteContent = await this.getLinkedNoteContent(linkedNotePath);
      
      if (preserveStructure) {
        // 들여쓰기 구조 유지
        content += `${indent}• ${noteTitle}\n`;
        // 노트 내용은 추가 들여쓰기 없이 그대로 삽입
        content += `${noteContent}\n\n`;
      } else {
        // 플랫 구조 (헤딩 사용)
        const heading = '#'.repeat(Math.min(depth + 1, 6));
        content += `${heading} ${noteTitle}\n\n${noteContent}\n\n`;
      }
    } else if (includeEmpty) {
      // 링크 없는 일반 노드
      if (preserveStructure) {
        content += `${indent}• ${node.content}\n`;
      } else {
        const heading = '#'.repeat(Math.min(depth + 1, 6));
        content += `${heading} ${node.content}\n\n`;
      }
    }
    
    // 자식 노드들 재귀 처리
    for (const childId of node.childIds) {
      const child = this.stateManager.getNode(childId);
      content += await this.composeNode(child, depth + 1, includeEmpty, preserveStructure);
    }
    
    return content;
  }
  
  /**
   * 노드 내용에서 [[노트 링크]] 추출
   * @returns 노트 파일 경로 또는 null
   */
  private extractLinkedNotePath(nodeContent: string): string | null {
    const linkMatch = nodeContent.match(/\[\[([^\]]+)\]\]/);
    if (!linkMatch) return null;
    
    const linkText = linkMatch[1];
    // 별칭 처리: [[실제경로|표시이름]]
    const actualPath = linkText.split('|')[0];
    
    // .md 확장자 추가 (없으면)
    const pathWithExt = actualPath.endsWith('.md') ? actualPath : `${actualPath}.md`;
    
    // 파일 존재 확인
    const file = this.app.metadataCache.getFirstLinkpathDest(actualPath, this.mindmapFile.path);
    return file?.path || null;
  }
  
  /**
   * [[노트 링크]]에서 표시용 제목 추출
   */
  private extractNoteTitleFromLink(nodeContent: string): string {
    const linkMatch = nodeContent.match(/\[\[([^\]]+)\]\]/);
    if (!linkMatch) return nodeContent;
    
    const linkText = linkMatch[1];
    // 별칭이 있으면 별칭 사용, 없으면 파일명 사용
    const parts = linkText.split('|');
    return parts[parts.length - 1];  // 별칭 또는 파일명
  }
  
  /**
   * 노트 파일 내용 가져오기
   */
  private async getLinkedNoteContent(path: string): Promise<string> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      return await this.app.vault.read(file);
    }
    return '';
  }
}
```

#### 통합하기 출력 예시

**마인드맵 구조:**
```
사람들 (루트)
├── 사람들
│   ├── [[옵시디안 CSS 바꾸기]]
│   ├── 할아버지
│   │   ├── [[PDF 판매 올해 목표...]]
│   │   └── 아저씨
│   │       └── [[옵시디언 설치]]
│   └── [[옵시디언 잘 쓰는 법]]
```

**출력 파일 (Full-사람들.md):**
```markdown
— 사람들
	• 사람들
		• 옵시디안 CSS 바꾸기
Date : 2023-12-11 22:56
Topic : #obsidian #plugin

작가님들 어서오세요~! 여기는 작가의 방입니다. 옵시디안의 최대 장점 중 하나는...
(노트 전체 내용이 삽입됨)

		• 할아버지
			• PDF 판매 올해 목표...
(노트 전체 내용)

			• 아저씨
				• 옵시디언 설치
(노트 전체 내용)

		• 옵시디언 잘 쓰는 법
(노트 전체 내용)
```

#### 툴바 버튼 동작

| 버튼 | 아이콘 | 동작 |
|------|--------|------|
| 통합하기 (Full Note) | 📄 (문서 아이콘) | `composeAndSave()` 호출 → 우측 상단 토스트 알림 표시 |

---

## 7️⃣ 미니맵 시스템 설계

### 7.1 미니맵 사양

```typescript
interface MiniMapConfig {
  position: 'bottom-right';
  defaultSize: { width: 200, height: 150 };
  minSize: { width: 100, height: 75 };
  maxSize: { width: 400, height: 300 };
  
  style: {
    background: 'rgba(255, 255, 255, 0.8)';
    backdropFilter: 'blur(10px)';
    borderRadius: 8;
    border: '1px solid rgba(0, 0, 0, 0.1)';
    opacity: 0.9;  // 사용자 조절 가능
  };
  
  viewport: {
    // 현재 보이는 영역 표시
    strokeColor: '#007AFF';
    strokeWidth: 2;
    fillColor: 'rgba(0, 122, 255, 0.1)';
  };
  
  nodes: {
    // 미니맵의 노드는 단순화
    fillColor: '#86868b';
    minSize: 4;
  };
}

class MiniMapRenderer {
  /**
   * 클릭/터치로 해당 위치로 이동
   */
  handleClick(event: MouseEvent | TouchEvent): void {
    const miniMapRect = this.element.getBoundingClientRect();
    const clickPos = this.getEventPosition(event);
    
    // 미니맵 좌표 → 실제 좌표 변환
    const scale = this.calculateScale();
    const worldPos = {
      x: (clickPos.x - miniMapRect.left) / scale,
      y: (clickPos.y - miniMapRect.top) / scale
    };
    
    // 뷰포트 중심 이동
    this.viewport.centerOn(worldPos);
  }
}
```

---

## 8️⃣ 설정 시스템 설계

### 8.1 설정 항목

```typescript
interface NeroMindSettings {
  // 뷰포트
  centerOnNodeCreate: boolean;    // 노드 생성 시 화면 중앙 이동 (기본: true)
  autoAlign: boolean;             // 자동 정렬 (기본: true)
  
  // 미니맵
  minimap: {
    enabled: boolean;             // 미니맵 표시 (기본: true)
    size: 'small' | 'medium' | 'large';  // 크기
    opacity: number;              // 투명도 0.0~1.0 (기본: 0.9)
  };
  
  // 테마
  theme: 'light' | 'dark' | 'system';  // 기본: 'light'
  
  // 고급
  animationDuration: number;      // 애니메이션 속도 ms (기본: 200)
  nodeGap: {
    horizontal: number;           // 수평 간격 (기본: 100)
    vertical: number;             // 수직 간격 (기본: 60)
  };
}

const DEFAULT_SETTINGS: NeroMindSettings = {
  centerOnNodeCreate: true,
  autoAlign: true,
  minimap: {
    enabled: true,
    size: 'medium',
    opacity: 0.9
  },
  theme: 'light',
  animationDuration: 200,
  nodeGap: {
    horizontal: 100,
    vertical: 60
  }
};
```

### 8.2 설정 UI

```typescript
class NeroMindSettingTab extends PluginSettingTab {
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    // 테마 선택 (드롭다운)
    new Setting(containerEl)
      .setName('테마')
      .setDesc('마인드맵 스타일 선택')
      .addDropdown(dropdown => dropdown
        .addOption('light', 'Light Mode')
        .addOption('dark', 'Dark Mode')
        .addOption('system', 'System')
        .setValue(this.plugin.settings.theme)
        .onChange(async (value) => {
          this.plugin.settings.theme = value as Theme;
          await this.plugin.saveSettings();
        }));
    
    // 미니맵 토글
    new Setting(containerEl)
      .setName('미니맵')
      .setDesc('우측 하단에 미니맵 표시')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.minimap.enabled)
        .onChange(async (value) => {
          this.plugin.settings.minimap.enabled = value;
          await this.plugin.saveSettings();
        }));
    
    // 미니맵 크기
    new Setting(containerEl)
      .setName('미니맵 크기')
      .addDropdown(dropdown => dropdown
        .addOption('small', '작게')
        .addOption('medium', '보통')
        .addOption('large', '크게')
        .setValue(this.plugin.settings.minimap.size)
        .onChange(async (value) => {
          this.plugin.settings.minimap.size = value as MiniMapSize;
          await this.plugin.saveSettings();
        }));
    
    // 미니맵 투명도
    new Setting(containerEl)
      .setName('미니맵 투명도')
      .addSlider(slider => slider
        .setLimits(0.3, 1.0, 0.1)
        .setValue(this.plugin.settings.minimap.opacity)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.minimap.opacity = value;
          await this.plugin.saveSettings();
        }));
    
    // 노드 생성 시 중앙 이동
    new Setting(containerEl)
      .setName('노드 생성 시 화면 중앙 이동')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.centerOnNodeCreate)
        .onChange(async (value) => {
          this.plugin.settings.centerOnNodeCreate = value;
          await this.plugin.saveSettings();
        }));
    
    // 자동 정렬
    new Setting(containerEl)
      .setName('자동 정렬')
      .setDesc('노드가 겹치지 않도록 자동 정렬')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoAlign)
        .onChange(async (value) => {
          this.plugin.settings.autoAlign = value;
          await this.plugin.saveSettings();
        }));
  }
}
```

---

## 9️⃣ 테마 시스템 설계

### 9.1 Light Mode (기본)

```typescript
const LIGHT_THEME: Theme = {
  name: 'light',
  
  canvas: {
    background: '#F5F5F7',
  },
  
  node: {
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    color: '#1d1d1f',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  },
  
  nodeSelected: {
    border: '2px solid #007AFF',
    boxShadow: '0 0 0 4px rgba(0, 122, 255, 0.2)',
  },
  
  nodePinned: {
    background: 'rgba(255, 149, 0, 0.15)',
    border: '1px solid rgba(255, 149, 0, 0.3)',
  },
  
  edge: {
    stroke: '#d2d2d7',
    strokeWidth: 2,
  },
  
  expandButton: {
    default: {
      background: '#ffffff',
      border: '1px solid #d2d2d7',
      iconColor: '#86868b',
    },
    collapsed: {
      background: '#ff3b30',
      border: 'none',
      iconColor: '#ffffff',
    },
  },
  
  toolbar: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
  },
  
  minimap: {
    background: 'rgba(255, 255, 255, 0.8)',
    nodeColor: '#86868b',
    viewportStroke: '#007AFF',
  },
};
```

### 9.2 테마 확장 구조

```typescript
class ThemeRegistry {
  private themes: Map<string, Theme> = new Map();
  
  constructor() {
    // 기본 테마 등록
    this.register(LIGHT_THEME);
    this.register(DARK_THEME);
  }
  
  /**
   * 커스텀 테마 등록 (향후 확장용)
   */
  register(theme: Theme): void {
    this.themes.set(theme.name, theme);
  }
  
  /**
   * 테마 목록 조회 (설정 드롭다운용)
   */
  getAvailableThemes(): string[] {
    return Array.from(this.themes.keys());
  }
  
  /**
   * 테마 적용
   */
  apply(themeName: string): void {
    const theme = this.themes.get(themeName);
    if (!theme) return;
    
    // CSS 변수로 적용
    document.documentElement.style.setProperty('--nm-canvas-bg', theme.canvas.background);
    document.documentElement.style.setProperty('--nm-node-bg', theme.node.background);
    // ... 기타 변수들
  }
}
```

---

## 🔟 동기화 시스템 설계

### 10.1 노드-노트 실시간 동기화

```typescript
class SyncManager implements Disposable {
  private fileWatcher: FileWatcher;
  private virtualPathMap: Map<string, string>;  // nodeId → filePath
  
  /**
   * 노드 제목 변경 시 파일명 변경
   */
  async onNodeTitleChange(nodeId: string, newTitle: string): Promise<void> {
    const filePath = this.virtualPathMap.get(nodeId);
    if (!filePath) return;
    
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      const newPath = `${file.parent?.path || ''}/${newTitle}.md`;
      await this.app.fileManager.renameFile(file, newPath);
      this.virtualPathMap.set(nodeId, newPath);
    }
  }
  
  /**
   * 파일 변경 감지 시 노드 업데이트
   */
  onFileChange(file: TFile): void {
    // 디바운스 300ms 적용
    this.debounce(() => {
      const nodeId = this.findNodeByFilePath(file.path);
      if (nodeId) {
        this.updateNodeFromFile(nodeId, file);
      }
    }, 300);
  }
  
  /**
   * 파일 탐색기 → 캔버스 드래그 시 즉시 노드화
   */
  onFileDragToCanvas(file: TFile, position: Position): MindMapNode {
    const node = this.createNodeFromFile(file, position);
    this.virtualPathMap.set(node.id, file.path);
    return node;
  }
  
  destroy(): void {
    this.fileWatcher.stop();
    this.virtualPathMap.clear();
  }
}
```

### 10.2 IntegrityChecker

```typescript
class IntegrityChecker {
  /**
   * Orphan 유형
   * - Node-Orphan: 노드는 있으나 파일이 없음
   * - File-Orphan: 파일은 있으나 노드가 없음
   */
  
  /**
   * Policy 1: 감지 (Detect)
   */
  detectOrphans(): OrphanReport {
    const nodeOrphans: string[] = [];
    const fileOrphans: string[] = [];
    
    // Node-Orphan 탐지
    for (const [nodeId, filePath] of this.virtualPathMap) {
      if (!this.fileExists(filePath)) {
        nodeOrphans.push(nodeId);
      }
    }
    
    // File-Orphan 탐지 (선택적)
    // ...
    
    return { nodeOrphans, fileOrphans };
  }
  
  /**
   * Policy 2: 분류 (Classify)
   */
  classifyOrphan(id: string): 'Node-Orphan' | 'File-Orphan' {
    // ...
  }
  
  /**
   * Policy 3: 알림 (Notify)
   */
  notifyUser(report: OrphanReport): void {
    if (report.nodeOrphans.length > 0 || report.fileOrphans.length > 0) {
      new Notice(`Orphan 발견: ${report.nodeOrphans.length}개 노드, ${report.fileOrphans.length}개 파일`);
    }
  }
  
  /**
   * Policy 4: 복구 (Repair) - 사용자 명시 선택 시에만
   */
  async repair(report: OrphanReport, userChoice: RepairChoice): Promise<void> {
    // 사용자가 선택한 항목만 복구
  }
}
```

---

## 1️⃣1️⃣ 상태 관리 시스템

### 11.1 Undo/Redo 시스템

```typescript
class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private readonly MAX_HISTORY = 100;
  
  /**
   * 명령 실행 및 기록
   */
  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];  // Redo 스택 초기화
    
    if (this.undoStack.length > this.MAX_HISTORY) {
      this.undoStack.shift();
    }
  }
  
  /**
   * 되돌리기 (Undo)
   */
  undo(): void {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }
  
  /**
   * 되살리기 (Redo)
   */
  redo(): void {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
    }
  }
}

interface Command {
  execute(): void;
  undo(): void;
  description: string;
}

// 예: 노드 생성 명령
class CreateNodeCommand implements Command {
  constructor(
    private stateManager: StateManager,
    private node: MindMapNode,
    private parentId: string | null
  ) {}
  
  execute(): void {
    this.stateManager.addNode(this.node, this.parentId);
  }
  
  undo(): void {
    this.stateManager.removeNode(this.node.id);
  }
  
  description = 'Create Node';
}
```

---

## 1️⃣2️⃣ LOD 전략

### 12.1 LOD 레벨 정의

```typescript
interface LODStrategy {
  levels: {
    minimal: {
      nodeScreenSize: '< 30px';
      render: '점 표시만';
      showLabel: false;
      showButtons: false;
    };
    basic: {
      nodeScreenSize: '30-80px';
      render: '사각형 + 1줄 라벨';
      showLabel: true;
      showButtons: false;
    };
    standard: {
      nodeScreenSize: '80-150px';
      render: '전체 UI';
      showLabel: true;
      showButtons: true;
    };
    full: {
      nodeScreenSize: '> 150px';
      render: '전체 UI + 편집 가능';
      showLabel: true;
      showButtons: true;
      editable: true;
    };
  };
  
  /**
   * 강제 승격 규칙
   * 선택(Selected) 또는 편집(Editing) 상태의 노드는
   * 화면 크기와 무관하게 LOD가 강제 승격됨
   */
  forceUpgrade: {
    selected: 'standard';
    editing: 'full';
  };
}
```

---

## 1️⃣3️⃣ Dispose 패턴 및 생명주기

### 13.1 Disposable 인터페이스

```typescript
interface Disposable {
  destroy(): void;
}
```

### 13.2 적용 대상

| 모듈 | destroy() 책임 |
|------|----------------|
| InteractionBridge | 이벤트 리스너 해제 |
| GlobalShortcutInterceptor | 키보드 이벤트 해제 |
| FileWatcher | 파일 감시 중지 |
| SyncManager | watcher, virtualPathMap 정리 |
| StateManager | Observable 구독 해제 |
| Renderer | SVG root detach, RAF 중지 |

### 13.3 Destroy 호출 순서

```
Input → Sync → State → Renderer
```

**이유**: 상위 이벤트 소스부터 차단하여 하위 모듈에 이벤트가 유입되지 않도록 함.

```typescript
class NeroMindPlugin extends Plugin {
  async onunload(): Promise<void> {
    // 1. Input Layer
    this.inputManager?.destroy();
    this.globalShortcutInterceptor?.destroy();
    
    // 2. Sync Layer
    this.syncManager?.destroy();
    this.integrityChecker?.destroy();
    
    // 3. State Layer
    this.stateManager?.destroy();
    this.commandHistory?.clear();
    
    // 4. Renderer Layer
    this.renderer?.destroy();
    this.miniMapRenderer?.destroy();
  }
}
```

---

## 1️⃣4️⃣ Phase별 개발 계획

### Phase 1: 코어 인프라 (1-2주)

**범위**:
- 플러그인 진입점 및 Disposable 인프라
- 기본 Renderer 조립 구조
- SVG 팩토리 (Node, Edge, UI)
- 루트노드 생성 및 화면 중앙 배치
- 기본 노드 스타일 (Glassmorphism)

**동결 대상**:
- 플러그인 진입점
- Renderer 조립 구조
- Disposable 인터페이스

### Phase 2: 노드 조작 & 인터랙션 (2-3주)

**범위**:
- 4방향 +/- 버튼 시스템
- 방향성 관리 (DirectionManager)
- 자식/형제 노드 생성
- 노드 접기/펼치기
- 키보드/마우스 인터랙션
- 노드 선택 및 탐색
- 기본 Undo/Redo

**동결 대상**:
- State 분류 체계
- Factory 인터페이스
- InteractionBridge

### Phase 3: 동기화 & 내보내기 (2-3주)

**범위**:
- 노드-노트 1:1 동기화
- IntegrityChecker
- 툴바 (8개 버튼)
- Markdown 내보내기/불러오기
- 이미지/PDF 내보내기
- 통합하기 (EssayComposer)

**동결 대상**:
- SyncContext 구조
- VirtualPathMap 스키마
- IntegrityChecker Policy

### Phase 4: 고급 기능 & 최적화 (2-3주)

**범위**:
- 자동 정렬 (AutoAligner)
- 핀 고정 기능
- 미니맵
- 설정창
- LOD 고도화
- 테마 확장 구조
- 성능 최적화

**동결 대상**:
- 전체 (유지보수 모드)

---

## 1️⃣5️⃣ 테스트 전략

### 15.1 Phase별 테스트 커버리지 목표: 80%

### 15.2 유닛 테스트 범위

| Phase | 테스트 대상 |
|-------|-------------|
| Phase 1 | NodeFactory, EdgeFactory, Disposable 패턴 |
| Phase 2 | DirectionManager, CommandHistory, KeyboardManager |
| Phase 3 | ExportManager, ImportManager, SyncManager |
| Phase 4 | AutoAligner, MiniMap, ThemeRegistry |

### 15.3 UI/UX 테스트 체크리스트

```markdown
## Phase 1 UI/UX
- [ ] 루트노드가 화면 중앙에 표시되는가?
- [ ] 루트노드 생성 시 커서가 자동 배치되는가?
- [ ] Glassmorphism 스타일이 적용되는가?

## Phase 2 UI/UX
- [ ] 4방향 +버튼이 루트노드에 표시되는가?
- [ ] 자식노드 생성 시 부모 방향으로 +버튼이 배치되는가?
- [ ] 접기 시 빨간색 +버튼으로 변경되는가?
- [ ] Tab/Enter로 자식/형제 생성이 되는가?
- [ ] 방향키로 노드 탐색이 되는가?

## Phase 3 UI/UX
- [ ] Markdown 내보내기가 계층 구조를 유지하는가?
- [ ] Markdown 불러오기가 마인드맵으로 변환되는가?
- [ ] 노트 드래그앤드롭 시 링크가 생성되는가?

## Phase 4 UI/UX
- [ ] 자동정렬 시 노드가 겹치지 않는가?
- [ ] 핀 고정 노드는 정렬 시 움직이지 않는가?
- [ ] 미니맵이 전체 맵을 표시하는가?
- [ ] 미니맵 클릭 시 해당 위치로 이동하는가?
```

---

## 변경 이력

### v3.3 → v4.0

| 항목 | 변경 내용 |
|------|-----------|
| 플러그인 정보 | KK-NeroMind, Author: Nero-kk |
| 노드 시스템 | 4방향 +/- 버튼, 방향성 유지 설계 추가 |
| 엣지 시스템 | Cubic Bezier 곡선 상세 사양 |
| 자동 정렬 | AutoAligner, 충돌 회피 알고리즘 |
| 입력 시스템 | 상세 키보드/마우스 매핑 |
| 툴바 | 8개 버튼 상세 설계 |
| 미니맵 | 상세 사양 및 인터랙션 |
| 설정 | 전체 설정 항목 정의 |
| 테마 | Light Mode 상세, 확장 구조 |
| 동기화 | 노드-노트 1:1 실시간 동기화 |
| Phase 분할 | 4단계 개발 계획 |

---

**문서 끝**

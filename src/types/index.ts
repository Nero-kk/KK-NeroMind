// === 문서 루트 ===
export interface MindMapDocument {
  readonly version: string;
  readonly title: string;
  readonly autoAlign: boolean;
  readonly root: MindMapNode;
  readonly viewport: ViewportState;
  readonly theme: ThemeId;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// === 노드 ===
export interface MindMapNode {
  readonly id: string;
  readonly label: string;
  readonly children: readonly MindMapNode[];
  readonly noteRef?: string;
  readonly collapsed?: boolean;
  readonly position?: Position;
}

// === 뷰포트 ===
export interface ViewportState {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

// === 보조 타입 ===
export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type ThemeId = "default" | "dark" | "warm" | "square" | "toss-dark" | "neon";

// === 렌더링용 확장 타입 (내부 전용, 저장하지 않음) ===
export interface RenderNode {
  readonly id: string;
  readonly label: string;
  readonly noteRef?: string;
  readonly collapsed?: boolean;
  readonly childCount: number;
  readonly computedX: number;
  readonly computedY: number;
  readonly depth: number;
  readonly parentId: string | null;
  readonly isRoot: boolean;
}

// === 렌더링용 엣지 ===
export interface RenderEdge {
  readonly fromId: string;
  readonly toId: string;
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
}

// === 액션 타입 ===
export type MindMapAction =
  | { readonly type: "ADD_CHILD"; readonly parentId: string; readonly node: MindMapNode }
  | { readonly type: "ADD_SIBLING"; readonly siblingId: string; readonly node: MindMapNode }
  | { readonly type: "DELETE_NODE"; readonly nodeId: string }
  | { readonly type: "RENAME_NODE"; readonly nodeId: string; readonly label: string }
  | { readonly type: "MOVE_NODE"; readonly nodeId: string; readonly newParentId: string; readonly index?: number }
  | { readonly type: "REORDER_NODE"; readonly nodeId: string; readonly direction: "up" | "down" }
  | { readonly type: "TOGGLE_COLLAPSE"; readonly nodeId: string }
  | { readonly type: "LINK_NOTE"; readonly nodeId: string; readonly noteRef: string; readonly label?: string }
  | { readonly type: "UNLINK_NOTE"; readonly nodeId: string }
  | { readonly type: "SET_AUTO_ALIGN"; readonly enabled: boolean }
  | { readonly type: "UPDATE_POSITION"; readonly nodeId: string; readonly position: Position }
  | { readonly type: "UPDATE_VIEWPORT"; readonly viewport: Partial<ViewportState> }
  | { readonly type: "SET_SELECTION"; readonly nodeIds: readonly string[] }
  | { readonly type: "LOAD_DOCUMENT"; readonly document: MindMapDocument }
  | { readonly type: "SET_THEME"; readonly theme: ThemeId }
  | { readonly type: "UPDATE_NOTE_REF"; readonly oldPath: string; readonly newPath: string }
  | { readonly type: "UNLINK_NOTE_BY_REF"; readonly notePath: string }
  | { readonly type: "ADD_CHILDREN_BATCH"; readonly parentId: string; readonly nodes: readonly MindMapNode[] };

// === 히스토리에 기록하지 않는 액션 ===
export const NON_HISTORY_ACTIONS: ReadonlySet<MindMapAction["type"]> = new Set([
  "LOAD_DOCUMENT",
  "UPDATE_VIEWPORT",
  "SET_SELECTION",
  "SET_THEME",
]);

// === 상태 리스너 ===
export type StateListener = (doc: MindMapDocument, action: MindMapAction) => void;
export type Unsubscribe = () => void;

// === 테마 ===
export interface NodeStyle {
  readonly background: string;
  readonly backdropFilter: string;
  readonly border: string;
  readonly boxShadow: string;
  readonly glowColor: string;
}

export interface MindMapTheme {
  readonly id: ThemeId;
  readonly name: string;
  readonly canvas: {
    readonly background: string;
  };
  readonly node: {
    readonly normal: NodeStyle;
    readonly noteLinked: NodeStyle;
    readonly root: NodeStyle;
    readonly selected: NodeStyle;
  };
  readonly edge: {
    readonly color: string;
    readonly width: number;
  };
  readonly text: {
    readonly fontFamily: string;
    readonly fontSize: number;
    readonly color: string;
  };
}

// === 단축키 액션 이름 ===
export type KeyActionName =
  | "addChild"
  | "addSibling"
  | "deleteNode"
  | "rename"
  | "escape"
  | "undo"
  | "redo"
  | "navUp"
  | "navDown"
  | "navLeft"
  | "navRight"
  | "reorderUp"
  | "reorderDown"
  | "moveToParent"
  | "moveToChild"
  | "toggleCollapse";

// === 키 바인딩 ===
export interface KeyBinding {
  readonly key: string;       // e.g. "Tab", "Enter", "ArrowUp", "z"
  readonly ctrl?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
  readonly meta?: boolean;
}

export type KeyBindingMap = Record<KeyActionName, KeyBinding>;

// === 플러그인 설정 ===
export interface NeroMindSettings {
  readonly saveFolderPath: string;
  readonly theme: ThemeId;
  readonly fontFamily: string;
  readonly canvasBgColor: string;
  readonly keyBindings: KeyBindingMap;
}

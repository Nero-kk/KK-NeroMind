/**
 * KK-NeroMind 타입 정의
 *
 * Architecture v4.0 기준 타입 시스템
 */

// ============================================================================
// Disposable 인터페이스
// ============================================================================

/**
 * Disposable 인터페이스
 *
 * 모든 생명주기 관리 대상 컴포넌트는 이 인터페이스를 구현
 * onunload 시 역순으로 destroy 호출됨
 */
export interface Disposable {
	destroy(): void;
}

// ============================================================================
// 기본 타입
// ============================================================================

/**
 * 노드 식별자
 * - 의미적으로 NodeId와 EdgeId를 구분하기 위한 타입 alias
 * - 런타임에는 string이지만 컴파일 타임에 타입 안정성 제공
 */
export type NodeId = string;

/**
 * 엣지 식별자
 * - 의미적으로 NodeId와 EdgeId를 구분하기 위한 타입 alias
 * - 런타임에는 string이지만 컴파일 타임에 타입 안정성 제공
 */
export type EdgeId = string;

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface BoundingBox {
	left: number;
	top: number;
	right: number;
	bottom: number;
	width: number;
	height: number;
}

// ============================================================================
// 노드 시스템
// ============================================================================

/**
 * 마인드맵 노드
 *
 * Architecture v4.0 § 2.1 노드 데이터 구조 기준
 */
export interface MindMapNode {
	id: NodeId; // UUID
	content: string; // 노드 텍스트 또는 노트 링크 (예: [[김진원]])
	position: Position;

	// 계층 구조
	parentId: NodeId | null; // 루트노드는 null
	childIds: NodeId[]; // 자식 노드 ID 배열

	// 방향성 (루트노드에서만 설정, 자식은 상속)
	direction: Direction | null; // 루트노드는 null

	// 상태
	isPinned: boolean; // 핀 고정 여부
	isCollapsed: boolean; // 자식 접힘 여부
	linkedNotePath: string | null; // 연결된 노트 경로

	// 메타데이터
	createdAt: number;
	updatedAt: number;
}

/**
 * 루트 노드 (특수 케이스)
 */
export interface RootNode extends MindMapNode {
	parentId: null;
	direction: null; // 루트노드는 방향 없음
	availableDirections: {
		up: boolean;
		down: boolean;
		left: boolean;
		right: boolean;
	};
}

/**
 * 엣지 (연결선)
 */
export interface MindMapEdge {
	id: EdgeId;
	fromNodeId: NodeId;
	toNodeId: NodeId;
	direction: Direction;
}

// ============================================================================
// 상태 관리
// ============================================================================

/**
 * 영구 상태 (Undo 대상)
 *
 * Architecture v4.0 § 11 상태 관리 시스템 기준
 */
export interface PersistentState {
	schemaVersion: number;
	graph: NodeGraph;
	layout: LayoutData;
	settings: UserSettings;
	pinnedNodes: Set<NodeId>;
}

/**
 * 임시 상태 (Undo 비대상)
 */
export interface EphemeralState {
	selectedNodeId: NodeId | null;
	editingNodeId: NodeId | null;
	collapsedNodes: Set<NodeId>;
	dragState: DragContext | null;
	lastSelectedNodeId: NodeId | null;
}

/**
 * 노드 그래프
 */
export interface NodeGraph {
	nodes: Map<NodeId, MindMapNode>;
	edges: Map<EdgeId, MindMapEdge>;
	rootId: NodeId;
}

/**
 * 레이아웃 데이터
 */
export interface LayoutData {
	viewport: {
		x: number;
		y: number;
		zoom: number;
	};
	nodePositions: Map<NodeId, Position>;
}

/**
 * 사용자 설정
 */
export interface UserSettings {
	autoAlign: boolean;
	centerOnCreate: boolean;
	minimap: MiniMapSettings;
}

export interface MiniMapSettings {
	enabled: boolean;
	size: 'small' | 'medium' | 'large';
	opacity: number;
}

/**
 * 드래그 컨텍스트
 */
export interface DragContext {
	nodeId: NodeId;
	startPosition: Position;
	currentPosition: Position;
}

// ============================================================================
// 플러그인 설정
// ============================================================================

/**
 * NeroMind 플러그인 설정
 *
 * Architecture v4.0 § 8.1 설정 항목 기준
 */
export interface NeroMindSettings {
	// 뷰포트
	centerOnNodeCreate: boolean; // 노드 생성 시 화면 중앙 이동
	autoAlign: boolean; // 자동 정렬

	// 미니맵
	minimap: {
		enabled: boolean; // 미니맵 표시
		size: 'small' | 'medium' | 'large'; // 크기
		opacity: number; // 투명도 0.0~1.0
	};

	// 테마
	theme: 'light' | 'dark' | 'system';

	// 고급
	animationDuration: number; // 애니메이션 속도 ms
	nodeGap: {
		horizontal: number; // 수평 간격
		vertical: number; // 수직 간격
	};
}

/**
 * 기본 설정값
 */
export const DEFAULT_SETTINGS: NeroMindSettings = {
	centerOnNodeCreate: true,
	autoAlign: true,
	minimap: {
		enabled: true,
		size: 'medium',
		opacity: 0.9,
	},
	theme: 'light',
	animationDuration: 200,
	nodeGap: {
		horizontal: 100,
		vertical: 60,
	},
};

// ============================================================================
// 렌더링
// ============================================================================

/**
 * 노드 스타일
 *
 * Architecture v4.0 § 2.2 노드 렌더링 사양 기준
 */
export interface NodeStyle {
	// 기본 형태
	width: number;
	minWidth: number;
	height: number;
	borderRadius: number;

	// Apple Style Glassmorphism
	background: string;
	backdropFilter: string;
	border: string;
	boxShadow: string;

	// 텍스트
	fontFamily: string;
	fontSize: number;
	fontWeight: number;
	color: string;

	// 상태별 스타일
	selected?: Partial<NodeStyle>;
	pinned?: Partial<NodeStyle>;
}

/**
 * 엣지 스타일
 */
export interface EdgeStyle {
	strokeWidth: number;
	strokeColor: string;
	bezier: {
		controlPointOffset: number;
	};
}

/**
 * 테마
 */
export interface Theme {
	name: string;
	canvas: {
		background: string;
	};
	node: NodeStyle;
	edge: EdgeStyle;
}

/**
 * LOD 레벨
 *
 * Architecture v4.0 § 12.1 LOD 레벨 정의 기준
 */
export type LODLevel = 'minimal' | 'basic' | 'standard' | 'full';

// ============================================================================
// 이벤트
// ============================================================================

export type NodeEvent =
	| 'nodeCreated'
	| 'nodeDeleted'
	| 'nodeUpdated'
	| 'nodeMoved'
	| 'nodeSelected'
	| 'nodeDeselected';

export type ViewportEvent = 'viewportChanged' | 'zoomChanged' | 'panChanged';

export type StateEvent = 'stateChanged' | 'historyChanged';

// ============================================================================
// Command 패턴
// ============================================================================

/**
 * Command 인터페이스
 *
 * Architecture v4.0 § 11.1 Undo/Redo 시스템 기준
 */
export interface Command {
	execute(): void;
	undo(): void;
	description: string;
}

// ============================================================================
// 상수
// ============================================================================

export const SVG_NS = 'http://www.w3.org/2000/svg';

export const NODE_CONSTANTS = {
	MIN_WIDTH: 120,
	HEIGHT: 40,
	BORDER_RADIUS: 12,
	PADDING: 12,
} as const;

export const EDGE_CONSTANTS = {
	STROKE_WIDTH: 2,
	CONTROL_POINT_OFFSET: 0.5,
} as const;

export const BUTTON_CONSTANTS = {
	SIZE: 24,
	OFFSET: 12,
} as const;

export const GAP_CONSTANTS = {
	HORIZONTAL: 100,
	VERTICAL: 60,
} as const;

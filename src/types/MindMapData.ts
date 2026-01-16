import { Direction } from './index';

/**
 * .kknm 파일 직렬화 포맷
 * 
 * KK-NeroMind Architecture v4.2.8 준수
 * kknm-schema-v1.md 기준
 * 
 * 이 타입은 파일 시스템에 저장되는 JSON 구조를 정의합니다.
 * 메모리 상태(StateSnapshot)와는 구분됩니다.
 */
export interface MindMapData {
	/**
	 * 메타데이터 섹션
	 * 
	 * 헌법 규칙:
	 * - createdWith는 파일 시그니처 (필수)
	 * - schemaVersion은 정수만 허용 (Semantic Versioning 금지)
	 * - updatedAt은 직렬화 시점에만 갱신
	 */
	meta: {
		createdWith: "KK-NeroMind";
		schemaVersion: number;
		pluginVersion: string;
		createdAt: number;
		updatedAt: number;
	};

	/**
	 * 노드 섹션
	 * 
	 * Object 형태로 저장 (Map이 아님)
	 * Key: NodeId
	 * Value: 노드 데이터
	 */
	nodes: {
		[id: string]: {
			id: string;
			content: string;
			position: { x: number; y: number };
			userPosition: boolean;
			parentId: string | null;
			childIds: string[];
			direction: Direction | null;
			isPinned: boolean;
			isCollapsed: boolean;
			linkedNotePath: string | null;
			createdAt: number;
			updatedAt: number;
		};
	};

	/**
	 * 엣지 섹션
	 * 
	 * Object 형태로 저장 (Map이 아님)
	 * Key: EdgeId
	 * Value: 엣지 데이터
	 */
	edges: {
		[id: string]: {
			id: string;
			fromNodeId: string;
			toNodeId: string;
			direction: Direction;
		};
	};

	/**
	 * 루트 노드 ID
	 * 
	 * 필수 필드
	 */
	rootNodeId: string;

	/**
	 * 뷰 상태 (선택적)
	 * 
	 * 비영속 상태이지만 UX 복원을 위한 힌트로 저장
	 * 
	 * 헌법 규칙:
	 * - 이 필드의 변경은 isDirty를 트리거하지 않음
	 * - 존재하지 않는 노드 ID는 조용히 무시
	 */
	view?: {
		zoom?: number;
		pan?: { x: number; y: number };
		selectedNodeId?: string | null;
	};
}

/**
 * Schema 버전 상수
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * 파일 시그니처
 */
export const FILE_SIGNATURE = "KK-NeroMind" as const;

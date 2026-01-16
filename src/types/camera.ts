/**
 * Camera System Types
 * 
 * 책임:
 * - 카메라 상태 타입 정의
 * - 카메라 변경 사유 정의
 * 
 * 비책임:
 * - 카메라 상태 변경 로직
 * - 좌표 변환
 */

/**
 * 카메라 상태 (Ephemeral State)
 * 
 * 주의:
 * - Undo/Redo 대상 아님
 * - PersistentState 저장 대상 아님
 * - 직접 수정 금지 → CameraController.applyCameraChange() 사용
 */
export interface CameraState {
	/** World → Screen translation X */
	offsetX: number;
	
	/** World → Screen translation Y */
	offsetY: number;
	
	/** Zoom level (0.1 ~ 5.0) */
	scale: number;
}

/**
 * 카메라 변경 사유
 * 
 * 목적:
 * - 디버깅 및 로깅
 * - 변경 주체 명확화
 * - 잠금 규칙 적용
 */
export enum CameraChangeReason {
	/** 사용자 수동 패닝 */
	UserPan = 'UserPan',
	
	/** 사용자 줌 */
	UserZoom = 'UserZoom',
	
	/** 선택 자동 추적 */
	FollowSelection = 'FollowSelection',
	
	/** 특정 노드 중앙 정렬 */
	CenterOnNode = 'CenterOnNode',
	
	/** 초기 뷰포트 설정 */
	InitialViewport = 'InitialViewport',
	
	/** 검색 결과로 점프 */
	SearchJump = 'SearchJump',
	
	/** 리사이즈 보정 */
	ResizeAdjustment = 'ResizeAdjustment'
}

/**
 * 뷰포트 정보
 */
export interface Viewport {
	width: number;
	height: number;
}

/**
 * 2D 좌표 포인트
 */
export interface Point {
	x: number;
	y: number;
}

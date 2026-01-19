/**
 * KK-NeroMind Schema Types v1
 * 
 * 근거: KK-NeroMind-Schema-v5.2.1.md
 * 
 * CRITICAL: 이 파일은 Schema v5.2.1의 TypeScript 구현이다.
 * 필드명, 타입, 구조를 절대 변경하지 말 것.
 */

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * 최상위 Mind Map 스키마
 */
export interface MindMapSchema {
  schemaVersion: number;
  metadata: MindMapMetadata;
  nodes: Record<string, MindMapNode>;
  edges: Record<string, MindMapEdge>;
  camera: CameraState;
}

/**
 * Mind Map 메타데이터
 * 
 * CRITICAL: 필드명 주의
 * - created (NOT createdAt)
 * - modified (NOT updatedAt)
 * - title (필수)
 */
export interface MindMapMetadata {
  created: number;      // Unix timestamp (milliseconds)
  modified: number;     // Unix timestamp (milliseconds)
  title: string;        // Mind Map 제목
  author?: string;      // 작성자 (선택)
  tags?: string[];      // 태그 배열 (선택)
}

/**
 * Mind Map 노드
 */
export interface MindMapNode {
  id: string;
  content: string;
  position: Position;
  size?: Size;
  style?: NodeStyle;
  linkedNote?: string;  // Full Note 연결 (Phase 7에서 사용)
}

/**
 * Mind Map 엣지 (연결선)
 */
export interface MindMapEdge {
  id: string;
  from: string;         // 시작 노드 ID
  to: string;           // 종료 노드 ID
  type?: 'solid' | 'dashed' | 'dotted';
}

/**
 * 2D 위치
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 노드 크기
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 노드 스타일
 * 
 * CRITICAL: v1에서는 반드시 빈 객체 {}
 * 키가 존재하면 검증 실패
 */
export interface NodeStyle {
  // v1: 빈 인터페이스 (확장 금지)
}

/**
 * 카메라 상태
 */
export interface CameraState {
  x: number;            // 카메라 X 위치
  y: number;            // 카메라 Y 위치
  zoom: number;         // 확대/축소 (양수만)
}

import { MindMapData } from '../types/MindMapData';

/**
 * Schema 데이터 정화기
 * 
 * KK-NeroMind Architecture v4.2.8 § 2.3 Schema-Driven Sanitation 준수
 * 
 * 책임:
 * - 참조 무결성 복원 (dangling edges 제거)
 * - Schema가 허용한 최소 조치만 수행
 * - 모든 Sanitation 로그 기록
 * 
 * 비책임:
 * - 추측 기반 복구 (명시적 금지)
 * - 편의적 정리 (명시적 금지)
 * - 의미 추론 (명시적 금지)
 * 
 * 허용 시점:
 * - 파일 로드 (load)
 * - 명시적 검증 (validation)
 * - 마이그레이션 (migration)
 * 
 * 금지 시점:
 * - 렌더링
 * - 인터랙션
 * - 편집
 * - Projection/View Update
 */
export class SchemaSanitizer {
	/**
	 * 데이터 정화
	 * 
	 * Schema가 허용한 최소 조치만 수행:
	 * 1. 존재하지 않는 노드를 참조하는 엣지 제거
	 * 
	 * @param data - 정화할 데이터
	 * @returns 정화된 데이터 (새 객체)
	 */
	sanitize(data: MindMapData): MindMapData {
		// 1. 유효한 노드 ID 집합 생성
		const validNodeIds = new Set(Object.keys(data.nodes));

		// 2. 존재하지 않는 노드를 참조하는 엣지 제거
		const sanitizedEdges: MindMapData['edges'] = {};
		let removedEdgeCount = 0;

		for (const [edgeId, edge] of Object.entries(data.edges)) {
			const isValid =
				validNodeIds.has(edge.fromNodeId) &&
				validNodeIds.has(edge.toNodeId);

			if (isValid) {
				sanitizedEdges[edgeId] = edge;
			} else {
				// 모든 Sanitation 로그 기록 (헌법 요구사항)
				console.warn(
					`[SchemaSanitizer] Invalid edge removed: ${edgeId}`,
					{
						fromNodeId: edge.fromNodeId,
						toNodeId: edge.toNodeId,
						fromExists: validNodeIds.has(edge.fromNodeId),
						toExists: validNodeIds.has(edge.toNodeId),
					}
				);
				removedEdgeCount++;
			}
		}

		if (removedEdgeCount > 0) {
			console.warn(
				`[SchemaSanitizer] Removed ${removedEdgeCount} invalid edge(s)`
			);
		}

		// 3. 정화된 데이터 반환 (새 객체)
		return {
			...data,
			edges: sanitizedEdges,
		};

		// ❌ 금지 사항:
		// - "이 노드는 아마도 root일 것 같아" (추측)
		// - "layoutControlled는 보통 true니까 true로 설정" (보정)
		// - "누락된 필드는 기본값으로 채워줄게" (생성)
		// - "이 정도는 괜찮겠지" (편의적 정리)
	}
}

import { Direction, MindMapNode } from '../types';

/**
 * DirectionPlan
 *
 * 방향 결정 결과를 담는 인터페이스
 * - direction: 노드가 배치될 의미적 방향 (up/down/left/right)
 * - laneIndex: 동일 방향 내 순번 (0부터 시작하는 배치 힌트)
 *
 * 주의: 이 값은 실제 좌표가 아니라 레이아웃 엔진에 전달할 힌트
 */
export interface DirectionPlan {
	direction: Direction;
	laneIndex: number;
}

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
export class DirectionManager {
	/**
	 * 루트 노드에서 특정 방향으로 자식 생성
	 *
	 * @param root - 루트 노드 (사용되지 않지만 시그니처 일관성 유지)
	 * @param direction - 배치할 방향 (up/down/left/right)
	 * @param existingChildren - 이미 존재하는 자식 노드 배열
	 * @returns 방향과 laneIndex를 포함한 DirectionPlan
	 *
	 * 동작:
	 * - 지정된 direction을 그대로 반환
	 * - 동일 방향의 기존 자식 개수를 세어 laneIndex 계산
	 */
	createChildFromRoot(
		root: MindMapNode,
		direction: Direction,
		existingChildren: MindMapNode[]
	): DirectionPlan {
		return {
			direction,
			laneIndex: this.getNextLane(existingChildren, direction),
		};
	}

	/**
	 * 일반 노드에서 자식 생성 (방향 상속)
	 *
	 * @param parent - 부모 노드
	 * @param siblings - 형제 노드 배열 (새 자식의 형제가 될 노드들)
	 * @returns 방향과 laneIndex를 포함한 DirectionPlan
	 *
	 * 동작:
	 * - 부모의 direction을 상속 (parent.direction이 null이면 'right' 기본값)
	 * - 동일 방향의 형제 개수를 세어 laneIndex 계산
	 *
	 * 의미:
	 * 부모가 'left' 방향이면 자식도 'left'로 배치되어야 함
	 */
	createChildFromNode(parent: MindMapNode, siblings: MindMapNode[]): DirectionPlan {
		const inheritedDirection = parent.direction ?? 'right';
		return {
			direction: inheritedDirection,
			laneIndex: this.getNextLane(siblings, inheritedDirection),
		};
	}

	/**
	 * 형제 노드 생성 시 위치 계산
	 *
	 * @param node - 기준 노드
	 * @param siblings - 모든 형제 노드 배열 (node 자신 포함)
	 * @returns 방향과 laneIndex를 포함한 DirectionPlan
	 *
	 * 동작:
	 * - node의 direction을 사용 (null이면 'right' 기본값)
	 * - node 자신을 제외한 형제 중 동일 방향 개수를 세어 laneIndex 계산
	 */
	createSiblingPosition(node: MindMapNode, siblings: MindMapNode[]): DirectionPlan {
		const direction = node.direction ?? 'right';
		return {
			direction,
			laneIndex: this.getNextLane(
				siblings.filter((sibling) => sibling.id !== node.id),
				direction
			),
		};
	}

	/**
	 * 다음 레인 인덱스 계산 (Private Helper)
	 *
	 * @param siblings - 형제 노드 배열
	 * @param direction - 대상 방향
	 * @returns 동일 방향의 노드 개수 (0부터 시작하는 인덱스)
	 *
	 * 동작:
	 * - siblings 중 direction과 일치하는 노드만 필터링
	 * - null direction을 가진 노드는 direction을 기본값으로 간주
	 * - 필터링된 노드 개수를 반환 (= 다음 노드가 들어갈 인덱스)
	 *
	 * 예:
	 * - siblings에 'left' 방향 노드가 2개 있으면 laneIndex는 2
	 * - 새 노드는 0, 1, [2] 순서로 배치됨
	 */
	private getNextLane(siblings: MindMapNode[], direction: Direction): number {
		return siblings.filter(
			(sibling) => (sibling.direction ?? direction) === direction
		).length;
	}
}

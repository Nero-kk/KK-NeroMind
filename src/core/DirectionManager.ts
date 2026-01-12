import { Direction, MindMapNode } from '../types';

/**
 * 자식/형제 방향 결정을 위한 최소 로직
 * - 좌표 계산이나 레이아웃 책임은 포함하지 않는다.
 */
export interface DirectionPlan {
	direction: Direction;
	laneIndex: number; // 동일 방향 내 순번 (배치 힌트)
}

export class DirectionManager {
	/**
	 * 루트에서 특정 방향으로 자식 생성
	 * - 동일 방향 자식 개수를 바탕으로 laneIndex만 계산
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
	 */
	createChildFromNode(parent: MindMapNode, siblings: MindMapNode[]): DirectionPlan {
		const inheritedDirection = parent.direction ?? 'right';
		return {
			direction: inheritedDirection,
			laneIndex: this.getNextLane(siblings, inheritedDirection),
		};
	}

	/**
	 * 형제 노드 생성 시 laneIndex 계산
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

	private getNextLane(siblings: MindMapNode[], direction: Direction): number {
		return siblings.filter(
			(sibling) => (sibling.direction ?? direction) === direction
		).length;
	}
}

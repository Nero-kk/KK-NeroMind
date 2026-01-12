import { MindMapEdge, Direction, Position, SVG_NS, EDGE_CONSTANTS } from '../types';

/**
 * SVGEdgeFactory
 *
 * Architecture v4.0 § 3.1 Cubic Bezier 곡선 사양 기준
 *
 * 역할:
 * - 엣지(연결선) SVG 요소 생성
 * - Cubic Bezier 곡선으로 부드러운 연결
 * - 방향에 따른 제어점 계산
 *
 * Phase 1: 기본 구현
 */
export class SVGEdgeFactory {
	/**
	 * 엣지 SVG 요소 생성
	 */
	createEdgeElement(
		edge: MindMapEdge,
		fromPos: Position,
		toPos: Position,
		direction: Direction
	): SVGPathElement {
		const path = document.createElementNS(SVG_NS, 'path');

		path.setAttribute('id', `edge-${edge.id}`);
		path.setAttribute('class', 'neromind-edge');

		// Cubic Bezier 경로 생성
		const pathData = this.createBezierPath(fromPos, toPos, direction);
		path.setAttribute('d', pathData);

		// 스타일
		path.setAttribute('fill', 'none');
		path.setAttribute('stroke', '#d2d2d7');
		path.setAttribute('stroke-width', String(EDGE_CONSTANTS.STROKE_WIDTH));

		return path;
	}

	/**
	 * Cubic Bezier 경로 생성
	 *
	 * Architecture v4.0 § 3.1 기준
	 */
	private createBezierPath(
		from: Position,
		to: Position,
		direction: Direction
	): string {
		const dx = to.x - from.x;
		const dy = to.y - from.y;

		let cp1: Position;
		let cp2: Position;

		if (direction === 'left' || direction === 'right') {
			// 수평 방향: 수평 제어점
			const offset = dx * EDGE_CONSTANTS.CONTROL_POINT_OFFSET;
			cp1 = { x: from.x + offset, y: from.y };
			cp2 = { x: to.x - offset, y: to.y };
		} else {
			// 수직 방향: 수직 제어점
			const offset = dy * EDGE_CONSTANTS.CONTROL_POINT_OFFSET;
			cp1 = { x: from.x, y: from.y + offset };
			cp2 = { x: to.x, y: to.y - offset };
		}

		return `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;
	}
}

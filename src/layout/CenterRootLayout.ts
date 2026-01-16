/**
 * CenterRootLayout - 중앙 루트 + 좌우 분기 레이아웃
 *
 * Phase 4.x: Renderer와 완전히 분리된 순수 레이아웃 계산 모듈
 *
 * 알고리즘:
 * 1. root 노드 (parentId === null)를 viewport 중앙에 배치
 * 2. depth 1 자식들을 좌우 교차 배치 (짝수 인덱스: 우측, 홀수 인덱스: 좌측)
 * 3. 각 subtree를 재귀적으로 배치하되, 부모와 같은 방향(side) 유지
 *
 * 시간 복잡도: O(n) - 각 노드를 한 번씩만 방문
 */

import { MindMapNode, NodeId, Position } from '../types';

// ============================================================================
// 레이아웃 상수
// ============================================================================

const HORIZONTAL_GAP = 100; // 수평 간격 (부모 ↔ 자식)
const VERTICAL_GAP = 60; // 수직 간격 (형제 노드 간)

// ============================================================================
// 내부 타입
// ============================================================================

type Side = 'left' | 'right';

interface LayoutNode {
	id: NodeId;
	parentId: NodeId | null;
	children: LayoutNode[];
}

interface Viewport {
	width: number;
	height: number;
}

// ============================================================================
// 공개 API
// ============================================================================

/**
 * 중앙 루트 + 좌우 분기 레이아웃 계산
 *
 * 검증 체크리스트:
 * ✓ 루트 노드가 항상 viewport 중앙(width/2, height/2)에 배치되는지
 * ✓ viewport 크기 변경 시 루트 노드 위치가 재계산되는지
 * ✓ 하드코딩된 y=0, marginTop, fixed offset 없이 viewport 기준 계산하는지
 *
 * @param nodes - MindMapNode 배열 (parentId 관계 포함)
 * @param viewport - 뷰포트 크기 { width, height }
 * @returns 각 노드의 좌표 { nodeId: { x, y } }
 */
export function computeCenterRootLayout(
	nodes: readonly MindMapNode[],
	viewport: Viewport
): Record<NodeId, Position> {
	// 1. 노드 맵 구축
	const nodeMap = new Map<NodeId, MindMapNode>();
	for (const node of nodes) {
		nodeMap.set(node.id, node);
	}

	// 2. root 노드 찾기
	const root = nodes.find((n) => n.parentId === null);
	if (!root) {
		return {}; // root 없으면 빈 레이아웃 반환
	}

	// 3. 트리 구조 구축
	const tree = buildTree(root.id, nodeMap);

	// 4. 위치 계산
	const positions: Record<NodeId, Position> = {};

	// root를 viewport 중앙에 배치
	const rootX = viewport.width / 2;
	const rootY = viewport.height / 2;
	positions[root.id] = { x: rootX, y: rootY };

	console.log('[CenterRootLayout] 루트 노드 중앙 배치:', {
		viewport,
		rootId: root.id,
		rootPosition: { x: rootX, y: rootY }
	});

	// depth 1 자식들을 좌우 교차 배치
	const children = tree.children;
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		const side: Side = i % 2 === 0 ? 'right' : 'left';

		// subtree 배치 (재귀)
		layoutSubtree(child, side, rootX, rootY, positions, nodeMap);
	}

	return positions;
}

// ============================================================================
// 내부 함수
// ============================================================================

/**
 * 트리 구조 구축
 *
 * @param nodeId - 현재 노드 ID
 * @param nodeMap - 노드 맵
 * @returns LayoutNode 트리
 */
function buildTree(
	nodeId: NodeId,
	nodeMap: Map<NodeId, MindMapNode>
): LayoutNode {
	const node = nodeMap.get(nodeId);
	if (!node) {
		throw new Error(`Node not found: ${nodeId}`);
	}

	const children: LayoutNode[] = [];
	for (const childId of node.childIds) {
		children.push(buildTree(childId, nodeMap));
	}

	return {
		id: nodeId,
		parentId: node.parentId,
		children,
	};
}

/**
 * Subtree 레이아웃 (재귀)
 *
 * @param tree - 현재 노드의 subtree
 * @param side - 배치 방향 ('left' | 'right')
 * @param parentX - 부모 노드의 x 좌표
 * @param parentY - 부모 노드의 y 좌표
 * @param positions - 결과 위치 맵 (in-place 업데이트)
 * @param nodeMap - 노드 맵
 */
function layoutSubtree(
	tree: LayoutNode,
	side: Side,
	parentX: number,
	parentY: number,
	positions: Record<NodeId, Position>,
	nodeMap: Map<NodeId, MindMapNode>
): void {
	// 현재 노드 위치 계산
	const x = side === 'right' ? parentX + HORIZONTAL_GAP : parentX - HORIZONTAL_GAP;

	// 자식들의 총 높이 계산
	const totalHeight = calculateSubtreeHeight(tree);

	// 현재 노드를 subtree 중앙에 배치
	const y = parentY;

	positions[tree.id] = { x, y };

	// 자식들을 수직으로 배치
	if (tree.children.length > 0) {
		// 첫 번째 자식의 시작 y 좌표
		let currentY = y - totalHeight / 2;

		for (const child of tree.children) {
			const childHeight = calculateSubtreeHeight(child);
			const childCenterY = currentY + childHeight / 2;

			// 자식 subtree를 재귀적으로 배치 (같은 side 유지)
			layoutSubtree(child, side, x, childCenterY, positions, nodeMap);

			currentY += childHeight + VERTICAL_GAP;
		}
	}
}

/**
 * Subtree 총 높이 계산 (재귀)
 *
 * @param tree - 현재 노드의 subtree
 * @returns 총 높이 (자식들 높이 + 간격 포함)
 */
function calculateSubtreeHeight(tree: LayoutNode): number {
	if (tree.children.length === 0) {
		return 0; // leaf 노드
	}

	// 자식들의 높이 합계 + 간격
	let totalHeight = 0;
	for (let i = 0; i < tree.children.length; i++) {
		const childHeight = calculateSubtreeHeight(tree.children[i]);
		totalHeight += Math.max(childHeight, 0);

		// 간격 추가 (마지막 자식 제외)
		if (i < tree.children.length - 1) {
			totalHeight += VERTICAL_GAP;
		}
	}

	return totalHeight;
}

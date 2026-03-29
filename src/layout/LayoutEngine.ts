import type { MindMapNode, RenderNode, RenderEdge } from "../types";
import { LAYOUT } from "../constants";
import { computeNodeWidth } from "../utils/TextMetrics";

interface LayoutResult {
  readonly nodes: RenderNode[];
  readonly edges: RenderEdge[];
}

/** 수평 간격 최소 여백 (노드 우측 끝 ~ 자식 노드 좌측 끝) */
const HORIZONTAL_MARGIN = 40;

interface InternalNode {
  id: string;
  label: string;
  noteRef?: string;
  collapsed?: boolean;
  childCount: number;
  children: InternalNode[];
  depth: number;
  parentId: string | null;
  isRoot: boolean;
  // Reingold-Tilford 임시 값
  x: number;
  y: number;
  mod: number;         // modifier (서브트리 오프셋 보정)
  subtreeHeight: number;
  nodeWidth: number;   // 실제 렌더링 폭
}

/**
 * Reingold-Tilford 변형 레이아웃.
 * 좌→우(LR) 방향 트리 레이아웃을 계산한다.
 * (Reingold-Tilford는 원래 상→하이지만, x/y를 뒤집어 LR로 변환)
 */
export function computeLayout(root: MindMapNode, autoAlign: boolean): LayoutResult {
  const nodes: RenderNode[] = [];
  const edges: RenderEdge[] = [];

  // 1. 내부 트리 구성
  const internalRoot = buildInternalTree(root, null, 0);

  // 2. 레이아웃 계산
  if (autoAlign) {
    computePositions(internalRoot);
  } else {
    // Auto-Align OFF: 수동 위치 사용 (저장된 position 또는 기본 레이아웃)
    computePositions(internalRoot);
    applyManualPositions(internalRoot, root);
  }

  // 3. RenderNode / RenderEdge 변환
  collectRenderData(internalRoot, nodes, edges);

  return { nodes, edges };
}

function buildInternalTree(
  node: MindMapNode,
  parentId: string | null,
  depth: number,
): InternalNode {
  const visibleChildren = node.collapsed
    ? []
    : node.children.map((child) => buildInternalTree(child, node.id, depth + 1));

  const isRoot = depth === 0;
  const nodeWidth = computeNodeWidth(node.label, isRoot, LAYOUT);

  return {
    id: node.id,
    label: node.label,
    noteRef: node.noteRef,
    collapsed: node.collapsed,
    childCount: node.children.length,
    children: visibleChildren,
    depth,
    parentId,
    isRoot,
    x: 0,
    y: 0,
    mod: 0,
    subtreeHeight: 0,
    nodeWidth,
  };
}

/**
 * 간소화된 Reingold-Tilford:
 * - 1st pass (후위): 각 서브트리의 높이 계산 + 자식 간 y 좌표 할당
 * - 2nd pass (전위): mod 값을 적용하여 최종 좌표 결정
 *
 * LR 방향이므로:
 * - x = depth * HORIZONTAL_GAP (깊이에 비례)
 * - y = 서브트리 내 수직 위치
 */
function computePositions(root: InternalNode): void {
  firstPass(root);

  // 깊이별 최대 노드 폭 계산 → 동적 x 오프셋
  const maxWidthByDepth = new Map<number, number>();
  collectMaxWidths(root, maxWidthByDepth);

  // 깊이별 누적 x 좌표: 이전 깊이의 노드 우측 끝 + 마진
  const xOffsets = new Map<number, number>();
  xOffsets.set(0, 0);
  let maxDepth = 0;
  for (const d of maxWidthByDepth.keys()) {
    if (d > maxDepth) maxDepth = d;
  }
  for (let d = 1; d <= maxDepth; d++) {
    const prevMaxWidth = maxWidthByDepth.get(d - 1) ?? LAYOUT.NODE_MIN_WIDTH;
    const prevX = xOffsets.get(d - 1) ?? 0;
    xOffsets.set(d, prevX + prevMaxWidth / 2 + HORIZONTAL_MARGIN + (maxWidthByDepth.get(d) ?? LAYOUT.NODE_MIN_WIDTH) / 2);
  }

  secondPass(root, 0, xOffsets, maxWidthByDepth);
}

/** 노드 타입에 따른 높이 반환 */
function getNodeHeight(node: InternalNode): number {
  return node.isRoot ? LAYOUT.ROOT_HEIGHT : LAYOUT.NODE_HEIGHT;
}

/** 후위 순회: 서브트리 높이 계산 + 자식 y 할당 */
function firstPass(node: InternalNode): void {
  const selfHeight = getNodeHeight(node);

  if (node.children.length === 0) {
    node.subtreeHeight = selfHeight;
    return;
  }

  // 재귀적으로 자식 먼저 처리
  for (const child of node.children) {
    firstPass(child);
  }

  // 전체 서브트리 높이 = 자식 서브트리 높이 합 + 간격
  let totalHeight = 0;
  for (let i = 0; i < node.children.length; i++) {
    totalHeight += node.children[i].subtreeHeight;
    if (i < node.children.length - 1) {
      totalHeight += LAYOUT.VERTICAL_GAP;
    }
  }
  node.subtreeHeight = Math.max(totalHeight, selfHeight);

  // 자식들의 y 좌표를 서브트리 중앙 기준으로 배치
  let currentY = -totalHeight / 2;
  for (const child of node.children) {
    child.y = currentY + child.subtreeHeight / 2;
    child.mod = 0;
    currentY += child.subtreeHeight + LAYOUT.VERTICAL_GAP;
  }
}

/** 깊이별 최대 노드 폭 수집 */
function collectMaxWidths(node: InternalNode, map: Map<number, number>): void {
  const current = map.get(node.depth) ?? 0;
  if (node.nodeWidth > current) {
    map.set(node.depth, node.nodeWidth);
  }
  for (const child of node.children) {
    collectMaxWidths(child, map);
  }
}

/** 전위 순회: 부모 절대 y를 전파하여 최종 좌표 결정 (좌측 정렬 + 동적 x 오프셋) */
function secondPass(
  node: InternalNode,
  parentAbsoluteY: number,
  xOffsets: Map<number, number>,
  maxWidthByDepth: Map<number, number>,
): void {
  // 열 중심 좌표에서 좌측 정렬: 열 좌측 끝 + 노드 자체 폭/2
  const columnCenter = xOffsets.get(node.depth) ?? (node.depth * LAYOUT.HORIZONTAL_GAP);
  const columnMaxWidth = maxWidthByDepth.get(node.depth) ?? node.nodeWidth;
  const columnLeft = columnCenter - columnMaxWidth / 2;
  node.x = columnLeft + node.nodeWidth / 2;

  // y: 부모의 절대 좌표 + firstPass에서 할당된 상대 오프셋
  node.y = parentAbsoluteY + node.y;

  for (const child of node.children) {
    secondPass(child, node.y, xOffsets, maxWidthByDepth);
  }
}

/** 수동 위치가 있는 노드에 적용 (Auto-Align OFF) */
function applyManualPositions(internal: InternalNode, original: MindMapNode): void {
  if (original.position) {
    internal.x = original.position.x;
    internal.y = original.position.y;
  }

  if (!original.collapsed) {
    for (let i = 0; i < internal.children.length; i++) {
      if (i < original.children.length) {
        applyManualPositions(internal.children[i], original.children[i]);
      }
    }
  }
}

/** 렌더 데이터 수집 */
function collectRenderData(
  node: InternalNode,
  nodes: RenderNode[],
  edges: RenderEdge[],
): void {
  nodes.push({
    id: node.id,
    label: node.label,
    noteRef: node.noteRef,
    collapsed: node.collapsed,
    childCount: node.childCount,
    computedX: node.x,
    computedY: node.y,
    depth: node.depth,
    parentId: node.parentId,
    isRoot: node.isRoot,
  });

  for (const child of node.children) {
    edges.push({
      fromId: node.id,
      toId: child.id,
      fromX: node.x + node.nodeWidth / 2,
      fromY: node.y,
      toX: child.x - child.nodeWidth / 2,
      toY: child.y,
    });
    collectRenderData(child, nodes, edges);
  }
}


import {
  MindMapNode,
  MindMapEdge,
  CreateNodeOptions,
  NodePosition,
  NODE_WIDTH,
  HORIZONTAL_SPACING,
  VERTICAL_SPACING,
  ROOT_POSITION,
} from "../types";

// Generate unique ID
export const generateId = (): string => {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Create a new node
export const createNode = (options: CreateNodeOptions): MindMapNode => {
  const id = generateId();
  return {
    id,
    type: "mindmap",
    position: options.position,
    data: {
      label: options.label || "New Node",
      parentId: options.parentId || null,
      level: options.level ?? 0,
      isEditing: options.isEditing ?? true, // Default to true unless specified
    },
    // Important for dragging to work properly in React Flow
    dragHandle: ".mindmap-node-drag-handle",
  };
};

// Create root node
export const createRootNode = (label: string = "Central Idea"): MindMapNode => {
  return {
    id: generateId(),
    type: "mindmap",
    position: ROOT_POSITION,
    data: {
      label,
      parentId: null,
      level: 0,
      isEditing: false,
    },
  };
};

// Create edge between two nodes
export const createEdge = (sourceId: string, targetId: string): MindMapEdge => {
  return {
    id: `edge-${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    type: "smoothstep", // Mind map style edge
    animated: false,
    style: {
      stroke: "rgba(99, 102, 241, 0.6)",
      strokeWidth: 2,
    },
  };
};

// Calculate position for a new child node
export const calculateChildPosition = (
  parentNode: MindMapNode,
  existingChildren: MindMapNode[]
): NodePosition => {
  const parentX = parentNode.position.x;
  const parentY = parentNode.position.y;

  // Position child to the right of parent
  const childX = parentX + NODE_WIDTH + HORIZONTAL_SPACING;

  // If no children, place parallel to parent or slightly adjusted
  if (existingChildren.length === 0) {
    return { x: childX, y: parentY };
  }

  // Find the lowest child and position below it
  const childrenYPositions = existingChildren.map((c) => c.position.y);
  const lowestY = Math.max(...childrenYPositions);

  return { x: childX, y: lowestY + VERTICAL_SPACING };
};

// Calculate position for a new sibling node
export const calculateSiblingPosition = (
  currentNode: MindMapNode,
  siblings: MindMapNode[]
): NodePosition => {
  const currentX = currentNode.position.x;

  // Find the lowest sibling (including current) and position below
  const siblingsIncludingCurrent = [...siblings, currentNode];
  const lowestY = Math.max(
    ...siblingsIncludingCurrent.map((s) => s.position.y)
  );

  return { x: currentX, y: lowestY + VERTICAL_SPACING };
};

// Get children of a node
export const getChildNodes = (
  parentId: string,
  nodes: MindMapNode[]
): MindMapNode[] => {
  return nodes.filter((node) => node.data.parentId === parentId);
};

// Get siblings of a node
export const getSiblingNodes = (
  node: MindMapNode,
  nodes: MindMapNode[]
): MindMapNode[] => {
  if (!node.data.parentId) {
    // Root node has no siblings
    return [];
  }
  return nodes.filter(
    (n) => n.data.parentId === node.data.parentId && n.id !== node.id
  );
};

// Get all descendant node IDs (for deletion)
export const getDescendantIds = (
  nodeId: string,
  nodes: MindMapNode[]
): string[] => {
  const descendants: string[] = [];
  const children = getChildNodes(nodeId, nodes);

  for (const child of children) {
    descendants.push(child.id);
    descendants.push(...getDescendantIds(child.id, nodes));
  }

  return descendants;
};

// Delete a node and all its descendants
export const deleteNodeWithDescendants = (
  nodeId: string,
  nodes: MindMapNode[],
  edges: MindMapEdge[]
): { nodes: MindMapNode[]; edges: MindMapEdge[] } => {
  const idsToDelete = [nodeId, ...getDescendantIds(nodeId, nodes)];

  const newNodes = nodes.filter((n) => !idsToDelete.includes(n.id));
  const newEdges = edges.filter(
    (e) => !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target)
  );

  return { nodes: newNodes, edges: newEdges };
};

// Update node label (Utility helper)
export const updateNodeLabel = (
  nodeId: string,
  label: string,
  nodes: MindMapNode[]
): MindMapNode[] => {
  return nodes.map((node) =>
    node.id === nodeId
      ? { ...node, data: { ...node.data, label, isEditing: false } }
      : node
  );
};

// Set node editing state
export const setNodeEditing = (
  nodeId: string,
  isEditing: boolean,
  nodes: MindMapNode[]
): MindMapNode[] => {
  return nodes.map((node) =>
    node.id === nodeId
      ? { ...node, data: { ...node.data, isEditing } }
      : { ...node, data: { ...node.data, isEditing: false } }
  );
};

// Find node by ID
export const findNodeById = (
  nodeId: string,
  nodes: MindMapNode[]
): MindMapNode | undefined => {
  return nodes.find((n) => n.id === nodeId);
};

// Get parent node
export const getParentNode = (
  node: MindMapNode,
  nodes: MindMapNode[]
): MindMapNode | undefined => {
  if (!node.data.parentId) return undefined;
  return findNodeById(node.data.parentId, nodes);
};

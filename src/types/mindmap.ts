import { Node, Edge } from '@xyflow/react';

// MindMap Node Data
export interface MindMapNodeData {
  label: string;
  parentId?: string | null;
  level: number;
  isEditing?: boolean;
  collapsed?: boolean;
}

// MindMap Node Type
export type MindMapNode = Node<MindMapNodeData, 'mindmap'>;

// MindMap Edge Type
export type MindMapEdge = Edge;

// MindMap State
export interface MindMapState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  selectedNodeId: string | null;
}

// Position for new node calculation
export interface NodePosition {
  x: number;
  y: number;
}

// Node creation options
export interface CreateNodeOptions {
  parentId?: string | null;
  position: NodePosition;
  label?: string;
  level?: number;
}

// Constants
export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 44;
export const HORIZONTAL_SPACING = 200;
export const VERTICAL_SPACING = 80;
export const ROOT_POSITION: NodePosition = { x: 400, y: 300 };

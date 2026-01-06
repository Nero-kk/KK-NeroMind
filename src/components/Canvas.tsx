import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  NodeMouseHandler,
  ReactFlowInstance,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { MindMapNode as MindMapNodeComponent } from './MindMapNode';
import { MindMapNode, MindMapEdge } from '../types';
import {
  createNode,
  createEdge,
  calculateChildPosition,
  calculateSiblingPosition,
  getChildNodes,
  getSiblingNodes,
  deleteNodeWithDescendants,
  setNodeEditing,
  findNodeById,
} from '../utils';

// Define custom node types
const nodeTypes = {
  mindmap: MindMapNodeComponent,
};

interface CanvasProps {
  nodes: MindMapNode[];
  setNodes: React.Dispatch<React.SetStateAction<MindMapNode[]>>;
}

export const Canvas: React.FC<CanvasProps> = ({
  nodes: externalNodes,
  setNodes: setExternalNodes,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<MindMapNode>(externalNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindMapEdge>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Sync internal nodes with external state
  useEffect(() => {
    setExternalNodes(nodes);
  }, [nodes, setExternalNodes]);

  // Initialize with external nodes
  useEffect(() => {
    if (externalNodes.length > 0 && nodes.length === 0) {
      setNodes(externalNodes);
    }
  }, [externalNodes, nodes.length, setNodes]);

  // Get selected node ID
  const selectedNodeId = useMemo(() => {
    const selectedNode = nodes.find((n) => n.selected);
    return selectedNode?.id || null;
  }, [nodes]);

  // Handle connection between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));
    },
    [setEdges]
  );

  // Create root node on double-click empty canvas
  const handlePaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!reactFlowInstance.current) return;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create new root node at clicked position
      const newNode = createNode({
        position,
        label: 'New Idea',
        level: 0,
        parentId: null,
      });

      setNodes((nds) => {
        const updated = [...nds, newNode];
        // Select the new node
        return updated.map((n) => ({
          ...n,
          selected: n.id === newNode.id,
        }));
      });
    },
    [setNodes]
  );

  // Handle node double click for editing
  const handleNodeDoubleClick: NodeMouseHandler = useCallback(
    (event, node) => {
      event.stopPropagation();
      setNodes((nds) => setNodeEditing(node.id, true, nds as MindMapNode[]));
    },
    [setNodes]
  );

  // Add child node (Tab key)
  const addChildNode = useCallback(() => {
    if (!selectedNodeId) return;

    const parentNode = findNodeById(selectedNodeId, nodes as MindMapNode[]);
    if (!parentNode) return;

    const existingChildren = getChildNodes(selectedNodeId, nodes as MindMapNode[]);
    const position = calculateChildPosition(parentNode, existingChildren);

    const newNode = createNode({
      position,
      label: 'New Node',
      level: parentNode.data.level + 1,
      parentId: selectedNodeId,
    });

    const newEdge = createEdge(selectedNodeId, newNode.id);

    setNodes((nds) => {
      const updated = [...nds, newNode];
      return updated.map((n) => ({
        ...n,
        selected: n.id === newNode.id,
      }));
    });
    setEdges((eds) => [...eds, newEdge]);
  }, [selectedNodeId, nodes, setNodes, setEdges]);

  // Add sibling node (Enter key)
  const addSiblingNode = useCallback(() => {
    if (!selectedNodeId) return;

    const currentNode = findNodeById(selectedNodeId, nodes as MindMapNode[]);
    if (!currentNode || !currentNode.data.parentId) {
      // If root node, create child instead
      addChildNode();
      return;
    }

    const parentId = currentNode.data.parentId;
    const siblings = getSiblingNodes(currentNode, nodes as MindMapNode[]);
    const position = calculateSiblingPosition(currentNode, siblings);

    const newNode = createNode({
      position,
      label: 'New Node',
      level: currentNode.data.level,
      parentId,
    });

    const newEdge = createEdge(parentId, newNode.id);

    setNodes((nds) => {
      const updated = [...nds, newNode];
      return updated.map((n) => ({
        ...n,
        selected: n.id === newNode.id,
      }));
    });
    setEdges((eds) => [...eds, newEdge]);
  }, [selectedNodeId, nodes, setNodes, setEdges, addChildNode]);

  // Delete selected node (Delete key)
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;

    const result = deleteNodeWithDescendants(
      selectedNodeId,
      nodes as MindMapNode[],
      edges as MindMapEdge[]
    );

    setNodes(result.nodes);
    setEdges(result.edges);
  }, [selectedNodeId, nodes, edges, setNodes, setEdges]);

  // Start editing selected node (Space key)
  const startEditingNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => setNodeEditing(selectedNodeId, true, nds as MindMapNode[]));
  }, [selectedNodeId, setNodes]);

  // Handle keyboard shortcuts at document level
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're inside the ReactFlow wrapper
      const wrapper = reactFlowWrapper.current;
      if (!wrapper) return;

      // Check if the event target is within our wrapper
      const target = event.target as HTMLElement;
      if (!wrapper.contains(target)) return;

      // Ignore if currently editing a node (input focused)
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (event.key) {
        case 'Tab':
          event.preventDefault();
          event.stopPropagation();
          addChildNode();
          break;
        case 'Enter':
          event.preventDefault();
          event.stopPropagation();
          addSiblingNode();
          break;
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          event.stopPropagation();
          deleteSelectedNode();
          break;
        case ' ': // Space
          event.preventDefault();
          event.stopPropagation();
          startEditingNode();
          break;
      }
    };

    // Add listener at document level with capture phase
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [addChildNode, addSiblingNode, deleteSelectedNode, startEditingNode]);

  // Handle label change from custom event
  useEffect(() => {
    const handleLabelChange = (event: CustomEvent) => {
      const { label } = event.detail;
      setNodes((nds) => {
        return nds.map((n) => {
          if (n.data.isEditing) {
            return {
              ...n,
              data: { ...n.data, label, isEditing: false },
            };
          }
          return n;
        });
      });
    };

    window.addEventListener(
      'neromind:node-label-change',
      handleLabelChange as EventListener
    );

    return () => {
      window.removeEventListener(
        'neromind:node-label-change',
        handleLabelChange as EventListener
      );
    };
  }, [setNodes]);

  // React Flow initialization
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  return (
    <div
      ref={reactFlowWrapper}
      className="nm-flex-1 nm-relative nm-overflow-hidden"
      tabIndex={0}
      style={{ width: '100%', height: '100%' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onPaneClick={() => {
          setNodes((nds) =>
            nds.map((n) => ({ ...n, selected: false }))
          );
        }}
        onDoubleClick={handlePaneDoubleClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={true}
        zoomOnScroll={true}
        fitView
        fitViewOptions={{
          padding: 0.5,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: 'rgba(99, 102, 241, 0.6)',
            strokeWidth: 2,
          },
        }}
        proOptions={{ hideAttribution: true }}
        className="nm-bg-nero-light dark:nm-bg-nero-dark"
      >
        {/* Grid Background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--nm-grid-dot-color, rgba(128, 128, 128, 0.3))"
        />

        {/* Controls - Bottom Left */}
        <Controls
          className="nm-mindmap-controls"
          position="bottom-left"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />

        {/* MiniMap - Bottom Right */}
        <MiniMap
          className="nm-mindmap-minimap"
          position="bottom-right"
          nodeColor={(node) => {
            const level = (node.data as MindMapNode['data'])?.level || 0;
            const colors = [
              'rgba(59, 130, 246, 0.8)',
              'rgba(99, 102, 241, 0.7)',
              'rgba(139, 92, 246, 0.7)',
              'rgba(168, 85, 247, 0.7)',
              'rgba(192, 132, 252, 0.6)',
            ];
            return colors[Math.min(level, colors.length - 1)];
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Empty state hint */}
      {nodes.length === 0 && (
        <div className="nm-absolute nm-inset-0 nm-flex nm-items-center nm-justify-center nm-pointer-events-none">
          <div className="nm-text-center nm-text-nero-text-light/50 dark:nm-text-nero-text-dark/50">
            <div className="nm-text-5xl nm-mb-4">🧠</div>
            <p className="nm-text-xl nm-font-semibold nm-mb-2">NeroMind</p>
            <p className="nm-text-sm nm-mt-2 nm-max-w-xs">
              Double-click on the canvas to create your first node
            </p>
            <div className="nm-mt-4 nm-text-xs nm-opacity-70">
              <p><kbd className="nm-px-1.5 nm-py-0.5 nm-bg-white/10 nm-rounded nm-font-mono">Tab</kbd> Add child node</p>
              <p className="nm-mt-1"><kbd className="nm-px-1.5 nm-py-0.5 nm-bg-white/10 nm-rounded nm-font-mono">Enter</kbd> Add sibling node</p>
              <p className="nm-mt-1"><kbd className="nm-px-1.5 nm-py-0.5 nm-bg-white/10 nm-rounded nm-font-mono">Space</kbd> Edit node</p>
              <p className="nm-mt-1"><kbd className="nm-px-1.5 nm-py-0.5 nm-bg-white/10 nm-rounded nm-font-mono">Delete</kbd> Remove node</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;

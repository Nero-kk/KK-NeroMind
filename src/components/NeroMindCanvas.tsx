import React, { useState, useCallback } from 'react';
import { App } from 'obsidian';
import { Toolbar } from './Toolbar';
import { Canvas } from './Canvas';
import { MindMapNode } from '../types';

interface NeroMindCanvasProps {
  app: App;
}

export const NeroMindCanvas: React.FC<NeroMindCanvasProps> = ({ app }) => {
  const [nodes, setNodes] = useState<MindMapNode[]>([]);

  const handleNewDocument = useCallback(() => {
    console.log('New document');
    setNodes([]);
  }, []);

  const handleSave = useCallback(() => {
    console.log('Save');
  }, []);

  const handleOpen = useCallback(() => {
    console.log('Open');
  }, []);

  const handleAutoArrange = useCallback(() => {
    console.log('Auto arrange');
  }, []);

  const handleExport = useCallback(() => {
    console.log('Export');
  }, []);

  return (
    <div className="nm-flex nm-flex-col nm-h-full nm-w-full nm-bg-nero-light dark:nm-bg-nero-dark nm-font-sf">
      <Toolbar
        onNewDocument={handleNewDocument}
        onSave={handleSave}
        onOpen={handleOpen}
        onAutoArrange={handleAutoArrange}
        onExport={handleExport}
      />
      <Canvas nodes={nodes} setNodes={setNodes} />
    </div>
  );
};

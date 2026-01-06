import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { MindMapNodeData } from '../types';

interface MindMapNodeComponentProps extends NodeProps {
  data: MindMapNodeData;
}

export const MindMapNode: React.FC<MindMapNodeComponentProps> = memo(({ id, data, selected, dragging }) => {
  const [isEditing, setIsEditing] = useState(data.isEditing || false);
  const [labelValue, setLabelValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with external label changes
  useEffect(() => {
    setLabelValue(data.label);
  }, [data.label]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Listen for external edit trigger
  useEffect(() => {
    if (data.isEditing && !isEditing) {
      setIsEditing(true);
    }
  }, [data.isEditing, isEditing]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLabelValue(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsEditing(false);
    // Always dispatch the event to update the label
    window.dispatchEvent(
      new CustomEvent('neromind:node-label-change', {
        detail: { nodeId: id, label: labelValue.trim() || 'New Node' },
      })
    );
  }, [labelValue, id]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(false);
        window.dispatchEvent(
          new CustomEvent('neromind:node-label-change', {
            detail: { nodeId: id, label: labelValue.trim() || 'New Node' },
          })
        );
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(false);
        setLabelValue(data.label); // Reset to original
      }
    },
    [labelValue, id, data.label]
  );

  // Calculate level-based color
  const getLevelColor = (level: number): string => {
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue - Root
      'rgba(99, 102, 241, 0.7)',   // Indigo - Level 1
      'rgba(139, 92, 246, 0.7)',   // Violet - Level 2
      'rgba(168, 85, 247, 0.7)',   // Purple - Level 3
      'rgba(192, 132, 252, 0.6)', // Light Purple - Level 4+
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  const levelColor = getLevelColor(data.level);
  const isRoot = data.level === 0;

  return (
    <div
      className={`
        nm-mindmap-node
        nm-relative nm-px-4 nm-py-2.5 nm-min-w-[120px] nm-max-w-[240px]
        nm-rounded-xl nm-select-none
        nm-transition-all nm-duration-200 nm-ease-out
        ${dragging ? 'nm-cursor-grabbing' : 'nm-cursor-grab'}
        ${selected
          ? 'nm-ring-2 nm-ring-blue-400 nm-ring-offset-1 nm-ring-offset-transparent'
          : ''
        }
        ${isRoot ? 'nm-font-semibold' : 'nm-font-medium'}
      `}
      style={{
        // Glassmorphism effect
        background: `linear-gradient(135deg,
          rgba(255, 255, 255, 0.25) 0%,
          rgba(255, 255, 255, 0.1) 100%)`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid rgba(255, 255, 255, 0.3)`,
        boxShadow: selected
          ? `0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 2px ${levelColor}, inset 0 1px 0 rgba(255,255,255,0.4)`
          : `0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.3)`,
        transform: dragging ? 'scale(1.05)' : selected ? 'scale(1.02)' : 'scale(1)',
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Left Handle (for incoming connections) */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: 8,
            height: 8,
            background: 'rgba(255, 255, 255, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            left: -4,
          }}
        />
      )}

      {/* Node Content */}
      <div className="nm-flex nm-items-center nm-justify-center nm-gap-2">
        {/* Level indicator dot */}
        <div
          className="nm-w-2 nm-h-2 nm-rounded-full nm-flex-shrink-0"
          style={{ backgroundColor: levelColor }}
        />

        {/* Label */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={labelValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="nm-bg-transparent nm-border-none nm-outline-none nm-text-center nm-text-sm nm-w-full"
            style={{
              minWidth: '60px',
              color: 'inherit',
              fontFamily: 'inherit',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="nm-text-sm nm-truncate"
            style={{ color: 'var(--text-normal, #1f2937)' }}
          >
            {labelValue}
          </span>
        )}
      </div>

      {/* Right Handle (for outgoing connections) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 8,
          height: 8,
          background: 'rgba(255, 255, 255, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          right: -4,
        }}
      />
    </div>
  );
});

MindMapNode.displayName = 'MindMapNode';

export default MindMapNode;

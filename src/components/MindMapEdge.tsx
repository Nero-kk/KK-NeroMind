import React, { memo } from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

export const MindMapEdge: React.FC<EdgeProps> = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
    style,
  }) => {
    // Calculate bezier path with smooth curve
    const [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.4, // Smooth cubic bezier curve
    });

    return (
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected
            ? 'rgba(99, 102, 241, 0.9)'
            : 'rgba(99, 102, 241, 0.4)',
          strokeWidth: selected ? 2.5 : 2,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
          filter: selected
            ? 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3))'
            : 'none',
          ...style,
        }}
      />
    );
  }
);

MindMapEdge.displayName = 'MindMapEdge';

export default MindMapEdge;

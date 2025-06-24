'use client';

import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { RequirementLinkData } from '@/types/react-flow.types';

const RequirementEdge: React.FC<EdgeProps<RequirementLinkData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getLinkTypeColor = (linkType?: string) => {
    switch (linkType) {
      case 'implements': return '#10B981'; // Green
      case 'derives': return '#3B82F6'; // Blue
      case 'validates': return '#F59E0B'; // Yellow
      case 'traces': return '#8B5CF6'; // Purple
      case 'depends': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  const getLinkTypeLabel = (linkType?: string) => {
    switch (linkType) {
      case 'implements': return 'Implements';
      case 'derives': return 'Derives';
      case 'validates': return 'Validates';
      case 'traces': return 'Traces';
      case 'depends': return 'Depends';
      default: return 'Links';
    }
  };

  const color = getLinkTypeColor(data?.linkType);
  const strokeWidth = selected ? 3 : 2;
  const opacity = data?.confidence ? data.confidence : 1;

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity}
        fill="none"
        markerEnd="url(#requirement-arrow)"
        style={{
          strokeDasharray: data?.linkType === 'derives' ? '5,5' : undefined,
        }}
      />
      
      {/* Custom arrow marker */}
      <defs>
        <marker
          id="requirement-arrow"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={color}
            fillOpacity={opacity}
          />
        </marker>
      </defs>

      {/* Edge Label */}
      {(data?.label || data?.linkType) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              className="px-2 py-1 bg-white border rounded shadow-sm text-xs font-medium"
              style={{ 
                borderColor: color,
                color: color,
              }}
            >
              {data?.label || getLinkTypeLabel(data?.linkType)}
              {data?.confidence && data.confidence < 1 && (
                <span className="ml-1 text-gray-500">
                  ({Math.round(data.confidence * 100)}%)
                </span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default RequirementEdge;

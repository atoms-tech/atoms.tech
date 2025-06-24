'use client';

import React from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import { ProcessFlowData } from '@/types/react-flow.types';

const ProcessFlowEdge: React.FC<EdgeProps<ProcessFlowData>> = ({
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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 10,
  });

  const getFlowTypeColor = (linkType?: string) => {
    switch (linkType) {
      case 'sequence': return '#3B82F6'; // Blue
      case 'conditional': return '#F59E0B'; // Yellow
      case 'parallel': return '#10B981'; // Green
      case 'loop': return '#8B5CF6'; // Purple
      default: return '#6B7280'; // Gray
    }
  };

  const getFlowTypeStyle = (linkType?: string) => {
    switch (linkType) {
      case 'conditional':
        return { strokeDasharray: '8,4' };
      case 'parallel':
        return { strokeWidth: 4 };
      case 'loop':
        return { strokeDasharray: '4,4' };
      default:
        return {};
    }
  };

  const color = getFlowTypeColor(data?.linkType);
  const strokeWidth = selected ? 3 : 2;
  const style = getFlowTypeStyle(data?.linkType);

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        stroke={color}
        strokeWidth={style.strokeWidth || strokeWidth}
        fill="none"
        markerEnd="url(#process-arrow)"
        style={{
          strokeDasharray: style.strokeDasharray,
        }}
      />
      
      {/* Custom arrow marker */}
      <defs>
        <marker
          id="process-arrow"
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
          />
        </marker>
      </defs>

      {/* Edge Label */}
      {(data?.label || data?.condition || data?.probability) && (
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
              {data?.label && <div>{data.label}</div>}
              {data?.condition && (
                <div className="text-gray-600">
                  {data.condition}
                </div>
              )}
              {data?.probability && (
                <div className="text-gray-500">
                  {Math.round(data.probability * 100)}%
                </div>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default ProcessFlowEdge;

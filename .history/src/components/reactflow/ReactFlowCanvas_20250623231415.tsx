'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  ReactFlowInstance,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { 
  CustomNode, 
  CustomEdge, 
  ReactFlowCanvasProps,
  ContextMenuAction,
  LayoutOptions 
} from '@/types/react-flow.types';

// Custom Node Components
import RequirementNode from './nodes/RequirementNode';
import ProcessNode from './nodes/ProcessNode';
import DecisionNode from './nodes/DecisionNode';
import DocumentNode from './nodes/DocumentNode';
import ActorNode from './nodes/ActorNode';
import SystemNode from './nodes/SystemNode';
import NoteNode from './nodes/NoteNode';
import GroupNode from './nodes/GroupNode';

// Custom Edge Components
import RequirementEdge from './edges/RequirementEdge';
import ProcessFlowEdge from './edges/ProcessFlowEdge';

// UI Components
import ContextMenu from './ui/ContextMenu';
import NodeToolbar from './ui/NodeToolbar';
import LayoutControls from './ui/LayoutControls';
import CollaborationPanel from './ui/CollaborationPanel';

// Hooks
import { useReactFlowDiagram } from '@/hooks/useReactFlowDiagram';
import { useRequirementLinking } from '@/hooks/useRequirementLinking';
import { useLayoutAlgorithms } from '@/hooks/useLayoutAlgorithms';

// Utils
import { generateNodeId, generateEdgeId } from '@/utils/react-flow-utils';

const nodeTypes = {
  requirement: RequirementNode,
  process: ProcessNode,
  decision: DecisionNode,
  document: DocumentNode,
  actor: ActorNode,
  system: SystemNode,
  note: NoteNode,
  group: GroupNode,
};

const edgeTypes = {
  requirement: RequirementEdge,
  process: ProcessFlowEdge,
};

const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = ({
  diagramId,
  projectId,
  initialNodes = [],
  initialEdges = [],
  config,
  onSave,
  onNodeSelect,
  onEdgeSelect,
  readOnly = false,
  collaborationEnabled = false,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    nodeId?: string;
    edgeId?: string;
  }>({ show: false, x: 0, y: 0 });

  // Custom hooks
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addNode,
    updateNode,
    deleteNode,
    addEdge: addCustomEdge,
    updateEdge,
    deleteEdge,
    applyLayout,
    save,
    load,
    isLoading,
    error,
  } = useReactFlowDiagram(diagramId, projectId, initialNodes, initialEdges);

  const { linkNodeToRequirement, unlinkNodeFromRequirement } = useRequirementLinking();
  const { applyLayoutAlgorithm } = useLayoutAlgorithms();

  // React Flow state
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges);

  // Sync custom state with React Flow state
  useEffect(() => {
    setRfNodes(nodes);
  }, [nodes, setRfNodes]);

  useEffect(() => {
    setRfEdges(edges);
  }, [edges, setRfEdges]);

  // Event Handlers
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: CustomEdge = {
        id: generateEdgeId(),
        source: params.source!,
        target: params.target!,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'default',
        data: {
          label: '',
          linkType: 'default',
        },
      };
      
      setRfEdges((eds) => addEdge(newEdge, eds));
      addCustomEdge(newEdge);
    },
    [setRfEdges, addCustomEdge]
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      
      if (readOnly) return;

      setContextMenu({
        show: true,
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    },
    [readOnly]
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      
      if (readOnly) return;

      setContextMenu({
        show: true,
        x: event.clientX,
        y: event.clientY,
        edgeId: edge.id,
      });
    },
    [readOnly]
  );

  const onPaneClick = useCallback(() => {
    setContextMenu({ show: false, x: 0, y: 0 });
  }, []);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node as CustomNode);
    },
    [onNodeSelect]
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      onEdgeSelect?.(edge as CustomEdge);
    },
    [onEdgeSelect]
  );

  // Context Menu Actions
  const contextMenuActions: ContextMenuAction[] = [
    {
      id: 'link-requirement',
      label: 'Link to Requirement',
      icon: '🔗',
      action: (nodeId: string) => {
        linkNodeToRequirement(nodeId);
        setContextMenu({ show: false, x: 0, y: 0 });
      },
    },
    {
      id: 'edit-node',
      label: 'Edit Node',
      icon: '✏️',
      action: (nodeId: string) => {
        // Open edit dialog
        setContextMenu({ show: false, x: 0, y: 0 });
      },
    },
    {
      id: 'duplicate-node',
      label: 'Duplicate',
      icon: '📋',
      action: (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          const duplicatedNode = {
            ...node,
            id: generateNodeId(),
            position: {
              x: node.position.x + 50,
              y: node.position.y + 50,
            },
          };
          addNode(duplicatedNode);
        }
        setContextMenu({ show: false, x: 0, y: 0 });
      },
    },
    {
      id: 'separator-1',
      label: '',
      separator: true,
      action: () => {},
    },
    {
      id: 'delete-node',
      label: 'Delete',
      icon: '🗑️',
      action: (nodeId: string) => {
        deleteNode(nodeId);
        setContextMenu({ show: false, x: 0, y: 0 });
      },
    },
  ];

  // Layout Controls
  const handleLayoutChange = useCallback(
    (options: LayoutOptions) => {
      applyLayoutAlgorithm(rfNodes, rfEdges, options).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
        setRfNodes(layoutedNodes);
        setRfEdges(layoutedEdges);
        setNodes(layoutedNodes as CustomNode[]);
        setEdges(layoutedEdges as CustomEdge[]);
      });
    },
    [rfNodes, rfEdges, setRfNodes, setRfEdges, setNodes, setEdges, applyLayoutAlgorithm]
  );

  // Auto-save
  useEffect(() => {
    if (!readOnly && reactFlowInstance) {
      const saveTimer = setTimeout(() => {
        save();
        onSave?.(nodes, edges);
      }, 2000);

      return () => clearTimeout(saveTimer);
    }
  }, [nodes, edges, save, onSave, readOnly, reactFlowInstance]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading diagram...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap />
        
        {/* Custom Panels */}
        <Panel position="top-left">
          <LayoutControls onLayoutChange={handleLayoutChange} />
        </Panel>
        
        {collaborationEnabled && (
          <Panel position="top-right">
            <CollaborationPanel projectId={projectId} diagramId={diagramId} />
          </Panel>
        )}
        
        {/* Context Menu */}
        {contextMenu.show && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            actions={contextMenuActions}
            nodeId={contextMenu.nodeId}
            edgeId={contextMenu.edgeId}
            onClose={() => setContextMenu({ show: false, x: 0, y: 0 })}
          />
        )}
        
        {/* Node Toolbar */}
        <NodeToolbar />
      </ReactFlow>
    </div>
  );
};

// Wrapper component with ReactFlowProvider
const ReactFlowCanvasWrapper: React.FC<ReactFlowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ReactFlowCanvas {...props} />
    </ReactFlowProvider>
  );
};

export default ReactFlowCanvasWrapper;

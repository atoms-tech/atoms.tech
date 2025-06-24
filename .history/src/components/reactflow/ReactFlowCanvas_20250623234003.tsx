'use client';

import {
    Background,
    Connection,
    Controls,
    Edge,
    MiniMap,
    Node,
    Panel,
    ReactFlow,
    ReactFlowInstance,
    ReactFlowProvider,
    addEdge,
    useEdgesState,
    useNodesState,
} from '@xyflow/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import '@xyflow/react/dist/style.css';

import { useLayoutAlgorithms } from '@/hooks/useLayoutAlgorithms';
// Hooks
import { useReactFlowDiagram } from '@/hooks/useReactFlowDiagram';
import { useRequirementLinking } from '@/hooks/useRequirementLinking';
import {
    ContextMenuAction,
    CustomEdge,
    CustomNode,
    LayoutOptions,
    ReactFlowCanvasProps,
} from '@/types/react-flow.types';
// Utils
import { generateEdgeId, generateNodeId } from '@/utils/react-flow-utils';

import ProcessFlowEdge from './edges/ProcessFlowEdge';
// Custom Edge Components
import RequirementEdge from './edges/RequirementEdge';
import ActorNode from './nodes/ActorNode';
import DecisionNode from './nodes/DecisionNode';
import DocumentNode from './nodes/DocumentNode';
import GroupNode from './nodes/GroupNode';
import NoteNode from './nodes/NoteNode';
import ProcessNode from './nodes/ProcessNode';
// Custom Node Components
import RequirementNode from './nodes/RequirementNode';
import SystemNode from './nodes/SystemNode';
import CollaborationPanel from './ui/CollaborationPanel';
// UI Components
import ContextMenu from './ui/ContextMenu';
import LayoutControls from './ui/LayoutControls';
import NodeToolbar from './ui/NodeToolbar';

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
    const [reactFlowInstance, setReactFlowInstance] =
        useState<ReactFlowInstance | null>(null);
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

    const { linkNodeToRequirement, unlinkNodeFromRequirement } =
        useRequirementLinking();
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
        [setRfEdges, addCustomEdge],
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
        [readOnly],
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
        [readOnly],
    );

    const onPaneClick = useCallback(() => {
        setContextMenu({ show: false, x: 0, y: 0 });
    }, []);

    const onNodeClick = useCallback(
        (event: React.MouseEvent, node: Node) => {
            onNodeSelect?.(node as CustomNode);
        },
        [onNodeSelect],
    );

    const onEdgeClick = useCallback(
        (event: React.MouseEvent, edge: Edge) => {
            onEdgeSelect?.(edge as CustomEdge);
        },
        [onEdgeSelect],
    );

    const onSelectionChange = useCallback(
        ({
            nodes: selectedNodes,
            edges: selectedEdges,
        }: {
            nodes: Node[];
            edges: Edge[];
        }) => {
            // Handle selection changes for collaboration
            console.log('Selection changed:', { selectedNodes, selectedEdges });
            // TODO: Broadcast selection to other collaborators
        },
        [],
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
                const node = nodes.find((n) => n.id === nodeId);
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
            applyLayoutAlgorithm(rfNodes, rfEdges, options).then(
                ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
                    setRfNodes(layoutedNodes);
                    setRfEdges(layoutedEdges);
                    setNodes(layoutedNodes as CustomNode[]);
                    setEdges(layoutedEdges as CustomEdge[]);
                },
            );
        },
        [
            rfNodes,
            rfEdges,
            setRfNodes,
            setRfEdges,
            setNodes,
            setEdges,
            applyLayoutAlgorithm,
        ],
    );

    // Handle adding new nodes from toolbar
    const handleAddNode = useCallback(
        (nodeType: string) => {
            if (!reactFlowInstance) return;

            // Get viewport center
            const { x, y, zoom } = reactFlowInstance.getViewport();
            const centerX = (window.innerWidth / 2 - x) / zoom;
            const centerY = (window.innerHeight / 2 - y) / zoom;

            // Create new node data based on type
            const newNode: CustomNode = {
                id: generateNodeId(),
                type: nodeType as any,
                position: { x: centerX, y: centerY },
                data: {
                    label: `New ${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`,
                    description: '',
                    metadata: {},
                },
            };

            // Add type-specific data
            switch (nodeType) {
                case 'requirement':
                    newNode.data = {
                        ...newNode.data,
                        requirementId: '',
                        priority: 'medium',
                        status: 'draft',
                        type: 'functional',
                    };
                    break;
                case 'process':
                    newNode.data = {
                        ...newNode.data,
                        processType: 'task',
                        duration: 0,
                    };
                    break;
                case 'decision':
                    newNode.data = {
                        ...newNode.data,
                        condition: '',
                        trueLabel: 'Yes',
                        falseLabel: 'No',
                    };
                    break;
                case 'document':
                    newNode.data = {
                        ...newNode.data,
                        documentId: '',
                        documentType: 'specification',
                    };
                    break;
                case 'actor':
                    newNode.data = {
                        ...newNode.data,
                        actorType: 'user',
                    };
                    break;
                case 'system':
                    newNode.data = {
                        ...newNode.data,
                        systemType: 'internal',
                    };
                    break;
            }

            addNode(newNode);
        },
        [reactFlowInstance, addNode],
    );

    // Handle drag and drop from toolbar
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const nodeType = event.dataTransfer.getData(
                'application/reactflow',
            );
            if (!nodeType || !reactFlowInstance) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Create new node at drop position
            const newNode: CustomNode = {
                id: generateNodeId(),
                type: nodeType as any,
                position,
                data: {
                    label: `New ${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`,
                    description: '',
                    metadata: {},
                },
            };

            // Add type-specific data (same as handleAddNode)
            switch (nodeType) {
                case 'requirement':
                    newNode.data = {
                        ...newNode.data,
                        requirementId: '',
                        priority: 'medium',
                        status: 'draft',
                        type: 'functional',
                    };
                    break;
                case 'process':
                    newNode.data = {
                        ...newNode.data,
                        processType: 'task',
                        duration: 0,
                    };
                    break;
                case 'decision':
                    newNode.data = {
                        ...newNode.data,
                        condition: '',
                        trueLabel: 'Yes',
                        falseLabel: 'No',
                    };
                    break;
                case 'document':
                    newNode.data = {
                        ...newNode.data,
                        documentId: '',
                        documentType: 'specification',
                    };
                    break;
                case 'actor':
                    newNode.data = {
                        ...newNode.data,
                        actorType: 'user',
                    };
                    break;
                case 'system':
                    newNode.data = {
                        ...newNode.data,
                        systemType: 'internal',
                    };
                    break;
            }

            addNode(newNode);
        },
        [reactFlowInstance, addNode],
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
                onDrop={onDrop}
                onDragOver={onDragOver}
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
                        <CollaborationPanel
                            projectId={projectId}
                            diagramId={diagramId}
                        />
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
                        onClose={() =>
                            setContextMenu({ show: false, x: 0, y: 0 })
                        }
                    />
                )}

                {/* Node Toolbar */}
                <Panel position="top-left" className="ml-4 mt-16">
                    <NodeToolbar onAddNode={handleAddNode} />
                </Panel>
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

'use client';

import React, { useCallback, useRef, useState } from 'react';
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
} from 'reactflow';

import 'reactflow/dist/style.css';

import NodeToolbar from './ui/NodeToolbar';

interface ReactFlowCanvasProps {
    diagramId?: string;
    projectId?: string;
    initialNodes?: Node[];
    initialEdges?: Edge[];
    onSave?: (nodes: Node[], edges: Edge[]) => void;
    readOnly?: boolean;
}

const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = ({
    diagramId,
    projectId,
    initialNodes = [],
    initialEdges = [],
    onSave,
    readOnly = false,
}) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] =
        useState<ReactFlowInstance | null>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Generate unique ID for new nodes
    const generateNodeId = () =>
        `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Handle connecting nodes
    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
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
            const newNode: Node = {
                id: generateNodeId(),
                type: nodeType,
                position,
                data: {
                    label: `New ${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`,
                    description: '',
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes],
    );

    // Handle adding node via click (fallback for when drag doesn't work)
    const handleAddNode = useCallback(
        (nodeType: string) => {
            const newNode: Node = {
                id: generateNodeId(),
                type: nodeType,
                position: { x: Math.random() * 400, y: Math.random() * 400 },
                data: {
                    label: `New ${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`,
                    description: '',
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [setNodes],
    );

    // Handle save
    const handleSave = useCallback(() => {
        if (onSave) {
            onSave(nodes, edges);
        }
    }, [nodes, edges, onSave]);

    return (
        <div className="w-full h-full" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                fitView
                attributionPosition="bottom-left"
                proOptions={{ hideAttribution: true }}
            >
                <Background />
                <Controls />
                <MiniMap />

                {/* Node Toolbar */}
                {!readOnly && (
                    <Panel position="top-left" className="ml-4 mt-4">
                        <NodeToolbar onAddNode={handleAddNode} />
                    </Panel>
                )}

                {/* Save Button */}
                {!readOnly && onSave && (
                    <Panel position="top-right" className="mr-4 mt-4">
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Save Diagram
                        </button>
                    </Panel>
                )}
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

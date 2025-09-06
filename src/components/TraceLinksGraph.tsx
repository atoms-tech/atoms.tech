import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    Edge,
    MarkerType,
    MiniMap,
    Node,
    useEdgesState,
    useNodesState,
} from 'reactflow';

import 'reactflow/dist/style.css';

import { useRouter } from 'next/navigation';

import { useRequirement, useRequirementsByIds } from '@/hooks/queries/useRequirement';
import { useReverseTraceLinks, useTraceLinks } from '@/hooks/queries/useTraceability';

interface TraceLinksGraphProps {
    requirementId: string;
}

type EntityType = 'requirement' | 'task' | 'epic' | 'project';

interface Entity {
    id: string;
    type: EntityType;
    name: string;
    children: string[];
    parents: string[];
}

const NODE_COLORS: Record<EntityType, { background: string; border: string }> = {
    requirement: {
        background: '#fff3e0',
        border: '#ff9800',
    },
    task: {
        background: '#f3e5f5',
        border: '#9c27b0',
    },
    epic: {
        background: '#e8f5e9',
        border: '#4caf50',
    },
    project: {
        background: '#e3f2fd',
        border: '#2196f3',
    },
};

const TraceLinksGraph = ({ requirementId }: TraceLinksGraphProps) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const router = useRouter();

    // Fetch the current requirement
    const { data: currentRequirementData } = useRequirement(requirementId);

    // Fetch trace links
    const { data: outgoingLinks, isLoading: outgoingLoading } = useTraceLinks(
        requirementId,
        'requirement',
    );
    const { data: incomingLinks, isLoading: incomingLoading } = useReverseTraceLinks(
        requirementId,
        'requirement',
    );

    // Extract requirement IDs from trace links
    const linkedRequirementIds = useMemo(() => {
        const sourceIds = incomingLinks?.map((link: any) => link.source_id) || [];
        const targetIds = outgoingLinks?.map((link: any) => link.target_id) || [];
        return [...sourceIds, ...targetIds];
    }, [incomingLinks, outgoingLinks]);

    // Fetch the actual requirements for the trace links
    const { data: linkedRequirements, isLoading: requirementsLoading } =
        useRequirementsByIds(linkedRequirementIds);

    // Handle node click to navigate to requirement page
    const onNodeClick = useCallback(
        (event: React.MouseEvent, node: Node) => {
            // Only navigate if the node is a requirement type
            const nodeId = node.id;
            if (nodeId) {
                // Get the current URL path parts
                const pathParts = window.location.pathname.split('/');

                // Find the indices of 'org', 'project', and 'requirements' in the path
                const orgIndex = pathParts.indexOf('org');
                const projectIndex = pathParts.indexOf('project');

                if (orgIndex >= 0 && projectIndex >= 0) {
                    const orgId = pathParts[orgIndex + 1];
                    const projectId = pathParts[projectIndex + 1];

                    // Construct the URL to the requirement page
                    const requirementUrl = `/org/${orgId}/project/${projectId}/requirements/${nodeId}`;

                    // Navigate to the requirement page
                    router.push(requirementUrl);
                }
            }
        },
        [router],
    );

    // Define createNode function before useEffect to avoid reference issues
    const createNode = useCallback(
        (entity: Entity, x: number, y: number): Node => {
            const colors = NODE_COLORS[entity.type];

            // Highlight the current requirement node
            const isCurrentNode = entity.id === requirementId;
            const borderWidth = isCurrentNode ? 3 : 2;
            const borderStyle = isCurrentNode ? 'dashed' : 'solid';

            return {
                id: entity.id,
                type: 'default',
                position: { x, y },
                data: {
                    label: (
                        <div
                            title={`Click to view requirement details for: ${entity.name || entity.id}`}
                        >
                            {entity.name || entity.id}
                        </div>
                    ),
                },
                style: {
                    background: colors.background,
                    border: `${borderWidth}px ${borderStyle} ${colors.border}`,
                    borderRadius: '8px',
                    padding: '10px',
                    width: 180,
                    fontWeight: 500,
                    boxShadow: isCurrentNode ? '0 0 10px rgba(0,0,0,0.2)' : 'none',
                    cursor: 'pointer', // Add cursor pointer to indicate clickable nodes
                },
            };
        },
        [requirementId],
    );

    useEffect(() => {
        // Ensure we have the current requirement data, even if there are no links
        if (!currentRequirementData) return;

        // Create a map to track all entities
        const entitiesMap = new Map<string, Entity>();

        // Always add the current requirement as the central node
        entitiesMap.set(requirementId, {
            id: requirementId,
            type: 'requirement',
            name: currentRequirementData.name,
            children: [],
            parents: [],
        });

        // If we have linked requirements data, process it
        if (linkedRequirements) {
            // Process incoming links (parents)
            if (incomingLinks && incomingLinks.length > 0) {
                incomingLinks.forEach((link: any) => {
                    const requirement = linkedRequirements.find(
                        (req) => req.id === link.source_id,
                    );
                    if (requirement) {
                        entitiesMap.set(link.source_id, {
                            id: link.source_id,
                            type: 'requirement',
                            name: requirement.name,
                            children: [requirementId],
                            parents: [],
                        });
                        entitiesMap.get(requirementId)?.parents.push(link.source_id);
                    }
                });
            }

            // Process outgoing links (children)
            if (outgoingLinks && outgoingLinks.length > 0) {
                outgoingLinks.forEach((link: any) => {
                    const requirement = linkedRequirements.find(
                        (req) => req.id === link.target_id,
                    );
                    if (requirement) {
                        entitiesMap.set(link.target_id, {
                            id: link.target_id,
                            type: 'requirement',
                            name: requirement.name,
                            children: [],
                            parents: [requirementId],
                        });
                        entitiesMap.get(requirementId)?.children.push(link.target_id);
                    }
                });
            }
        }

        // Calculate the layout
        const nodesArray: Node[] = [];
        const edgesArray: Edge[] = [];

        // Constants for layout
        const nodeWidth = 180;
        const nodeSpacing = 60;
        const levelHeight = 200;

        // Position parent nodes above
        const parentNodes = [...(entitiesMap.get(requirementId)?.parents || [])];
        if (parentNodes.length > 0) {
            const parentWidth = parentNodes.length * (nodeWidth + nodeSpacing);
            parentNodes.forEach((parentId, index) => {
                const parent = entitiesMap.get(parentId);
                if (parent) {
                    const x =
                        -parentWidth / 2 +
                        index * (nodeWidth + nodeSpacing) +
                        nodeWidth / 2;
                    nodesArray.push(createNode(parent, x, -levelHeight));
                }
            });
        }

        // Position current node in center
        const current = entitiesMap.get(requirementId);
        if (current) {
            nodesArray.push(createNode(current, 0, 0));
        }

        // Position child nodes below
        const childNodes = [...(entitiesMap.get(requirementId)?.children || [])];
        if (childNodes.length > 0) {
            const childWidth = childNodes.length * (nodeWidth + nodeSpacing);
            childNodes.forEach((childId, index) => {
                const child = entitiesMap.get(childId);
                if (child) {
                    const x =
                        -childWidth / 2 +
                        index * (nodeWidth + nodeSpacing) +
                        nodeWidth / 2;
                    nodesArray.push(createNode(child, x, levelHeight));
                }
            });
        }

        // Create edges
        entitiesMap.forEach((entity) => {
            entity.children.forEach((childId) => {
                edgesArray.push({
                    id: `${entity.id}-${childId}`,
                    source: entity.id,
                    target: childId,
                    type: 'smoothstep',
                    animated: true,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: '#2979ff',
                    },
                    style: {
                        stroke: '#2979ff',
                        strokeWidth: 2,
                    },
                });
            });
        });

        setNodes(nodesArray);
        setEdges(edgesArray);
    }, [
        outgoingLinks,
        incomingLinks,
        linkedRequirements,
        requirementId,
        currentRequirementData,
        createNode,
        setEdges,
        setNodes,
    ]);

    // Show loading state or no data message when appropriate
    if (outgoingLoading || incomingLoading || requirementsLoading) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="text-center">Loading trace links diagram...</div>
            </div>
        );
    }

    if (!currentRequirementData) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="text-center">Current requirement not found</div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '600px' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                fitView
                fitViewOptions={{ padding: 0.2 }}
            >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            </ReactFlow>
        </div>
    );
};

export default TraceLinksGraph;

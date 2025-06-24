// React Flow Utility Functions
import { CustomNode, CustomEdge, CustomNodeType } from '@/types/react-flow.types';

// ID Generation
export const generateNodeId = (type?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return type ? `${type}-${timestamp}-${random}` : `node-${timestamp}-${random}`;
};

export const generateEdgeId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `edge-${timestamp}-${random}`;
};

// Node Creation Helpers
export const createNode = (
  type: CustomNodeType,
  position: { x: number; y: number },
  data: Partial<any> = {}
): CustomNode => {
  const baseData = {
    label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
    description: '',
    metadata: {},
  };

  const nodeData = { ...baseData, ...data };

  return {
    id: generateNodeId(type),
    type,
    position,
    data: nodeData,
  } as CustomNode;
};

// Node Type Defaults
export const getNodeDefaults = (type: CustomNodeType) => {
  switch (type) {
    case 'requirement':
      return {
        label: 'New Requirement',
        requirementId: 'REQ-TBD',
        priority: 'medium' as const,
        status: 'draft' as const,
        type: 'functional' as const,
      };
    
    case 'process':
      return {
        label: 'New Process',
        processType: 'task' as const,
        duration: undefined,
        assignee: undefined,
      };
    
    case 'decision':
      return {
        label: 'Decision Point',
        condition: 'condition',
        trueLabel: 'Yes',
        falseLabel: 'No',
      };
    
    case 'document':
      return {
        label: 'New Document',
        documentId: 'DOC-TBD',
        documentType: 'specification' as const,
        version: '1.0',
      };
    
    case 'actor':
      return {
        label: 'New Actor',
        actorType: 'user' as const,
        role: undefined,
      };
    
    case 'system':
      return {
        label: 'New System',
        systemType: 'internal' as const,
        technology: undefined,
      };
    
    case 'note':
      return {
        label: 'Note',
        description: 'Add your notes here...',
      };
    
    case 'group':
      return {
        label: 'Group',
        description: 'Drag nodes here to group them',
      };
    
    default:
      return {
        label: 'New Node',
      };
  }
};

// Position Utilities
export const getNextNodePosition = (
  existingNodes: CustomNode[],
  offset: { x: number; y: number } = { x: 50, y: 50 }
): { x: number; y: number } => {
  if (existingNodes.length === 0) {
    return { x: 100, y: 100 };
  }

  // Find the rightmost and bottommost positions
  const maxX = Math.max(...existingNodes.map(node => node.position.x));
  const maxY = Math.max(...existingNodes.map(node => node.position.y));

  return {
    x: maxX + offset.x,
    y: maxY + offset.y,
  };
};

export const centerNodesInViewport = (
  nodes: CustomNode[],
  viewportWidth: number,
  viewportHeight: number
): CustomNode[] => {
  if (nodes.length === 0) return nodes;

  // Calculate bounding box
  const minX = Math.min(...nodes.map(node => node.position.x));
  const maxX = Math.max(...nodes.map(node => node.position.x + 250)); // Assume 250px node width
  const minY = Math.min(...nodes.map(node => node.position.y));
  const maxY = Math.max(...nodes.map(node => node.position.y + 100)); // Assume 100px node height

  const diagramWidth = maxX - minX;
  const diagramHeight = maxY - minY;

  // Calculate center offset
  const offsetX = (viewportWidth - diagramWidth) / 2 - minX;
  const offsetY = (viewportHeight - diagramHeight) / 2 - minY;

  return nodes.map(node => ({
    ...node,
    position: {
      x: node.position.x + offsetX,
      y: node.position.y + offsetY,
    },
  }));
};

// Edge Utilities
export const createEdge = (
  sourceId: string,
  targetId: string,
  type: string = 'default',
  data: any = {}
): CustomEdge => {
  return {
    id: generateEdgeId(),
    source: sourceId,
    target: targetId,
    type,
    data: {
      linkType: 'default',
      ...data,
    },
  };
};

// Validation Utilities
export const validateNode = (node: CustomNode): string[] => {
  const errors: string[] = [];

  if (!node.data.label || node.data.label.trim() === '') {
    errors.push('Node label is required');
  }

  // Type-specific validation
  switch (node.type) {
    case 'requirement':
      if (!node.data.requirementId) {
        errors.push('Requirement ID is required');
      }
      break;
    
    case 'document':
      if (!node.data.documentId) {
        errors.push('Document ID is required');
      }
      break;
  }

  return errors;
};

export const validateEdge = (edge: CustomEdge, nodes: CustomNode[]): string[] => {
  const errors: string[] = [];

  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode) {
    errors.push('Source node not found');
  }

  if (!targetNode) {
    errors.push('Target node not found');
  }

  if (edge.source === edge.target) {
    errors.push('Self-loops are not allowed');
  }

  return errors;
};

// Search and Filter Utilities
export const searchNodes = (nodes: CustomNode[], query: string): CustomNode[] => {
  if (!query.trim()) return nodes;

  const lowerQuery = query.toLowerCase();
  
  return nodes.filter(node => {
    const searchableText = [
      node.data.label,
      node.data.description,
      (node.data as any).requirementId,
      (node.data as any).documentId,
      (node.data as any).assignee,
      (node.data as any).role,
      (node.data as any).technology,
    ].filter(Boolean).join(' ').toLowerCase();

    return searchableText.includes(lowerQuery);
  });
};

export const filterNodesByType = (nodes: CustomNode[], types: CustomNodeType[]): CustomNode[] => {
  return nodes.filter(node => types.includes(node.type as CustomNodeType));
};

// Export Utilities
export const exportToJSON = (nodes: CustomNode[], edges: CustomEdge[]) => {
  return JSON.stringify({
    nodes,
    edges,
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0',
    },
  }, null, 2);
};

// Import Utilities
export const importFromJSON = (jsonString: string): { nodes: CustomNode[]; edges: CustomEdge[] } => {
  try {
    const data = JSON.parse(jsonString);
    return {
      nodes: data.nodes || [],
      edges: data.edges || [],
    };
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
};

// Statistics Utilities
export const getDiagramStats = (nodes: CustomNode[], edges: CustomEdge[]) => {
  const nodeTypeCount = nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const edgeTypeCount = edges.reduce((acc, edge) => {
    const type = edge.data?.linkType || 'default';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodeTypes: nodeTypeCount,
    edgeTypes: edgeTypeCount,
    complexity: calculateComplexity(nodes, edges),
  };
};

const calculateComplexity = (nodes: CustomNode[], edges: CustomEdge[]): number => {
  if (nodes.length === 0) return 0;
  
  // Simple complexity metric based on nodes, edges, and connections per node
  const avgConnections = edges.length / nodes.length;
  return Math.round((nodes.length * 0.3 + edges.length * 0.5 + avgConnections * 0.2) * 10) / 10;
};

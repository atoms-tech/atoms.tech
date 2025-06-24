// Excalidraw to React Flow Migration Utility
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { CustomNode, CustomEdge, CustomNodeType } from '@/types/react-flow.types';

interface ExcalidrawData {
  elements: ExcalidrawElement[];
  appState: any;
}

interface MigrationResult {
  nodes: CustomNode[];
  edges: CustomEdge[];
  warnings: string[];
  errors: string[];
}

// Element type mapping
const mapExcalidrawTypeToReactFlow = (element: ExcalidrawElement): CustomNodeType => {
  // Analyze element properties to determine best React Flow node type
  if (element.type === 'text') {
    const text = (element as any).text?.toLowerCase() || '';
    
    // Check for requirement patterns
    if (text.includes('req-') || text.includes('requirement')) {
      return 'requirement';
    }
    
    // Check for process patterns
    if (text.includes('process') || text.includes('task') || text.includes('step')) {
      return 'process';
    }
    
    // Check for decision patterns
    if (text.includes('?') || text.includes('decision') || text.includes('if')) {
      return 'decision';
    }
    
    // Check for document patterns
    if (text.includes('doc') || text.includes('specification') || text.includes('manual')) {
      return 'document';
    }
    
    // Check for actor patterns
    if (text.includes('user') || text.includes('actor') || text.includes('role')) {
      return 'actor';
    }
    
    // Check for system patterns
    if (text.includes('system') || text.includes('service') || text.includes('api')) {
      return 'system';
    }
    
    // Default to note for text elements
    return 'note';
  }
  
  // Map shapes to node types
  switch (element.type) {
    case 'rectangle':
      return 'process';
    case 'diamond':
      return 'decision';
    case 'ellipse':
      return 'actor';
    default:
      return 'note';
  }
};

// Generate node data based on element type
const generateNodeData = (element: ExcalidrawElement, nodeType: CustomNodeType) => {
  const text = (element as any).text || '';
  const baseData = {
    label: text || `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node`,
    description: '',
    metadata: {
      migratedFrom: 'excalidraw',
      originalType: element.type,
      originalId: element.id,
    },
  };

  switch (nodeType) {
    case 'requirement':
      return {
        ...baseData,
        requirementId: extractRequirementId(text) || 'REQ-TBD',
        priority: extractPriority(text) || 'medium',
        status: 'draft',
        type: 'functional',
      };
    
    case 'process':
      return {
        ...baseData,
        processType: 'task',
        duration: extractDuration(text),
        assignee: extractAssignee(text),
      };
    
    case 'decision':
      return {
        ...baseData,
        condition: text,
        trueLabel: 'Yes',
        falseLabel: 'No',
      };
    
    case 'document':
      return {
        ...baseData,
        documentId: extractDocumentId(text) || 'DOC-TBD',
        documentType: 'specification',
        version: extractVersion(text),
      };
    
    case 'actor':
      return {
        ...baseData,
        actorType: 'user',
        role: extractRole(text),
      };
    
    case 'system':
      return {
        ...baseData,
        systemType: 'internal',
        technology: extractTechnology(text),
      };
    
    default:
      return baseData;
  }
};

// Helper functions for data extraction
const extractRequirementId = (text: string): string | undefined => {
  const match = text.match(/REQ-\d+/i);
  return match ? match[0].toUpperCase() : undefined;
};

const extractPriority = (text: string): 'low' | 'medium' | 'high' | 'critical' | undefined => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('critical') || lowerText.includes('urgent')) return 'critical';
  if (lowerText.includes('high')) return 'high';
  if (lowerText.includes('low')) return 'low';
  return undefined;
};

const extractDuration = (text: string): number | undefined => {
  const match = text.match(/(\d+)\s*(min|hour|day)/i);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    switch (unit) {
      case 'min': return value;
      case 'hour': return value * 60;
      case 'day': return value * 60 * 24;
    }
  }
  return undefined;
};

const extractAssignee = (text: string): string | undefined => {
  const match = text.match(/assigned?\s+to:?\s*([^,\n]+)/i);
  return match ? match[1].trim() : undefined;
};

const extractDocumentId = (text: string): string | undefined => {
  const match = text.match(/DOC-\d+/i);
  return match ? match[0].toUpperCase() : undefined;
};

const extractVersion = (text: string): string | undefined => {
  const match = text.match(/v?(\d+\.\d+(?:\.\d+)?)/i);
  return match ? match[1] : undefined;
};

const extractRole = (text: string): string | undefined => {
  const match = text.match(/role:?\s*([^,\n]+)/i);
  return match ? match[1].trim() : undefined;
};

const extractTechnology = (text: string): string | undefined => {
  const technologies = ['node.js', 'react', 'python', 'java', 'c#', 'go', 'rust'];
  const lowerText = text.toLowerCase();
  return technologies.find(tech => lowerText.includes(tech));
};

// Generate edges from arrows
const generateEdgesFromArrows = (elements: ExcalidrawElement[], nodeMap: Map<string, string>): CustomEdge[] => {
  const edges: CustomEdge[] = [];
  
  const arrows = elements.filter(el => el.type === 'arrow');
  
  arrows.forEach((arrow, index) => {
    const startBinding = (arrow as any).startBinding;
    const endBinding = (arrow as any).endBinding;
    
    if (startBinding && endBinding) {
      const sourceNodeId = nodeMap.get(startBinding.elementId);
      const targetNodeId = nodeMap.get(endBinding.elementId);
      
      if (sourceNodeId && targetNodeId) {
        edges.push({
          id: `migrated-edge-${index}`,
          source: sourceNodeId,
          target: targetNodeId,
          data: {
            label: (arrow as any).text || '',
            linkType: 'default',
            metadata: {
              migratedFrom: 'excalidraw',
              originalId: arrow.id,
            },
          },
        });
      }
    }
  });
  
  return edges;
};

// Main migration function
export const migrateExcalidrawToReactFlow = (excalidrawData: ExcalidrawData): MigrationResult => {
  const nodes: CustomNode[] = [];
  const edges: CustomEdge[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const nodeMap = new Map<string, string>(); // Maps Excalidraw element ID to React Flow node ID

  try {
    // Filter out arrows for separate processing
    const nonArrowElements = excalidrawData.elements.filter(el => el.type !== 'arrow');
    
    // Convert elements to nodes
    nonArrowElements.forEach((element, index) => {
      try {
        const nodeType = mapExcalidrawTypeToReactFlow(element);
        const nodeId = `migrated-node-${index}`;
        
        const node: CustomNode = {
          id: nodeId,
          type: nodeType,
          position: {
            x: element.x,
            y: element.y,
          },
          data: generateNodeData(element, nodeType),
        };
        
        nodes.push(node);
        nodeMap.set(element.id, nodeId);
        
        // Add warning for uncertain mappings
        if (nodeType === 'note' && element.type !== 'text') {
          warnings.push(`Element "${element.id}" mapped to note type - manual review recommended`);
        }
      } catch (error) {
        errors.push(`Failed to convert element "${element.id}": ${error}`);
      }
    });
    
    // Convert arrows to edges
    const migratedEdges = generateEdgesFromArrows(excalidrawData.elements, nodeMap);
    edges.push(...migratedEdges);
    
    // Add summary warnings
    if (nodes.length === 0) {
      warnings.push('No nodes were created from the Excalidraw diagram');
    }
    
    if (edges.length === 0 && excalidrawData.elements.some(el => el.type === 'arrow')) {
      warnings.push('Arrows were found but no edges were created - check element bindings');
    }
    
  } catch (error) {
    errors.push(`Migration failed: ${error}`);
  }

  return {
    nodes,
    edges,
    warnings,
    errors,
  };
};

// Batch migration function for multiple diagrams
export const batchMigrateExcalidrawDiagrams = async (
  diagrams: { id: string; data: ExcalidrawData }[]
): Promise<{ id: string; result: MigrationResult }[]> => {
  const results = [];
  
  for (const diagram of diagrams) {
    try {
      const result = migrateExcalidrawToReactFlow(diagram.data);
      results.push({ id: diagram.id, result });
    } catch (error) {
      results.push({
        id: diagram.id,
        result: {
          nodes: [],
          edges: [],
          warnings: [],
          errors: [`Migration failed: ${error}`],
        },
      });
    }
  }
  
  return results;
};

// Validation function for migration results
export const validateMigrationResult = (result: MigrationResult): boolean => {
  // Check if migration produced meaningful results
  if (result.nodes.length === 0) {
    return false;
  }
  
  // Check if there are more errors than successful conversions
  if (result.errors.length > result.nodes.length) {
    return false;
  }
  
  // Validate node data integrity
  const invalidNodes = result.nodes.filter(node => !node.data.label || node.data.label.trim() === '');
  if (invalidNodes.length > result.nodes.length * 0.5) {
    return false; // More than 50% of nodes have invalid data
  }
  
  return true;
};

// Generate migration report
export const generateMigrationReport = (results: { id: string; result: MigrationResult }[]): string => {
  const totalDiagrams = results.length;
  const successfulMigrations = results.filter(r => validateMigrationResult(r.result)).length;
  const totalNodes = results.reduce((sum, r) => sum + r.result.nodes.length, 0);
  const totalEdges = results.reduce((sum, r) => sum + r.result.edges.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.result.warnings.length, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.result.errors.length, 0);

  return `
Migration Report
================
Total Diagrams: ${totalDiagrams}
Successful Migrations: ${successfulMigrations}
Success Rate: ${((successfulMigrations / totalDiagrams) * 100).toFixed(1)}%

Elements Created:
- Nodes: ${totalNodes}
- Edges: ${totalEdges}

Issues:
- Warnings: ${totalWarnings}
- Errors: ${totalErrors}

${results.map(r => `
Diagram ${r.id}:
- Nodes: ${r.result.nodes.length}
- Edges: ${r.result.edges.length}
- Warnings: ${r.result.warnings.length}
- Errors: ${r.result.errors.length}
`).join('')}
  `.trim();
};

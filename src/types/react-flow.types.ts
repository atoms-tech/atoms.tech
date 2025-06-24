// React Flow Types for atoms.tech
import { Node, Edge, NodeProps, EdgeProps } from '@xyflow/react';

// Custom Node Types
export type CustomNodeType = 
  | 'requirement'
  | 'process' 
  | 'decision'
  | 'document'
  | 'actor'
  | 'system'
  | 'note'
  | 'group';

// Node Data Interfaces
export interface BaseNodeData {
  label: string;
  description?: string;
  metadata?: Record<string, any>;
  linkedRequirements?: string[];
  color?: string;
  icon?: string;
}

export interface RequirementNodeData extends BaseNodeData {
  requirementId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'approved' | 'in_review' | 'rejected';
  type: 'functional' | 'non_functional' | 'constraint';
}

export interface ProcessNodeData extends BaseNodeData {
  processType: 'start' | 'end' | 'task' | 'subprocess';
  duration?: number;
  assignee?: string;
}

export interface DecisionNodeData extends BaseNodeData {
  condition: string;
  trueLabel?: string;
  falseLabel?: string;
}

export interface DocumentNodeData extends BaseNodeData {
  documentId: string;
  documentType: 'specification' | 'design' | 'test' | 'manual';
  version?: string;
}

export interface ActorNodeData extends BaseNodeData {
  actorType: 'user' | 'system' | 'external';
  role?: string;
}

export interface SystemNodeData extends BaseNodeData {
  systemType: 'internal' | 'external' | 'database' | 'service';
  technology?: string;
}

// Custom Node Types
export type CustomNode = 
  | Node<RequirementNodeData, 'requirement'>
  | Node<ProcessNodeData, 'process'>
  | Node<DecisionNodeData, 'decision'>
  | Node<DocumentNodeData, 'document'>
  | Node<ActorNodeData, 'actor'>
  | Node<SystemNodeData, 'system'>
  | Node<BaseNodeData, 'note'>
  | Node<BaseNodeData, 'group'>;

// Edge Data Interfaces
export interface BaseEdgeData {
  label?: string;
  description?: string;
  metadata?: Record<string, any>;
  linkType?: string;
}

export interface RequirementLinkData extends BaseEdgeData {
  linkType: 'implements' | 'derives' | 'validates' | 'traces' | 'depends';
  confidence?: number;
  bidirectional?: boolean;
}

export interface ProcessFlowData extends BaseEdgeData {
  linkType: 'sequence' | 'conditional' | 'parallel' | 'loop';
  condition?: string;
  probability?: number;
}

// Custom Edge Types
export type CustomEdge = 
  | Edge<RequirementLinkData>
  | Edge<ProcessFlowData>
  | Edge<BaseEdgeData>;

// Diagram Configuration
export interface DiagramConfig {
  id: string;
  name: string;
  projectId: string;
  type: 'workflow' | 'requirements' | 'architecture' | 'mixed';
  layoutAlgorithm: 'dagre' | 'elk' | 'manual';
  theme: 'light' | 'dark';
  settings: {
    snapToGrid: boolean;
    showGrid: boolean;
    allowZoom: boolean;
    allowPan: boolean;
    multiSelection: boolean;
  };
}

// Layout Options
export interface LayoutOptions {
  algorithm: 'dagre' | 'elk' | 'force' | 'hierarchical';
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  spacing: {
    node: number;
    rank: number;
  };
  alignment: 'UL' | 'UR' | 'DL' | 'DR';
}

// Requirement Linking
export interface RequirementLink {
  id: string;
  nodeId: string;
  requirementId: string;
  linkType: 'implements' | 'derives' | 'validates' | 'traces';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Context Menu
export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  action: (nodeId: string, nodeData: any) => void;
  disabled?: boolean;
  separator?: boolean;
}

// Collaboration
export interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  selection?: string[];
  color: string;
  role?: string;
  isOnline?: boolean;
}

// Migration
export interface MigrationData {
  excalidrawDiagramId: string;
  reactFlowDiagramId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  elementMapping: Record<string, string>;
  errors?: string[];
  createdAt: string;
}

// Export/Import
export interface ExportOptions {
  format: 'json' | 'png' | 'svg' | 'pdf' | 'excalidraw';
  includeMetadata: boolean;
  resolution?: number;
  background?: boolean;
}

export interface ImportOptions {
  format: 'json' | 'excalidraw' | 'drawio';
  preserveIds: boolean;
  mergeMode: 'replace' | 'append' | 'merge';
}

// Component Props
export interface ReactFlowCanvasProps {
  diagramId?: string;
  projectId: string;
  initialNodes?: CustomNode[];
  initialEdges?: CustomEdge[];
  config?: Partial<DiagramConfig>;
  onSave?: (nodes: CustomNode[], edges: CustomEdge[]) => void;
  onNodeSelect?: (node: CustomNode | null) => void;
  onEdgeSelect?: (edge: CustomEdge | null) => void;
  readOnly?: boolean;
  collaborationEnabled?: boolean;
}

export interface CustomNodeProps<T = BaseNodeData> extends NodeProps<T> {
  onLinkToRequirement?: (nodeId: string) => void;
  onEditNode?: (nodeId: string, data: T) => void;
  onDeleteNode?: (nodeId: string) => void;
  isSelected?: boolean;
  isCollaborating?: boolean;
  collaborators?: CollaborationUser[];
}

// Hooks
export interface UseReactFlowDiagramReturn {
  nodes: CustomNode[];
  edges: CustomEdge[];
  setNodes: (nodes: CustomNode[]) => void;
  setEdges: (edges: CustomEdge[]) => void;
  addNode: (node: Omit<CustomNode, 'id'>) => void;
  updateNode: (id: string, data: Partial<CustomNode['data']>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Omit<CustomEdge, 'id'>) => void;
  updateEdge: (id: string, data: Partial<CustomEdge['data']>) => void;
  deleteEdge: (id: string) => void;
  applyLayout: (options: LayoutOptions) => void;
  exportDiagram: (options: ExportOptions) => Promise<string | Blob>;
  importDiagram: (data: string, options: ImportOptions) => Promise<void>;
  save: () => Promise<void>;
  load: (diagramId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// API Responses
export interface ReactFlowDiagramResponse {
  id: string;
  name: string;
  projectId: string;
  nodes: CustomNode[];
  edges: CustomEdge[];
  viewport: { x: number; y: number; zoom: number };
  config: DiagramConfig;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DiagramListResponse {
  diagrams: ReactFlowDiagramResponse[];
  total: number;
  page: number;
  limit: number;
}

// Events
export interface DiagramEvent {
  type: 'node_added' | 'node_updated' | 'node_deleted' | 'edge_added' | 'edge_updated' | 'edge_deleted' | 'layout_applied';
  payload: any;
  timestamp: string;
  userId: string;
}

// Validation
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (nodes: CustomNode[], edges: CustomEdge[]) => ValidationResult[];
}

export interface ValidationResult {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  nodeId?: string;
  edgeId?: string;
  suggestion?: string;
}

// Analytics
export interface DiagramAnalytics {
  nodeCount: number;
  edgeCount: number;
  nodeTypes: Record<CustomNodeType, number>;
  linkTypes: Record<string, number>;
  complexity: number;
  coverage: number;
  lastModified: string;
  collaborators: number;
}

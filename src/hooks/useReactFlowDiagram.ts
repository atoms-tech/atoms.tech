'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CustomNode, 
  CustomEdge, 
  UseReactFlowDiagramReturn,
  LayoutOptions,
  ExportOptions,
  ImportOptions 
} from '@/types/react-flow.types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// API functions
const fetchDiagram = async (diagramId: string) => {
  if (!diagramId) return null;
  
  const { data, error } = await supabase
    .from('react_flow_diagrams')
    .select('*')
    .eq('id', diagramId)
    .single();

  if (error) throw error;
  return data;
};

const saveDiagram = async (diagramId: string, projectId: string, nodes: CustomNode[], edges: CustomEdge[]) => {
  const diagramData = {
    project_id: projectId,
    nodes: nodes,
    edges: edges,
    updated_at: new Date().toISOString(),
  };

  if (diagramId) {
    // Update existing diagram
    const { data, error } = await supabase
      .from('react_flow_diagrams')
      .update(diagramData)
      .eq('id', diagramId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new diagram
    const { data, error } = await supabase
      .from('react_flow_diagrams')
      .insert({
        ...diagramData,
        name: 'Untitled Diagram',
        layout_algorithm: 'dagre',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

const generateNodeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateEdgeId = () => `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useReactFlowDiagram = (
  diagramId?: string,
  projectId?: string,
  initialNodes: CustomNode[] = [],
  initialEdges: CustomEdge[] = []
): UseReactFlowDiagramReturn => {
  const queryClient = useQueryClient();
  const [nodes, setNodes] = useState<CustomNode[]>(initialNodes);
  const [edges, setEdges] = useState<CustomEdge[]>(initialEdges);
  const [currentDiagramId, setCurrentDiagramId] = useState<string | undefined>(diagramId);

  // Fetch diagram data
  const { data: diagramData, isLoading, error } = useQuery({
    queryKey: ['react-flow-diagram', currentDiagramId],
    queryFn: () => fetchDiagram(currentDiagramId!),
    enabled: !!currentDiagramId,
  });

  // Save diagram mutation
  const saveMutation = useMutation({
    mutationFn: ({ diagramId, projectId, nodes, edges }: {
      diagramId?: string;
      projectId: string;
      nodes: CustomNode[];
      edges: CustomEdge[];
    }) => saveDiagram(diagramId, projectId, nodes, edges),
    onSuccess: (data) => {
      if (!currentDiagramId) {
        setCurrentDiagramId(data.id);
      }
      queryClient.invalidateQueries({ queryKey: ['react-flow-diagram', data.id] });
      toast.success('Diagram saved successfully');
    },
    onError: (error) => {
      console.error('Failed to save diagram:', error);
      toast.error('Failed to save diagram');
    },
  });

  // Load diagram data when it's fetched
  useEffect(() => {
    if (diagramData) {
      setNodes(diagramData.nodes || []);
      setEdges(diagramData.edges || []);
    }
  }, [diagramData]);

  // Node operations
  const addNode = useCallback((node: Omit<CustomNode, 'id'>) => {
    const newNode: CustomNode = {
      ...node,
      id: generateNodeId(),
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, []);

  const updateNode = useCallback((id: string, data: Partial<CustomNode['data']>) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== id));
    setEdges((prevEdges) => 
      prevEdges.filter((edge) => edge.source !== id && edge.target !== id)
    );
  }, []);

  // Edge operations
  const addEdge = useCallback((edge: Omit<CustomEdge, 'id'>) => {
    const newEdge: CustomEdge = {
      ...edge,
      id: generateEdgeId(),
    };
    setEdges((prevEdges) => [...prevEdges, newEdge]);
  }, []);

  const updateEdge = useCallback((id: string, data: Partial<CustomEdge['data']>) => {
    setEdges((prevEdges) =>
      prevEdges.map((edge) =>
        edge.id === id ? { ...edge, data: { ...edge.data, ...data } } : edge
      )
    );
  }, []);

  const deleteEdge = useCallback((id: string) => {
    setEdges((prevEdges) => prevEdges.filter((edge) => edge.id !== id));
  }, []);

  // Layout operations
  const applyLayout = useCallback(async (options: LayoutOptions) => {
    // This will be implemented with the layout algorithms hook
    console.log('Applying layout:', options);
  }, []);

  // Export operations
  const exportDiagram = useCallback(async (options: ExportOptions): Promise<string | Blob> => {
    switch (options.format) {
      case 'json':
        return JSON.stringify({
          nodes,
          edges,
          metadata: {
            exportedAt: new Date().toISOString(),
            includeMetadata: options.includeMetadata,
          },
        }, null, 2);
      
      case 'png':
      case 'svg':
      case 'pdf':
        // This would require additional implementation with html2canvas or similar
        throw new Error(`Export format ${options.format} not yet implemented`);
      
      case 'excalidraw':
        // Convert React Flow data to Excalidraw format
        throw new Error('Excalidraw export not yet implemented');
      
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }, [nodes, edges]);

  // Import operations
  const importDiagram = useCallback(async (data: string, options: ImportOptions) => {
    try {
      const parsedData = JSON.parse(data);
      
      switch (options.format) {
        case 'json':
          if (options.mergeMode === 'replace') {
            setNodes(parsedData.nodes || []);
            setEdges(parsedData.edges || []);
          } else if (options.mergeMode === 'append') {
            setNodes((prevNodes) => [...prevNodes, ...(parsedData.nodes || [])]);
            setEdges((prevEdges) => [...prevEdges, ...(parsedData.edges || [])]);
          }
          break;
        
        case 'excalidraw':
          // Convert Excalidraw data to React Flow format
          throw new Error('Excalidraw import not yet implemented');
        
        case 'drawio':
          // Convert Draw.io data to React Flow format
          throw new Error('Draw.io import not yet implemented');
        
        default:
          throw new Error(`Unsupported import format: ${options.format}`);
      }
      
      toast.success('Diagram imported successfully');
    } catch (error) {
      console.error('Failed to import diagram:', error);
      toast.error('Failed to import diagram');
      throw error;
    }
  }, []);

  // Save operation
  const save = useCallback(async () => {
    if (!projectId) {
      toast.error('Project ID is required to save diagram');
      return;
    }

    saveMutation.mutate({
      diagramId: currentDiagramId,
      projectId,
      nodes,
      edges,
    });
  }, [currentDiagramId, projectId, nodes, edges, saveMutation]);

  // Load operation
  const load = useCallback(async (diagramId: string) => {
    setCurrentDiagramId(diagramId);
  }, []);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    applyLayout,
    exportDiagram,
    importDiagram,
    save,
    load,
    isLoading,
    error: error?.message || null,
  };
};

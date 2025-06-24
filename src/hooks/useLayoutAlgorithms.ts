'use client';

import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import { LayoutOptions } from '@/types/react-flow.types';

const nodeWidth = 250;
const nodeHeight = 100;

export const useLayoutAlgorithms = () => {
  // Dagre layout algorithm
  const applyDagreLayout = useCallback((
    nodes: Node[],
    edges: Edge[],
    direction: 'TB' | 'BT' | 'LR' | 'RL' = 'TB'
  ) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }, []);

  // Force-directed layout (simple implementation)
  const applyForceLayout = useCallback((nodes: Node[], edges: Edge[]) => {
    const layoutedNodes = nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = Math.max(200, nodes.length * 30);
      
      return {
        ...node,
        position: {
          x: Math.cos(angle) * radius + 400,
          y: Math.sin(angle) * radius + 300,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }, []);

  // Grid layout
  const applyGridLayout = useCallback((nodes: Node[], edges: Edge[]) => {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 300;

    const layoutedNodes = nodes.map((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      return {
        ...node,
        position: {
          x: col * spacing,
          y: row * spacing,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }, []);

  // Hierarchical layout
  const applyHierarchicalLayout = useCallback((nodes: Node[], edges: Edge[]) => {
    // Simple hierarchical layout based on node connections
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();
    
    // Initialize degrees
    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      outDegree.set(node.id, 0);
    });

    // Calculate degrees
    edges.forEach(edge => {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1);
    });

    // Group nodes by level (topological sort)
    const levels: string[][] = [];
    const visited = new Set<string>();
    const queue: string[] = [];

    // Start with nodes that have no incoming edges
    nodes.forEach(node => {
      if (inDegree.get(node.id) === 0) {
        queue.push(node.id);
      }
    });

    while (queue.length > 0) {
      const currentLevel: string[] = [];
      const levelSize = queue.length;

      for (let i = 0; i < levelSize; i++) {
        const nodeId = queue.shift()!;
        currentLevel.push(nodeId);
        visited.add(nodeId);

        // Add connected nodes to queue
        edges.forEach(edge => {
          if (edge.source === nodeId && !visited.has(edge.target)) {
            const targetInDegree = inDegree.get(edge.target)! - 1;
            inDegree.set(edge.target, targetInDegree);
            
            if (targetInDegree === 0) {
              queue.push(edge.target);
            }
          }
        });
      }

      if (currentLevel.length > 0) {
        levels.push(currentLevel);
      }
    }

    // Add any remaining nodes (cycles or disconnected)
    const remainingNodes = nodes.filter(node => !visited.has(node.id));
    if (remainingNodes.length > 0) {
      levels.push(remainingNodes.map(node => node.id));
    }

    // Position nodes
    const layoutedNodes = nodes.map(node => {
      let levelIndex = 0;
      let positionInLevel = 0;

      for (let i = 0; i < levels.length; i++) {
        const levelNodes = levels[i];
        const nodeIndex = levelNodes.indexOf(node.id);
        if (nodeIndex !== -1) {
          levelIndex = i;
          positionInLevel = nodeIndex;
          break;
        }
      }

      const levelWidth = levels[levelIndex].length;
      const spacing = 300;
      const levelSpacing = 200;

      return {
        ...node,
        position: {
          x: (positionInLevel - (levelWidth - 1) / 2) * spacing,
          y: levelIndex * levelSpacing,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }, []);

  // Main layout function
  const applyLayoutAlgorithm = useCallback(async (
    nodes: Node[],
    edges: Edge[],
    options: LayoutOptions
  ) => {
    switch (options.algorithm) {
      case 'dagre':
        return applyDagreLayout(nodes, edges, options.direction);
      
      case 'force':
        return applyForceLayout(nodes, edges);
      
      case 'hierarchical':
        return applyHierarchicalLayout(nodes, edges);
      
      case 'elk':
        // ELK layout would require additional setup
        console.warn('ELK layout not implemented, falling back to dagre');
        return applyDagreLayout(nodes, edges, options.direction);
      
      default:
        return { nodes, edges };
    }
  }, [applyDagreLayout, applyForceLayout, applyHierarchicalLayout]);

  // Auto-layout based on diagram type
  const autoLayout = useCallback((
    nodes: Node[],
    edges: Edge[],
    diagramType: 'workflow' | 'requirements' | 'architecture' | 'mixed' = 'mixed'
  ) => {
    const options: LayoutOptions = {
      algorithm: 'dagre',
      direction: 'TB',
      spacing: { node: 50, rank: 100 },
      alignment: 'UL',
    };

    switch (diagramType) {
      case 'workflow':
        options.algorithm = 'dagre';
        options.direction = 'TB';
        break;
      
      case 'requirements':
        options.algorithm = 'hierarchical';
        options.direction = 'TB';
        break;
      
      case 'architecture':
        options.algorithm = 'force';
        break;
      
      case 'mixed':
      default:
        options.algorithm = 'dagre';
        options.direction = 'LR';
        break;
    }

    return applyLayoutAlgorithm(nodes, edges, options);
  }, [applyLayoutAlgorithm]);

  return {
    applyLayoutAlgorithm,
    applyDagreLayout,
    applyForceLayout,
    applyHierarchicalLayout,
    autoLayout,
  };
};

import { useState, useMemo } from 'react';

export interface NodeData {
  id: string;
  title: string;
  tags: string[];
  synthesis: Record<string, string>;
  coordinates: { x: number; y: number };
}

export const useNebula = (nodes: NodeData[]) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const hoveredNode = useMemo(
    () => nodes.find((n) => n.id === hoveredNodeId) || null,
    [nodes, hoveredNodeId]
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  // Determine if a node is related to the hovered node
  const isRelated = (nodeId: string) => {
    if (!hoveredNode) return true;
    if (nodeId === hoveredNodeId) return true;
    
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return false;

    return targetNode.tags.some(tag => hoveredNode.tags.includes(tag));
  };

  // Get common tags between two nodes (to know which filaments to highlight)
  const getSharedTags = (nodeAId: string, nodeBId: string) => {
    const nodeA = nodes.find(n => n.id === nodeAId);
    const nodeB = nodes.find(n => n.id === nodeBId);
    if (!nodeA || !nodeB) return [];
    
    return nodeA.tags.filter(tag => nodeB.tags.includes(tag));
  };

  return {
    hoveredNodeId,
    setHoveredNodeId,
    selectedNodeId,
    setSelectedNodeId,
    hoveredNode,
    selectedNode,
    isRelated,
    getSharedTags
  };
};

"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { NeuralNebula } from "@/components/NeuralNebula";
import ArticleViewer from "@/components/ArticleViewer";
import nodesData from "@/data/nodes.json";
import { NodeData } from "@/hooks/useNebula";

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  return (
    <main className="relative min-h-screen bg-obsidian overflow-hidden">
      {/* Background Layer: Neural Nebula */}
      <div className="absolute inset-0 z-0">
        <NeuralNebula 
          nodes={nodesData as unknown as NodeData[]} 
          onNodeClick={(node) => setSelectedNode(node)}
        />
      </div>

      {/* Foreground Layer: Research Viewer Overlay */}
      <AnimatePresence>
        {selectedNode && (
          <ArticleViewer 
            nodeData={selectedNode} 
            onClose={() => setSelectedNode(null)} 
          />
        )}
      </AnimatePresence>

      {/* Optional: Global Header Overlay could go here with z-20 */}
    </main>
  );
}

import { NeuralNebula } from "@/components/NeuralNebula";
import ArticleViewer from "@/components/ArticleViewer";
import nodesData from "@/data/nodes.json";
import { NodeData } from "@/hooks/useNebula";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-obsidian overflow-hidden">
      {/* Background Layer: Neural Nebula */}
      <div className="absolute inset-0 z-0">
        <NeuralNebula nodes={nodesData as unknown as NodeData[]} />
      </div>

      {/* Foreground Layer: Research Viewer */}
      <div className="relative z-10 w-full h-screen">
        <ArticleViewer />
      </div>

      {/* Optional: Global Header Overlay could go here with z-20 */}
    </main>
  );
}

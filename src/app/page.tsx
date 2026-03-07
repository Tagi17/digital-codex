import { NeuralNebula } from "@/components/NeuralNebula";
import nodesData from "@/data/nodes.json";
import { NodeData } from "@/hooks/useNebula";

export default function Home() {
  return (
    <main>
      <NeuralNebula nodes={nodesData as unknown as NodeData[]} />
    </main>
  );
}

'use client';

import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { NodeData, useNebula } from '@/hooks/useNebula';
import { Node } from './ui/Node';
import { NodeTooltip } from './ui/NodeTooltip';
import { CustomCursor } from './ui/CustomCursor';

interface NeuralNebulaProps {
  nodes: NodeData[];
  onNodeClick?: (node: NodeData) => void;
  isOverlayActive?: boolean;
}

interface SimulationNode extends d3.SimulationNodeDatum, NodeData {
  x: number;
  y: number;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  source: SimulationNode;
  target: SimulationNode;
}

export const NeuralNebula = ({ nodes, onNodeClick, isOverlayActive = false }: NeuralNebulaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [simNodes, setSimNodes] = useState<SimulationNode[]>([]);
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);
  
  const {
    hoveredNodeId,
    setHoveredNodeId,
    selectedNodeId,
    setSelectedNodeId,
    hoveredNode,
    selectedNode,
    isRelated,
  } = useNebula(nodes);

  // Unified Tooltip State
  const tooltipData = useMemo(() => {
    if (!hoveredNode || hoveredNode.dimmed) return { visible: false, title: '', content: '' };
    
    let content = hoveredNode.description || Object.values(hoveredNode.synthesis)[0] || 'Establishing resonance...';
    let title = hoveredNode.subtitle ? `${hoveredNode.title} // ${hoveredNode.subtitle}` : hoveredNode.title;

    if (hoveredNode.id === 'cellular-bio-electricity') {
      content = `${hoveredNode.description} [Click to Synthesize Data]`;
    }

    return {
      visible: true,
      title: title,
      content
    };
  }, [hoveredNode]);

  // Handle article opening
  useEffect(() => {
    if (selectedNode && onNodeClick) {
      if (selectedNode.id === 'cellular-bio-electricity') {
        onNodeClick(selectedNode);
      }
      setSelectedNodeId(null);
    }
  }, [selectedNode, onNodeClick, setSelectedNodeId]);

  // Initialize D3 Simulation
  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const simulationNodes: SimulationNode[] = nodes.map(d => ({ 
      ...d, 
      x: (d.coordinates.x / 1000) * width,
      y: (d.coordinates.y / 1000) * height,
      fx: d.dimmed ? undefined : (d.coordinates.x / 1000) * width,
      fy: d.dimmed ? undefined : (d.coordinates.y / 1000) * height,
      vx: 0,
      vy: 0
    }));

    const links: SimulationLink[] = [];
    nodes.forEach(node => {
      node.links?.forEach(targetId => {
        const source = simulationNodes.find(n => n.id === node.id);
        const target = simulationNodes.find(n => n.id === targetId);
        if (source && target) {
          links.push({ source, target });
        }
      });
    });

    const simulation = d3.forceSimulation<SimulationNode>(simulationNodes)
      .force("link", d3.forceLink<SimulationNode, SimulationLink>(links).id(d => d.id).distance(200))
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("collide", d3.forceCollide().radius(100))
      .velocityDecay(0.15)
      .alphaDecay(0.02) // Organic settling
      .on("tick", () => {
        setSimNodes([...simulationNodes]);
      });

    simulationRef.current = simulation;

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      simulationNodes.forEach(node => {
        if (!node.dimmed) {
          node.fx = (node.coordinates.x / 1000) * w;
          node.fy = (node.coordinates.y / 1000) * h;
        }
      });
      simulation.alpha(0.3).restart();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      simulation.stop();
      window.removeEventListener('resize', handleResize);
    };
  }, [nodes]);

  // Canvas Drawing Logic
  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    const time = Date.now() / 1000;

    nodes.forEach(node => {
      node.links?.forEach(targetId => {
        const sourceNode = simNodes.find(n => n.id === node.id);
        const targetNode = simNodes.find(n => n.id === targetId);

        if (sourceNode && targetNode) {
          const isSourceHovered = hoveredNodeId === node.id;
          const isTargetHovered = hoveredNodeId === targetId;
          const isCellularActive = hoveredNodeId === 'cellular-bio-electricity' && (node.id === 'cellular-bio-electricity' || targetId === 'cellular-bio-electricity');

          ctx.beginPath();
          // Organic curved links mimicking axonal pathways
          const midX = (sourceNode.x + targetNode.x) / 2 + (targetNode.y - sourceNode.y) * 0.1;
          const midY = (sourceNode.y + targetNode.y) / 2 + (sourceNode.x - targetNode.x) * 0.1;
          
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.quadraticCurveTo(midX, midY, targetNode.x, targetNode.y);

          if (isCellularActive) {
            const pulse = 0.4 + Math.sin(time * 4) * 0.3;
            ctx.strokeStyle = '#00F5FF';
            ctx.lineWidth = 2.5;
            ctx.globalAlpha = pulse;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00F5FF';
          } else if (isSourceHovered || isTargetHovered) {
            ctx.strokeStyle = '#D4AF37';
            ctx.lineWidth = 1.8;
            ctx.globalAlpha = 0.7;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#D4AF37';
          } else {
            ctx.strokeStyle = '#00F5FF';
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.05; // Faint ghost filament
            ctx.shadowBlur = 0;
          }

          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;
        }
      });
    });
  }, [simNodes, hoveredNodeId, nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      draw(ctx, width, height);
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [draw]);

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 w-screen h-screen bg-obsidian overflow-hidden font-serif ${isOverlayActive ? 'pointer-events-none' : ''}`}
    >
      {!isOverlayActive && <CustomCursor />}
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none transition-opacity duration-1000"
        style={{ opacity: isOverlayActive ? 0.2 : 1 }}
      />

      <div className="absolute inset-0 z-20 pointer-events-none">
        {simNodes.map(node => (
          <div 
            key={node.id} 
            className="absolute pointer-events-auto"
            style={{ 
              left: 0, 
              top: 0, 
              transform: `translate3d(${node.x}px, ${node.y}px, 0) translate(-50%, -50%)` 
            }}
          >
            <Node
              id={node.id}
              title={node.title}
              x={0} 
              y={0} 
              isHovered={hoveredNodeId === node.id}
              isRelated={isRelated(node.id)}
              isSpecial={node.id === 'cellular-bio-electricity'}
              dimmed={node.dimmed}
              onHover={setHoveredNodeId}
              onClick={() => setSelectedNodeId(node.id)}
            />
          </div>
        ))}
      </div>

      <NodeTooltip {...tooltipData} />

      {/* HUD / Branding */}
      <div className="absolute top-16 left-16 z-30 pointer-events-none">
        <h1 className="text-auric-gold text-3xl tracking-[0.5em] uppercase mb-3">The Luminous Codex</h1>
        <div className="h-[1px] w-32 bg-bio-cyan/40 mb-3" />
        <p className="text-bio-cyan/60 font-mono text-xs tracking-[0.2em] uppercase">Bio-Electromagnetic Archive // v1.1.0</p>
      </div>

      <div className="absolute bottom-16 left-16 z-30 pointer-events-none">
        <p className="text-white/30 font-mono text-[10px] uppercase tracking-[0.4em]">
          Trace axonal pathways. Click "Cellular Bio-Electricity" to expand synthesis.
        </p>
      </div>

      <style jsx global>{`
        * { cursor: none !important; }
        .no-cursor-hide { cursor: auto !important; }
      `}</style>
    </div>
  );
};

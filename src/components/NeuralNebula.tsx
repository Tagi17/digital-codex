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

interface SimulationNode extends d3.SimulationNodeDatum, NodeData {}
interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  source: string | SimulationNode;
  target: string | SimulationNode;
}

export const NeuralNebula = ({ nodes, onNodeClick, isOverlayActive = false }: NeuralNebulaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [simNodes, setSimNodes] = useState<SimulationNode[]>([]);
  
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
    if (!hoveredNode) return { visible: false, title: '', content: '' };
    
    // Bio-Electric Journey special text or fallback to first synthesis tag
    const content = hoveredNode.id === 'bio-electric-journey' 
      ? "A deep-dive into the transition from neural intent to the manifestation of the human biofield."
      : Object.values(hoveredNode.synthesis)[0] || 'Establishing resonance...';

    return {
      visible: true,
      title: hoveredNode.title,
      content
    };
  }, [hoveredNode]);

  // Handle article opening
  useEffect(() => {
    if (selectedNode && onNodeClick) {
      if (selectedNode.id === 'bio-electric-journey') {
        onNodeClick(selectedNode);
      }
      setSelectedNodeId(null);
    }
  }, [selectedNode, onNodeClick, setSelectedNodeId]);

  // Initialize D3 Simulation
  useEffect(() => {
    const simulationNodes: SimulationNode[] = nodes.map(d => ({ 
      ...d, 
      x: (d.coordinates.x / 100) * (containerRef.current?.clientWidth || 1000),
      y: (d.coordinates.y / 100) * (containerRef.current?.clientHeight || 1000)
    }));

    const links: SimulationLink[] = [];
    nodes.forEach(node => {
      node.links?.forEach(targetId => {
        links.push({ source: node.id, target: targetId });
      });
    });

    const simulation = d3.forceSimulation<SimulationNode>(simulationNodes)
      .force("link", d3.forceLink<SimulationNode, SimulationLink>(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(
        (containerRef.current?.clientWidth || 1000) / 2, 
        (containerRef.current?.clientHeight || 1000) / 2
      ))
      .force("x", d3.forceX<SimulationNode>(d => (d.coordinates.x / 100) * (containerRef.current?.clientWidth || 1000)).strength(0.1))
      .force("y", d3.forceY<SimulationNode>(d => (d.coordinates.y / 100) * (containerRef.current?.clientHeight || 1000)).strength(0.1))
      .on("tick", () => {
        setSimNodes([...simulationNodes]);
      });

    return () => simulation.stop();
  }, [nodes]);

  // Canvas Drawing Logic
  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Draw Links
    nodes.forEach(node => {
      node.links?.forEach(targetId => {
        const sourceNode = simNodes.find(n => n.id === node.id);
        const targetNode = simNodes.find(n => n.id === targetId);

        if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
          const isHighlighted = hoveredNodeId && (node.id === hoveredNodeId || targetId === hoveredNodeId);

          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);

          if (isHighlighted) {
            ctx.strokeStyle = '#D4AF37'; // Auric Gold
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#D4AF37';
          } else {
            ctx.strokeStyle = '#00F5FF'; // Bio-Electric Cyan
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.15;
            ctx.shadowBlur = 0;
          }

          ctx.stroke();
          ctx.shadowBlur = 0; // Reset for next stroke
        }
      });
    });
  }, [simNodes, hoveredNodeId, nodes]);

  useEffect(() => {
    if (isOverlayActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const { width, height } = canvas.getBoundingClientRect();
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
  }, [draw, isOverlayActive]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-screen bg-obsidian overflow-hidden font-serif ${isOverlayActive ? 'pointer-events-none' : ''}`}
    >
      {!isOverlayActive && <CustomCursor />}
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none transition-opacity duration-700"
        style={{ opacity: isOverlayActive ? 0.2 : 1 }}
      />

      <div className="absolute inset-0 z-20">
        {simNodes.map(node => {
          const width = containerRef.current?.clientWidth || 1000;
          const height = containerRef.current?.clientHeight || 1000;
          return (
            <Node
              key={node.id}
              {...node}
              x={(node.x! / width) * 100}
              y={(node.y! / height) * 100}
              isHovered={hoveredNodeId === node.id}
              isRelated={isRelated(node.id)}
              isSpecial={node.id === 'bio-electric-journey'}
              onHover={setHoveredNodeId}
              onClick={setSelectedNodeId}
            />
          );
        })}
      </div>

      <NodeTooltip {...tooltipData} />

      {/* HUD / Branding */}
      <div className="absolute top-16 left-16 z-30 pointer-events-none">
        <h1 className="text-auric-gold text-3xl tracking-[0.5em] uppercase mb-3">The Luminous Codex</h1>
        <div className="h-[1px] w-32 bg-bio-cyan/40 mb-3" />
        <p className="text-bio-cyan/60 font-mono text-xs tracking-[0.2em] uppercase">Bio-Electromagnetic Archive // v1.0.6</p>
      </div>

      <div className="absolute bottom-16 left-16 z-30 pointer-events-none">
        <p className="text-white/30 font-mono text-[10px] uppercase tracking-[0.4em]">
          Hover nodes to trace filaments. Click highlighted nodes to synthesize data.
        </p>
      </div>
    </div>
  );
};

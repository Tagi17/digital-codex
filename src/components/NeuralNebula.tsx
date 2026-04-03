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

  // Returns safe-zone mapped coordinates for a given raw coordinate + viewport
  const getMobileCoords = (cx: number, cy: number, w: number, h: number) => {
    const isMobile = w < 768;
    if (!isMobile) {
      return { x: (cx / 1000) * w, y: (cy / 1000) * h };
    }
    // Safe zone: max 85vw width capped at 448px, centred horizontally
    // Vertically: starts below the HUD header (~96px) and uses 60vh
    const safeW   = Math.min(w * 0.85, 448);
    const offsetX = (w - safeW) / 2;
    const topPad  = 96;
    const safeH   = h * 0.60 - topPad;
    return {
      x: offsetX + (cx / 1000) * safeW,
      y: topPad  + (cy / 1000) * safeH,
    };
  };

  // Initialize D3 Simulation
  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const simulationNodes: SimulationNode[] = nodes.map(d => {
      const { x, y } = getMobileCoords(d.coordinates.x, d.coordinates.y, width, height);
      return {
        ...d,
        x, y,
        fx: d.dimmed ? undefined : x,
        fy: d.dimmed ? undefined : y,
        vx: 0,
        vy: 0,
      };
    });

    const links: SimulationLink[] = [];
    nodes.forEach(node => {
      node.links?.forEach(targetId => {
        const source = simulationNodes.find(n => n.id === node.id);
        const target = simulationNodes.find(n => n.id === targetId);
        if (source && target && source.id !== target.id) {
          links.push({ source, target });
        }
      });
    });

    // Tighter forces on mobile so the contained triangle holds
    const isMobile = width < 768;
    const simulation = d3.forceSimulation<SimulationNode>(simulationNodes)
      .force("link", d3.forceLink<SimulationNode, SimulationLink>(links).id(d => d.id).distance(isMobile ? 120 : 200))
      .force("charge", d3.forceManyBody().strength(isMobile ? -400 : -1000))
      .force("collide", d3.forceCollide().radius(isMobile ? 60 : 100))
      .velocityDecay(0.15)
      .alphaDecay(0.02)
      .on("tick", () => {
        setSimNodes([...simulationNodes]);
      });

    simulationRef.current = simulation;

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      simulationNodes.forEach(node => {
        if (!node.dimmed) {
          const { x, y } = getMobileCoords(node.coordinates.x, node.coordinates.y, w, h);
          node.fx = x;
          node.fy = y;
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
    ctx.setLineDash([]); // Ensure solid lines

    nodes.forEach(node => {
      node.links?.forEach(targetId => {
        // Render Guard: Verify source and target nodes exist and are not the same node
        const s = nodes.find(n => n.id === node.id);
        const t = nodes.find(n => n.id === targetId);
        if (!s || !t || s.id === t.id) return;

        const sourceNode = simNodes.find(n => n.id === node.id);
        const targetNode = simNodes.find(n => n.id === targetId);

        if (sourceNode && targetNode) {
          const isConnectedToHover = hoveredNodeId && (node.id === hoveredNodeId || targetId === hoveredNodeId);

          ctx.beginPath();
          // Straight line implementation
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);

          if (isConnectedToHover) {
            ctx.strokeStyle = '#D4AF37'; // Gold
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.8;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#D4AF37';
          } else {
            ctx.strokeStyle = '#00F5FF'; // Electric Cyan
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.1; // 10% Opacity for inactive
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
      <div className="absolute top-4 left-4 md:top-16 md:left-16 z-30 pointer-events-none">
        <h1 className="text-auric-gold text-xl md:text-3xl tracking-[0.3em] md:tracking-[0.5em] uppercase mb-2 md:mb-3">The Luminous Codex</h1>
        <div className="h-[1px] w-20 md:w-32 bg-bio-cyan/40 mb-2 md:mb-3" />
        <p className="text-bio-cyan/60 font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase">Bio-Electromagnetic Archive // v1.1.2</p>
      </div>

      <div
        className="absolute bottom-8 inset-x-0 md:bottom-16 md:left-16 md:right-auto text-center md:text-left z-30 pointer-events-none px-4 md:px-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        <p className="text-white/30 font-mono text-[10px] uppercase tracking-[0.4em]">
          Trace axonal pathways. Click nodes to expand synthesis.
        </p>
      </div>

      <style jsx global>{`
        * { cursor: none !important; }
        .no-cursor-hide { cursor: auto !important; }
      `}</style>
    </div>
  );
};

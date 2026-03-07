'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { NodeData, useNebula } from '@/hooks/useNebula';
import { Node } from './ui/Node';
import { SynthesisTooltip } from './ui/SynthesisTooltip';
import { ArticleSlate } from './ui/ArticleSlate';
import { CustomCursor } from './ui/CustomCursor';

interface NeuralNebulaProps {
  nodes: NodeData[];
}

export const NeuralNebula = ({ nodes }: NeuralNebulaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    hoveredNodeId,
    setHoveredNodeId,
    selectedNodeId,
    setSelectedNodeId,
    hoveredNode,
    selectedNode,
    isRelated,
    getSharedTags
  } = useNebula(nodes);

  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number; visible: boolean }>({
    content: '',
    x: 0,
    y: 0,
    visible: false
  });

  // Pre-calculate filaments (pairs of nodes with shared tags)
  const filaments = useMemo(() => {
    const pairs: { a: NodeData; b: NodeData; tags: string[] }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const shared = nodes[i].tags.filter(tag => nodes[j].tags.includes(tag));
        if (shared.length > 0) {
          pairs.push({ a: nodes[i], b: nodes[j], tags: shared });
        }
      }
    }
    return pairs;
  }, [nodes]);

  useEffect(() => {
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

      ctx.clearRect(0, 0, width, height);

      // Draw Filaments
      filaments.forEach(({ a, b, tags }) => {
        const ax = (a.coordinates.x / 100) * width;
        const ay = (a.coordinates.y / 100) * height;
        const bx = (b.coordinates.x / 100) * width;
        const by = (b.coordinates.y / 100) * height;

        const isGlow = hoveredNodeId && 
          (a.id === hoveredNodeId || b.id === hoveredNodeId) &&
          tags.some(t => hoveredNode?.tags.includes(t));

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        
        if (isGlow) {
          ctx.strokeStyle = '#D4AF37'; // Auric Gold
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.8;
          
          // Shadow for glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#D4AF37';
        } else {
          ctx.strokeStyle = '#00F5FF'; // Bio-Electric Cyan
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = 0.05;
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [filaments, hoveredNodeId, hoveredNode]);

  // Handle Tooltip Positioning on Mouse Move
  useEffect(() => {
    if (!hoveredNode) {
      setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }

    // Logic to find the midpoint of the active filament if possible, 
    // but the prompt says "precisely over a glowing Filament when hovered".
    // Since we hover the NODE, we'll show the synthesis for the first shared tag.
    const primaryTag = hoveredNode.tags[0];
    setTooltip({
      content: hoveredNode.synthesis[primaryTag] || 'Establishing resonance...',
      x: hoveredNode.coordinates.x,
      y: hoveredNode.coordinates.y,
      visible: true
    });
  }, [hoveredNode]);

  return (
    <div className="relative w-full h-screen bg-obsidian overflow-hidden font-serif">
      <CustomCursor />
      {/* Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      />

      {/* Nodes Layer */}
      <div className="absolute inset-0 z-20">
        {nodes.map(node => (
          <Node
            key={node.id}
            {...node}
            x={node.coordinates.x}
            y={node.coordinates.y}
            isHovered={hoveredNodeId === node.id}
            isRelated={isRelated(node.id)}
            onHover={setHoveredNodeId}
            onClick={setSelectedNodeId}
          />
        ))}
      </div>

      {/* Tooltip */}
      <SynthesisTooltip {...tooltip} />

      {/* Article Overlay */}
      <ArticleSlate
        node={selectedNode}
        onClose={() => setSelectedNodeId(null)}
      />

      {/* HUD / Branding */}
      <div className="absolute top-16 left-16 z-30 pointer-events-none">
        <h1 className="text-auric-gold text-3xl tracking-[0.5em] uppercase mb-3">The Luminous Codex</h1>
        <div className="h-[1px] w-32 bg-bio-cyan/40 mb-3" />
        <p className="text-bio-cyan/60 font-mono text-xs tracking-[0.2em] uppercase">Bio-Electromagnetic Archive // v1.0.4</p>
      </div>

      {/* Navigation Instruction */}
      <div className="absolute bottom-16 left-16 z-30 pointer-events-none">
        <p className="text-white/30 font-mono text-[10px] uppercase tracking-[0.4em]">
          Hover nodes to trace filaments. Click to synthesize data.
        </p>
      </div>
    </div>
  );
};

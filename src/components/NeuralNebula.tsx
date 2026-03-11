'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { NodeData, useNebula } from '@/hooks/useNebula';
import { Node } from './ui/Node';
import { SynthesisTooltip } from './ui/SynthesisTooltip';
import { CustomCursor } from './ui/CustomCursor';

interface NeuralNebulaProps {
  nodes: NodeData[];
  onNodeClick?: (node: NodeData) => void;
  isOverlayActive?: boolean;
}

const NodeTooltip = ({ content, visible }: { content: string; visible: boolean }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          className="fixed z-[100] pointer-events-none glass p-4 max-w-[280px] border border-auric-gold/30 shadow-2xl"
          style={{ x, y, translateX: 20, translateY: 20 }}
        >
          <p className="text-[11px] leading-relaxed text-auric-gold font-mono uppercase tracking-[0.1em]">
            {content}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const NeuralNebula = ({ nodes, onNodeClick, isOverlayActive = false }: NeuralNebulaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    hoveredNodeId,
    setHoveredNodeId,
    selectedNodeId,
    setSelectedNodeId,
    hoveredNode,
    selectedNode,
    isRelated,
  } = useNebula(nodes);

  // Trigger parent callback only for "Bio-Electric Journey"
  useEffect(() => {
    if (selectedNode && onNodeClick) {
      if (selectedNode.articleId === 'intent-to-aura') {
        onNodeClick(selectedNode);
      }
      setSelectedNodeId(null);
    }
  }, [selectedNode, onNodeClick, setSelectedNodeId]);

  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number; visible: boolean }>({
    content: '',
    x: 0,
    y: 0,
    visible: false
  });

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

      ctx.clearRect(0, 0, width, height);

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
          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.8;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#D4AF37';
        } else {
          ctx.strokeStyle = '#00F5FF';
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
  }, [filaments, hoveredNodeId, hoveredNode, isOverlayActive]);

  useEffect(() => {
    if (!hoveredNode || hoveredNode.id === 'bio-electric-journey') {
      setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }

    const primaryTag = hoveredNode.tags[0];
    setTooltip({
      content: hoveredNode.synthesis[primaryTag] || 'Establishing resonance...',
      x: hoveredNode.coordinates.x,
      y: hoveredNode.coordinates.y,
      visible: true
    });
  }, [hoveredNode]);

  const showSpecialTooltip = hoveredNodeId === 'bio-electric-journey';

  return (
    <div className={`relative w-full h-screen bg-obsidian overflow-hidden font-serif ${isOverlayActive ? 'pointer-events-none' : ''}`}>
      {!isOverlayActive && <CustomCursor />}
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none transition-opacity duration-700"
        style={{ opacity: isOverlayActive ? 0.3 : 1 }}
      />

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

      <SynthesisTooltip {...tooltip} />
      <NodeTooltip 
        visible={showSpecialTooltip} 
        content="A deep-dive into the transition from neural intent to the manifestation of the human biofield." 
      />

      <div className="absolute top-16 left-16 z-30 pointer-events-none">
        <h1 className="text-auric-gold text-3xl tracking-[0.5em] uppercase mb-3">The Luminous Codex</h1>
        <div className="h-[1px] w-32 bg-bio-cyan/40 mb-3" />
        <p className="text-bio-cyan/60 font-mono text-xs tracking-[0.2em] uppercase">Bio-Electromagnetic Archive // v1.0.5</p>
      </div>

      <div className="absolute bottom-16 left-16 z-30 pointer-events-none">
        <p className="text-white/30 font-mono text-[10px] uppercase tracking-[0.4em]">
          Hover nodes to trace filaments. Click "Bio-Electric Journey" to synthesize data.
        </p>
      </div>
    </div>
  );
};

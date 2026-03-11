'use client';

import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { useEffect } from 'react';

interface NodeTooltipProps {
  content: string;
  title: string;
  visible: boolean;
}

export const NodeTooltip = ({ content, title, visible }: NodeTooltipProps) => {
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
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          className="fixed z-[100] pointer-events-none glass p-6 max-w-[320px] bg-obsidian/90 border-[0.5px] border-auric-gold/40 backdrop-blur-md shadow-2xl"
          style={{ x, y, translateX: 24, translateY: 24 }}
        >
          <div className="text-[10px] text-auric-gold font-mono uppercase tracking-[0.2em] mb-4 border-b border-auric-gold/10 pb-2">
            Node Synthesis // {title}
          </div>
          <p className="text-[13px] leading-relaxed text-white/90 font-mono tracking-wide">
            {content}
          </p>
          
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1 h-1 bg-bio-cyan rounded-full animate-pulse" />
            <span className="text-[8px] text-bio-cyan/40 font-mono uppercase tracking-[0.1em]">Resonance Active</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

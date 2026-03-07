'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface SynthesisTooltipProps {
  content: string;
  x: number;
  y: number;
  visible: boolean;
}

export const SynthesisTooltip = ({ content, x, y, visible }: SynthesisTooltipProps) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          className="absolute glass p-6 max-w-[350px] z-50 pointer-events-none"
          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -115%)' }}
        >
          <div className="text-[11px] text-auric-gold font-mono uppercase tracking-[0.15em] mb-3 border-b border-auric-gold/20 pb-2">Synthesis Resonance</div>
          <p className="text-[15px] leading-relaxed text-white/90 font-serif italic">{content}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

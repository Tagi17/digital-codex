'use client';

import { motion } from 'framer-motion';

interface NodeProps {
  id: string;
  title: string;
  x: number;
  y: number;
  isHovered: boolean;
  isRelated: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}

export const Node = ({ id, title, x, y, isHovered, isRelated, onHover, onClick }: NodeProps) => {
  return (
    <motion.div
      className="absolute flex flex-col items-center justify-center cursor-pointer z-20 group"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ opacity: isRelated ? 1 : 0.2 }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(id)}
    >
      <div className="relative">
        {/* Glow effect */}
        <motion.div
          className="absolute -inset-6 rounded-full bg-bio-cyan/20 blur-xl"
          animate={{ scale: isHovered ? 1.8 : 1, opacity: isHovered ? 1 : 0 }}
        />
        
        {/* The Node Circle - Increased size */}
        <div className={`w-6 h-6 rounded-full border-2 transition-colors duration-500 ${isHovered ? 'bg-auric-gold border-auric-gold shadow-[0_0_15px_#D4AF37]' : 'bg-transparent border-bio-cyan'}`} />
      </div>

      {/* Title - Increased font size and spacing */}
      <motion.span
        className={`mt-8 text-[13px] tracking-[0.25em] font-mono uppercase transition-colors duration-500 ${isHovered ? 'text-auric-gold' : 'text-bio-cyan/70'}`}
        animate={{ 
          opacity: isRelated ? 1 : 0.4,
          y: isHovered ? 6 : 0,
          scale: isHovered ? 1.05 : 1
        }}
      >
        {title}
      </motion.span>
    </motion.div>
  );
};

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { NodeData } from '@/hooks/useNebula';

interface ArticleSlateProps {
  node: NodeData | null;
  onClose: () => void;
}

export const ArticleSlate = ({ node, onClose }: ArticleSlateProps) => {
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 150 }}
          className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-obsidian border-l border-auric-gold/40 z-[100] shadow-[-20px_0_50px_rgba(0,0,0,0.9)] p-16 overflow-y-auto no-cursor-hide"
        >
          <button 
            onClick={onClose}
            className="absolute top-10 right-10 text-auric-gold hover:text-white transition-colors uppercase font-mono text-xs tracking-widest p-2"
          >
            [ Close Archive ]
          </button>

          <header className="mt-24 mb-16">
            <div className="text-bio-cyan font-mono text-xs uppercase tracking-[0.4em] mb-6 opacity-60">Research Node: {node.id}</div>
            <h1 className="text-5xl font-serif text-auric-gold leading-[1.1]">{node.title}</h1>
          </header>

          <section className="space-y-16">
            {Object.entries(node.synthesis).map(([tag, text]) => (
              <div key={tag} className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="h-[1px] flex-1 bg-auric-gold/30" />
                  <span className="text-auric-gold font-mono text-xs uppercase tracking-[0.2em]">{tag}</span>
                  <div className="h-[1px] flex-1 bg-auric-gold/30" />
                </div>
                <p className="text-2xl font-serif text-white/95 leading-relaxed italic">{text}</p>
              </div>
            ))}
          </section>

          <footer className="mt-32 pt-16 border-t border-auric-gold/20">
            <div className="text-xs font-mono text-bio-cyan/50 uppercase tracking-[0.2em] mb-6">Cross-Reference Tags</div>
            <div className="flex flex-wrap gap-3">
              {node.tags.map(tag => (
                <span key={tag} className="px-5 py-2 border border-bio-cyan/30 text-bio-cyan/80 text-[11px] uppercase tracking-wider bg-bio-cyan/5">
                  #{tag}
                </span>
              ))}
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

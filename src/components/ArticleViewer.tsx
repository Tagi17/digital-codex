"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ArrowLeft } from "lucide-react";
import journeyData from "@/data/journey_content.json";

interface Definition {
  title: string;
  description: string;
  image: string;
}

interface TermProps {
  id: string;
  children: React.ReactNode;
  onHover: (id: string | null) => void;
}

const Term: React.FC<TermProps> = ({ id, children, onHover }) => {
  return (
    <span
      className="cursor-help transition-all duration-300 relative group inline-block"
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="text-auric-gold relative z-10 font-medium">
        {children}
      </span>
      {/* Subtle gold glow effect */}
      <span className="absolute inset-0 bg-auric-gold/10 blur-sm scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm" />
      <span className="absolute bottom-0 left-0 w-full h-[1px] bg-auric-gold/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </span>
  );
};

interface ArticleViewerProps {
  nodeData: any; // We can type this more strictly if needed
  onClose: () => void;
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({ nodeData, onClose }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeDefinition = useMemo(() => {
    if (!activeId) return null;
    return (journeyData.definitions as Record<string, Definition>)[activeId] || null;
  }, [activeId]);

  const parseContent = (text: string) => {
    const parts = text.split(/(<Term id='.*?'>.*?<\/Term>)/g);
    return parts.map((part, index) => {
      const match = part.match(/<Term id='(.*?)'>(.*?)<\/Term>/);
      if (match) {
        const id = match[1];
        const content = match[2];
        return (
          <Term key={index} id={id} onHover={setActiveId}>
            {content}
          </Term>
        );
      }
      return part;
    });
  };

  return (
    <motion.div 
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8 backdrop-blur-xl bg-obsidian/40"
    >
      {/* Close Button / Back Arrow */}
      <button 
        onClick={onClose}
        className="absolute top-12 left-12 z-[60] flex items-center gap-4 text-auric-gold/60 hover:text-auric-gold transition-colors group"
      >
        <div className="w-10 h-10 rounded-full border border-auric-gold/20 flex items-center justify-center group-hover:border-auric-gold/40 bg-obsidian/40 backdrop-blur-md">
          <ArrowLeft size={18} />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Return to Nebula</span>
      </button>

      {/* Glassmorphism Container */}
      <div className="w-full max-w-7xl h-full max-h-[90vh] glass rounded-2xl overflow-hidden flex border border-auric-gold/20 shadow-2xl relative">
        {/* LEFT: Scrollable Research Text */}
        <main className="w-[65%] h-full overflow-y-auto custom-scrollbar p-10 lg:p-20 bg-obsidian/60">
          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-mono text-[10px] text-bio-cyan/60 tracking-[0.4em] uppercase mb-4"
            >
              Research Node: {nodeData.id}
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-serif text-4xl lg:text-6xl text-auric-gold leading-tight mb-12"
            >
              {journeyData.title}
            </motion.h1>

            <div className="space-y-8 font-serif text-lg lg:text-xl leading-relaxed text-white/90">
              {journeyData.content.map((item, idx) => (
                <motion.p 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                >
                  {parseContent(item.text)}
                </motion.p>
              ))}
            </div>
            
            <div className="h-32" />
          </div>
        </main>

        {/* RIGHT: Fixed Aura Sidebar */}
        <aside className="w-[35%] h-full flex flex-col items-center justify-center p-8 bg-black/60 border-l border-auric-gold/10 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activeDefinition ? (
              <motion.div
                key={activeId}
                initial={{ opacity: 0, x: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -20, filter: "blur(8px)" }}
                className="relative z-10 flex flex-col items-center text-center w-full"
              >
                <div className="w-24 h-24 mb-8 relative">
                  <div className="absolute inset-0 bg-bio-cyan/20 blur-xl rounded-full" />
                  <div className="relative z-10 w-full h-full border border-bio-cyan/20 rounded-xl flex items-center justify-center bg-black/40 p-4">
                    <Image 
                      src={activeDefinition.image} 
                      alt={activeDefinition.title}
                      width={48}
                      height={48}
                      className="invert brightness-200"
                    />
                  </div>
                </div>

                <h2 className="font-mono text-bio-cyan/60 text-[10px] tracking-[0.3em] uppercase mb-4">
                  Neural Sync Active
                </h2>
                
                <h3 className="font-serif text-2xl text-auric-gold mb-6 px-4">
                  {activeDefinition.title}
                </h3>

                <p className="font-mono text-[11px] leading-loose text-bio-cyan/80 tracking-wide uppercase px-6">
                  {activeDefinition.description}
                </p>
                
                <div className="mt-8 w-8 h-[1px] bg-auric-gold/20" />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-auric-gold/40 max-w-[200px] leading-loose"
              >
                Hover over a term to synchronize research
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.1);
        }
      `}</style>
    </motion.div>
  );
};

export default ArticleViewer;

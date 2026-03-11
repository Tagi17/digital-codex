"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
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

const ArticleJourney: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeDefinition = useMemo(() => {
    if (!activeId) return null;
    return (journeyData.definitions as Record<string, Definition>)[activeId] || null;
  }, [activeId]);

  // Helper to parse content strings into React components with <Term> elements
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
    <div className="flex h-screen w-full bg-obsidian overflow-hidden selection:bg-auric-gold/30 selection:text-auric-gold">
      {/* Left Pane: Scrollable Research Text */}
      <main className="w-[65%] h-full overflow-y-auto custom-scrollbar p-12 lg:p-24 border-r border-auric-gold/10">
        <div className="max-w-2xl mx-auto space-y-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl lg:text-7xl text-auric-gold leading-tight mb-16"
          >
            {journeyData.title}
          </motion.h1>

          <div className="space-y-8 font-serif text-xl lg:text-2xl leading-relaxed text-white/80">
            {journeyData.content.map((item, idx) => (
              <motion.p 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
              >
                {parseContent(item.text)}
              </motion.p>
            ))}
          </div>

          <div className="h-48" /> {/* Spacer for scrolling */}
        </div>
      </main>

      {/* Right Pane: Aura Sidebar */}
      <aside className="w-[35%] h-full relative overflow-hidden flex flex-col items-center justify-center p-8 bg-obsidian-depth border-l border-auric-gold/20">
        {/* Background Decorative Element */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-auric-gold/20 animate-pulse" />
        </div>

        <AnimatePresence mode="wait">
          {activeDefinition ? (
            <motion.div
              key={activeId}
              initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative z-10 flex flex-col items-center text-center max-w-sm"
            >
              {/* Technical Image Placeholder / Icon */}
              <div className="w-32 h-32 mb-8 relative group">
                <div className="absolute inset-0 bg-bio-cyan/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 w-full h-full border border-bio-cyan/30 rounded-lg flex items-center justify-center bg-obsidian/50 backdrop-blur-sm p-6 overflow-hidden">
                  <Image 
                    src={activeDefinition.image} 
                    alt={activeDefinition.title}
                    width={64}
                    height={64}
                    className="invert brightness-200"
                  />
                </div>
              </div>

              <h2 className="font-mono text-bio-cyan text-sm tracking-widest uppercase mb-4 opacity-60">
                Synthesis Definition
              </h2>
              
              <h3 className="font-serif text-3xl text-auric-gold mb-6">
                {activeDefinition.title}
              </h3>

              <p className="font-mono text-xs leading-loose text-bio-cyan/80 tracking-wide uppercase">
                {activeDefinition.description}
              </p>
              
              <div className="mt-8 w-12 h-[1px] bg-auric-gold/30" />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-auric-gold/40"
            >
              Hover over highlighted terms <br /> to synchronize research
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.3);
        }
      `}</style>
    </div>
  );
};

export default ArticleJourney;

"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import journeyData from "@/data/journey_content.json";
import articlesData from "@/data/articles.json";
import { NodeData } from "@/hooks/useNebula";

interface Definition {
  title: string;
  concept: string;
  mechanism: string;
  function: string;
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
      <span className="absolute inset-0 bg-auric-gold/10 blur-sm scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm" />
      <span className="absolute bottom-0 left-0 w-full h-[1px] bg-auric-gold/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </span>
  );
};

interface ArticleViewerProps {
  nodeData: NodeData;
  onClose: () => void;
  contentId?: string;
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({ nodeData, onClose, contentId }) => {
  const [activeTermId, setActiveTermId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const targetId = contentId || nodeData.articleId;
  const article = targetId ? (articlesData as any)[targetId] : null;

  const { scrollYProgress } = useScroll({
    container: scrollContainerRef,
  });
  
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    document.body.style.cursor = 'auto';
    
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.cursor = '';
    };
  }, []);

  const activeDefinition = useMemo(() => {
    if (!activeTermId) return null;
    return (journeyData.definitions as Record<string, Definition>)[activeTermId] || null;
  }, [activeTermId]);

  const parseText = (text: string) => {
    const parts = text.split(/(<Term id='.*?'>.*?<\/Term>)/g);
    return parts.map((part, index) => {
      const match = part.match(/<Term id='(.*?)'>(.*?)<\/Term>/);
      if (match) {
        const id = match[1];
        const content = match[2];
        return (
          <Term key={index} id={id} onHover={setActiveTermId}>
            {content}
          </Term>
        );
      }
      return part;
    });
  };

  const renderBlock = (block: any, index: number) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p key={index} className="font-serif text-lg leading-relaxed text-white/80 mb-6 selection:bg-auric-gold/30">
            {parseText(block.text)}
          </p>
        );
      case 'heading':
        return (
          <h3 key={index} className="font-mono text-xl text-bio-cyan/90 uppercase tracking-widest mt-12 mb-6">
            {block.text}
          </h3>
        );
      case 'bullet-list':
        return (
          <ul key={index} className="list-none space-y-3 mb-6 ml-4">
            {block.items.map((item: string, i: number) => (
              <li key={i} className="font-serif text-lg text-white/70 flex gap-4">
                <span className="text-auric-gold/50 font-mono text-sm mt-1">—</span>
                {parseText(item)}
              </li>
            ))}
          </ul>
        );
      case 'numbered-list':
        return (
          <ol key={index} className="list-none space-y-3 mb-6 ml-4">
            {block.items.map((item: string, i: number) => (
              <li key={i} className="font-serif text-lg text-white/70 flex gap-4">
                <span className="text-auric-gold/50 font-mono text-sm mt-1">{i + 1}.</span>
                {parseText(item)}
              </li>
            ))}
          </ol>
        );
      default:
        return null;
    }
  };

  if (!article) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-obsidian/95 backdrop-blur-2xl flex selection:bg-auric-gold/20 article-active pointer-events-auto"
      style={{ cursor: 'auto' }}
    >
      {/* 1. LEFT SIDEBAR: THE INDEX */}
      <aside className="w-[200px] h-full border-r border-auric-gold/10 flex flex-col p-8 pt-24 shrink-0">
        <button 
          onClick={onClose}
          className="font-mono text-[10px] text-auric-gold/60 hover:text-auric-gold transition-colors tracking-[0.2em] mb-16 flex items-center gap-2 group cursor-pointer"
        >
          <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
          [ BACK TO NEBULA ]
        </button>

        <nav className="space-y-8">
          <div className="text-[10px] font-mono text-bio-cyan/40 tracking-[0.3em] uppercase mb-4">Index</div>
          {article.sections.map((section: any) => (
            <div key={section.id} className="group cursor-default">
              <div className="font-mono text-[11px] text-auric-gold/40 group-hover:text-auric-gold transition-colors mb-1">
                [{section.id}]
              </div>
              <div className="font-mono text-[12px] text-white/40 group-hover:text-white/80 transition-colors uppercase tracking-wider">
                {section.title}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* 2. CENTER PANE: THE RESEARCH */}
      <main className="flex-1 h-full relative flex flex-col items-center">
        {/* Progress Line on the divider */}
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-auric-gold/5 overflow-hidden">
          <motion.div 
            className="w-full h-full bg-auric-gold origin-top"
            style={{ scaleY }}
          />
        </div>

        <div 
          ref={scrollContainerRef}
          className="w-full h-full overflow-y-auto custom-scrollbar px-16 lg:px-32 py-24"
        >
          <div className="max-w-2xl mx-auto">
            <header className="mb-20">
              <div className="font-mono text-[10px] text-bio-cyan/60 tracking-[0.5em] uppercase mb-4">
                Research Archive // Cellular Systems
              </div>
              <h1 className="font-serif text-5xl lg:text-7xl text-auric-gold leading-tight">
                {article.title}
              </h1>
              <div className="mt-8 flex items-center gap-4">
                <div className="h-[1px] w-12 bg-auric-gold/30" />
                <div className="font-mono text-[10px] text-white/30 tracking-widest uppercase">
                  Published Cycle: 0x4F92
                </div>
              </div>
            </header>

            {article.sections.map((section: any) => (
              <section key={section.id} className="mb-16">
                <div className="flex items-center gap-4 mb-8">
                  <span className="font-mono text-xs text-auric-gold/50">[{section.id}]</span>
                  <h2 className="font-mono text-sm text-white/50 tracking-[0.4em] uppercase">{section.title}</h2>
                </div>
                {section.blocks.map((block: any, idx: number) => renderBlock(block, idx))}
              </section>
            ))}
            
            <footer className="mt-32 pt-16 border-t border-auric-gold/10 text-center">
              <div className="font-mono text-[10px] text-white/20 tracking-widest uppercase">
                End of Transmission // Signal Stabilized
              </div>
            </footer>
          </div>
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR: THE SYNC */}
      <aside className="w-[320px] h-full border-l border-auric-gold/10 bg-black/20 shrink-0 p-10 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {activeDefinition ? (
            <motion.div
              key={activeTermId}
              initial={{ opacity: 0, x: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(8px)" }}
              className="relative z-10 flex flex-col w-full"
            >
              <div className="w-16 h-16 mb-10 relative">
                <div className="absolute inset-0 bg-bio-cyan/20 blur-xl rounded-full" />
                <div className="relative z-10 w-full h-full border border-bio-cyan/20 rounded-lg flex items-center justify-center bg-black/40 p-3">
                  <Image 
                    src={activeDefinition.image} 
                    alt={activeDefinition.title}
                    width={32}
                    height={32}
                    className="invert brightness-200"
                  />
                </div>
              </div>

              <div className="space-y-10">
                <div>
                  <h4 className="font-mono text-[10px] text-bio-cyan/60 tracking-[0.3em] uppercase mb-2">Definition</h4>
                  <h3 className="font-serif text-3xl text-auric-gold">{activeDefinition.title}</h3>
                </div>

                <div>
                  <h4 className="font-mono text-[10px] text-auric-gold/40 tracking-[0.3em] uppercase mb-2">Concept</h4>
                  <p className="font-mono text-[11px] leading-relaxed text-white/70 uppercase">{activeDefinition.concept}</p>
                </div>

                <div>
                  <h4 className="font-mono text-[10px] text-auric-gold/40 tracking-[0.3em] uppercase mb-2">Mechanism</h4>
                  <p className="font-mono text-[11px] leading-relaxed text-white/70 uppercase">{activeDefinition.mechanism}</p>
                </div>

                <div>
                  <h4 className="font-mono text-[10px] text-auric-gold/40 tracking-[0.3em] uppercase mb-2">Function</h4>
                  <p className="font-mono text-[11px] leading-relaxed text-white/70 uppercase">{activeDefinition.function}</p>
                </div>
              </div>
              
              <div className="mt-12 flex items-center gap-2">
                <div className="w-1 h-1 bg-bio-cyan rounded-full animate-pulse" />
                <span className="text-[9px] text-bio-cyan/40 font-mono uppercase tracking-[0.1em]">Neural Sync Active</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-auric-gold/40 max-w-[200px] mx-auto leading-loose"
            >
              [ SYNC IDLE ]<br />
              Hover terms to synchronize archive
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
      `}</style>
    </motion.div>
  );
};

export default ArticleViewer;

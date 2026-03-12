"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Settings } from "lucide-react";
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

  // Permanent Cursor Restore & Global Styles
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    
    // Brute Force Cursor Injection
    const style = document.createElement('style');
    style.id = 'article-viewer-cursor-fix';
    style.innerHTML = `* { cursor: auto !important; }`;
    document.head.appendChild(style);
    
    return () => {
      document.body.style.overflow = originalStyle;
      const fix = document.getElementById('article-viewer-cursor-fix');
      if (fix) fix.remove();
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
          <p key={index} className="font-serif text-xl leading-relaxed text-white/80 mb-8 selection:bg-auric-gold/30">
            {parseText(block.text)}
          </p>
        );
      case 'heading':
        return (
          <h3 key={index} className="font-mono text-xl text-bio-cyan/90 uppercase tracking-[0.3em] mt-16 mb-8 border-b border-auric-gold/10 pb-4">
            {block.text}
          </h3>
        );
      case 'bullet-list':
        return (
          <ul key={index} className="list-none space-y-4 mb-8 ml-4">
            {block.items.map((item: string, i: number) => (
              <li key={i} className="font-serif text-lg text-white/70 flex gap-4">
                <span className="text-auric-gold/50 font-mono text-sm mt-1">/</span>
                {parseText(item)}
              </li>
            ))}
          </ul>
        );
      case 'image':
        return (
          <figure key={index} className="mb-8 group">
            <div className="relative aspect-video w-full overflow-hidden rounded border border-auric-gold/20 bg-black/40">
              <Image 
                src={block.url} 
                alt={block.caption || ""} 
                fill 
                className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
            </div>
            {block.caption && (
              <figcaption className="mt-3 font-mono text-[10px] text-bio-cyan/50 uppercase tracking-[0.2em] italic">
                Fig.{index + 1}: {block.caption}
              </figcaption>
            )}
          </figure>
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
      className="fixed inset-0 z-[100] bg-obsidian/95 backdrop-blur-2xl flex selection:bg-auric-gold/20 pointer-events-auto"
      style={{ pointerEvents: 'all' }}
    >
      {/* 1. LEFT SIDEBAR: THE INDEX (200px) */}
      <aside className="w-[220px] h-full border-r-[0.5px] border-auric-gold/20 flex flex-col p-8 pt-24 shrink-0 bg-black/20">
        <button 
          onClick={onClose}
          className="font-mono text-[11px] text-auric-gold hover:text-white transition-all tracking-[0.2em] mb-20 flex items-center gap-3 group cursor-pointer border border-auric-gold/20 p-3 bg-black/40 backdrop-blur-sm"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          [ BACK TO NEBULA ]
        </button>

        <nav className="space-y-10">
          <div className="text-[10px] font-mono text-bio-cyan/40 tracking-[0.4em] uppercase mb-6 border-b border-bio-cyan/10 pb-2">Archive Index</div>
          {article.sections.map((section: any) => (
            <div key={section.id} className="group cursor-pointer">
              <div className="font-mono text-[11px] text-auric-gold/40 group-hover:text-auric-gold transition-colors mb-1">
                [{section.id}]
              </div>
              <div className="font-mono text-[11px] text-white/40 group-hover:text-white/90 transition-colors uppercase tracking-[0.2em] leading-tight">
                {section.title}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* 2. CENTER PANE: THE RESEARCH */}
      <main className="flex-1 h-full relative flex flex-col items-center">
        {/* Progress Line on the divider */}
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-auric-gold/10 overflow-hidden">
          <motion.div 
            className="w-full h-full bg-auric-gold origin-top shadow-[0_0_10px_#D4AF37]"
            style={{ scaleY }}
          />
        </div>

        <div 
          ref={scrollContainerRef}
          className="w-full h-full overflow-y-auto custom-scrollbar px-12 lg:px-24 py-24 scroll-smooth"
        >
          <div className="max-w-2xl mx-auto">
            <header className="mb-24">
              <div className="font-mono text-[11px] text-bio-cyan/60 tracking-[0.6em] uppercase mb-6 flex items-center gap-4">
                <span className="w-8 h-[1px] bg-bio-cyan/30" />
                NEURAL RESEARCH CODEX
              </div>
              <h1 className="font-serif text-5xl lg:text-7xl text-auric-gold leading-[1.1] mb-10 tracking-tight">
                {article.title}
              </h1>
              <div className="flex items-center gap-6 font-mono text-[10px] text-white/30 tracking-[0.3em] uppercase border-y border-auric-gold/10 py-4">
                <span>AUTH: LUMINOUS ARCHIVE</span>
                <span className="w-1 h-1 bg-auric-gold/40 rounded-full" />
                <span>CYCLE: 0x4F92</span>
                <span className="w-1 h-1 bg-auric-gold/40 rounded-full" />
                <span>ID: {targetId}</span>
              </div>
            </header>

            {article.sections.map((section: any) => (
              <section key={section.id} className="mb-20">
                <div className="flex items-center gap-4 mb-10">
                  <span className="font-mono text-xs text-auric-gold tracking-widest">[{section.id}]</span>
                  <div className="h-[0.5px] flex-1 bg-auric-gold/20" />
                </div>
                {section.blocks.map((block: any, idx: number) => renderBlock(block, idx))}
              </section>
            ))}

            {/* DEEP DIVE BOX */}
            <div className="mt-32 p-10 border-[0.5px] border-auric-gold/40 bg-auric-gold/[0.03] backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-auric-gold/40" />
              <div className="flex items-start gap-6 relative z-10">
                <div className="p-3 border border-auric-gold/30 bg-black/40 text-auric-gold">
                  <Settings size={24} className="group-hover:rotate-90 transition-transform duration-700" />
                </div>
                <div>
                  <h4 className="font-mono text-xs text-auric-gold uppercase tracking-[0.3em] mb-4">Deep Dive: Synthesis Mechanism</h4>
                  <p className="font-serif text-lg text-white/60 leading-relaxed italic mb-6">
                    "The manifestation of the biofield is not a passive emission, but an active synthesis of neural intent mediated by mitochondrial electrical gradients."
                  </p>
                  <div className="font-mono text-[9px] text-bio-cyan/40 uppercase tracking-[0.2em]">
                    Referenced: Bio-Electric Signal Stabilization (v1.0.4)
                  </div>
                </div>
              </div>
            </div>
            
            <footer className="mt-48 pb-24 text-center">
              <div className="font-mono text-[10px] text-white/10 tracking-[0.5em] uppercase border-t border-white/5 pt-12">
                SIGNAL ARCHIVE // END OF TRANSCRIPTION
              </div>
            </footer>
          </div>
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR: THE SYNC (320px) */}
      <aside className="w-[350px] h-full border-l-[0.5px] border-auric-gold/20 bg-black/40 shrink-0 p-12 flex flex-col">
        <div className="h-full flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {activeDefinition ? (
              <motion.div
                key={activeTermId}
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                className="space-y-12"
              >
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-20 h-20 border border-bio-cyan/30 bg-black/60 p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-bio-cyan/5 animate-pulse" />
                    <Image 
                      src={activeDefinition.image} 
                      alt={activeDefinition.title}
                      width={40}
                      height={40}
                      className="invert brightness-200 relative z-10"
                    />
                  </div>
                  <div>
                    <h4 className="font-mono text-[10px] text-bio-cyan tracking-[0.4em] uppercase mb-2">Aura Sync Active</h4>
                    <h3 className="font-serif text-3xl text-auric-gold tracking-tight">{activeDefinition.title}</h3>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="border-l border-auric-gold/20 pl-6">
                    <h5 className="font-mono text-[10px] text-auric-gold/60 tracking-[0.2em] uppercase mb-3">[ DEFINITION ]</h5>
                    <p className="font-mono text-[11px] leading-relaxed text-white/80 uppercase tracking-wide">{activeDefinition.concept}</p>
                  </div>

                  <div className="border-l border-auric-gold/20 pl-6">
                    <h5 className="font-mono text-[10px] text-auric-gold/60 tracking-[0.2em] uppercase mb-3">[ MECHANISM ]</h5>
                    <p className="font-mono text-[11px] leading-relaxed text-white/80 uppercase tracking-wide">{activeDefinition.mechanism}</p>
                  </div>

                  <div className="border-l border-auric-gold/20 pl-6">
                    <h5 className="font-mono text-[10px] text-auric-gold/60 tracking-[0.2em] uppercase mb-3">[ BIOLOGICAL FUNCTION ]</h5>
                    <p className="font-mono text-[11px] leading-relaxed text-white/80 uppercase tracking-wide">{activeDefinition.function}</p>
                  </div>
                </div>

                <div className="pt-12 border-t border-auric-gold/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-bio-cyan rounded-full animate-ping" />
                    <span className="text-[10px] text-bio-cyan/60 font-mono uppercase tracking-[0.2em]">Live Resonance</span>
                  </div>
                  <div className="font-mono text-[9px] text-white/20 tracking-tighter">REF_SYN_04.9</div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                exit={{ opacity: 0 }}
                className="text-center font-mono text-[11px] uppercase tracking-[0.5em] text-auric-gold leading-loose border-[0.5px] border-auric-gold/20 p-12 bg-black/20 backdrop-blur-sm"
              >
                [ SYNC IDLE ]<br />
                <span className="text-[9px] tracking-[0.3em] opacity-60">Hover Research Terms to Synchronize Archive</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(212, 175, 55, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.15);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.3);
        }
      `}</style>
    </motion.div>
  );
};

export default ArticleViewer;

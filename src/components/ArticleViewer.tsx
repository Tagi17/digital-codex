"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Settings } from "lucide-react";
import journeyData from "@/data/journey_content.json";
import articlesData from "@/data/articles.json";
import { NodeData } from "@/hooks/useNebula";

// 1. INTERFACE UPDATE
interface Definition {
  id: string;
  title: string;
  definition: string;
  concept: string;
  mechanism: string;
  biological_function: string;
  image?: string;
}

interface TermProps {
  id: string;
  children: React.ReactNode;
  onHover: (id: string | null) => void;
}

const Term: React.FC<TermProps> = ({ id, children, onHover }) => {
  return (
    <span
      className="cursor-help transition-all duration-300 relative group inline-block hover:cursor-pointer"
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="text-auric-gold relative z-10 font-medium italic">
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
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const targetId = contentId || nodeData.articleId;
  const article = targetId ? (articlesData as any)[targetId] : null;

  // 1. THE HELPER FUNCTION (Modified for React Safety)
  // Note: We use React nodes instead of dangerouslySetInnerHTML to preserve 
  // the Term component's hover state logic and state updates.
  const renderFormattedText = (text: string) => {
    if (!text) return "";
    
    // Split by both Term tags and Markdown bold markers
    const parts = text.split(/(<Term id='.*?'>.*?<\/Term>|\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      // Handle <Term> tags
      const termMatch = part.match(/<Term id='(.*?)'>(.*?)<\/Term>/);
      if (termMatch) {
        return (
          <Term key={index} id={termMatch[1]} onHover={setActiveTermId}>
            {termMatch[2]}
          </Term>
        );
      }
      
      // Handle **bold** text
      const boldMatch = part.match(/\*\*(.*?)\*\*/);
      if (boldMatch) {
        return (
          <span key={index} className="text-auric-gold font-bold tracking-wide">
            {boldMatch[1]}
          </span>
        );
      }
      
      return part;
    });
  };

  // LOGIC CORRECTION
  const activeDefinition = useMemo(() => {
    if (!activeTermId || !Array.isArray(journeyData)) return null;
    return (journeyData as Definition[]).find((item: Definition) => item.id === activeTermId) || null;
  }, [activeTermId]);

  const headings = useMemo(() => {
    if (!article || !article.content) return [];
    return article.content
      .map((block: any, index: number) => ({ ...block, index }))
      .filter((block: any) => block.type === 'heading');
  }, [article]);

  const { scrollYProgress } = useScroll({
    container: scrollContainerRef,
  });
  
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    const style = document.createElement('style');
    style.id = 'article-cursor-force-fix';
    style.innerHTML = `* { cursor: auto !important; }`;
    document.head.appendChild(style);
    
    return () => {
      document.body.style.overflow = originalOverflow;
      const styleTag = document.getElementById('article-cursor-force-fix');
      if (styleTag) styleTag.remove();
    };
  }, []);

  useEffect(() => {
    if (!scrollContainerRef.current || headings.length === 0) return;

    const observerOptions = {
      root: scrollContainerRef.current,
      rootMargin: '-10% 0px -70% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSectionId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    headings.forEach((h: any) => {
      const id = `heading-${h.index}`;
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderBlock = (block: any, index: number) => {
    const commonClass = "mb-8 selection:bg-auric-gold/30";
    
    switch (block.type) {
      case 'paragraph':
        return (
          <p key={index} className={`font-serif text-xl leading-[1.8] text-white/80 ${commonClass}`}>
            {renderFormattedText(block.text)}
          </p>
        );
      case 'heading':
        return (
          <h3 
            key={index} 
            id={`heading-${index}`}
            className={`font-mono text-xl text-bio-cyan/90 uppercase tracking-[0.3em] mt-16 border-b border-auric-gold/10 pb-4 scroll-mt-24 ${commonClass}`}
          >
            {block.text}
          </h3>
        );
      case 'heading-small':
        return (
          <h4 
            key={index}
            className="text-auric-gold/90 font-mono text-sm tracking-[0.2em] uppercase mb-4 mt-8"
          >
            {block.text}
          </h4>
        );
      case 'divider':
        return (
          <hr key={index} className="border-t border-bio-cyan/10 my-10 w-1/4 mx-auto" />
        );
      case 'dash-list':
        return (
          <ul key={index} className="list-none mb-8 block selection:bg-auric-gold/30">
            {block.items.map((item: string, i: number) => (
              <li 
                key={i} 
                className="font-serif text-xl text-white/80 relative pl-10 mb-6 leading-relaxed before:content-['—'] before:absolute before:left-0 before:text-auric-gold"
              >
                {renderFormattedText(item)}
              </li>
            ))}
          </ul>
        );
      case 'image':
        return (
          <figure key={index} className={`${commonClass} group w-full`}>
            <div className="relative aspect-video w-full overflow-hidden border border-auric-gold/10 bg-black/40">
              {block.url ? (
                <Image 
                  src={block.url} 
                  alt={block.caption || ""} 
                  fill 
                  className="object-cover opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono text-[10px] text-white/20 uppercase tracking-widest">
                  [ Image Data Stream Offline ]
                </div>
              )}
            </div>
            {block.caption && (
              <figcaption className="mt-3 font-mono text-[10px] text-bio-cyan/60 uppercase tracking-[0.3em] italic">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );
      case 'deep-dive':
        return (
          <div key={index} className={`${commonClass} p-10 border border-auric-gold/30 bg-auric-gold/[0.02] backdrop-blur-sm relative overflow-hidden group`}>
            <div className="absolute top-0 left-0 w-[2px] h-full bg-auric-gold/50" />
            <div className="flex items-start gap-8 relative z-10">
              <div className="p-4 border border-auric-gold/20 bg-black/60 text-auric-gold">
                <Settings size={28} className="group-hover:rotate-180 transition-transform duration-1000 ease-in-out" />
              </div>
              <div>
                <h4 className="font-mono text-[11px] text-auric-gold uppercase tracking-[0.4em] mb-4">Deep Dive: {block.label}</h4>
                <div className="font-serif text-xl text-white/70 leading-relaxed italic mb-4">
                  {renderFormattedText(block.text)}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!article || !article.content || !Array.isArray(journeyData)) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-obsidian/98 backdrop-blur-3xl flex selection:bg-auric-gold/20 pointer-events-auto"
      style={{ pointerEvents: 'all' }}
    >
      <aside className="w-[240px] h-full border-r-[0.5px] border-auric-gold/20 flex flex-col p-8 pt-24 shrink-0 bg-black/20">
        <button 
          onClick={onClose}
          className="font-mono text-[11px] text-auric-gold hover:text-white transition-all tracking-[0.2em] mb-20 flex items-center gap-3 group cursor-pointer border-[0.5px] border-auric-gold/30 p-4 bg-black/40 backdrop-blur-md hover:cursor-pointer"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          [ BACK TO NEBULA ]
        </button>

        <nav className="space-y-8 overflow-y-auto custom-scrollbar pr-4">
          <div className="text-[10px] font-mono text-bio-cyan/40 tracking-[0.4em] uppercase mb-6 border-b border-bio-cyan/20 pb-2">Research Index</div>
          {headings.map((h: any) => {
            const id = `heading-${h.index}`;
            const isActive = activeSectionId === id;
            return (
              <button 
                key={h.index} 
                onClick={() => scrollToSection(id)}
                className="group flex flex-col items-start w-full text-left transition-all duration-300 hover:cursor-pointer"
              >
                <div className={`flex items-center gap-3 font-mono text-[11px] mb-1 transition-all duration-300 ${isActive ? 'text-auric-gold' : 'text-auric-gold/40'}`}>
                  {isActive && <motion.div layoutId="active-dot" className="w-1 h-1 bg-auric-gold rounded-full shadow-[0_0_8px_#D4AF37]" />}
                  {h.text.match(/\[(.*?)\]/)?.[0] || `[0.${h.index}]`}
                </div>
                <div className={`font-mono text-[10px] uppercase tracking-[0.2em] leading-snug transition-all duration-300 ${isActive ? 'text-white scale-105' : 'text-white/40 group-hover:text-white/70'}`}>
                  {h.text.replace(/\[.*?\]/g, '').trim()}
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 h-full relative flex flex-col items-center overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[0.5px] bg-auric-gold/10 overflow-hidden">
          <motion.div 
            className="w-full h-full bg-auric-gold origin-top shadow-[0_0_10px_#D4AF37]"
            style={{ scaleY }}
          />
        </div>

        <div 
          ref={scrollContainerRef}
          className="w-full h-full overflow-y-auto custom-scrollbar px-16 lg:px-32 py-24 scroll-smooth"
        >
          <div className="max-w-2xl mx-auto">
            <header className="mb-24 relative">
              <div className="font-mono text-[11px] text-bio-cyan/50 tracking-[0.6em] uppercase mb-6 flex items-center gap-4">
                <span className="w-10 h-[1px] bg-bio-cyan/20" />
                NEURAL RESEARCH CODEX
              </div>
              <h1 className="font-serif text-5xl lg:text-7xl text-auric-gold leading-[1.05] mb-12 tracking-tight">
                {article.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 font-mono text-[10px] text-white/30 tracking-[0.3em] uppercase border-y border-auric-gold/10 py-6">
                <span>AUTH: <span className="text-white/60">{article.author}</span></span>
                <span>DATE: <span className="text-white/60">{article.date}</span></span>
                <span>ID: <span className="text-white/60">{targetId}</span></span>
              </div>
            </header>

            <article className="relative">
              {article.content.map((block: any, idx: number) => renderBlock(block, idx))}
            </article>
            
            <footer className="mt-48 pb-32 border-t border-auric-gold/10 text-center">
              <div className="font-mono text-[10px] text-white/10 tracking-[0.6em] uppercase pt-12">
                SIGNAL ARCHIVE // END OF TRANSCRIPTION
              </div>
            </footer>
          </div>
        </div>
      </main>

      <aside className="w-[350px] h-full border-l-[0.5px] border-auric-gold/20 bg-black/50 shrink-0 p-12 flex flex-col relative">
        <div className="h-full flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {activeDefinition ? (
              <motion.div
                key={activeTermId}
                initial={{ opacity: 0, y: 30, filter: "blur(15px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -30, filter: "blur(15px)" }}
                className="space-y-12"
              >
                <div className="flex flex-col gap-6 mb-16">
                  <div className="w-20 h-20 border border-bio-cyan/20 bg-black/40 p-5 relative overflow-hidden self-start">
                    <div className="absolute inset-0 bg-bio-cyan/5 animate-pulse" />
                    {activeDefinition.image ? (
                      <Image 
                        src={activeDefinition.image} 
                        alt={activeDefinition.title}
                        width={40}
                        height={40}
                        className="invert brightness-200 relative z-10"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-auric-gold/40">
                        <Settings size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-mono text-[10px] text-bio-cyan/60 tracking-[0.4em] uppercase mb-3">Neural Sync Active</h4>
                    <h3 className="font-serif text-3xl text-auric-gold tracking-tight">{activeDefinition.title}</h3>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="border-l-[0.5px] border-auric-gold/30 pl-8">
                    <h5 className="font-mono text-[10px] text-auric-gold tracking-[0.3em] uppercase mb-4 opacity-60">[ CONCEPT ]</h5>
                    <p className="font-mono text-[11px] leading-relaxed text-white/90 uppercase tracking-widest leading-[1.8]">{activeDefinition.concept}</p>
                  </div>

                  <div className="border-l-[0.5px] border-auric-gold/30 pl-8">
                    <h5 className="font-mono text-[10px] text-auric-gold tracking-[0.3em] uppercase mb-4 opacity-60">[ MECHANISM ]</h5>
                    <p className="font-mono text-[11px] leading-relaxed text-white/90 uppercase tracking-widest leading-[1.8]">{activeDefinition.mechanism}</p>
                  </div>

                  <div className="border-l-[0.5px] border-auric-gold/30 pl-8">
                    <h5 className="font-mono text-[10px] text-auric-gold tracking-[0.3em] uppercase mb-4 opacity-60">[ BIOLOGICAL FUNCTION ]</h5>
                    <p className="font-mono text-[11px] leading-relaxed text-white/90 uppercase tracking-widest leading-[1.8]">{activeDefinition.biological_function}</p>
                  </div>
                </div>

                <div className="pt-16 mt-8 border-t border-auric-gold/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-bio-cyan rounded-full animate-ping" />
                    <span className="text-[10px] text-bio-cyan/50 font-mono uppercase tracking-[0.2em]">Signal Stable</span>
                  </div>
                  <div className="font-mono text-[9px] text-white/20 tracking-widest uppercase">{activeTermId}</div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                exit={{ opacity: 0 }}
                className="text-center font-mono text-[11px] uppercase tracking-[0.6em] text-auric-gold leading-loose border-[0.5px] border-auric-gold/10 p-16 bg-black/20"
              >
                [ SYNC IDLE ]<br />
                <span className="text-[10px] tracking-[0.3em] opacity-50 mt-4 block">Synchronizing archive via neural hover state...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
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

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
  category?: string;
}

interface TermProps {
  id: string;
  children: React.ReactNode;
  onHover: (id: string | null) => void;
  onTap?: (id: string) => void;
}

const Term: React.FC<TermProps> = ({ id, children, onHover, onTap }) => {
  return (
    <span
      className="cursor-help transition-all duration-300 relative group inline-block hover:cursor-pointer border-b border-bio-cyan/30 hover:bg-bio-cyan/10 px-1 rounded-sm"
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); onTap?.(id); }}
    >
      <span className="text-bio-cyan group-hover:text-white relative z-10 font-medium italic transition-colors duration-300">
        {children}
      </span>
      <span className="absolute inset-0 bg-bio-cyan/5 blur-sm scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm" />
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
  const [mobileTermId, setMobileTermId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const targetId = contentId || nodeData.articleId;
  const article = targetId ? (articlesData as any)[targetId] : null;

  const renderFormattedText = (text: string) => {
    if (!text) return "";
    const parts = text.split(/(<Term id='.*?'>.*?<\/Term>|\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      const termMatch = part.match(/<Term id='(.*?)'>(.*?)<\/Term>/);
      if (termMatch) {
        return (
          <Term key={index} id={termMatch[1]} onHover={setActiveTermId} onTap={setMobileTermId}>
            {termMatch[2]}
          </Term>
        );
      }
      
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

  const activeDefinition = useMemo(() => {
    if (!activeTermId || !Array.isArray(journeyData)) return null;
    return (journeyData as Definition[]).find((item: Definition) => item.id === activeTermId) || null;
  }, [activeTermId]);

  const mobileDefinition = useMemo(() => {
    if (!mobileTermId || !Array.isArray(journeyData)) return null;
    return (journeyData as Definition[]).find((item: Definition) => item.id === mobileTermId) || null;
  }, [mobileTermId]);

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
            className={`font-mono text-xl text-auric-gold/90 uppercase tracking-[0.3em] mt-16 border-b border-auric-gold/10 pb-4 scroll-mt-24 ${commonClass}`}
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
        const images = article.content.filter((b: any) => b.type === 'image');
        const imageIndex = images.findIndex((b: any) => b === block) + 1;
        
        // Clean the caption to avoid redundant "Figure X:" prefixes
        const cleanCaption = block.caption 
          ? block.caption.replace(/^(Figure\s+\d+:|Image\s+of\s+)/i, '').trim()
          : "";
          
        return (
          <figure key={index} className="flex flex-col items-center my-16 p-6 bg-black/40 border border-auric-gold/10 rounded-sm shadow-xl shadow-auric-gold/5 group w-full">
            <div className="relative w-full flex items-center justify-center overflow-hidden">
              {block.url ? (
                <div className="relative w-full flex justify-center">
                  <img 
                    src={block.url} 
                    alt={cleanCaption} 
                    className="w-full h-auto max-h-[500px] block mx-auto object-contain opacity-90 hover:opacity-100 transition-all duration-700"
                  />
                </div>
              ) : (
                <div className="w-full h-[300px] flex items-center justify-center font-mono text-[10px] text-white/20 uppercase tracking-widest">
                  [ Image Data Stream Offline ]
                </div>
              )}
            </div>
            {block.caption && (
              <figcaption className="mt-6 text-center text-[10.5px] font-mono uppercase tracking-[0.2em] text-auric-gold/80">
                FIGURE [{imageIndex}]: {cleanCaption}
              </figcaption>
            )}
          </figure>
        );
      case 'deep-dive':
        return (
          <div key={index} className={`${commonClass} p-8 border border-auric-gold/20 bg-auric-gold/[0.01] backdrop-blur-md relative overflow-hidden group`}>
            <div className="absolute top-0 left-0 w-[1px] h-full bg-auric-gold/40" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[16px] text-auric-gold drop-shadow-[0_0_4px_rgba(212,175,55,0.3)]">◈</span>
                <h4 className="font-mono text-[9px] text-auric-gold tracking-[0.3em] uppercase opacity-60">
                  [ SUPPLEMENTAL DATA ]: {block.label}
                </h4>
              </div>
              <div className="font-serif text-xl text-white/70 leading-relaxed italic pl-7">
                {renderFormattedText(block.text)}
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
      className="fixed inset-0 z-[100] bg-obsidian/98 backdrop-blur-3xl flex selection:bg-auric-gold/20 pointer-events-auto overflow-hidden"
      style={{ pointerEvents: 'all' }}
    >
      {/* MOBILE: Fixed top bar with Back and Index buttons */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[150] flex items-center justify-between px-4 py-3 bg-obsidian/95 backdrop-blur-md border-b border-auric-gold/10">
        <button
          onClick={onClose}
          className="font-mono text-[10px] text-auric-gold border border-auric-gold/30 px-3 py-2 bg-black/40 flex items-center gap-2 tracking-[0.2em] cursor-pointer"
        >
          <ArrowLeft size={12} className="shrink-0" />
          [ BACK ]
        </button>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="font-mono text-[10px] text-auric-gold border border-auric-gold/30 px-3 py-2 bg-black/40 tracking-[0.2em] cursor-pointer"
        >
          [ INDEX ]
        </button>
      </div>

      {/* MOBILE: Full-screen slide-out index menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed inset-0 z-[200] md:hidden bg-obsidian/98 backdrop-blur-3xl flex flex-col p-8 pt-16"
          >
            <div className="flex justify-between items-center mb-10">
              <div className="text-[10px] font-mono text-bio-cyan/40 tracking-[0.4em] uppercase border-b border-bio-cyan/20 pb-2">Research Index</div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-mono text-[11px] text-auric-gold border border-auric-gold/30 px-3 py-2 bg-black/40 cursor-pointer"
              >
                [ CLOSE ]
              </button>
            </div>
            <nav className="space-y-8 overflow-y-auto custom-scrollbar pr-4 flex-1">
              {headings.map((h: any) => {
                const id = `heading-${h.index}`;
                const isActive = activeSectionId === id;
                return (
                  <button
                    key={h.index}
                    onClick={() => { scrollToSection(id); setIsMobileMenuOpen(false); }}
                    className="group flex flex-col items-start w-full text-left transition-all duration-300 cursor-pointer"
                  >
                    <div className={`flex items-center gap-3 font-mono text-[11px] mb-1 transition-all duration-300 ${isActive ? 'text-auric-gold' : 'text-auric-gold/40'}`}>
                      {isActive && <div className="w-1 h-1 bg-auric-gold rounded-full shadow-[0_0_8px_#D4AF37]" />}
                      {h.text.match(/\[(.*?)\]/)?.[0] || `[0.${h.index}]`}
                    </div>
                    <div className={`font-mono text-[10px] uppercase tracking-[0.2em] leading-snug transition-all duration-300 ${isActive ? 'text-white' : 'text-white/40'}`}>
                      {h.text.replace(/\[.*?\]/g, '').trim()}
                    </div>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. LEFT SIDEBAR: THE INDEX */}
      <aside className="hidden md:flex md:flex-col w-[240px] h-full border-r-[0.5px] border-auric-gold/20 p-8 pt-24 shrink-0 bg-black/20 relative z-30 pointer-events-auto">
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

      {/* 2. CENTER PANE: THE RESEARCH (INTERACTIVE AREA) */}
      <main className="flex-1 h-full relative flex flex-col items-center overflow-hidden z-10">
        <div className="absolute left-0 top-0 bottom-0 w-[0.5px] bg-auric-gold/10 overflow-hidden pointer-events-none">
          <motion.div
            className="w-full h-full bg-auric-gold origin-top shadow-[0_0_10px_#D4AF37]"
            style={{ scaleY }}
          />
        </div>

        <div
          ref={scrollContainerRef}
          className="w-full h-full overflow-y-auto custom-scrollbar px-5 md:px-16 lg:px-32 pt-20 pb-16 md:py-24 scroll-smooth relative z-20"
          style={{ scrollbarGutter: 'stable' }}
        >
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <header className="mb-12 md:mb-24 relative">
              <div className="font-mono text-[11px] text-bio-cyan/50 tracking-[0.6em] uppercase mb-6 flex items-center gap-4">
                <span className="w-10 h-[1px] bg-bio-cyan/20" />
                NEURAL RESEARCH CODEX
              </div>
              <h1 className="font-serif text-3xl md:text-5xl lg:text-7xl text-auric-gold leading-[1.1] md:leading-[1.05] mb-8 md:mb-12 tracking-tight">
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

      {/* 3. RIGHT SIDEBAR: THE SYNC PANE */}
      <aside className="hidden md:flex md:flex-col w-[350px] h-full border-l-[0.5px] border-auric-gold/20 bg-black/50 shrink-0 p-12 relative z-30 pointer-events-auto">
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
                <div className="flex flex-col items-center mb-8 w-full text-center border-b border-white/5 pb-4">
                  <h4 className="font-mono text-[10px] font-medium tracking-[0.6em] text-auric-gold uppercase flex items-center justify-center gap-3 whitespace-nowrap">
                    <span className="text-[16px] text-auric-gold drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]">
                      {activeDefinition.category === 'Barrier' ? '⫶' : 
                       activeDefinition.category === 'Spark' ? '◈' : 
                       activeDefinition.category === 'Process' ? '⌬' : 
                       activeDefinition.category === 'Field' ? '⚙︎' : '⌬'}
                    </span>
                    {activeDefinition.category === 'Barrier' ? 'ISOLATION PROTOCOL' : 
                     activeDefinition.category === 'Spark' ? 'TRANSMISSION NODE' : 
                     activeDefinition.category === 'Process' ? 'METABOLIC ENGINE' : 
                     activeDefinition.category === 'Field' ? 'RESONANCE FIELD' : 'NEURAL SYNC ACTIVE'}
                  </h4>
                </div>
                <div className="mb-10 w-full text-center px-4">
                  <h3 className="font-serif text-2xl text-bio-cyan tracking-tight leading-tight">
                    {activeDefinition.title}
                  </h3>
                </div>

                <div className="space-y-8">
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-0 bottom-0 w-[0.5px] bg-bio-cyan/20" />
                    <h5 className="font-mono text-[9px] text-bio-cyan tracking-[0.4em] uppercase mb-2 opacity-40">[ Concept ]</h5>
                    <p className="font-mono text-[11px] font-light leading-relaxed text-white/80 tracking-widest leading-[1.7] lowercase first-letter:uppercase">
                      {activeDefinition.concept}
                    </p>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute left-0 top-0 bottom-0 w-[0.5px] bg-bio-cyan/20" />
                    <h5 className="font-mono text-[9px] text-bio-cyan tracking-[0.4em] uppercase mb-2 opacity-40">[ Mechanism ]</h5>
                    <p className="font-mono text-[11px] font-light leading-relaxed text-white/80 tracking-widest leading-[1.7] lowercase first-letter:uppercase">
                      {activeDefinition.mechanism}
                    </p>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute left-0 top-0 bottom-0 w-[0.5px] bg-bio-cyan/20" />
                    <h5 className="font-mono text-[9px] text-bio-cyan tracking-[0.4em] uppercase mb-2 opacity-40">[ Biological Function ]</h5>
                    <p className="font-mono text-[11px] font-light leading-relaxed text-white/80 tracking-widest leading-[1.7] lowercase first-letter:uppercase">
                      {activeDefinition.biological_function}
                    </p>
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
                className="text-center font-mono text-[11px] uppercase tracking-[0.6em] text-bio-cyan leading-loose border-[0.5px] border-bio-cyan/10 p-16 bg-black/20"
              >
                [ SYNC IDLE ]<br />
                <span className="text-[10px] tracking-[0.3em] opacity-50 mt-4 block">Synchronizing archive via neural hover state...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* MOBILE: Term Definition Bottom Sheet */}
      <AnimatePresence>
        {mobileDefinition && (
          <>
            {/* Backdrop — tap outside to dismiss */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[249] md:hidden bg-black/50"
              onClick={() => setMobileTermId(null)}
            />

            {/* Bottom sheet panel */}
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_: any, info: any) => {
                if (info.offset.y > 90) setMobileTermId(null);
              }}
              className="fixed bottom-0 left-0 right-0 z-[250] md:hidden rounded-t-2xl overflow-hidden"
              style={{
                background: 'rgba(10, 10, 10, 0.96)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderTop: '1.5px solid #00F5FF',
                boxShadow: '0 -8px 40px rgba(0, 245, 255, 0.08)',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Header row */}
              <div className="flex items-start justify-between px-6 pt-3 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-bio-cyan text-lg shrink-0">
                    {mobileDefinition.category === 'Barrier' ? '⫶' :
                     mobileDefinition.category === 'Spark'   ? '◈' :
                     mobileDefinition.category === 'Process' ? '⌬' :
                     mobileDefinition.category === 'Field'   ? '⚙︎' : '⌬'}
                  </span>
                  <h3 className="font-serif text-xl text-bio-cyan leading-snug truncate">
                    {mobileDefinition.title}
                  </h3>
                </div>
                <button
                  onClick={() => setMobileTermId(null)}
                  className="font-mono text-[11px] text-white/40 border border-white/10 px-2.5 py-1.5 ml-4 shrink-0 rounded-sm hover:text-white hover:border-white/30 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable content */}
              <div className="px-6 py-6 space-y-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: '55vh' }}>
                <div>
                  <h5 className="font-mono text-[9px] text-bio-cyan tracking-[0.4em] uppercase mb-2 opacity-40">CONCEPT</h5>
                  <p className="font-mono text-[12px] text-white/80 leading-relaxed lowercase first-letter:uppercase">
                    {mobileDefinition.concept}
                  </p>
                </div>
                <div className="border-t border-white/5 pt-6">
                  <h5 className="font-mono text-[9px] text-bio-cyan tracking-[0.4em] uppercase mb-2 opacity-40">MECHANISM</h5>
                  <p className="font-mono text-[12px] text-white/80 leading-relaxed lowercase first-letter:uppercase">
                    {mobileDefinition.mechanism}
                  </p>
                </div>
                <div className="border-t border-white/5 pt-6">
                  <h5 className="font-mono text-[9px] text-bio-cyan tracking-[0.4em] uppercase mb-2 opacity-40">FUNCTION</h5>
                  <p className="font-mono text-[12px] text-white/80 leading-relaxed lowercase first-letter:uppercase">
                    {mobileDefinition.biological_function}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.8);
        }
      `}</style>
    </motion.div>
  );
};

export default ArticleViewer;

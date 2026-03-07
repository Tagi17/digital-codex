'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from './LoadingContext';
import { useEffect } from 'react';

const SEED_OF_LIFE_CIRCLES = [
  { cx: 50, cy: 50 }, // Center
  { cx: 50, cy: 30 }, // North
  { cx: 67.32, cy: 40 }, // North-East
  { cx: 67.32, cy: 60 }, // South-East
  { cx: 50, cy: 70 }, // South
  { cx: 32.68, cy: 60 }, // South-West
  { cx: 32.68, cy: 40 }, // North-West
];

export const LuminousLoader = () => {
  const { isComplete, hasSeenLoader, setComplete } = useLoading();

  useEffect(() => {
    // Phase 1 (0-1500ms) + Phase 2 (1500-2200ms) + Phase 3 (2200-2500ms)
    // Total guaranteed window of 2500ms for first-time or fresh sessions
    const totalDuration = hasSeenLoader ? 500 : 2500;
    
    const timer = setTimeout(() => {
      setComplete();
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [hasSeenLoader, setComplete]);

  return (
    <AnimatePresence mode="wait">
      {!isComplete && (
        <motion.div
          key="loader-container"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.05,
            transition: { duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96], delay: hasSeenLoader ? 0 : 2.1 } 
          }}
          className="fixed inset-0 z-[9999] bg-obsidian-depth no-cursor-hide"
        >
          {/* Main Flex Container: Centers the entire ceremony */}
          <div className="relative h-screen w-screen flex flex-col items-center justify-center gap-y-12 z-10">
            
            {/* SVG Symbol Container */}
            <div className="relative w-80 h-80 z-20 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {SEED_OF_LIFE_CIRCLES.map((circle, i) => (
                  <motion.circle
                    key={i}
                    cx={circle.cx}
                    cy={circle.cy}
                    r="20"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="0.5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ 
                      pathLength: 1, 
                      opacity: 1,
                      filter: hasSeenLoader ? "none" : [
                        "drop-shadow(0 0 0px #D4AF37)",
                        "drop-shadow(0 0 10px #D4AF37)",
                        "drop-shadow(0 0 0px #D4AF37)"
                      ]
                    }}
                    transition={{
                      pathLength: { 
                        duration: hasSeenLoader ? 0.3 : 1.5, 
                        ease: "easeInOut",
                        delay: hasSeenLoader ? 0 : i * 0.05 
                      },
                      opacity: { duration: 0.4 },
                      filter: { 
                        delay: 1.5, 
                        duration: 0.6,
                        times: [0, 0.5, 1]
                      }
                    }}
                  />
                ))}
              </svg>
            </div>
            
            {/* Metadata Text Layer */}
            {!hasSeenLoader && (
              <motion.div
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 0.5, filter: "blur(0px)" }}
                transition={{ 
                  delay: 1, 
                  duration: 1.5, 
                  ease: "easeOut" 
                }}
                className="z-20 text-center"
              >
                <div className="text-auric-gold font-mono text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">
                  Accessing the Luminous Archive
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

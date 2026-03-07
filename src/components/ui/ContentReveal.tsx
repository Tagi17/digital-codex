'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from './LoadingContext';

export const ContentReveal = ({ children }: { children: React.ReactNode }) => {
  const { isComplete } = useLoading();

  return (
    <AnimatePresence>
      {isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-full h-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

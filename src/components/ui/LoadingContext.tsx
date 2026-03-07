'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LoadingContextType {
  isComplete: boolean;
  hasSeenLoader: boolean;
  setComplete: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isComplete, setIsComplete] = useState(false);
  const [hasSeenLoader, setHasSeenLoader] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem('hasSeenLoader');
    if (seen === 'true') {
      setHasSeenLoader(true);
    }
  }, []);

  const setComplete = () => {
    sessionStorage.setItem('hasSeenLoader', 'true');
    setIsComplete(true);
  };

  return (
    <LoadingContext.Provider value={{ isComplete, hasSeenLoader, setComplete }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ProcessingContextType = {
  processingCount: number;
  incrementProcessing: () => void;
  decrementProcessing: () => void;
};

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [processingCount, setProcessingCount] = useState(0);

  const incrementProcessing = () => {
    setProcessingCount(prev => prev + 1);
  };

  const decrementProcessing = () => {
    setProcessingCount(prev => Math.max(0, prev - 1));
  };

  return (
    <ProcessingContext.Provider value={{ processingCount, incrementProcessing, decrementProcessing }}>
      {children}
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error("useProcessing must be used within a ProcessingProvider");
  }
  return context;
}


'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { LoadingManager, registerLoadingCallbacks, stopLoading as stopLoadingManager } from '@/lib/loading-manager';
import { LoadingScreen } from './loading-screen';

interface LoadingContextType {
  isLoading: boolean;
  message: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Cargando...');

  const startLoading = useCallback((msg?: string) => {
    setMessage(msg || 'Cargando...');
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Connect to LoadingManager (used by api-client)
  useEffect(() => {
    registerLoadingCallbacks(startLoading, stopLoading);

    const unsubscribe = LoadingManager.subscribe((msg) => {
      setMessage(msg);
      setIsLoading(true);
    });

    return unsubscribe;
  }, [startLoading, stopLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, message, startLoading, stopLoading }}>
      {children}
      <LoadingScreen visible={isLoading} message={message} />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

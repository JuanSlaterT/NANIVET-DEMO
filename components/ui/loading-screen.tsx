'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  visible: boolean;
}

export function LoadingScreen({ message = 'Cargando...', visible }: LoadingScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!visible || !mounted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo */}
        <div className="relative">
          <img src="/logo.svg" alt="NANIVET" className="h-16 w-auto" />
        </div>
        
        {/* Spinner */}
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        
        {/* Message */}
        <p className="text-sm text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

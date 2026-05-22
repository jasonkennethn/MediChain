'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 1500 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-scale-in z-10">
        {/* Logo with glow effect */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/15 rounded-full blur-2xl scale-150 animate-pulse-soft" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-card/80 backdrop-blur-md border border-border shadow-2xl">
            <Activity className="h-14 w-14 text-primary drop-shadow-md" strokeWidth={2.5} />
          </div>
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-foreground tracking-tight drop-shadow-sm">
            MediChain
          </h1>
          <p className="mt-3 text-muted-foreground text-base font-medium tracking-wide">
            Healthcare Made Simple
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex gap-2.5 mt-8">
          <div className="h-2.5 w-2.5 rounded-full bg-primary/80 animate-bounce shadow-sm" style={{ animationDelay: '0ms' }} />
          <div className="h-2.5 w-2.5 rounded-full bg-primary/80 animate-bounce shadow-sm" style={{ animationDelay: '150ms' }} />
          <div className="h-2.5 w-2.5 rounded-full bg-primary/80 animate-bounce shadow-sm" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LucideSmartphone, LucideArrowUpCircle, LucideDownload } from 'lucide-react';

export default function PWAGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (PWA installed)
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone 
        || document.referrer.includes('android-app://');
      
      setIsStandalone(standalone);
    };

    // Detect iOS
    const detectIOS = () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(ios);
    };

    checkStandalone();
    detectIOS();

    // Listen for changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);
    
    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
    };
  }, []);

  if (process.env.NODE_ENV === 'development' || pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6 text-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full space-y-12 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="space-y-6">
          <div className="w-24 h-24 primary-gradient rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(16,185,129,0.3)] animate-pulse">
            <LucideSmartphone className="w-10 h-10 text-black" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-outfit text-white tracking-tight">Ghost Mode Required</h1>
            <p className="text-muted-foreground text-sm leading-relaxed px-4">
              To use the decentralised recovery engine, you must install the Ghost PWA to your device.
            </p>
          </div>
        </div>

        <div className="glass p-8 rounded-[3rem] border border-white/10 space-y-8">
          <div className="space-y-4 text-left">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <LucideDownload className="w-5 h-5 text-primary" /> How to install:
            </h3>
            
            {isIOS ? (
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0 text-xs font-bold text-white">1</div>
                  <p>Tap the <span className="text-white font-bold inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-white/10 rounded text-xs"><LucideArrowUpCircle className="w-3 h-3"/> Share</span> button in Safari.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0 text-xs font-bold text-white">2</div>
                  <p>Scroll down and tap <span className="text-white font-bold">"Add to Home Screen"</span>.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0 text-xs font-bold text-white">3</div>
                  <p>Launch <span className="text-primary font-bold">Ghost</span> from your home screen.</p>
                </li>
              </ul>
            ) : (
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0 text-xs font-bold text-white">1</div>
                  <p>Tap the <span className="text-white font-bold">Menu</span> (3 dots) in your browser.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0 text-xs font-bold text-white">2</div>
                  <p>Select <span className="text-white font-bold">"Install App"</span> or <span className="text-white font-bold">"Add to Home Screen"</span>.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0 text-xs font-bold text-white">3</div>
                  <p>Launch <span className="text-primary font-bold">Ghost</span> to begin.</p>
                </li>
              </ul>
            )}
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.4em] animate-pulse">
          Secure Edge Protocol v2.5
        </div>
      </div>
    </div>
  );
}

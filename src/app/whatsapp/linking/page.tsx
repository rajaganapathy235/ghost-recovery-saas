'use client';

import React, { useState, useEffect } from 'react';
import { LucideShield, LucideArrowLeft, LucideSmartphone, LucideCheckCircle2, LucideLoader2 } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { linkWhatsApp } from '@/app/actions';

declare global {
  interface Window {
    Go: any;
    getWhatsAppPairingCode?: (phone: string) => Promise<string>;
  }
}

function WhatsAppLinkingContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId') || 'demo-business-id';
  
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('+91-9597992677');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading_linker' | 'loading_engine' | 'ready' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Hijack console for debugging
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      setLogs(prev => [...prev.slice(-20), `LOG: ${args.join(' ')}`]);
      originalLog(...args);
    };
    console.error = (...args) => {
      setLogs(prev => [...prev.slice(-20), `ERR: ${args.join(' ')}`]);
      originalError(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);
  useEffect(() => {
    // Proactively start initialization
    const startLoading = async () => {
      setLoadStatus('loading_linker');
      
      // 1. Load Linker Script if missing
      if (typeof window.Go !== 'function') {
        const script = document.createElement('script');
        script.src = '/wasm_exec.js';
        script.async = true;
        document.head.appendChild(script);
      }

      // 2. Wait for Linker
      let retries = 0;
      while (typeof window.Go !== 'function' && retries < 100) { // 10s timeout
        await new Promise(r => setTimeout(r, 100));
        retries++;
      }

      if (typeof window.Go !== 'function') {
        setLoadStatus('error');
        setErrorDetails("Ghost Linker (wasm_exec.js) failed to execute. Check connection.");
        return;
      }

      // 3. Load Engine Binary
      if (typeof window.getWhatsAppPairingCode === 'function') {
        setLoadStatus('ready');
        return;
      }

      try {
        setLoadStatus('loading_engine');
        const go = new window.Go();
        
        if (!window.WebAssembly) {
            throw new Error("Browser does not support WebAssembly.");
        }

        const response = await fetch("/whatsapp.wasm");
        if (!response.ok) throw new Error(`Engine Download Failed: HTTP ${response.status}`);
        
        const buffer = await response.arrayBuffer();
        const result = await WebAssembly.instantiate(buffer, go.importObject);
        
        // Start the engine
        go.run(result.instance);
        
        // IMPORTANT: Wait for the engine to register its functions
        console.log("Ghost: Engine started, waiting for registration (15s timeout)...");
        let registrationRetries = 0;
        const maxRetries = 150; // 15 seconds
        
        while (typeof window.getWhatsAppPairingCode !== 'function' && registrationRetries < maxRetries) {
          // Check if engine is still running/has exports
          if (!result.instance.exports) {
              throw new Error("Ghost Engine crashed during initialization.");
          }
          await new Promise(r => setTimeout(r, 100));
          registrationRetries++;
        }

        if (typeof window.getWhatsAppPairingCode !== 'function') {
           // Debug: Check if there was any console output trapped in the linker
           throw new Error("Ghost Engine registration timed out after 15s. This usually happens on slow devices or low memory.");
        }

        setLoadStatus('ready');
        console.log("Ghost: Engine fully ready with registration.");
      } catch (err: any) {
        console.error("Wasm Loading Failed:", err);
        setLoadStatus('error');
        setErrorDetails(err.message || "Failed to load Ghost Engine.");
      }
    };

    startLoading();
  }, []);

  const generateCode = async () => {
    if (loadStatus !== 'ready') {
        alert(errorDetails || "Engine still loading... please wait.");
        return;
    }
    
    setLoading(true);
    const pairingFn = window.getWhatsAppPairingCode;

    if (!pairingFn) {
      setLoading(false);
      setLoadStatus('error');
      setErrorDetails("Ghost Engine lost registration. Refreshing...");
      window.location.reload();
      return;
    }

    try {
      // 2. Request real code from WhatsApp via Wasm
      const realCode = await pairingFn(phone.replace(/\D/g, ''));
      setCode(realCode);
      
      // 3. Persist in DB
      await linkWhatsApp(businessId, phone);
      
      setStep(2);
    } catch (err: any) {
      console.error("Pairing Error:", err);
      const msg = typeof err === 'string' ? err : (err.message || "Unknown engine error");
      setLoadStatus('error');
      setErrorDetails(`Pairing Failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden px-4 pt-12">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md mx-auto relative space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 glass rounded-full flex items-center justify-center border-white/10 hover:bg-white/5 transition-all">
            <LucideArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-xl font-bold font-outfit text-white">Link Device</h1>
        </div>

        {/* Card */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20">
                  <LucideSmartphone className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">WhatsApp Connection</h2>
                  <p className="text-muted-foreground text-sm mt-1">Enter your WhatsApp number to link</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Mobile Number</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-white/10"
                  />
                </div>
                <button 
                  disabled={!phone || loading || loadStatus !== 'ready'}
                  onClick={generateCode}
                  className="w-full primary-gradient text-black py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-30 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  {loading ? (
                    <>
                      <LucideLoader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Code"
                  )}
                </button>

                {/* Status Indicator */}
                <div className="flex flex-col items-center gap-2 pt-2">
                   {loadStatus === 'loading_linker' && (
                     <p className="text-[10px] text-muted-foreground animate-pulse">Initializing Secure Tunnel...</p>
                   )}
                   {loadStatus === 'loading_engine' && (
                     <p className="text-[10px] text-primary animate-pulse font-bold">Downloading Ghost Engine (26MB)...</p>
                   )}
                   {loadStatus === 'error' && (
                     <div className="space-y-4 w-full">
                       <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold text-center w-full">
                         {errorDetails}
                       </div>
                       <div className="glass p-4 rounded-xl border border-white/5 space-y-2">
                         <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Technical Logs</p>
                         <div className="max-h-32 overflow-y-auto font-mono text-[8px] text-white/40 leading-relaxed break-all whitespace-pre-wrap">
                           {logs.join('\n')}
                         </div>
                       </div>
                       <button 
                        onClick={() => window.location.reload()}
                        className="w-full py-2 text-[10px] font-bold text-primary hover:underline"
                       >
                        Tap to Retry
                       </button>
                     </div>
                   )}
                   {loadStatus === 'ready' && !loading && (
                     <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                       <p className="text-[10px] text-primary/50 uppercase tracking-widest font-bold">Engine Connected</p>
                     </div>
                   )}
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  <span className="text-primary font-bold">INFO:</span> This will generate a unique 8-character code. Enter this code in your WhatsApp linked devices section.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold text-white">Your Link Code</h2>
                <p className="text-muted-foreground text-sm">Enter this on your phone</p>
              </div>

              <div className="flex justify-center flex-wrap gap-2">
                {code.split('').map((char, i) => (
                  <div key={i} className="w-10 h-14 glass border border-primary/30 rounded-xl flex items-center justify-center text-2xl font-bold text-primary font-mono shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    {char}
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-[10px] font-bold text-primary">1</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Open WhatsApp on your phone</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-[10px] font-bold text-primary">2</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Go to Settings &gt; Linked Devices</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-[10px] font-bold text-primary">3</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Tap "Link with phone code" and enter the code above</p>
                  </div>
                </div>

                <Link 
                  href="/"
                  className="w-full primary-gradient text-black py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <LucideCheckCircle2 className="w-5 h-5" />
                  Done, I've Linked
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
      <div className="text-center">
          <p className="text-muted-foreground/30 text-[10px] uppercase tracking-[0.2em]">Secure PWA Bridge v2.0</p>
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppLinking() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><LucideLoader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <WhatsAppLinkingContent />
    </React.Suspense>
  );
}

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
  const [wasmLoaded, setWasmLoaded] = useState(false);

  const initWasm = async () => {
    if (typeof window.getWhatsAppPairingCode === 'function') return true;
    
    const go = new window.Go();
    try {
      const result = await WebAssembly.instantiateStreaming(
        fetch("/whatsapp.wasm"),
        go.importObject
      );
      go.run(result.instance);
      return true;
    } catch (err) {
      console.error("Wasm Loading Failed:", err);
      return false;
    }
  };

  const generateCode = async () => {
    setLoading(true);
    
    // 1. Ensure Wasm is loaded
    const ready = await initWasm();
    const pairingFn = window.getWhatsAppPairingCode;

    if (!ready || !pairingFn) {
      setLoading(false);
      alert("Failed to initialize Ghost Engine. Ensure you are on a compatible browser.");
      return;
    }

    try {
      // 2. Request real code from WhatsApp via Wasm
      const realCode = await pairingFn(phone.replace(/\D/g, ''));
      setCode(realCode);
      
      // 3. Persist in DB
      await linkWhatsApp(businessId, phone);
      
      setStep(2);
    } catch (err) {
      console.error("Pairing Error:", err);
      alert("Failed to get pairing code. Check network.");
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
                  disabled={!phone || loading}
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
      <Script src="/wasm_exec.js" strategy="beforeInteractive" />
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

'use client';

import React, { useState, useEffect } from 'react';
import { LucideShield, LucideArrowLeft, LucideSmartphone, LucideCheckCircle2, LucideLoader2 } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { linkWhatsApp, scheduleTestReminder, processDueReminders, markReminderSent, savePushSubscription } from '@/app/actions';

declare global {
  interface Window {
    Go: any;
    getWhatsAppPairingCode?: (phone: string) => Promise<string>;
    loadGhostSession?: (session: string) => void;
    saveGhostSession?: () => string;
    checkGhostLogin?: () => boolean;
    getLoggedInPhone?: () => string;
    sendGhostMessage?: (target: string, text: string) => Promise<string>;
    logoutGhost?: () => string | null;
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
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Background Keep-Alive (Silent Audio Hack)
  useEffect(() => {
    if (step === 2 && !audioRef.current) {
        const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        audio.loop = true;
        audio.play().catch(() => console.warn("Ghost: Background audio hack blocked by browser (Needs user interaction first)"));
        audioRef.current = audio;
    }
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }
  }, [step]);

  // Priority Re-stabilization on Return
  useEffect(() => {
      const handleVisibility = () => {
          if (document.visibilityState === 'visible') {
              console.log("Ghost: App returned to foreground. Forcing engine check...");
              if (window.checkGhostLogin?.()) {
                  setStep(3);
              }
          }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
  
  // Testing States
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('iam live');
  const [testLoading, setTestLoading] = useState(false);
  const [schedLoading, setSchedLoading] = useState(false);

  // 1. Session Persistence Loop
  useEffect(() => {
    if (loadStatus === 'ready') {
       // Auto-subscribe to push
       const setupPush = async () => {
         try {
           const registration = await navigator.serviceWorker.ready;
           const existingSub = await registration.pushManager.getSubscription();
           
           if (!existingSub) {
             const sub = await registration.pushManager.subscribe({
               userVisibleOnly: true,
               applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
             });
             await savePushSubscription(businessId, sub);
             console.log("Ghost: Push Subscription secured.");
           }
         } catch (err) {
           console.warn("Ghost: Push subscription skipped (likely permission denied or local dev):", err);
         }
       };
       setupPush();

       const persistenceInterval = setInterval(() => {
          if (window.checkGhostLogin?.()) {
             const session = window.saveGhostSession?.();
             if (session) {
                localStorage.setItem(`ghost_session_${businessId}`, session);
             }
          }
       }, 5000);
       return () => clearInterval(persistenceInterval);
    }
  }, [loadStatus, businessId]);

  useEffect(() => {
    // Session Auto-Detection
    if (loadStatus === 'ready' && step === 1) {
       const check = () => {
         if (window.checkGhostLogin?.()) {
            console.log("Ghost: Active session detected. Skipping to dashboard.");
            setStep(4);
         }
       };
       check();
       const interval = setInterval(check, 3000);
       return () => clearInterval(interval);
    }
  }, [loadStatus, step]);

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
      while (typeof window.Go !== 'function' && retries < 450) { // 45s timeout
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

        // 4. Try Session Restoration
        const savedSession = localStorage.getItem(`ghost_session_${businessId}`);
        if (savedSession && window.loadGhostSession) {
           console.log("Ghost: Attempting to restore session from localStorage...");
           window.loadGhostSession(savedSession);
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

  // Ghost Automation Loop (Worker)
  useEffect(() => {
    if (loadStatus === 'ready' && step === 4) {
       const worker = async () => {
          try {
             const res = await processDueReminders(businessId);
             if (res.success && res.reminders && res.reminders.length > 0) {
                console.log(`Ghost: Found ${res.reminders.length} due reminders. Dispatching...`);
                for (const rem of res.reminders) {
                   try {
                      const r = rem as any;
                      const cleanPhone = r.customer.phone.replace(/\D/g, '');
                      await window.sendGhostMessage?.(cleanPhone, "This is your Ghost recovery message! (Test Mode)");
                      await markReminderSent(r.id);
                      console.log(`Ghost: Success sending to ${cleanPhone}`);
                   } catch (sendErr) {
                      console.error(`Ghost: Send fail for log ${rem.id}:`, sendErr);
                   }
                }
             }
          } catch (err) {
             console.error("Ghost: Automation loop error:", err);
          }
       };

       const interval = setInterval(worker, 15000); // Check every 15s
       return () => clearInterval(interval);
    }
  }, [loadStatus, step, businessId]);

  // Auto-detect login success in Step 2
  useEffect(() => {
    if (step === 2) {
      const interval = setInterval(async () => {
        if (window.checkGhostLogin?.()) {
          console.log("Ghost: Pairing success detected via polling!");
          
          // Sync to database
          try {
            const cleanPhone = phone.replace(/\D/g, '');
            await linkWhatsApp(businessId, cleanPhone);
            console.log("Ghost: Database synced successfully.");
          } catch (err) {
            console.error("Ghost: Failed to sync link to DB:", err);
          }

          setStep(3); 
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
    
    if (step === 3) {
      // Trigger Live Test Message
      const triggerTest = async () => {
        try {
           const cleanPhone = phone.replace(/\D/g, '');
           console.log("Ghost: Triggering Live Test Message to", cleanPhone);
           await window.sendGhostMessage?.(cleanPhone, "iam live");
           console.log("Ghost: SUCCESS! Test message sent.");
        } catch (err) {
           console.error("Ghost: Test message failed:", err);
        }
      };
      triggerTest();
    }
  }, [step, phone]);

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
      let msg = typeof err === 'string' ? err : (err.message || "Unknown engine error");
      
      if (msg.includes('429') || msg.includes('rate-overlimit')) {
        msg = "WhatsApp Rate Limit Reached. Please wait 5-10 minutes before retrying. WhatsApp throttles frequent pairing attempts to prevent spam.";
      }
      
      setLoadStatus('error');
      setErrorDetails(`Pairing Failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
     if (confirm("Disconnect this device? You will need to link again.")) {
        window.logoutGhost?.();
        localStorage.removeItem(`ghost_session_${businessId}`);
        setStep(1);
        setPhone('');
        setCode('');
     }
  };

  const handleScheduleTest = async () => {
    const loggedInPhone = window.getLoggedInPhone?.();
    if (!loggedInPhone) return alert("Please link WhatsApp first");
    
    setSchedLoading(true);
    try {
       const res = await scheduleTestReminder(businessId, loggedInPhone);
       if (res.success) {
          alert(`Success! Reminder scheduled for ${new Date(res.scheduledAt!).toLocaleTimeString()}. Keep this page open if testing via Wasm Engine.`);
       } else {
          alert(res.error);
       }
    } catch (err: any) {
       alert("Error scheduling test: " + err);
    } finally {
       setSchedLoading(false);
    }
  };

  const runCustomTest = async () => {
    if (!testPhone) return alert("Enter a test number");
    setTestLoading(true);
    try {
       await window.sendGhostMessage?.(testPhone.replace(/\D/g, ''), testMsg);
       alert("Test message sent successfully!");
    } catch (err: any) {
       alert("Failed to send: " + err);
    } finally {
       setTestLoading(false);
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
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mobile Number</label>
                    <span className="text-[10px] text-primary/50 font-bold">Country Code Required</span>
                  </div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="919597992677"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-white/20"
                  />
                  <p className="text-[9px] text-muted-foreground ml-1">Format: <span className="text-white/40">91</span> + <span className="text-white/40">10 digits</span>. No '+' or '-' needed.</p>
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

              {/* Same Device Tip */}
              <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <LucideSmartphone className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Same-Device Tip</h4>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  If you are using this phone for both Ghost and WhatsApp, use <span className="text-primary font-bold">Split Screen</span> to keep Ghost visible. Browsers pause background apps, which makes pairing show "Logging in" for a long time.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  <span className="text-primary font-bold">INFO:</span> This will generate a unique 8-character code. Enter this code in your WhatsApp linked devices section.
                </p>
              </div>

              {/* Duplicate Tab Warning */}
              <div className="flex items-center gap-2 px-1 justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500/40" />
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                  Keep only ONE tab open to avoid rate limits
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
              </div>
            </div>
          )}

          {step === 3 && (
             <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700 text-center py-4">
              <div className="space-y-4">
                <div className="w-24 h-24 bg-primary/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-primary/30 relative">
                   <LucideCheckCircle2 className="w-12 h-12 text-primary" />
                   <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white font-outfit">Successfully Linked!</h2>
                  <p className="text-muted-foreground">Ghost Engine is now managing your recovery.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="glass p-6 rounded-3xl border border-white/5 space-y-4 bg-primary/5">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                         <LucideLoader2 className="w-4 h-4 text-primary animate-spin" />
                      </div>
                      <div className="text-left">
                         <p className="text-xs font-bold text-white">Live Test Triggered</p>
                         <p className="text-[10px] text-primary/70">Sending "iam live" to {phone}</p>
                      </div>
                   </div>
                   <div className="h-px bg-white/5 w-full" />
                   <div className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
                      Checking your own WhatsApp for the "iam live" message confirms the Ghost Engine has full control.
                   </div>
                </div>

                <button 
                  onClick={() => setStep(4)}
                  className="w-full primary-gradient text-black py-5 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] mt-4"
                >
                  Enter Dashboard
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
              {/* Connected Header */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative">
                  <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" />
                  <LucideShield className="w-10 h-10 text-primary relative z-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Engine Active</h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-primary/70 font-mono text-sm">+{window.getLoggedInPhone?.() || "Connected"}</p>
                  </div>
                </div>
              </div>

              {/* Test Actions */}
              <div className="space-y-4">
                <div className="p-5 glass rounded-3xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manual Live Test</p>
                    <div className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                  </div>
                  
                  <div className="space-y-3">
                    <input 
                      type="tel"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="Receiver Number (e.g. 919876543210)"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-white/20"
                    />
                    <textarea 
                      value={testMsg}
                      onChange={(e) => setTestMsg(e.target.value)}
                      placeholder="Message content"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-white/20 h-20 resize-none"
                    />
                    <button 
                      onClick={runCustomTest}
                      disabled={testLoading}
                      className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {testLoading ? <LucideLoader2 className="w-3 h-3 animate-spin" /> : "Dispatch Test Message"}
                    </button>
                  </div>
                </div>

                {/* Scheduled Test Section */}
                <div className="p-5 glass rounded-3xl border border-white/5 space-y-4 bg-primary/5">
                   <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Automation Test</p>
                      <LucideLoader2 className="w-3 h-3 text-primary animate-spin" />
                   </div>
                   <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
                      Schedule a test reminder for **5 minutes from now** to verify the Ghost automation engine.
                   </p>
                   <button 
                      onClick={handleScheduleTest}
                      disabled={schedLoading}
                      className="w-full py-4 primary-gradient text-black rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                   >
                      {schedLoading ? <LucideLoader2 className="w-4 h-4 animate-spin" /> : "Schedule 5-Min Test"}
                   </button>
                </div>

                <div className="flex flex-col gap-3">
                  <Link 
                    href="/"
                    className="w-full py-4 text-center text-xs text-muted-foreground hover:text-white transition-all font-medium border border-white/5 rounded-2xl"
                  >
                    Go back to Home
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full py-4 text-center text-xs text-rose-500 hover:text-rose-400 transition-all font-bold tracking-widest uppercase opacity-80"
                  >
                    Disconnect Device
                  </button>
                </div>
              </div>

              <div className="text-center pt-2">
                <p className="text-[8px] text-muted-foreground/30 uppercase tracking-[0.3em]">Hardware ID: {businessId.slice(0,8)}</p>
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

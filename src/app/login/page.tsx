'use client';

import React, { useState } from 'react';
import { LucideShield, LucideArrowRight, LucideKey } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [testId, setTestId] = useState('');
  const router = useRouter();

  const handleTestLogin = () => {
    if (!testId) return;
    localStorage.setItem('ghost_business_id', testId);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Decorative accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <div className="flex flex-col items-center mb-8 relative">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
              <LucideShield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold font-outfit text-white tracking-tight">Ghost Recovery</h1>
            <p className="text-muted-foreground text-sm mt-2">Bring back your lost customers</p>
          </div>

          <div className="space-y-6 relative">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1 mb-1 block">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="+91 98765 43210"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              
              <Link 
                href="/"
                className="w-full primary-gradient text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all group shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Sign In
                <LucideArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-muted-foreground/50 bg-transparent"><span className="px-2 bg-[#0A0A0A]">Testing Only</span></div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Manual Business ID</label>
                <div className="relative">
                  <LucideKey className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={testId}
                    onChange={(e) => setTestId(e.target.value)}
                    placeholder="Enter ID for testing"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>
              <button 
                onClick={handleTestLogin}
                className="w-full bg-white/5 border border-white/10 text-white py-3 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
              >
                Restore Session
              </button>
            </div>

            <div className="text-center">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                By entering, you agree to the Ghost Secure Protocol.
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground/40 text-[10px] uppercase tracking-[0.2em]">Verified by Ghost Secure Platform</p>
        </div>
      </div>
    </div>
  );
}

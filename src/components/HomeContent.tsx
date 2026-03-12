'use client';

import React, { useState } from 'react';
import PairingUI from "@/components/PairingUI";
import Onboarding from "@/components/onboarding/Onboarding";
import Link from "next/link";
import { LayoutDashboard, Zap, LogOut } from "lucide-react";

export default function HomeContent() {
  const [businessId, setBusinessId] = useState<string | null>(null);

  if (!businessId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-24 animate-in fade-in duration-1000">
        <Onboarding onComplete={(id) => setBusinessId(id)} />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-24 animate-in fade-in duration-500">
      <div className="w-full max-w-5xl flex flex-col items-center">
        <div className="mb-12 text-center space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-secondary/80 border border-border text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4">
            Ghost Protocol Active
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter text-foreground mb-4">
            Customer Recovery System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            System ready for business ID: <span className="font-mono text-primary">{businessId}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-start">
          <PairingUI />
          
          <div className="flex flex-col space-y-6">
            <div className="p-8 glass rounded-3xl border border-border space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-4">
                <Link 
                  href={`/quick-visit?businessId=${businessId}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="font-semibold">Quick Visit Entry</div>
                      <div className="text-xs text-muted-foreground">High-speed visit recording</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                </Link>

                <Link 
                  href="/dashboard"
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <LayoutDashboard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">View Dashboard</div>
                      <div className="text-xs text-muted-foreground">Track ROI and performance</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>

            <button 
              onClick={() => setBusinessId(null)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-rose-500 transition-colors self-center p-2"
            >
              <LogOut className="w-3 h-3" /> Reset Business (Demo Mode)
            </button>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl opacity-50">
          <div className="p-6 rounded-2xl border border-border bg-secondary/10">
            <h3 className="font-semibold mb-2 text-foreground">Decentralized</h3>
            <p className="text-sm text-muted-foreground">Sending happens in the browser via Go-Wasm bridge.</p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-secondary/10">
            <h3 className="font-semibold mb-2 text-foreground">Revenue-First</h3>
            <p className="text-sm text-muted-foreground">ROI logic baked into every visit marked.</p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-secondary/10">
            <h3 className="font-semibold mb-2 text-foreground">Minimalist</h3>
            <p className="text-sm text-muted-foreground">Linear-tier UX for maximum speed and zero clutter.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

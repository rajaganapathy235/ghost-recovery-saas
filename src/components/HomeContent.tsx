'use client';

import React, { useState } from 'react';
import PairingUI from "@/components/PairingUI";
import Onboarding from "@/components/onboarding/Onboarding";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Zap, 
  LogOut, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  PlusCircle, 
  Home as HomeIcon, 
  Settings,
  ChevronRight,
  UserPlus
} from "lucide-react";

export default function HomeContent() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Persistence Hook
  useEffect(() => {
    const savedId = localStorage.getItem('ghost_business_id');
    if (savedId) {
      setBusinessId(savedId);
    }
    setIsReady(true);
  }, []);

  const handleSetBusiness = (id: string | null) => {
    setBusinessId(id);
    if (id) {
      localStorage.setItem('ghost_business_id', id);
    } else {
      localStorage.removeItem('ghost_business_id');
    }
  };

  if (!isReady) return null; // Prevent flash of onboarding

  if (!businessId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Onboarding onComplete={(id) => handleSetBusiness(id)} />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-white">Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">WhatsApp Ready</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full glass flex items-center justify-center border-white/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Hero Card */}
        <div className="glass overflow-hidden rounded-[2rem] border-white/10 p-6 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-12 -mt-12" />
          <div className="relative z-10 space-y-4">
            <h2 className="text-xl font-bold text-white">Customer Recovery System</h2>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-[200px]">
              Bringing back customers who forgot to return — automatically.
            </p>
            <Link 
              href={`/quick-visit?businessId=${businessId}`}
              className="flex items-center gap-2 bg-primary/20 text-primary border border-primary/20 px-4 py-2.5 rounded-xl text-sm font-bold w-fit hover:bg-primary/30 transition-all"
            >
              <Zap className="w-4 h-4" />
              Mark a Visit
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass p-5 rounded-[2rem] border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Customers</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold font-outfit text-white">124</div>
            <p className="text-[10px] text-muted-foreground">In your database</p>
          </div>
          
          <div className="glass p-5 rounded-[2rem] border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Reminders</span>
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold font-outfit text-white">12</div>
            <p className="text-[10px] text-muted-foreground">Sent today</p>
          </div>

          <div className="glass p-5 rounded-[2rem] border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Recovered</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold font-outfit text-white">8</div>
            <p className="text-[10px] text-emerald-400">↑ 12% vs last month</p>
          </div>

          <div className="glass p-5 rounded-[2rem] border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Revenue</span>
              <span className="text-xs font-bold text-primary">₹</span>
            </div>
            <div className="text-2xl font-bold font-outfit text-white tracking-tighter">₹8,450</div>
            <p className="text-[10px] text-muted-foreground">From recovery</p>
          </div>
        </div>

        {/* Quick Actions List */}
        <div className="glass rounded-[2rem] border-white/10 p-2">
          <Link 
            href="/dashboard"
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                <LayoutDashboard className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
              </div>
              <span className="text-sm font-bold text-muted-foreground group-hover:text-white transition-colors">Advanced Dashboard</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
          
          <Link 
            href="/whatsapp/linking"
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group border-t border-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                <Zap className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-bold text-muted-foreground group-hover:text-white transition-colors">Connect WhatsApp</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Demo info */}
        <div className="pt-4 text-center">
           <button 
              onClick={() => handleSetBusiness(null)}
              className="text-[10px] text-muted-foreground/30 hover:text-rose-500 transition-colors uppercase tracking-widest font-bold"
            >
              Reset Environment
            </button>
        </div>
      </div>

      {/* Floating Plus Button */}
      <Link 
        href={`/quick-visit?businessId=${businessId}`}
        className="fixed bottom-28 right-6 w-14 h-14 primary-gradient rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(16,185,129,0.4)] transition-transform active:scale-90 z-40"
      >
        <UserPlus className="w-6 h-6 text-black" />
      </Link>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md glass rounded-[2.5rem] border-white/10 p-2 z-50 flex items-center justify-around">
        <Link href="/" className="p-4 rounded-full bg-primary/10 text-primary">
          <HomeIcon className="w-6 h-6" />
        </Link>
        <Link href="/dashboard" className="p-4 rounded-full text-muted-foreground hover:text-white transition-all">
          <Users className="w-6 h-6" />
        </Link>
        <Link href="/dashboard" className="p-4 rounded-full text-muted-foreground hover:text-white transition-all">
          <TrendingUp className="w-6 h-6" />
        </Link>
        <Link href="/dashboard" className="p-4 rounded-full text-muted-foreground hover:text-white transition-all">
          <Settings className="w-6 h-6" />
        </Link>
      </nav>
    </main>
  );
}

'use client';

import QuickVisit from "@/components/quick-visit/QuickVisit";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, Zap, ChevronLeft } from 'lucide-react';
import { Suspense } from 'react';

function QuickVisitContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId') || "demo-business-id";

  return (
    <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <Link 
          href="/" 
          className="w-10 h-10 glass rounded-full flex items-center justify-center border-white/10 hover:bg-white/5 transition-all group"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-white" />
        </Link>
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.3em]">Quick Entry</span>
        <Link 
          href="/dashboard" 
          className="w-10 h-10 glass rounded-full flex items-center justify-center border-white/10 hover:bg-white/5 transition-all group"
        >
          <LayoutDashboard className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
        </Link>
      </div>

      <div className="space-y-2 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20 mb-4">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-outfit text-white tracking-tight">Record Visit</h1>
        <p className="text-muted-foreground text-xs font-medium">Instantly trigger recovery logic for this customer.</p>
      </div>

      <QuickVisit businessId={businessId} />

      <div className="text-center pt-8">
        <p className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em]">Ghost Engine v2.4 Active</p>
      </div>
    </div>
  );
}

export default function QuickVisitPage() {
  return (
    <main className="min-h-screen bg-background p-4 pt-8 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Initializing Engine...</p>
        </div>
      }>
        <QuickVisitContent />
      </Suspense>
    </main>
  );
}

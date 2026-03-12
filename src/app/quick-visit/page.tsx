'use client';

import QuickVisit from "@/components/quick-visit/QuickVisit";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Suspense } from 'react';

function QuickVisitContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId') || "demo-business-id";

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
        </Link>
      </div>

      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Quick Visit Entry</h1>
        <p className="text-muted-foreground text-lg">Record a new visit and trigger recovery logic instantly.</p>
      </div>

      <QuickVisit businessId={businessId} />
    </div>
  );
}

export default function QuickVisitPage() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-12 animate-in fade-in duration-500">
      <Suspense fallback={<div className="flex items-center justify-center p-20 font-bold">Loading Engine...</div>}>
        <QuickVisitContent />
      </Suspense>
    </main>
  );
}

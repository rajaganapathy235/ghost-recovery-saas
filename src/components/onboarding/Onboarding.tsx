'use client';

import React, { useState } from 'react';
import { onboardBusiness } from '@/app/actions';
import { Scissors, Bike, Dog, ChevronRight, Store, CheckCircle2, Building2, MapPin } from 'lucide-react';

const NICHES = [
  { id: 'Salon', name: 'Salon & Spa', icon: Scissors, color: 'text-rose-500' },
  { id: 'Bike Service', name: 'Bike/Auto Service', icon: Bike, color: 'text-blue-500' },
  { id: 'Pet Grooming', name: 'Pet Grooming', icon: Dog, color: 'text-emerald-500' },
  { id: 'Other', name: 'General Service', icon: Store, color: 'text-zinc-500' },
];

export default function Onboarding({ onComplete }: { onComplete: (businessId: string) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOnboard = async () => {
    if (!name || !niche) return;
    setLoading(true);
    setError(null);
    try {
      const res = await onboardBusiness(name, niche);
      if (res.success && res.businessId) {
        onComplete(res.businessId);
      } else {
        setError(res.error || 'Failed to setup business. Please try again.');
      }
    } catch (err) {
      setError('A connection error occurred. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-bold font-outfit text-white tracking-tight">Setup Business</h2>
        <p className="text-muted-foreground text-sm">Configure your workspace in seconds</p>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2 px-1">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'flex-1 bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'w-2 bg-white/10'}`} />
        <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 2 ? 'flex-1 bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'w-2 bg-white/10'}`} />
      </div>

      <div className="glass p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Identity</h3>
                <p className="text-muted-foreground text-xs mt-1">What should we call your business?</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Business Name"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-white/20"
                />
              </div>
              <button 
                disabled={!name}
                onClick={() => setStep(2)}
                className="w-full primary-gradient text-black py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-30 disabled:grayscale shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                Next Step <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-bold text-white">Choose Niche</h3>
              <p className="text-muted-foreground text-xs mt-1">Pick a category to auto-seed services</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {NICHES.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setNiche(n.id)}
                  className={`p-5 rounded-[2rem] border text-center space-y-3 transition-all transform active:scale-95 ${
                    niche === n.id 
                      ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center bg-white/5`}>
                    <n.icon className={`w-5 h-5 ${n.color}`} />
                  </div>
                  <span className="block font-bold text-xs tracking-tight text-white">{n.name}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold text-center animate-in fade-in zoom-in duration-300">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-4 glass border border-white/10 rounded-2xl font-bold text-sm hover:bg-white/5 transition-all"
                disabled={loading}
              >
                Back
              </button>
              <button 
                disabled={!niche || loading}
                onClick={handleOnboard}
                className="flex-[2] primary-gradient text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-30 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                {loading ? 'Processing...' : 'Complete'} <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.3em]">Phase 1 Deployment</p>
      </div>
    </div>
  );
}

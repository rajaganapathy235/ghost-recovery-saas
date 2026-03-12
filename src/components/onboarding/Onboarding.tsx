'use client';

import React, { useState } from 'react';
import { onboardBusiness } from '@/app/actions';
import { Scissors, Bike, Dog, ChevronRight, Store, CheckCircle2 } from 'lucide-react';

const NICHES = [
  { id: 'Salon', name: 'Salon & Spa', icon: Scissors, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  { id: 'Bike Service', name: 'Bike/Auto Service', icon: Bike, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'Pet Grooming', name: 'Pet Grooming', icon: Dog, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { id: 'Other', name: 'General Service', icon: Store, color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' },
];

export default function Onboarding({ onComplete }: { onComplete: (businessId: string) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOnboard = async () => {
    if (!name || !niche) return;
    setLoading(true);
    const res = await onboardBusiness(name, niche);
    if (res.success && res.businessId) {
      onComplete(res.businessId);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome to Recovery</h2>
        <p className="text-muted-foreground">Let's set up your business in 30 seconds.</p>
      </div>

      <div className="glass rounded-3xl border border-border p-8 space-y-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">What's your business name?</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Modern Cuts"
                className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-4 text-xl focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/30"
              />
            </div>
            <button 
              disabled={!name}
              onClick={() => setStep(2)}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-4">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select your niche</label>
              <div className="grid grid-cols-2 gap-4">
                {NICHES.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setNiche(n.id)}
                    className={`p-6 rounded-2xl border text-left space-y-4 transition-all ${
                      niche === n.id 
                        ? 'border-primary ring-1 ring-primary bg-primary/5' 
                        : 'border-border bg-secondary/10 hover:bg-secondary/20'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${n.color}`}>
                      <n.icon className="w-5 h-5" />
                    </div>
                    <span className="block font-bold text-sm tracking-tight">{n.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-4 border border-border rounded-xl font-bold hover:bg-secondary/50 transition-colors"
                disabled={loading}
              >
                Back
              </button>
              <button 
                disabled={!niche || loading}
                onClick={handleOnboard}
                className="flex-[2] py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Finalize Setup'} <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2">
        <div className={`w-2 h-2 rounded-full transition-all ${step === 1 ? 'w-8 bg-primary' : 'bg-muted'}`} />
        <div className={`w-2 h-2 rounded-full transition-all ${step === 2 ? 'w-8 bg-primary' : 'bg-muted'}`} />
      </div>
    </div>
  );
}

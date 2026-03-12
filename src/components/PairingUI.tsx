'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function PairingUI() {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'paired' | 'expired'>('pending');

  const fetchCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pair');
      const data = await res.json();
      setCode(data.code);
      setStatus('pending');
    } catch (err) {
      console.error('Failed to fetch pairing code');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCode();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 glass rounded-2xl border border-border max-w-md w-full mx-auto space-y-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-secondary/50 border border-border">
        <Smartphone className="w-8 h-8 text-foreground" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Link with Phone Number</h2>
        <p className="text-muted-foreground text-sm">
          Enter this code on your device to link your WhatsApp account for decentralized sending.
        </p>
      </div>

      <div className="w-full py-6 px-4 bg-secondary/30 rounded-xl border border-border flex items-center justify-center">
        {loading ? (
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        ) : (
          <div className="text-4xl font-mono tracking-widest text-foreground font-bold">
            {code}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        {status === 'pending' && (
          <>
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-muted-foreground">Waiting for connection...</span>
          </>
        )}
        {status === 'paired' && (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500">Device linked successfully</span>
          </>
        )}
      </div>

      <button 
        onClick={fetchCode}
        className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        disabled={loading}
      >
        Refresh Code
      </button>

      <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider font-semibold">
        Ghost Decentralized Protocol v1.0
      </p>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LucideShield, LucideLock, LucideUser, LucideArrowRight, LucideLoader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (username === 'admin' && password === 'admin') {
      // For this demo/SAAS stage, we'll use a local storage flag + a simple redirect
      // In production, we'd use a secure JWT cookie
      localStorage.setItem('gh_admin_auth', 'true');
      router.push('/admin/dashboard');
    } else {
      setError('Invalid admin credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 selection:bg-primary/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" />
      
      <div className="w-full max-w-md space-y-8 relative">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-[2.5rem] mb-4 border border-primary/20 animate-pulse">
            <LucideShield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Ghost Admin
          </h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em]">
            System Control Panel
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 glass p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Username</label>
              <div className="relative group/input">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-white/20"
                  placeholder="admin"
                  required
                />
                <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-primary transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</label>
              <div className="relative group/input">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-white/20"
                  placeholder="••••••••"
                  required
                />
                <LucideLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-primary transition-colors" />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 primary-gradient text-black rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <LucideLoader2 className="w-4 h-4 animate-spin" /> : "Authorize Access"}
            {!loading && <LucideArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground/40 uppercase tracking-widest">
          Hardware ID: {typeof window !== 'undefined' ? btoa(window.navigator.userAgent).slice(0, 12).toUpperCase() : 'RES-000'}
        </p>
      </div>
    </div>
  );
}

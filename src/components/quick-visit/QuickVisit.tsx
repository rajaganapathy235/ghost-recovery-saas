'use client';

import React, { useState, useEffect } from 'react';
import { searchCustomer, markVisit, getServices } from '@/app/actions';
import { CheckCircle2, User, Clock, ChevronRight, X, Smartphone, Zap, Shield } from 'lucide-react';

interface QuickVisitProps {
  businessId: string;
}

export default function QuickVisit({ businessId }: QuickVisitProps) {
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

  useEffect(() => {
    const fetchServices = async () => {
      const res = await getServices(businessId);
      if (res.success) setServices(res.services || []);
    };
    fetchServices();
  }, [businessId]);

  useEffect(() => {
    if (phone.length >= 10) {
      const doSearch = async () => {
        const res = await searchCustomer(phone, businessId);
        if (res.success && res.customer) {
          setCustomer(res.customer);
        } else {
          setCustomer(null);
        }
      };
      doSearch();
    } else {
      setCustomer(null);
    }
  }, [phone, businessId]);

  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      setPhone(prev => prev.slice(0, -1));
    } else if (key === '') {
      setPhone('');
    } else if (phone.length < 15) {
      setPhone(prev => prev + key);
    }
  };

  const handleSave = async () => {
    if (!phone || !selectedService) return;
    setLoading(true);
    const res = await markVisit(phone, selectedService);
    if (res.success) {
      setSuccess(res);
      setTimeout(() => {
        setPhone('');
        setSelectedService(null);
        setSuccess(null);
        setCustomer(null);
      }, 4000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass rounded-[3rem] border border-primary/20 bg-primary/5 text-center space-y-6 animate-in zoom-in duration-500 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="w-24 h-24 rounded-full primary-gradient flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
          <CheckCircle2 className="w-12 h-12 text-black" />
        </div>
        <div className="space-y-3 relative z-10">
          <h2 className="text-3xl font-bold text-white font-outfit">Visit Recorded!</h2>
          <div className="flex flex-col items-center gap-2">
            <p className="text-muted-foreground text-sm font-medium">{success.customerName}</p>
            {success.recovered && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary font-bold text-xs border border-primary/20">
                <Zap className="w-3 h-3" />
                Recovered: ₹{success.revenue}
              </div>
            )}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.3em] pt-4">Returning to entry mode...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* WhatsApp Status Header - High Visibility */}
      <div className="glass p-5 rounded-[2.5rem] border-primary/20 bg-primary/5 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.1)]">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none">WhatsApp Engine</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-primary">CONNECTED (GHOST MODE)</span>
          </div>
        </div>
        <Shield className="w-5 h-5 text-primary opacity-50" />
      </div>

      <h1 className="text-3xl font-bold font-outfit text-white">Quick Visit Entry</h1>

      {/* Phone Entry Section */}
      <div className="space-y-6">
        <div className="p-8 glass rounded-[2.5rem] border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -ml-16 -mt-16" />
          
          <div className="space-y-6 text-center relative z-10">
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <Smartphone className="w-3 h-3" /> Mobile Number
            </div>
            <div className="text-4xl font-mono font-bold tracking-tighter text-white min-h-[50px] flex items-center justify-center">
              {phone || <span className="opacity-10">0000000000</span>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8">
            {KEYS.map((key, i) => (
              <button
                key={i}
                onClick={() => handleKeyPress(key)}
                className={`py-5 rounded-2xl font-bold transition-all transform active:scale-95 flex items-center justify-center group ${
                  key === 'delete' 
                    ? 'bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10'
                    : key === ''
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20'
                    : 'bg-white/5 border border-white/10 text-xl text-white hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {key === 'delete' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-delete"><path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><path d="m12 9 6 6"/><path d="m18 9-6 6"/></svg>
                ) : key === '' ? (
                  <X className="w-6 h-6" />
                ) : (
                  key
                )}
              </button>
            ))}
          </div>
        </div>

        {customer && (
          <div className="p-5 glass rounded-3xl border border-primary/20 bg-primary/5 flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">{customer.name || 'Returning Client'}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-primary/40" /> Last seen {new Date(customer.lastVisit).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="px-3 py-1 bg-primary/20 text-primary text-[8px] rounded-full font-bold uppercase tracking-widest border border-primary/20">
              verified
            </div>
          </div>
        )}
      </div>

      {/* Service Grid Section */}
      <div className="space-y-6">
        <div className="p-8 glass rounded-[2.5rem] border border-white/10 space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10 px-1">
            <h3 className="text-xl font-bold tracking-tight text-white font-outfit">Select Service</h3>
            <div className="px-3 py-1 glass rounded-full text-[10px] font-bold text-muted-foreground border-white/5 uppercase tracking-widest">
              {services.length} items
            </div>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
            {services.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedService(s.id)}
                className={`w-full flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-300 text-left group min-h-[100px] ${
                  selectedService === s.id
                    ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="space-y-1">
                  <span className={`font-bold text-lg block leading-tight transition-colors ${selectedService === s.id ? 'text-primary' : 'text-white'}`}>{s.name}</span>
                  <span className="text-[10px] text-muted-foreground font-medium block opacity-70">{s.recoveryDays} Day Cycle</span>
                </div>
                <div className="text-xl font-bold font-outfit text-white">₹{s.price}</div>
              </button>
            ))}
            
            {services.length === 0 && (
              <div className="text-center py-12 text-muted-foreground/40 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest">No Services Found</p>
              </div>
            )}
          </div>

          <button
            disabled={!phone || !selectedService || loading}
            onClick={handleSave}
            className="w-full py-5 primary-gradient text-black rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale shadow-[0_10px_30px_rgba(16,185,129,0.3)] mt-4"
          >
            {loading ? (
               <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>Record Visit <ChevronRight className="w-6 h-6" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

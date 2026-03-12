'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { searchCustomer, markVisit, getServices } from '@/app/actions';
import { Delete, CheckCircle2, User, Clock, ChevronRight, X } from 'lucide-react';

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

  // Keyboard layout
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  useEffect(() => {
    const fetchServices = async () => {
      const res = await getServices(businessId);
      if (res.success) setServices(res.services || []);
    };
    fetchServices();
  }, [businessId]);

  // Search-as-you-type with debounce simulation
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
    if (phone.length < 15) setPhone(prev => prev + key);
  };

  const handleDelete = () => {
    setPhone(prev => prev.slice(0, -1));
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
      }, 3000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass rounded-3xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-4 animate-in zoom-in duration-300">
        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Visit Recorded!</h2>
          {success.recovered && (
            <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-sm">
              ROI Recovered: ${success.revenue}
            </div>
          )}
          <p className="text-muted-foreground">{success.customerName} marked successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl mx-auto items-start">
      {/* Phone Entry Section */}
      <div className="flex flex-col space-y-6">
        <div className="p-8 glass rounded-3xl border border-border bg-secondary/10 space-y-8">
          <div className="space-y-4 text-center">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Enter Phone Number</label>
            <div className="text-5xl font-mono font-bold tracking-tight text-foreground min-h-[60px] flex items-center justify-center">
              {phone || <span className="text-muted-foreground/20">0000000000</span>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {KEYS.map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="py-6 rounded-2xl bg-secondary/30 border border-border text-2xl font-bold hover:bg-secondary/50 active:scale-95 transition-all"
              >
                {key}
              </button>
            ))}
            <button
              onClick={() => setPhone('')}
              className="py-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold hover:bg-rose-500/20 active:scale-95 transition-all flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={handleDelete}
              className="py-6 rounded-2xl bg-secondary/30 border border-border font-bold hover:bg-secondary/50 active:scale-95 transition-all flex items-center justify-center col-span-1"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>
        </div>

        {customer && (
          <div className="p-6 rounded-2xl border border-border bg-primary/5 flex items-center justify-between animate-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="font-bold text-foreground">{customer.name || 'Existing Customer'}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Last visit: {new Date(customer.lastVisit).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="px-3 py-1 bg-primary text-primary-foreground text-[10px] rounded-full font-bold uppercase tracking-wider">
              Profile Matched
            </div>
          </div>
        )}
      </div>

      {/* Service Grid Section */}
      <div className="flex flex-col space-y-6">
        <div className="p-8 glass rounded-3xl border border-border bg-secondary/10 space-y-6 min-h-[500px]">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight">Select Service</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {services.length} items
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {services.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedService(s.id)}
                className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${
                  selectedService === s.id
                    ? 'border-primary ring-1 ring-primary bg-primary/5'
                    : 'border-border bg-secondary/30 hover:bg-secondary/50'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold">{s.name}</span>
                  <span className="text-xs text-muted-foreground">Next reminder in {s.recoveryDays} days</span>
                </div>
                <div className="text-xl font-mono font-bold">${s.price}</div>
              </button>
            ))}
            {services.length === 0 && (
              <div className="text-center py-20 text-muted-foreground space-y-2">
                <p>No services found.</p>
                <p className="text-xs">Configure services in the Admin panel.</p>
              </div>
            )}
          </div>

          <button
            disabled={!phone || !selectedService || loading}
            onClick={handleSave}
            className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 mt-auto"
          >
            {loading ? 'Recording...' : 'Record Visit'} <ChevronRight className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/10 border border-border text-[10px] text-muted-foreground uppercase tracking-widest font-bold text-center">
          Secure ROI Attribution Engine v2.4
        </div>
      </div>
    </div>
  );
}

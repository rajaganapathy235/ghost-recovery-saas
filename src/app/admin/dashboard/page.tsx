'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LucideLayoutDashboard, LucideUsers, LucideMessageSquare, LucideSettings, 
  LucideLogOut, LucideExternalLink, LucideCheckCircle2, LucideXCircle,
  LucideActivity, LucideTrendingUp, LucidePlus, LucideLoader2, LucideSearch
} from 'lucide-react';
import { getAdminData, createAdminMessage, sendPushWakeUp } from '@/app/actions';

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBiz, setSelectedBiz] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Auth Check
    if (localStorage.getItem('gh_admin_auth') !== 'true') {
      router.push('/admin/login');
      return;
    }

    const fetchData = async () => {
      const res = await getAdminData();
      if (res.success) {
        setData(res);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const handleTestTrigger = async () => {
    if (!selectedBiz || !testPhone) return alert("Select business and enter phone");
    setSending(true);
    const res = await createAdminMessage(selectedBiz, testPhone, "Admin forced test via Control Panel");
    if (res.success) {
      // 2. Trigger instant wakeup via push
      await sendPushWakeUp(selectedBiz).catch(e => console.error("Optional wakeup push failed:", e));
      
      alert("Test command sent! Command DISPATCHED + Push WAKEUP signal sent.");
      setShowModal(false);
    } else {
      alert(res.error);
    }
    setSending(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <LucideLoader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 flex flex-col">
      {/* Sidebar / Top Nav */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <LucideActivity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Ghost Control</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Master Administration</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => {
                localStorage.removeItem('gh_admin_auth');
                router.push('/admin/login');
              }}
              className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-bold"
            >
              <LucideLogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full p-6 md:p-10 space-y-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Network Revenue</p>
            <h2 className="text-3xl font-black text-primary">${data?.totalRevenue?.toFixed(2)}</h2>
          </div>
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Clients</p>
            <h2 className="text-3xl font-black text-white">{data?.businesses?.length}</h2>
          </div>
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Nodes</p>
            <h2 className="text-3xl font-black text-white">
              {data?.businesses?.filter((b: any) => b.whatsappStatus === 'CONNECTED').length}
            </h2>
          </div>
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Uptime Index</p>
            <h2 className="text-3xl font-black text-white">99.8%</h2>
          </div>
        </div>

        {/* Business List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight">Linked Nodes (Clients)</h3>
            <button 
              onClick={() => setShowModal(true)}
              className="primary-gradient text-black text-xs font-bold py-3 px-6 rounded-2xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <LucidePlus className="w-4 h-4" />
              Force Test Command
            </button>
          </div>

          <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Business Name</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="p-6 text-[10px) font-bold uppercase tracking-widest text-muted-foreground">WhasApp No</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customers</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.businesses?.map((biz: any) => (
                  <tr key={biz.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white/90">{biz.name}</span>
                        <span className="text-[10px] text-muted-foreground">{biz.niche || 'General'}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        biz.whatsappStatus === 'CONNECTED' 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${biz.whatsappStatus === 'CONNECTED' ? 'bg-primary animate-pulse' : 'bg-red-400'}`} />
                        {biz.whatsappStatus || 'UNKNOWN'}
                      </div>
                    </td>
                    <td className="p-6 text-sm text-white/60 font-mono italic">{biz.whatsappNumber || '—'}</td>
                    <td className="p-6 text-sm font-bold">{biz._count.customers}</td>
                    <td className="p-6 text-sm text-primary font-black">$0.00</td>
                    <td className="p-6">
                      <button className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all">
                        <LucideSettings className="w-4 h-4 text-white/40" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Global Activity Feed */}
        <section className="space-y-6 pb-20">
          <h3 className="text-xl font-bold tracking-tight">Recent Dispatch Activity</h3>
          <div className="glass rounded-[2.5rem] border border-white/5 p-4">
             <div className="space-y-2">
                {data?.recentLogs?.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-5 hover:bg-white/5 rounded-3xl transition-all border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center border-2 ${
                        log.status === 'RECOVERED' ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/5'
                      }`}>
                        <LucideMessageSquare className={`w-5 h-5 ${log.status === 'RECOVERED' ? 'text-primary' : 'text-white/40'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white/90">{log.business.name} ➔ {log.customer.phone}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Status: {log.status} • {new Date(log.sentAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    {log.status === 'RECOVERED' && (
                       <span className="text-primary font-black text-sm">+${log.revenueAmount}</span>
                    )}
                  </div>
                ))}
             </div>
          </div>
        </section>
      </main>

      {/* Trigger Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="w-full max-w-lg glass border border-white/10 rounded-[3rem] p-8 space-y-8 animate-in zoom-in-95 fade-in duration-300 relative">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Network Override</h2>
              <p className="text-sm text-muted-foreground">Create a scheduled task for a client's PWA worker.</p>
            </div>

            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Target Business</label>
                  <select 
                    value={selectedBiz}
                    onChange={(e) => setSelectedBiz(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="" className="bg-black text-white">Select a business...</option>
                    {data?.businesses?.map((b: any) => (
                      <option key={b.id} value={b.id} className="bg-black text-white">{b.name}</option>
                    ))}
                  </select>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Recipient Phone</label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="919597992677"
                  />
               </div>
            </div>

            <button
              onClick={handleTestTrigger}
              disabled={sending}
              className="w-full py-5 primary-gradient text-black rounded-3xl text-sm font-black transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:scale-[1.02]"
            >
              {sending ? <LucideLoader2 className="w-5 h-5 animate-spin mx-auto text-black" /> : "DISPATCH COMMAND"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Bell, 
  ArrowRight, 
  Calendar,
  LayoutDashboard,
  MessageSquare,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import MetricCard from './MetricCard';
import RecoveryChart from './RecoveryChart';
import { getDashboardStats } from '@/app/actions';

interface DashboardProps {
  businessId: string;
}

export default async function Dashboard({ businessId }: DashboardProps) {
  const stats = await getDashboardStats(businessId);

  return (
    <div className="flex flex-col space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary font-bold">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="text-xs uppercase tracking-[0.3em]">Analytics Hub</span>
          </div>
          <h1 className="text-4xl font-bold font-outfit text-white tracking-tight">System Performance</h1>
          <p className="text-muted-foreground text-sm max-w-lg">Track your recovery ROI and customer engagement in real-time.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="glass px-4 py-2.5 rounded-2xl border-white/5 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold text-white">Last 30 Days</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Recovered Revenue" 
          value={`₹${stats.totalRevenue.toLocaleString()}`} 
          icon={DollarSign}
          description="Direct ROI from WhatsApp bots"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard 
          title="Recovered Customers" 
          value={stats.customersWonBack} 
          icon={Users}
          description="Customers who came back"
        />
        <MetricCard 
          title="Recovery Efficiency" 
          value={`${stats.recoveryRate}%`} 
          icon={TrendingUp}
          description="Reminders vs Success rate"
          trend={{ value: 5, isPositive: true }}
        />
        <MetricCard 
          title="Pending Reminders" 
          value={stats.activeReminders} 
          icon={MessageSquare}
          description="Reminders awaiting trigger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-white font-outfit">Recovery Trends</h3>
            <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
              Download Report <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <RecoveryChart data={stats.chartData} />
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-white font-outfit">Recent Activity</h3>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-md">Live</span>
          </div>
          
          <div className="glass p-2 rounded-[2.5rem] border-white/10 space-y-2">
            <ActivityItem 
              title="Recovery Success" 
              time="2m ago" 
              description="John D. returned via 'Haircut' message"
              amount="+₹450"
              isSuccess
            />
            <ActivityItem 
              title="WhatsApp Sent" 
              time="1h ago" 
              description="Recovery message sent to +91 98...21"
            />
            <ActivityItem 
              title="New Entry" 
              time="3h ago" 
              description="Sarah L. added to recovery queue"
            />
            
            <button className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-all py-4">
              View All Logs <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Tip */}
          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-3">
             <div className="flex items-center gap-2 text-primary">
               <TrendingUp className="w-4 h-4" />
               <span className="text-xs font-bold uppercase tracking-wider">Optimization Tip</span>
             </div>
             <p className="text-xs text-muted-foreground leading-relaxed">
               Reminders sent at <span className="text-white font-bold">10:30 AM</span> have a 25% higher recovery rate in your niche.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ title, time, description, amount, isSuccess }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
          isSuccess ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/5 text-muted-foreground'
        }`}>
          {isSuccess ? <ArrowUpRight className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">{title}</span>
            <span className="text-[10px] text-muted-foreground font-medium">{time}</span>
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-1">{description}</p>
        </div>
      </div>
      {amount && (
        <span className="text-xs font-bold text-emerald-500">{amount}</span>
      )}
    </div>
  );
}

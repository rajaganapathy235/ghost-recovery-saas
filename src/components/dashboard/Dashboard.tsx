import React from 'react';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Bell, 
  ArrowRight, 
  Calendar,
  LayoutDashboard
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
    <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <LayoutDashboard className="w-5 h-5" />
          <h1 className="text-3xl tracking-tight">Main Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Overview of your recovery performance and revenue growth.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Recovered Revenue" 
          value={`$${stats.totalRevenue.toLocaleString()}`} 
          icon={DollarSign}
          description="Direct ROI from automated reminders"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard 
          title="Customers Won Back" 
          value={stats.customersWonBack} 
          icon={Users}
          description="Total visits marked within 7 days of reminder"
        />
        <MetricCard 
          title="Recovery Rate %" 
          value={`${stats.recoveryRate}%`} 
          icon={TrendingUp}
          description="Reminders vs Actual Comebacks"
          trend={{ value: 5, isPositive: true }}
        />
        <MetricCard 
          title="Active Reminders" 
          value={stats.activeReminders} 
          icon={Bell}
          description="Pending recovery opportunities"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecoveryChart data={stats.chartData} />
        </div>
        
        <div className="p-6 rounded-2xl border border-border bg-secondary/10 flex flex-col space-y-6">
          <h3 className="font-semibold tracking-tight">Recent Activity</h3>
          <div className="space-y-4">
            {/* Placeholder for real activity stream */}
            <ActivityItem 
              title="Recovery Success" 
              time="2 minutes ago" 
              description="John D. returned via 'Haircut' reminder"
              amount="+$45.00"
              isSuccess
            />
            <ActivityItem 
              title="Reminder Sent" 
              time="1 hour ago" 
              description="Sent recovery message to +1 555-0123"
            />
            <ActivityItem 
              title="New Customer" 
              time="3 hours ago" 
              description="Sarah L. added to recovery queue"
            />
          </div>
          <button className="flex items-center justify-center gap-2 text-sm font-medium hover:text-primary transition-colors mt-auto pt-4 border-t border-border/50">
            View All Activity <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ title, time, description, amount, isSuccess }: any) {
  return (
    <div className="flex justify-between items-start gap-3">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="text-[10px] text-muted-foreground">{time}</span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {amount && (
        <span className={`text-sm font-bold ${isSuccess ? 'text-emerald-500' : 'text-foreground'}`}>
          {amount}
        </span>
      )}
    </div>
  );
}

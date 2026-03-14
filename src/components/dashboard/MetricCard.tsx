import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function MetricCard({ title, value, icon: Icon, description, trend }: MetricCardProps) {
  return (
    <div className="p-6 rounded-[2rem] border border-white/5 glass flex flex-col space-y-3 hover:bg-white/5 transition-all group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors">
          <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-bold tracking-tighter text-white font-outfit">{value}</span>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend.isPositive ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-500'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      {description && <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{description}</p>}
    </div>
  );
}

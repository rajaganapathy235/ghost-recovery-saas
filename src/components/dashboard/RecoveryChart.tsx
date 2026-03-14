'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RecoveryChartProps {
  data: Array<{
    date: string;
    sent: number;
    recovered: number;
  }>;
}

export default function RecoveryChart({ data }: RecoveryChartProps) {
  return (
    <div className="w-full h-[400px] p-8 rounded-[2.5rem] border border-white/10 glass">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-white font-outfit tracking-tight">Recovery Performance</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reminders</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Comebacks</span>
          </div>
        </div>
      </div>
      
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}
              tickFormatter={(str) => {
                const date = new Date(str);
                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
              }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{ 
                backgroundColor: 'rgba(5, 5, 5, 0.9)', 
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                fontSize: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar 
              name="Reminders" 
              dataKey="sent" 
              fill="rgba(255,255,255,0.08)" 
              radius={[6, 6, 0, 0]} 
              barSize={12}
            />
            <Bar 
              name="Comebacks" 
              dataKey="recovered" 
              fill="#10b981" 
              radius={[6, 6, 0, 0]} 
              barSize={12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

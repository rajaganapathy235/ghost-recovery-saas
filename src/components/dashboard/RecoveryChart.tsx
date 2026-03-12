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
  Legend,
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
    <div className="w-full h-[400px] p-6 rounded-2xl border border-border bg-secondary/10">
      <h3 className="text-lg font-semibold mb-6 tracking-tight">Recovery Performance (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12 }}
            tickFormatter={(str) => {
              const date = new Date(str);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#18181b', 
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: '#fafafa'
            }}
            itemStyle={{ color: '#fafafa' }}
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px' }}
          />
          <Bar 
            name="Reminders Sent" 
            dataKey="sent" 
            fill="#71717a" 
            radius={[4, 4, 0, 0]} 
            barSize={20}
          />
          <Bar 
            name="Actual Comebacks" 
            dataKey="recovered" 
            fill="#fafafa" 
            radius={[4, 4, 0, 0]} 
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

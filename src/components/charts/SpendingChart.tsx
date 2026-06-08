'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SpendingChartProps {
  data: { month: string; amount: number }[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <Card className="rounded-[3rem] border border-glass-border bg-surface/50 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-text-primary">Financial Velocity</CardTitle>
            <p className="text-xs text-text-muted">Monthly spend and tax trajectory</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[2rem] bg-champagne/10 text-champagne shadow-inner group-hover:scale-110 transition-transform duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px] w-full pt-4" role="img" aria-label="Monthly spending trend">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--champagne)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--champagne)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: 'var(--glass-border)', 
                borderRadius: '1rem',
                fontSize: '12px',
                fontWeight: 'bold',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }} 
              itemStyle={{ color: 'var(--champagne)' }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--champagne)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAmount)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

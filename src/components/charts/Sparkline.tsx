'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: { date: string; amount: number }[];
  color?: string;
}

export function Sparkline({ data, color = 'var(--champagne)' }: SparklineProps) {
  if (data.length < 2) return null;

  return (
    <div className="h-8 w-full max-w-[120px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="amount"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  /** Array of data points sorted by date */
  data: { date: string; amount: number }[];
  /** Stroke color (CSS variable or value); defaults to champagne */
  color?: string;
}

export function Sparkline({ data, color = 'var(--champagne)' }: SparklineProps) {
  if (data.length < 2) return null;

  return (
    <div className="h-8 w-full max-w-[120px]" role="img" aria-label={`Sparkline chart: ${data.length} data points over time`}>
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

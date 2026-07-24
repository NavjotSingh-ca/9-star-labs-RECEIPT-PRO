'use client';

import { LineChart, Line, Area, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  /** Array of data points sorted by date */
  data: { date: string; amount: number }[];
  /** Stroke color (CSS variable or value); defaults to champagne */
  color?: string;
  /** The CSS variable or hex for the chart id; used for gradient uniqueness */
  id?: string;
}

export function Sparkline({ data, color = 'var(--champagne)', id }: SparklineProps) {
  if (data.length < 2) return null;

  const gradientId = id ?? `spark-gradient-${data.length}-${data[0]?.date ?? 'default'}`;
  const fillColor = color.replace(')', '/0.2)').replace(')', '');

  return (
    <div className="h-8 w-full max-w-[120px]" role="img" aria-label={`Sparkline: ${data.length} points over time`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="amount"
            stroke="none"
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
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

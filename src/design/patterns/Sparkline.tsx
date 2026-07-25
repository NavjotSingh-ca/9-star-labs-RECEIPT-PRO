/**
 * Sparkline — Tiny inline chart for trends.
 */

import { type SVGAttributes } from 'react';
import { cn } from '@design/utils/helpers';

export interface SparklineProps extends SVGAttributes<SVGSVGElement> {
  data: number[];
  height?: number;
  width?: string | number;
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  showPoints?: boolean;
}

export function Sparkline({
  data,
  height = 40,
  width = '100%',
  color = 'currentColor',
  fillColor,
  strokeWidth = 2,
  showPoints = false,
  className,
  ...props
}: SparklineProps) {
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x}% ${y}%`;
  }).join(' ');

  const fillPoints = [
    `${points.split(' ')[0].split('%')[0]}% 100%`,
    points,
    `${points.split(' ').pop()?.split('%')[0] || '100'}% 100%`,
  ].join(' ');

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
      {...props}
    >
      {fillColor && (
        <polygon
          points={fillPoints}
          fill={fillColor}
          opacity={0.15}
        />
      )}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="animate-draw"
        style={{
          strokeDasharray: data.length * 5,
          strokeDashoffset: data.length * 5,
        }}
      />
      {showPoints && data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return (
          <circle
            key={index}
            cx={`${x}%`}
            cy={`${y}%`}
            r="2"
            fill={color}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        );
      })}
    </svg>
  );
}

export default Sparkline;
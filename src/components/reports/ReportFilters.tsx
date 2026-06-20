'use client';

import { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DatePreset, ReportConfig } from '@/lib/services/reports';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

interface Props {
  onChange: (filters: Partial<ReportConfig>) => void;
}

export function ReportFilters({ onChange }: Props) {
  const [preset, setPreset] = useState<DatePreset>('this_year');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePresetChange = (value: DatePreset) => {
    setPreset(value);
    onChange({
      datePreset: value,
      customDateRange: value === 'custom' && startDate && endDate ? { start: startDate, end: endDate } : undefined,
    });
  };

  const handleCustomRange = () => {
    if (startDate && endDate) {
      onChange({ datePreset: 'custom', customDateRange: { start: startDate, end: endDate } });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-glass-border bg-card">
      <Filter className="h-4 w-4 text-text-muted flex-shrink-0" />
      <div className="flex flex-wrap gap-1.5">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePresetChange(p.value)}
            className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
              preset === p.value
                ? 'bg-champagne text-obsidian font-medium'
                : 'bg-surface text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="flex items-center gap-2 ml-2">
          <Calendar className="h-3.5 w-3.5 text-text-muted" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 w-36 text-xs"
            aria-label="Start date"
          />
          <span className="text-xs text-text-muted">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8 w-36 text-xs"
            aria-label="End date"
          />
          <Button size="sm" variant="outline" onClick={handleCustomRange} className="text-xs h-8">
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}

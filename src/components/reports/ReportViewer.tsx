'use client';

import { motion } from 'framer-motion';
import { Download, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { METRIC_LABELS, formatMetricValue } from '@/lib/services/reports';
import type { ReportResult } from '@/lib/services/reports';

interface Props {
  /** Result data from a report generation call */
  result: ReportResult;
  /** Display name for the report heading and export filename */
  templateName: string;
}

export function ReportViewer({ result, templateName }: Props) {
  const groupBy = result.config.groupBy;

  const handleExport = async (format: 'csv' | 'json') => {
    const res = await fetch('/api/reports/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: result.config, format }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-glass-border bg-card overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border bg-surface/50">
        <div>
          <h3 className="font-semibold text-sm">{templateName}</h3>
          <p className="text-[10px] text-text-muted">
            Generated {new Date(result.generatedAt).toLocaleString('en-CA')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleExport('csv')} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExport('json')} className="gap-1.5 text-xs">
            <FileDown className="h-3.5 w-3.5" /> JSON
          </Button>
        </div>
      </div>

      {/* Totals row for ungrouped reports */}
      {!groupBy && result.rows.length <= 1 && (
        <div className="px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {result.config.metrics.map((m) => (
              <div key={m} className="text-center p-3 rounded-lg bg-surface/50">
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">{METRIC_LABELS[m] || m}</p>
                <p className="text-lg font-semibold tabular-nums text-champagne">
                  {formatMetricValue(m, Number(result.rows[0]?.[m] ?? result.totals[m] ?? 0))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table for grouped reports */}
      {result.rows.length > 0 && groupBy && (
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-sm" role="table" aria-label="Report data">
            <caption className="sr-only">{templateName} report data</caption>
            <thead>
              <tr className="border-b border-glass-border">
                {groupBy && <th className="text-left py-2 px-2 font-medium text-xs uppercase tracking-wider text-text-muted">{METRIC_LABELS[groupBy] || groupBy}</th>}
                {result.config.metrics.map((m) => (
                  <th key={m} className="text-right py-2 px-2 font-medium text-xs uppercase tracking-wider text-text-muted">{METRIC_LABELS[m] || m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i} className="border-b border-glass-border/50 hover:bg-champagne/5 transition-colors">
                  {groupBy && <td className="py-2 px-2 font-medium">{String(row[groupBy] ?? '')}</td>}
                  {result.config.metrics.map((m) => (
                    <td key={m} className="py-2 px-2 text-right tabular-nums">{formatMetricValue(m, Number(row[m] ?? 0))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t-2 border-champagne/30">
                {groupBy && <td className="py-2 px-2 text-xs uppercase text-text-muted">Total</td>}
                {result.config.metrics.map((m) => (
                  <td key={m} className="py-2 px-2 text-right tabular-nums">{formatMetricValue(m, result.totals[m] ?? 0)}</td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {result.rows.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-text-muted">
          No data matches the current filters and date range.
        </div>
      )}
    </motion.div>
  );
}

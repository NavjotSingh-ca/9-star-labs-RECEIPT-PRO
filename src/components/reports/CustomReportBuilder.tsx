'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useReportGenerate, useSaveTemplate } from '@/hooks/useReports';
import { ReportViewer } from './ReportViewer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase';
import type { DatePreset, ReportConfig, ReportResult, Metric, Dimension } from '@/lib/services/reports';

const GROUP_BY_OPTIONS: { value: Dimension | undefined; label: string }[] = [
  { value: undefined, label: 'None (single total)' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'category', label: 'Category' },
  { value: 'month', label: 'Month' },
];

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: 'total_spend', label: 'Total Spend' },
  { value: 'receipt_count', label: 'Receipt Count' },
  { value: 'avg_receipt', label: 'Average Receipt' },
  { value: 'max_receipt', label: 'Largest Receipt' },
  { value: 'tax_total', label: 'Total Tax' },
];

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

interface Props {
  onClose?: () => void;
  orgId: string;
}

export function CustomReportBuilder({ onClose, orgId }: Props) {
  const [name, setName] = useState('');
  const [groupBy, setGroupBy] = useState<Dimension | undefined>(undefined);
  const [selectedMetrics, setSelectedMetrics] = useState<Metric[]>(['total_spend', 'receipt_count']);
  const [datePreset, setDatePreset] = useState<DatePreset>('this_year');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);

  const generateMutation = useReportGenerate();
  const saveMutation = useSaveTemplate(orgId);

  const handleGenerate = () => {
    if (selectedMetrics.length === 0) return;

    const config: ReportConfig = {
      datePreset,
      metrics: selectedMetrics,
      groupBy: groupBy ?? null,
    };
    if (datePreset === 'custom' && startDate && endDate) {
      config.customDateRange = { start: startDate, end: endDate };
    }

    generateMutation.mutate(config, {
      onSuccess: (result) => setReportResult(result),
    });
  };

  const handleSave = async () => {
    if (!reportResult || !templateName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await saveMutation.mutateAsync({
      name: templateName.trim(),
      config: reportResult.config,
      userId: user.id,
    });
  };

  const toggleMetric = (metric: Metric) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    );
  };

  useEffect(() => {
    if (!templateName && groupBy) {
      setTemplateName(`Custom: ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} Report`);
    }
  }, [groupBy, templateName]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custom Report Builder</CardTitle>
          <CardDescription>Configure a one-off report from scratch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Report Name */}
          <div>
            <label htmlFor="report-name" className="block text-sm font-medium mb-1.5">Report Name (optional)</label>
            <Input
              id="report-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q1 Vendor Spend Analysis"
              className="max-w-md"
            />
          </div>

          {/* Group By */}
          <fieldset>
            <legend className="block text-sm font-medium mb-2">Group By</legend>
            <div className="flex flex-wrap gap-2">
              {GROUP_BY_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setGroupBy(opt.value)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    groupBy === opt.value
                      ? 'bg-champagne text-obsidian font-medium'
                      : 'bg-surface text-text-secondary hover:bg-surface-hover border border-glass-border'
                  }`}
                  aria-pressed={groupBy === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Metrics */}
          <fieldset>
            <legend className="block text-sm font-medium mb-2">Metrics (select at least 1)</legend>
            <div className="flex flex-wrap gap-3">
              {METRIC_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(opt.value)}
                    onChange={() => toggleMetric(opt.value)}
                    className="accent-champagne h-4 w-4"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
            {selectedMetrics.length === 0 && (
              <p className="text-xs text-danger mt-1">Select at least one metric</p>
            )}
          </fieldset>

          {/* Date Preset */}
          <fieldset>
            <legend className="block text-sm font-medium mb-2">Date Range</legend>
            <div className="flex flex-wrap gap-2 mb-3">
              {DATE_PRESETS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDatePreset(opt.value)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    datePreset === opt.value
                      ? 'bg-champagne text-obsidian font-medium'
                      : 'bg-surface text-text-secondary hover:bg-surface-hover border border-glass-border'
                  }`}
                  aria-pressed={datePreset === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {datePreset === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2"
                >
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 w-40 text-xs" aria-label="Start date" />
                  <span className="text-xs text-text-muted">to</span>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 w-40 text-xs" aria-label="End date" />
                </motion.div>
              )}
            </AnimatePresence>
          </fieldset>

          {/* Generate */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleGenerate}
              disabled={selectedMetrics.length === 0 || generateMutation.isPending}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              {generateMutation.isPending ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save as template */}
      <AnimatePresence>
        {reportResult && !generateMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-lg border border-glass-border bg-card"
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="accent-champagne h-4 w-4"
              />
              <span className="text-sm font-medium">Save as template</span>
            </label>
            {saveAsTemplate && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                className="flex items-center gap-2"
              >
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name"
                  className="h-8 w-56 text-xs"
                />
                <Button size="sm" onClick={handleSave} disabled={!templateName.trim() || saveMutation.isPending} className="gap-1.5 text-xs">
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report result */}
      {generateMutation.isError && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          Failed to generate report. Please try again.
        </div>
      )}

      {reportResult && !generateMutation.isPending && (
        <ErrorBoundary componentName="ReportViewer">
          <ReportViewer
            result={reportResult}
            templateName={name || 'Custom Report'}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

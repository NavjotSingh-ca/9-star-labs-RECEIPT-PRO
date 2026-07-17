'use client';

import { motion } from 'framer-motion';
import { FileText, Building2, PieChart, TrendingUp, Calendar, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ReportTemplate } from '@/lib/services/reports';
import { fadeUp, cardHoverSubtle } from '@/lib/animations';

const ICON_MAP: Record<string, typeof FileText> = {
  FileText, Building2, PieChart, TrendingUp, Calendar, FileSpreadsheet,
};

interface Props {
  /** Report template definition */
  template: ReportTemplate;
  /** Called when the card is clicked to generate the report */
  onGenerate: () => void;
  /** Whether this specific template is currently generating */
  isGenerating?: boolean;
}

export function ReportTemplateCard({ template, onGenerate, isGenerating }: Props) {
  const Icon = ICON_MAP[template.icon] ?? FileSpreadsheet;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      {...cardHoverSubtle}
      className="group relative rounded-lg border border-glass-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-glass-border-hover cursor-pointer"
      onClick={onGenerate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onGenerate(); }}
      aria-label={`Generate ${template.name} report`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-champagne/10 text-champagne">
          <Icon className="h-5 w-5" />
        </div>
        <Badge variant={template.type === 'builtin' ? 'secondary' : 'outline'} className="text-[10px]">
          {template.type === 'builtin' ? 'Pre-built' : 'Custom'}
        </Badge>
      </div>
      <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
      <p className="text-xs text-text-muted line-clamp-2">{template.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-text-muted">
          {template.defaultExport.toUpperCase()}
        </span>
        {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-champagne" />}
      </div>
    </motion.div>
  );
}

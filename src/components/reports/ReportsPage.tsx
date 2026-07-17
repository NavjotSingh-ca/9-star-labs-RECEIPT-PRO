'use client';

import { useState, useCallback } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { useReportTemplates, useReportGenerate } from '@/hooks/useReports';
import { generateMileageByVehicleReport } from '@/lib/services/reports';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CardSkeleton, ReceiptTableSkeleton } from '@/components/ui/PremiumSkeletons';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { ReportTemplateCard } from './ReportTemplateCard';
import { ReportViewer } from './ReportViewer';
import { ReportFilters } from './ReportFilters';
import { CustomReportBuilder } from './CustomReportBuilder';
import { ScheduleManager } from './ScheduleManager';
import type { ReportConfig, ReportResult, ReportTemplate } from '@/lib/services/reports';

interface Props {
  /** Organization ID for scoping report data and schedules */
  orgId: string;
}

export function ReportsPage({ orgId }: Props) {
  const { data: templates, isLoading } = useReportTemplates(orgId);
  const generateMutation = useReportGenerate();
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [activeFilters, setActiveFilters] = useState<Partial<ReportConfig>>({});
  const [showBuilder, setShowBuilder] = useState(false);

  const handleGenerate = useCallback(async (template: ReportTemplate) => {
    setSelectedTemplate(template);
    if (template.source === 'mileage') {
      const result = await generateMileageByVehicleReport(orgId);
      setReportResult(result);
      return;
    }
    const config = { ...template.config, ...activeFilters };
    const result = await generateMutation.mutateAsync(config);
    setReportResult(result);
  }, [activeFilters, generateMutation, orgId]);

  const handleFiltersChange = useCallback((filters: Partial<ReportConfig>) => {
    setActiveFilters(filters);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate, export, and schedule reports from your receipt data."
        action={
          <Button onClick={() => setShowBuilder(!showBuilder)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Custom Report
          </Button>
        }
      />

      <ReportFilters onChange={handleFiltersChange} />

      {showBuilder && (
        <CustomReportBuilder onClose={() => setShowBuilder(false)} orgId={orgId} />
      )}

      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-4">
          {templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <ReportTemplateCard
                  key={template.id}
                  template={template}
                  onGenerate={() => handleGenerate(template)}
                  isGenerating={generateMutation.isPending && selectedTemplate?.id === template.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-text-muted">
              <FileSpreadsheet className="mx-auto h-12 w-12 mb-4 opacity-40" />
              <p className="font-medium">No reports yet</p>
              <p className="text-sm mt-1">Select a template to generate your first report.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          <ScheduleManager orgId={orgId} />
        </TabsContent>
      </Tabs>

      {generateMutation.isPending && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <ReceiptTableSkeleton key={i} />)}
        </div>
      )}

      {reportResult && !generateMutation.isPending && (
        <ErrorBoundary componentName="ReportViewer">
          <ReportViewer
            result={reportResult}
            templateName={selectedTemplate?.name ?? 'Report'}
          />
        </ErrorBoundary>
      )}

      {generateMutation.isError && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          Failed to generate report. Please try again.
        </div>
      )}
    </div>
  );
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateReport, getPrebuiltTemplates, getCustomTemplates, saveCustomTemplate, deleteCustomTemplate } from '@/lib/services/reports';
import type { ReportConfig, ReportResult, ReportTemplate } from '@/lib/services/reports';

export function useReportTemplates(orgId: string) {
  return useQuery<ReportTemplate[]>({
    queryKey: ['report_templates', orgId],
    queryFn: async () => {
      const builtin = getPrebuiltTemplates();
      const custom = await getCustomTemplates(orgId);
      return [...builtin, ...custom];
    },
    staleTime: 30_000,
  });
}

export function useReportGenerate() {
  return useMutation({
    mutationFn: (config: ReportConfig) => generateReport(config),
  });
}

export function useSaveTemplate(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, config, userId }: { name: string; config: ReportConfig; userId: string }) =>
      saveCustomTemplate(orgId, userId, name, config),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report_templates', orgId] }),
  });
}

export function useDeleteTemplate(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => deleteCustomTemplate(templateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report_templates', orgId] }),
  });
}

// ─── Schedule hooks ───

export interface Schedule {
  id: string;
  org_id: string;
  created_by: string;
  report_name: string;
  report_config: Record<string, unknown>;
  frequency: string;
  email_to: string;
  format: string;
  day_of_week: number | null;
  day_of_month: number | null;
  time_of_day: string;
  next_run_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function fetchSchedules(orgId: string): Promise<Schedule[]> {
  const res = await fetch(`/api/reports/schedules?orgId=${orgId}`);
  if (!res.ok) throw new Error('Failed to fetch schedules');
  const json = await res.json();
  return json.schedules ?? [];
}

async function createSchedule(data: {
  orgId: string;
  report_name: string;
  frequency: string;
  email_to: string;
  format?: string;
  report_config?: Record<string, unknown>;
  day_of_week?: number;
  day_of_month?: number;
  time_of_day?: string;
}): Promise<Schedule> {
  const res = await fetch('/api/reports/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      report_name: data.report_name,
      frequency: data.frequency,
      email_to: data.email_to,
      format: data.format,
      report_config: data.report_config,
      day_of_week: data.day_of_week,
      day_of_month: data.day_of_month,
      time_of_day: data.time_of_day,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create schedule');
  }
  const json = await res.json();
  return json.schedule;
}

async function updateSchedule(data: {
  id: string;
  is_active?: boolean;
  frequency?: string;
  email_to?: string;
  report_name?: string;
  format?: string;
  report_config?: Record<string, unknown>;
  day_of_week?: number;
  day_of_month?: number;
  time_of_day?: string;
}): Promise<Schedule> {
  const res = await fetch(`/api/reports/schedules?id=${data.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update schedule');
  }
  const json = await res.json();
  return json.schedule;
}

async function deleteSchedule(id: string): Promise<void> {
  const res = await fetch(`/api/reports/schedules?id=${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete schedule');
  }
}

export function useOrgSchedules(orgId: string) {
  return useQuery<Schedule[]>({
    queryKey: ['report_schedules', orgId],
    queryFn: () => fetchSchedules(orgId),
    staleTime: 30_000,
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      orgId: string;
      report_name: string;
      frequency: string;
      email_to: string;
      format?: string;
      report_config?: Record<string, unknown>;
      day_of_week?: number;
      day_of_month?: number;
      time_of_day?: string;
    }) => createSchedule(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['report_schedules', variables.orgId] });
    },
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      is_active?: boolean;
      frequency?: string;
      email_to?: string;
      report_name?: string;
    }) => updateSchedule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report_schedules'] });
    },
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report_schedules'] });
    },
  });
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateReport,
  getPrebuiltTemplates,
  getCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
} from '@/lib/services/reports';
import type { ReportConfig, ReportTemplate } from '@/lib/services/reports';

/**
 * Fetches both pre-built and custom report templates for the given org.
 */
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

/**
 * Returns a mutation that generates a report from a given config.
 */
export function useReportGenerate() {
  return useMutation({
    mutationFn: (config: ReportConfig) => generateReport(config),
  });
}

/**
 * Saves a custom report template for the org.
 */
export function useSaveTemplate(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      config,
      userId,
    }: {
      name: string;
      config: ReportConfig;
      userId: string;
    }) => saveCustomTemplate(orgId, userId, name, config),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report_templates', orgId] }),
  });
}

/**
 * Deletes a custom report template by ID.
 */
export function useDeleteTemplate(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => deleteCustomTemplate(templateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report_templates', orgId] }),
  });
}

// ─── Schedule types ───

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

// ─── Fetch helpers with AbortController support ───

async function fetchSchedules(
  orgId: string,
  signal?: AbortSignal,
): Promise<Schedule[]> {
  const res = await fetch(`/api/reports/schedules?orgId=${orgId}`, { signal });
  if (!res.ok) throw new Error('Failed to fetch schedules');
  const json = await res.json();
  return json.schedules ?? [];
}

async function createSchedule(
  data: {
    orgId: string;
    report_name: string;
    frequency: string;
    email_to: string;
    format?: string;
    report_config?: Record<string, unknown>;
    day_of_week?: number;
    day_of_month?: number;
    time_of_day?: string;
  },
  signal?: AbortSignal,
): Promise<Schedule> {
  const res = await fetch('/api/reports/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create schedule');
  }
  const json = await res.json();
  return json.schedule;
}

async function updateSchedule(
  data: {
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
  },
  signal?: AbortSignal,
): Promise<Schedule> {
  const res = await fetch(`/api/reports/schedules?id=${data.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update schedule');
  }
  const json = await res.json();
  return json.schedule;
}

async function deleteSchedule(id: string, signal?: AbortSignal): Promise<void> {
  const res = await fetch(`/api/reports/schedules?id=${id}`, {
    method: 'DELETE',
    signal,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete schedule');
  }
}

// ─── Schedule hooks ───

/**
 * Fetches all report schedules for the given org.
 */
export function useOrgSchedules(orgId: string) {
  return useQuery<Schedule[]>({
    queryKey: ['report_schedules', orgId],
    queryFn: ({ signal }) => fetchSchedules(orgId, signal),
    staleTime: 30_000,
  });
}

/**
 * Creates a new report schedule.
 * Invalidates the schedule list for the created org on success.
 */
export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createSchedule>[0]) => createSchedule(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['report_schedules', variables.orgId] });
    },
  });
}

/**
 * Updates an existing report schedule.
 * Invalidates all schedule queries on success.
 */
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

/**
 * Deletes a report schedule by ID.
 * Invalidates all schedule queries on success.
 */
export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report_schedules'] });
    },
  });
}

// LOCKED: BUGGY
'use client';

import type { ReportConfig, ReportResult, ReportTemplate } from '@/lib/services/reports';

export function useReportTemplates(_orgId: string) {
  return { data: [] as ReportTemplate[], isLoading: false, error: null };
}

export function useReportGenerate() {
  return { mutate: async (_config: ReportConfig) => ({} as ReportResult), isLoading: false, error: null };
}

export function useSaveTemplate(_orgId: string) {
  return { mutate: async (_params: { name: string; config: ReportConfig; userId: string }) => {}, isLoading: false, error: null };
}

export function useDeleteTemplate(_orgId: string) {
  return { mutate: async (_templateId: string) => {}, isLoading: false, error: null };
}

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

export function useOrgSchedules(_orgId: string) {
  return { data: [] as Schedule[], isLoading: false, error: null };
}

export function useCreateSchedule() {
  return { mutateAsync: async (_data: { orgId: string; report_name: string; frequency: string; email_to: string; format?: string; report_config?: Record<string, unknown>; day_of_week?: number; day_of_month?: number; time_of_day?: string }) => ({} as Schedule), isLoading: false, error: null };
}

export function useUpdateSchedule() {
  return { mutate: async (_data: { id: string; is_active?: boolean; frequency?: string; email_to?: string; report_name?: string; format?: string; report_config?: Record<string, unknown>; day_of_week?: number; day_of_month?: number; time_of_day?: string }) => {}, isLoading: false, error: null };
}

export function useDeleteSchedule() {
  return { mutateAsync: async (_id: string) => {}, isLoading: false, error: null };
}

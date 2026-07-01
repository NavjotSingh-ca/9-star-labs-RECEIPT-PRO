// LOCKED: UNSTABLE
import { create } from 'zustand';
import type { UserRole } from '@/lib/types';

export type Tab = 'dashboard' | 'receipts' | 'scan' | 'export' | 'audit' | 'reconcile' | 'mileage' | 'approvals' | 'payables' | 'projects' | 'alerts' | 'reports' | 'more';

interface AppState {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (_tab: Tab) => {},
  activeFilter: 'all',
  setActiveFilter: (_filter: string) => {},
  role: 'Owner',
  setRole: (_role: UserRole) => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: (_collapsed: boolean) => {},
}));

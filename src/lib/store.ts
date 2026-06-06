import { create } from 'zustand';
import type { UserRole } from '@/lib/types';
import type { Plan } from '@/lib/services/subscription';

export type Tab = 'dashboard' | 'receipts' | 'scan' | 'export' | 'audit' | 'reconcile' | 'mileage' | 'approvals' | 'payables' | 'projects' | 'alerts' | 'more';

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
  setActiveTab: (tab) => set({ activeTab: tab }),
  activeFilter: 'all',
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  role: 'Owner',
  setRole: (role) => set({ role }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));

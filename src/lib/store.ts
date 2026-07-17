import { create } from 'zustand';
import type { UserRole, Tab } from '@/lib/types';

/** Global application UI state. */
interface AppState {
  /** Currently active navigation tab. */
  activeTab: Tab;
  /** Sets the active navigation tab. */
  setActiveTab: (tab: Tab) => void;
  /** Active filter value for the current view. */
  activeFilter: string;
  /** Sets the active filter. */
  setActiveFilter: (filter: string) => void;
  /** Current user role within the organization. */
  role: UserRole;
  /** Sets the current user role. */
  setRole: (role: UserRole) => void;
  /** Whether the desktop sidebar is collapsed to icon-only. */
  sidebarCollapsed: boolean;
  /** Toggles sidebar collapsed state. */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Whether the global command palette (⌘K) is open. */
  commandOpen: boolean;
  /** Opens or closes the command palette. */
  setCommandOpen: (open: boolean) => void;
  /** Toggles the command palette open state. */
  toggleCommand: () => void;
}

/** Global app store for UI state. */
export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  activeFilter: 'all',
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  role: 'Owner',
  setRole: (role) => set({ role }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
}));

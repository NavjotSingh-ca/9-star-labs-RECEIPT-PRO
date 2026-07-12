'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppNotification, NotificationType } from '@/lib/types';

const STORAGE_KEY = 'lrp-notifications';
const MAX_NOTIFICATIONS = 200;

interface NotificationsState {
  /** All notifications, newest first */
  notifications: AppNotification[];
  /** Whether polling is active */
  isPolling: boolean;
  setPolling: (polling: boolean) => void;

  /** Add a notification (dedup by id) */
  addNotification: (n: AppNotification) => void;
  /** Add multiple at once (batch insert) */
  addNotifications: (items: AppNotification[]) => void;
  /** Replace all (used on initial load) */
  setNotifications: (items: AppNotification[]) => void;

  /** Mark single notification as read */
  markAsRead: (id: string) => void;
  /** Mark all as read */
  markAllAsRead: () => void;

  /** Remove a notification */
  removeNotification: (id: string) => void;
  /** Clear all */
  clearAll: () => void;

  /** Computed: unread count */
  unreadCount: () => number;
  /** Computed: filter by type */
  filterByType: (type: NotificationType | NotificationType[]) => AppNotification[];
  /** Computed: filter read/unread */
  filterRead: (onlyUnread?: boolean) => AppNotification[];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createNotification(
  overrides: Partial<AppNotification> & { title: string; message: string }
): AppNotification {
  return {
    id: generateId(),
    org_id: '',
    user_id: '',
    type: 'system',
    is_read: false,
    created_at: new Date().toISOString(),
    link: null,
    metadata: null,
    ...overrides,
  };
}

export const useNotificationStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isPolling: false,
      setPolling: (polling) => set({ isPolling: polling }),

      addNotification: (n) =>
        set((state) => {
          const exists = state.notifications.some((x) => x.id === n.id);
          if (exists) return state;
          const next = [n, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
          return { notifications: next };
        }),

      addNotifications: (items) =>
        set((state) => {
          const existingIds = new Set(state.notifications.map((x) => x.id));
          const newItems = items.filter((n) => !existingIds.has(n.id));
          if (newItems.length === 0) return state;
          const next = [...newItems, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
          return { notifications: next };
        }),

      setNotifications: (items) =>
        set({ notifications: items.slice(0, MAX_NOTIFICATIONS) }),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearAll: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter((n) => !n.is_read).length,

      filterByType: (type) => {
        const types = Array.isArray(type) ? type : [type];
        return get().notifications.filter((n) => types.includes(n.type));
      },

      filterRead: (onlyUnread) => {
        if (onlyUnread) return get().notifications.filter((n) => !n.is_read);
        return get().notifications;
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);

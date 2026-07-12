'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/lib/stores/notifications';
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } from '@/lib/services/notifications';
import { logError } from '@/lib/logger';
import type { AppNotification } from '@/lib/types';

interface NotificationBellProps {
  /** True when sidebar is collapsed (desktop only) */
  collapsed?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function NotificationItem({
  notification,
  onMarkRead,
  onNavigate,
}: {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onNavigate?: (link: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!notification.is_read) onMarkRead(notification.id);
        if (notification.link && onNavigate) onNavigate(notification.link);
      }}
      className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-surface-hover ${
        !notification.is_read ? 'bg-champagne/5' : ''
      }`}
    >
      <div className="mt-0.5 flex-shrink-0">
        {!notification.is_read && (
          <span className="block h-2 w-2 rounded-full bg-champagne" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium leading-snug ${!notification.is_read ? 'text-text-primary' : 'text-text-secondary'}`}>
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{notification.message}</p>
        <p className="mt-1 text-[10px] font-medium text-text-muted/60">
          {timeAgo(notification.created_at)}
        </p>
      </div>
    </button>
  );
}

export default function NotificationBell({ collapsed }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const addNotifications = useNotificationStore((s) => s.addNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsReadLocal = useNotificationStore((s) => s.markAllAsRead);

  const unreadCount = useNotificationStore((s) => s.unreadCount());

  // Load notifications from DB on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // If we already have notifications in the store (from localStorage), just sync the unread count
        if (notifications.length === 0) {
          const dbNotifications = await getNotifications(50);
          if (!cancelled && dbNotifications.length > 0) {
            addNotifications(dbNotifications);
          }
        }
      } catch (err) {
        logError(err, { action: 'load_notifications_bell' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll every 30 seconds for new unread count
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const count = await getUnreadCount();
        // If the server has more unread than the local store, fetch full list
        if (count > 0 && count > unreadCount) {
          const fresh = await getNotifications(50, true);
          if (fresh.length > 0) {
            addNotifications(fresh);
          }
        }
      } catch {
        // Silently fail — store still works
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [unreadCount, addNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleMarkAllRead = useCallback(async () => {
    markAllAsReadLocal();
    await markAllNotificationsRead().catch(() => {});
  }, [markAllAsReadLocal]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      markAsRead(id);
      await markNotificationRead(id).catch(() => {});
    },
    [markAsRead]
  );

  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        title={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-white"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute right-0 z-[100] mt-2 overflow-hidden rounded-xl border border-glass-border bg-popover shadow-modal ${
              collapsed ? 'left-0' : 'w-[360px]'
            } max-w-[90vw]`}
            role="dialog"
            aria-label="Notifications"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-glass-border px-4 py-2.5">
              <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-champagne hover:text-champagne-light transition"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-champagne border-t-transparent" />
                </div>
              ) : recentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="mb-2 h-8 w-8 text-text-muted/40" />
                  <p className="text-sm font-medium text-text-secondary">No notifications yet</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Updates appear here when receipts are approved, team members join, and more.
                  </p>
                </div>
              ) : (
                recentNotifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onMarkRead={handleMarkRead}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 10 && (
              <div className="border-t border-glass-border px-4 py-2 text-center">
                <a
                  href="/notifications"
                  className="text-xs font-medium text-champagne hover:text-champagne-light transition"
                >
                  View all {notifications.length} notifications
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

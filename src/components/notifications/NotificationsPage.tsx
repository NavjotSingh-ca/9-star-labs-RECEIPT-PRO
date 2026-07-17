'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { Bell, CheckCheck, Trash2, ArrowLeft } from 'lucide-react';
import { useNotificationStore } from '@/lib/stores/notifications';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '@/lib/services/notifications';
import { logError } from '@/lib/logger';
import type { AppNotification, NotificationGroup, NotificationType } from '@/lib/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function groupByDate(notifications: AppNotification[]): NotificationGroup[] {
  const groups = new Map<string, AppNotification[]>();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const n of notifications) {
    const date = new Date(n.created_at).toDateString();
    let label: string;
    if (date === today) label = 'Today';
    else if (date === yesterday) label = 'Yesterday';
    else label = new Date(n.created_at).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });

    const existing = groups.get(label) || [];
    existing.push(n);
    groups.set(label, existing);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    date: label,
    label,
    notifications: items,
  }));
}

const TYPE_LABELS: Partial<Record<NotificationType, string>> = {
  receipt_approved: 'Approvals',
  receipt_rejected: 'Rejected',
  receipt_submitted: 'Submissions',
  team_joined: 'Team',
  reimbursement_paid: 'Reimbursements',
  reimbursement_requested: 'Reimbursements',
  bank_unmatched: 'Banking',
  export_ready: 'Exports',
  digest_warning: 'Alerts',
  system: 'System',
  comment_added: 'Comments',
};

interface NotificationsPageProps {
  onBack?: () => void;
}

/**
 * Full notifications page with filter chips by notification type,
 * date-grouped list, mark-as-read, mark-all-read, and delete actions.
 * Action buttons are keyboard-accessible via focus-within styling.
 */
export default function NotificationsPage({ onBack }: NotificationsPageProps) {
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all');

  const notifications = useNotificationStore((s) => s.notifications);
  const addNotifications = useNotificationStore((s) => s.addNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsReadLocal = useNotificationStore((s) => s.markAllAsRead);
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  const unreadCount = useNotificationStore((s) => s.unreadCount());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const dbNotifications = await getNotifications(200);
        if (!cancelled && dbNotifications.length > 0) {
          addNotifications(dbNotifications);
        }
      } catch (err) {
        logError(err, { action: 'load_notifications_page' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [addNotifications]);

  // Compute unique notification types present
  const availableTypes = useMemo(() => {
    const types = new Set(notifications.map((n) => n.type));
    return Array.from(types);
  }, [notifications]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const handleMarkRead = async (id: string) => {
    markAsRead(id);
    await markNotificationRead(id).catch(() => {});
  };

  const handleMarkAllRead = async () => {
    markAllAsReadLocal();
    await markAllNotificationsRead().catch(() => {});
  };

  const handleDelete = async (id: string) => {
    removeNotification(id);
    await deleteNotification(id).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-hover transition lg:hidden"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Notifications</h1>
            <p className="text-sm text-text-muted">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 rounded-lg border border-glass-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover transition"
          >
            <CheckCheck className="h-3.5 w-3.5 text-emerald-light" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            activeFilter === 'all'
              ? 'bg-champagne/15 text-champagne'
              : 'bg-surface text-text-secondary hover:bg-surface-hover'
          }`}
        >
          All
        </button>
        {availableTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveFilter(type)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              activeFilter === type
                ? 'bg-champagne/15 text-champagne'
                : 'bg-surface text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-champagne border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-champagne/10">
            <Bell className="h-7 w-7 text-champagne" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">No notifications</h2>
          <p className="mt-1 text-sm text-text-muted max-w-sm">
            {activeFilter === 'all'
              ? 'You&apos;re all caught up! Notifications will appear here when receipts are approved, team members join, and more.'
              : `No ${activeFilter.replace(/_/g, ' ')} notifications yet.`}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          className="space-y-6"
        >
          {grouped.map((group) => (
            <motion.div key={group.date} variants={{ visible: { transition: { staggerChildren: 0.03 } } }}>
              <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
                {group.label}
              </h3>
              <div className="divide-y divide-glass-border overflow-hidden rounded-xl border border-glass-border bg-card shadow-sm">
                {group.notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`group flex items-start gap-3 px-4 py-3.5 transition ${
                      !notification.is_read ? 'bg-champagne/5' : ''
                    } hover:bg-surface-hover`}
                  >
                    {/* Unread indicator */}
                    <div className="mt-1.5 flex-shrink-0">
                      {!notification.is_read ? (
                        <span className="block h-2 w-2 rounded-full bg-champagne" />
                      ) : (
                        <span className="block h-2 w-2 rounded-full bg-transparent" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-snug ${
                          !notification.is_read ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">{notification.message}</p>
                      <p className="mt-1 text-[10px] font-medium text-text-muted/50">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition">
                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(notification.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-emerald-light transition"
                          aria-label="Mark as read"
                          title="Mark as read"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(notification.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-danger transition"
                        aria-label="Delete notification"
                        title="Delete notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

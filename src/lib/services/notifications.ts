import { supabase, getOrgIdString } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import type { AppNotification, NotificationType } from '@/lib/types';

const DEFAULT_NOTIFICATION_LIMIT = 50;
const PGRST116 = 'PGRST116';

/**
 * Check whether a Supabase error is a PGRST116 (relation not found).
 * This typically means the notifications table does not exist yet.
 */
function isTableNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === PGRST116
  );
}

/**
 * Map a raw database row to an AppNotification.
 */
function rowToNotification(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id),
    org_id: String(row.org_id),
    user_id: String(row.user_id),
    type: String(row.type) as NotificationType,
    title: String(row.title),
    message: String(row.message),
    link: row.link ? String(row.link) : null,
    is_read: Boolean(row.is_read),
    created_at: String(row.created_at),
    metadata: row.metadata ? (row.metadata as Record<string, unknown>) : null,
  };
}

/**
 * Fetch notifications for the current user in the current org.
 * Falls back to empty array on any error.
 *
 * @param limit - Maximum number of notifications to fetch (default 50).
 * @param onlyUnread - If true, only return unread notifications.
 * @returns Array of AppNotification, newest first.
 */
export async function getNotifications(
  limit: number = DEFAULT_NOTIFICATION_LIMIT,
  onlyUnread: boolean = false
): Promise<AppNotification[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const orgId = await getOrgIdString();
    if (!orgId) return [];

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (onlyUnread) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) {
      if (isTableNotFound(error)) return [];
      logError(error, { action: 'fetch_notifications' });
      return [];
    }

    return (data || []).map(rowToNotification);
  } catch (err) {
    logError(err, { action: 'getNotifications' });
    return [];
  }
}

/**
 * Mark a single notification as read.
 * Scoped by user_id for security (user can only mark their own notifications).
 *
 * @param notificationId - UUID of the notification to mark as read.
 * @returns True if the operation succeeded, false otherwise.
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
  if (!notificationId) return false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      if (isTableNotFound(error)) return false;
      logError(error, { action: 'mark_notification_read' });
      return false;
    }
    return true;
  } catch (err) {
    logError(err, { action: 'markNotificationRead' });
    return false;
  }
}

/**
 * Mark all notifications as read for the current user in the current org.
 *
 * @returns True if the operation succeeded, false otherwise.
 */
export async function markAllNotificationsRead(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const orgId = await getOrgIdString();
    if (!orgId) return false;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      if (isTableNotFound(error)) return false;
      logError(error, { action: 'mark_all_notifications_read' });
      return false;
    }
    return true;
  } catch (err) {
    logError(err, { action: 'markAllNotificationsRead' });
    return false;
  }
}

/**
 * Create a notification in the database and return it.
 * Does NOT update the local store — caller is responsible for that.
 *
 * @param notification - Notification data (without id, created_at, is_read).
 * @returns The created AppNotification, or null on failure.
 */
export async function createDBNotification(
  notification: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>
): Promise<AppNotification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        org_id: notification.org_id,
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link ?? null,
        metadata: notification.metadata ?? null,
      })
      .select()
      .single();

    if (error) {
      if (isTableNotFound(error)) return null;
      logError(error, { action: 'create_notification' });
      return null;
    }

    if (!data) return null;

    return rowToNotification(data as Record<string, unknown>);
  } catch (err) {
    logError(err, { action: 'createDBNotification' });
    return null;
  }
}

/**
 * Delete a notification by ID.
 * Scoped by user_id for security.
 *
 * @param notificationId - UUID of the notification to delete.
 * @returns True if the operation succeeded, false otherwise.
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  if (!notificationId) return false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      if (isTableNotFound(error)) return false;
      logError(error, { action: 'delete_notification' });
      return false;
    }
    return true;
  } catch (err) {
    logError(err, { action: 'deleteNotification' });
    return false;
  }
}

/**
 * Get unread notification count for the current user in the current org.
 *
 * @returns The count of unread notifications, or 0 on error.
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const orgId = await getOrgIdString();
    if (!orgId) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      if (isTableNotFound(error)) return 0;
      logError(error, { action: 'get_unread_count' });
      return 0;
    }
    return count || 0;
  } catch (err) {
    logError(err, { action: 'getUnreadCount' });
    return 0;
  }
}

// ─── Notification type helpers ───

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  receipt_approved: '✅',
  receipt_rejected: '❌',
  receipt_submitted: '📋',
  team_joined: '👋',
  reimbursement_paid: '💰',
  reimbursement_requested: '💸',
  bank_unmatched: '🏦',
  export_ready: '📊',
  digest_warning: '⚠️',
  system: '🔔',
  comment_added: '💬',
};

export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  receipt_approved: 'text-emerald-light',
  receipt_rejected: 'text-danger',
  receipt_submitted: 'text-info',
  team_joined: 'text-champagne',
  reimbursement_paid: 'text-emerald-light',
  reimbursement_requested: 'text-warning',
  bank_unmatched: 'text-warning',
  export_ready: 'text-info',
  digest_warning: 'text-danger',
  system: 'text-text-secondary',
  comment_added: 'text-info',
};

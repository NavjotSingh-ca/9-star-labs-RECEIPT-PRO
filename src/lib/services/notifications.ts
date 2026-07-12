import { supabase, getOrgIdString } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import type { AppNotification, NotificationType } from '@/lib/types';

// ─── In-App Notification Service ───
// Uses the `notifications` table for persistence.
// Falls back gracefully if the table doesn't exist yet (returns empty).

/**
 * Fetch notifications for the current user in the current org.
 * Falls back to empty array on any error.
 */
export async function getNotifications(
  limit = 50,
  onlyUnread = false
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
      // PGRST116 = table doesn't exist
      if ((error as { code?: string }).code === 'PGRST116') return [];
      logError(error, { action: 'fetch_notifications' });
      return [];
    }

    return (data || []).map((row: Record<string, unknown>) => ({
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
    }));
  } catch (err) {
    logError(err, { action: 'getNotifications' });
    return [];
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') return false;
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
      if ((error as { code?: string }).code === 'PGRST116') return false;
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
      if ((error as { code?: string }).code === 'PGRST116') return null;
      logError(error, { action: 'create_notification' });
      return null;
    }

    if (!data) return null;

    return {
      id: String(data.id),
      org_id: String(data.org_id),
      user_id: String(data.user_id),
      type: String(data.type) as NotificationType,
      title: String(data.title),
      message: String(data.message),
      link: data.link ? String(data.link) : null,
      is_read: Boolean(data.is_read),
      created_at: String(data.created_at),
      metadata: data.metadata ? (data.metadata as Record<string, unknown>) : null,
    };
  } catch (err) {
    logError(err, { action: 'createDBNotification' });
    return null;
  }
}

/**
 * Delete a notification by ID.
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') return false;
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
 * Get unread notification count.
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
      if ((error as { code?: string }).code === 'PGRST116') return 0;
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

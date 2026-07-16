'use client';

import { supabase, getOrgIdString } from '@/lib/supabase';
import { useNotificationStore, createNotification } from '@/lib/stores/notifications';
import { logError, logWarn } from '@/lib/logger';
import type { AppNotification, NotificationType } from '@/lib/types';

/**
 * Create a notification locally (Zustand store) and persist to Supabase.
 * Returns the notification object on success, null on failure.
 *
 * @param params - Notification parameters.
 * @param params.type - Notification type from the NotificationType union.
 * @param params.title - Notification title (displayed in bold).
 * @param params.message - Notification body text.
 * @param params.link - Optional deep-link path for click-through.
 * @param params.userId - Recipient user UUID.
 * @param params.orgId - Optional org UUID. Auto-resolved from session if omitted.
 * @returns The created AppNotification, or null if creation failed.
 */
export async function notifyUser(params: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  userId: string;
  orgId?: string;
}): Promise<AppNotification | null> {
  const { type, title, message, link, userId } = params;

  if (!userId) {
    logWarn('notifyUser: userId is required, skipping notification', { type });
    return null;
  }

  const orgId = params.orgId || (await getOrgIdString());
  if (!orgId) {
    logWarn('notifyUser: no orgId found, skipping notification', { type, userId });
    return null;
  }

  const notification = createNotification({
    org_id: orgId,
    user_id: userId,
    type,
    title,
    message,
    link: link ?? null,
  });

  // Add to local store immediately (optimistic UI)
  try {
    useNotificationStore.getState().addNotification(notification);
  } catch (err) {
    logError(err, { action: 'notifyUser_store_add', userId, type });
  }

  // Persist to DB
  try {
    const { error } = await supabase.from('notifications').insert({
      id: notification.id,
      org_id: orgId,
      user_id: userId,
      type,
      title,
      message,
      link: link ?? null,
      is_read: false,
    });

    if (error) {
      // PGRST116 = table doesn't exist yet
      if ((error as { code?: string }).code !== 'PGRST116') {
        logError(error, { action: 'notifyUser_insert', type, userId });
      }
    }
  } catch (err) {
    logError(err, { action: 'notifyUser_persist' });
  }

  return notification;
}

/**
 * Notify all Owners and Accountants in an org about a receipt event.
 * Used when a new receipt is submitted or requires admin attention.
 *
 * @param params - Notification parameters for org-wide broadcast.
 * @param params.type - Notification type.
 * @param params.title - Notification title.
 * @param params.message - Notification body text.
 * @param params.link - Optional deep-link path.
 * @param params.orgId - Organization UUID for member lookup.
 * @param params.excludeUserId - Optional UUID to exclude (e.g., the submitting user).
 */
export async function notifyOrgAdmins(params: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  orgId: string;
  excludeUserId?: string;
}): Promise<void> {
  const { type, title, message, link, orgId, excludeUserId } = params;

  if (!orgId) {
    logWarn('notifyOrgAdmins: orgId is required, skipping');
    return;
  }

  try {
    const { data: admins, error } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('org_id', orgId)
      .in('role', ['Owner', 'Accountant']);

    if (error) {
      logError(error, { action: 'notifyOrgAdmins_fetch' });
      return;
    }

    const userIds = (admins || [])
      .map((r) => r.user_id)
      .filter((id) => id !== excludeUserId);

    if (userIds.length === 0) return;

    // Create notifications in parallel, don't let one failure block others
    await Promise.allSettled(
      userIds.map((userId) =>
        notifyUser({ type, title, message, link, userId, orgId })
      )
    );
  } catch (err) {
    logError(err, { action: 'notifyOrgAdmins' });
  }
}

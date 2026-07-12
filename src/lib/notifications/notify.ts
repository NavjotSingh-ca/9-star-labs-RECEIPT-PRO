'use client';

import { supabase, getOrgIdString } from '@/lib/supabase';
import { useNotificationStore, createNotification } from '@/lib/stores/notifications';
import { logError, logWarn } from '@/lib/logger';
import type { AppNotification, NotificationType } from '@/lib/types';

/**
 * Create a notification locally (store) and in Supabase (persisted).
 * Returns the notification object on success, null on failure.
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

  // Add to local store immediately
  try {
    useNotificationStore.getState().addNotification(notification);
  } catch {
    // Store may not be initialized on server
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
 * Used when a new receipt is submitted.
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

  try {
    // Fetch all Owners and Accountants in the org
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

    // Create notifications in parallel
    await Promise.allSettled(
      userIds.map((userId) =>
        notifyUser({ type, title, message, link, userId, orgId })
      )
    );
  } catch (err) {
    logError(err, { action: 'notifyOrgAdmins' });
  }
}

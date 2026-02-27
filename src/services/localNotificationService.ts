import * as Notifications from 'expo-notifications';
import { Product } from '../types/product.types';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { getReminderTime, getReminderDaysBefore, getNotificationsEnabled } from './settingsStorage';

/**
 * Request notification permission (idempotent). Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Present immediate "saved" notification (professional, OL-friendly).
 * Skips if user has turned off "Reminder notifications" in Settings.
 */
export async function notifyProductSaved(): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Saved to your collection',
        body: "We'll remind you before it expires so you can use it in time.",
        data: {},
      },
      trigger: null,
    });
  } catch {
    // Silently ignore notification errors
  }
}

const EXPIRY_IDENTIFIER_PREFIX = 'expiry-';
const PAO_IDENTIFIER_PREFIX = 'pao-';

/**
 * Cancel the scheduled expiry reminder for a product (e.g. after edit or delete).
 */
export async function cancelExpiryReminder(productId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(EXPIRY_IDENTIFIER_PREFIX + productId);
  } catch {
    // Silently ignore
  }
}

/**
 * Cancel the scheduled PAO (use-by after opening) reminder for a product.
 */
export async function cancelPAOReminder(productId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(PAO_IDENTIFIER_PREFIX + productId);
  } catch {
    // Silently ignore
  }
}

/**
 * Schedule a reminder X days before product expires at user's Reminder time.
 * X is from Settings (Remind me before expiry). Skips if notifications off or reminder date in the past.
 */
export async function scheduleExpiryReminder(product: Product): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const daysBefore = await getReminderDaysBefore();
  const { hour, minute } = await getReminderTime();
  const expiry = new Date(product.expirationDate);
  const reminderDate = new Date(expiry);
  reminderDate.setDate(reminderDate.getDate() - daysBefore);
  reminderDate.setHours(hour, minute, 0, 0);

  const now = new Date();
  if (reminderDate.getTime() <= now.getTime()) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Expiry reminder',
        body: `"${product.name}" expires soon. Use it before the use-by date.`,
        data: { productId: product.id },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
      identifier: EXPIRY_IDENTIFIER_PREFIX + product.id,
    });
  } catch {
    // Silently ignore
  }
}

/**
 * Schedule a one-time reminder for "use by X months after opening" when product has openedDate and paoMonths.
 * Fires at user's reminder time on the day before useByAfterOpening. Skips if that date is in the past or notifications off.
 */
export async function schedulePAOReminder(product: Product): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const opened = product.openedDate;
  const paoMonths = product.paoMonths;
  if (!opened || paoMonths == null || paoMonths < 1) return;

  const useBy = new Date(opened);
  useBy.setMonth(useBy.getMonth() + paoMonths);
  const reminderDate = new Date(useBy);
  reminderDate.setDate(reminderDate.getDate() - 1); // day before use-by
  const { hour, minute } = await getReminderTime();
  reminderDate.setHours(hour, minute, 0, 0);

  const now = new Date();
  if (reminderDate.getTime() <= now.getTime()) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Use-by after opening',
        body: `"${product.name}" should be used by ${reminderDate.toLocaleDateString()} (${paoMonths} months after opening).`,
        data: { productId: product.id },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
      identifier: PAO_IDENTIFIER_PREFIX + product.id,
    });
  } catch {
    // Silently ignore
  }
}

// Throttle: only one "saved" notification per product within a short window (avoids duplicates from double-handling)
const lastSavedNotifyTime = new Map<string, number>();
const SAVED_NOTIFY_THROTTLE_MS = 3000;

/**
 * Call after a product is saved: show "saved" notification and schedule expiry reminder.
 * Respects "Reminder notifications" in Settings; throttles the immediate "saved" notification.
 */
export async function onProductSaved(product: Product): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (enabled) {
    const now = Date.now();
    const last = lastSavedNotifyTime.get(product.id);
    if (last == null || now - last >= SAVED_NOTIFY_THROTTLE_MS) {
      lastSavedNotifyTime.set(product.id, now);
      await notifyProductSaved();
    }
    await scheduleExpiryReminder(product);
    await schedulePAOReminder(product);
  }
}

/**
 * Call after a product is updated (e.g. from edit): cancel the old expiry and PAO reminders
 * and schedule new ones for the updated dates.
 */
export async function onProductUpdated(product: Product): Promise<void> {
  await cancelExpiryReminder(product.id);
  await cancelPAOReminder(product.id);
  await scheduleExpiryReminder(product);
  await schedulePAOReminder(product);
}

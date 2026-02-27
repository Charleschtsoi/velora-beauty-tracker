import * as Notifications from 'expo-notifications';
import { Product } from '../types/product.types';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { getReminderTime, getNotificationsEnabled } from './settingsStorage';

const EXPIRY_REMINDER_DAYS_BEFORE = 1;

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
 * Schedule a reminder 1 day before product expires at user's Reminder time.
 * Skips if "Reminder notifications" is off, permission denied, or expiry is in the past or within 1 day.
 */
export async function scheduleExpiryReminder(product: Product): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const { hour, minute } = await getReminderTime();
  const expiry = new Date(product.expirationDate);
  const reminderDate = new Date(expiry);
  reminderDate.setDate(reminderDate.getDate() - EXPIRY_REMINDER_DAYS_BEFORE);
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
  }
}

/**
 * Call after a product is updated (e.g. from edit): cancel the old expiry reminder
 * and schedule a new one for the updated expiration date. Status and reminders
 * will reflect the new date (e.g. if now safe, reminder moves to 1 day before new expiry).
 */
export async function onProductUpdated(product: Product): Promise<void> {
  await cancelExpiryReminder(product.id);
  await scheduleExpiryReminder(product);
}

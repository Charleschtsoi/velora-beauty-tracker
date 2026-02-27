import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  REMINDER_TIME: '@hermes/reminderTime',
  NOTIFICATIONS_ENABLED: '@hermes/notificationsEnabled',
  EXPIRING_SOON_ALERT: '@hermes/expiringSoonAlert',
  EXPIRED_ALERT: '@hermes/expiredAlert',
  HAS_SEEN_FIRST_RUN: '@hermes/hasSeenFirstRun',
  HAS_SEEN_WELCOME: '@hermes/hasSeenWelcome',
  COMPACT_LIST: '@hermes/compactList',
  REMINDERS_READ_IDS: '@hermes/remindersReadIds',
} as const;

const DEFAULTS = {
  reminderHour: 9,
  reminderMinute: 0,
  notificationsEnabled: true,
  expiringSoonAlert: true,
  expiredAlert: true,
};

export async function getReminderTime(): Promise<{ hour: number; minute: number }> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.REMINDER_TIME);
    if (!raw) return { hour: DEFAULTS.reminderHour, minute: DEFAULTS.reminderMinute };
    const [hour, minute] = raw.split(':').map(Number);
    if (Number.isFinite(hour) && Number.isFinite(minute)) return { hour, minute };
  } catch {}
  return { hour: DEFAULTS.reminderHour, minute: DEFAULTS.reminderMinute };
}

export async function setReminderTime(hour: number, minute: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.REMINDER_TIME, `${hour}:${minute}`);
  } catch {}
}

export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEYS.NOTIFICATIONS_ENABLED);
    if (v === 'false') return false;
    if (v === 'true') return true;
  } catch {}
  return DEFAULTS.notificationsEnabled;
}

export async function setNotificationsEnabled(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.NOTIFICATIONS_ENABLED, value ? 'true' : 'false');
  } catch {}
}

export async function getExpiringSoonAlert(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEYS.EXPIRING_SOON_ALERT);
    if (v === 'false') return false;
    if (v === 'true') return true;
  } catch {}
  return DEFAULTS.expiringSoonAlert;
}

export async function setExpiringSoonAlert(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.EXPIRING_SOON_ALERT, value ? 'true' : 'false');
  } catch {}
}

export async function getExpiredAlert(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEYS.EXPIRED_ALERT);
    if (v === 'false') return false;
    if (v === 'true') return true;
  } catch {}
  return DEFAULTS.expiredAlert;
}

export async function setExpiredAlert(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.EXPIRED_ALERT, value ? 'true' : 'false');
  } catch {}
}

/** Format hour/minute as "9:00 AM" for display */
export function formatReminderTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  const m = minute < 10 ? `0${minute}` : `${minute}`;
  return `${h}:${m} ${period}`;
}

/** Parse "9:00 AM" style string to hour (0-23) and minute */
export function parseReminderTimeDisplay(str: string): { hour: number; minute: number } {
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: DEFAULTS.reminderHour, minute: DEFAULTS.reminderMinute };
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = (match[3] || '').toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
}

export async function getHasSeenFirstRun(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEYS.HAS_SEEN_FIRST_RUN);
    return v === 'true';
  } catch {
    return false;
  }
}

export async function setHasSeenFirstRun(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.HAS_SEEN_FIRST_RUN, 'true');
  } catch {}
}

export async function getHasSeenWelcome(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEYS.HAS_SEEN_WELCOME);
    return v === 'true';
  } catch {
    return false;
  }
}

export async function setHasSeenWelcome(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.HAS_SEEN_WELCOME, 'true');
  } catch {}
}

export async function getCompactList(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEYS.COMPACT_LIST);
    return v === 'true';
  } catch {
    return false;
  }
}

export async function setCompactList(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.COMPACT_LIST, value ? 'true' : 'false');
  } catch {}
}

/** Persist which reminder product ids the user has marked as read */
export async function getReadReminderIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.REMINDERS_READ_IDS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export async function setReadReminderIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.REMINDERS_READ_IDS, JSON.stringify(ids));
  } catch {}
}

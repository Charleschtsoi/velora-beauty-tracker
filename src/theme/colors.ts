/**
 * Design tokens: palette for Velora (fashion-forward, premium feel).
 * Warm neutral background; primary green as accent; soft editorial surfaces.
 */
export const colors = {
  // Primary & accent
  primary: '#10b981',
  primaryLight: '#d1fae5',
  primaryTint: '#f0fdf4',
  secondary: '#e11d48', // soft rose accent for highlights (beauty-adjacent)
  secondaryLight: '#ffe4e6',

  // Surfaces (warm editorial)
  background: '#faf9f7', // warm off-white default
  backgroundWarm: '#fafaf9',
  surface: '#ffffff',
  surfaceMuted: '#f3f4f6',

  // Text
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',

  // Borders & dividers
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  iconMuted: '#d1d5db', // chevrons, disabled icons

  // Status (expiry)
  statusExpired: '#ef4444',
  statusExpiredBg: '#fee2e2',
  statusExpiringSoon: '#f97316',
  statusExpiringSoonBg: '#fed7aa',
  statusWarning: '#fbbf24',
  statusWarningBg: '#fef3c7',
  statusSafe: '#10b981',
  statusSafeBg: '#d1fae5',
  statusMuted: '#6b7280',
  statusMutedBg: '#f3f4f6',

  // Hero / homepage (green-aligned with rest of app)
  heroGradientStart: '#ecfdf5',
  heroGradientEnd: '#ffffff',
  logoBrownishPink: '#9d7b7b',
  accentGold: '#b45309',

  // Interactive
  link: '#10b981',
  destructive: '#ef4444',
  white: '#ffffff',
  black: '#000000',
} as const;

export type ColorKey = keyof typeof colors;

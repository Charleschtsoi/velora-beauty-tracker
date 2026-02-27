/**
 * Design tokens: palette for Velora (OL-friendly, premium feel).
 * Primary green retained; secondary accent for warmth; status and surfaces.
 */
export const colors = {
  // Primary & accent
  primary: '#10b981',
  primaryLight: '#d1fae5',
  primaryTint: '#f0fdf4',
  secondary: '#e11d48', // soft rose accent for highlights (beauty-adjacent)
  secondaryLight: '#ffe4e6',

  // Surfaces
  background: '#f9fafb',
  backgroundWarm: '#fafaf9', // barely warm grey for key screens
  surface: '#ffffff',
  surfaceMuted: '#f3f4f6',

  // Text
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',

  // Borders & dividers
  border: '#e5e7eb',
  borderLight: '#f3f4f6',

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

  // Interactive
  link: '#10b981',
  destructive: '#ef4444',
  white: '#ffffff',
  black: '#000000',
} as const;

export type ColorKey = keyof typeof colors;

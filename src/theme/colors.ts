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

  // K-beauty editorial accents (pastel, airy)
  blush: '#fce7f3',
  blushDeep: '#f9a8d4',
  mintSoft: '#ecfdf5',
  sage: '#a7f3d0',
  cream: '#fffbf7',
  peach: '#ffedd5',
  champagne: '#fef3c7',
  /** Soft tint for hero / glass-like surfaces */
  heroTint: '#f0fdf9',
  heroTint2: '#fdf2f8',

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

  // Interactive
  link: '#10b981',
  destructive: '#ef4444',
  white: '#ffffff',
  black: '#000000',
} as const;

export type ColorKey = keyof typeof colors;

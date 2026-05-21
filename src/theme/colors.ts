/**
 * Design tokens: Luxury Beauty / editorial counter palette.
 * Cream alabaster backgrounds; charcoal primary; champagne/taupe accents;
 * muted terracotta and ochre for expiry urgency (text and dots, not loud pills).
 */
export const colors = {
  // Primary & accent
  primary: '#1A1A1A',
  primaryLight: '#E8E4DE',
  primaryTint: '#F5F2ED',
  secondary: '#C4B5A0',
  secondaryLight: '#E8E2D9',

  // Editorial neutrals (legacy keys mapped to luxury tones)
  blush: '#F5F0EB',
  blushDeep: '#E8E2D9',
  mintSoft: '#F5F2ED',
  sage: '#E8E4DE',
  cream: '#FAF9F6',
  peach: '#FAF6EE',
  champagne: '#E8E2D9',
  heroTint: '#F5F2ED',
  heroTint2: '#EDE9E3',

  // Surfaces
  background: '#FAF9F6',
  backgroundWarm: '#FAF9F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F2ED',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6560',
  textTertiary: '#9C958D',

  // Borders & dividers
  border: '#E8E4DE',
  borderLight: '#F0EDE8',
  iconMuted: '#C4B5A0',

  // Status (expiry) — muted, elegant
  statusExpired: '#8B3A3A',
  statusExpiredBg: 'transparent',
  statusExpiringSoon: '#B8860B',
  statusExpiringSoonBg: '#FAF6EE',
  statusWarning: '#A67C00',
  statusWarningBg: '#FAF6EE',
  statusSafe: '#6B6560',
  statusSafeBg: '#F5F2ED',
  statusMuted: '#9C958D',
  statusMutedBg: '#F5F2ED',

  // Interactive
  link: '#1A1A1A',
  destructive: '#8B3A3A',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorKey = keyof typeof colors;

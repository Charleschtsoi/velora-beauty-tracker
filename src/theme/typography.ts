/**
 * Global typography: Cormorant Garamond (display) + system sans (functional UI).
 */
import { TextStyle } from 'react-native';
import { fontFamily, brandLogoSize } from './fonts';

const scale = {
  caption: 12,
  body: 14,
  bodyStrong: 16,
  subtitle: 18,
  title: 20,
  headline: 24,
  screenHeader: 28,
  modalHeader: 22,
  emptyState: 24,
  brandLogo: brandLogoSize,
} as const;

const displayBase: TextStyle = {
  fontFamily: fontFamily.display,
  fontWeight: '400',
};

const sansBase = (weight: TextStyle['fontWeight'] = '400'): TextStyle => ({
  fontFamily: fontFamily.sans,
  fontWeight: weight,
});

export const fontFamilies = {
  display: fontFamily.display,
  sans: fontFamily.sans,
} as const;

export const typography = {
  /** Home wordmark only */
  brandLogo: {
    ...displayBase,
    fontSize: scale.brandLogo,
    letterSpacing: 1.5,
  },
  /** Top-level tab screen titles: Inventory, Reminders, Settings */
  screenHeader: {
    ...displayBase,
    fontSize: scale.screenHeader,
    letterSpacing: 0.5,
    lineHeight: 34,
  },
  /** Modal / stack sheet titles: Add Product, Product Detail */
  modalHeader: {
    ...displayBase,
    fontSize: scale.modalHeader,
    letterSpacing: 0.3,
    lineHeight: 28,
  },
  /** Empty state headline */
  emptyStateTitle: {
    ...displayBase,
    fontSize: scale.emptyState,
    letterSpacing: 0.2,
    lineHeight: 30,
  },
  /** Legacy alias — Cormorant display at logo scale */
  display: {
    ...displayBase,
    fontSize: scale.brandLogo,
    letterSpacing: 1.5,
  },
  /** Legacy alias — same as screenHeader */
  headline: {
    ...displayBase,
    fontSize: scale.screenHeader,
    letterSpacing: 0.5,
    lineHeight: 34,
  },
  /** Legacy alias — sans card/list heading (was serif) */
  title: {
    ...sansBase('600'),
    fontSize: scale.title,
    letterSpacing: -0.15,
    lineHeight: 26,
  },
  heroTitle: {
    ...displayBase,
    fontSize: 26,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  heroTagline: {
    ...sansBase('500'),
    fontSize: scale.bodyStrong,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  caption: {
    ...sansBase('400'),
    fontSize: scale.caption,
  },
  body: {
    ...sansBase('400'),
    fontSize: scale.body,
  },
  bodyStrong: {
    ...sansBase('600'),
    fontSize: scale.body,
  },
  bodyLarge: {
    ...sansBase('400'),
    fontSize: scale.bodyStrong,
  },
  bodyLargeStrong: {
    ...sansBase('600'),
    fontSize: scale.bodyStrong,
  },
  subtitle: {
    ...sansBase('600'),
    fontSize: scale.subtitle,
  },
  cardTitle: {
    ...sansBase('600'),
    fontSize: scale.title,
    letterSpacing: -0.15,
    lineHeight: 26,
  },
  editorialLabel: {
    ...sansBase('600'),
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionLabel: {
    ...sansBase('600'),
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export const fontScale = scale;

/**
 * Design tokens: type scale and text styles.
 * Serif for logo and major headers; sans for body and metadata.
 */
import { Platform, TextStyle } from 'react-native';

export const fontFamilies = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
} as const;

const scale = {
  caption: 12,
  body: 14,
  bodyStrong: 16,
  subtitle: 18,
  title: 20,
  headline: 24,
  display: 22,
  hero: 26,
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.serif,
    fontSize: scale.display,
    fontWeight: '700' as const,
    letterSpacing: 1.4,
  },
  caption: {
    fontFamily: fontFamilies.sans,
    fontSize: scale.caption,
    fontWeight: '400' as const,
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: scale.body,
    fontWeight: '400' as const,
  },
  bodyStrong: {
    fontFamily: fontFamilies.sans,
    fontSize: scale.body,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: scale.bodyStrong,
    fontWeight: '400' as const,
  },
  bodyLargeStrong: {
    fontFamily: fontFamilies.sans,
    fontSize: scale.bodyStrong,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: scale.subtitle,
    fontWeight: '600' as const,
  },
  title: {
    fontFamily: fontFamilies.serif,
    fontSize: scale.title,
    fontWeight: '600' as const,
  },
  headline: {
    fontFamily: fontFamilies.serif,
    fontSize: scale.headline,
    fontWeight: '700' as const,
  },
  heroTagline: {
    fontFamily: fontFamilies.sans,
    fontSize: scale.bodyStrong,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  heroTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: scale.hero,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  /** Small uppercase sans editorial labels (section eyebrows). */
  editorialLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  /** Card and in-content headings — sans only. */
  cardTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: scale.title,
    fontWeight: '600' as const,
    letterSpacing: -0.15,
    lineHeight: 26,
  },
  sectionLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
} as const satisfies Record<string, TextStyle>;

export const fontScale = scale;

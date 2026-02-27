/**
 * Design tokens: type scale and text styles.
 * Roles: caption, body, bodyStrong, subtitle, title, headline.
 */
import { TextStyle } from 'react-native';

const scale = {
  caption: 12,
  body: 14,
  bodyStrong: 16,
  subtitle: 18,
  title: 20,
  headline: 24,
} as const;

export const typography = {
  caption: {
    fontSize: scale.caption,
    fontWeight: '400' as const,
  },
  body: {
    fontSize: scale.body,
    fontWeight: '400' as const,
  },
  bodyStrong: {
    fontSize: scale.body,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontSize: scale.bodyStrong,
    fontWeight: '400' as const,
  },
  bodyLargeStrong: {
    fontSize: scale.bodyStrong,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontSize: scale.subtitle,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: scale.title,
    fontWeight: '600' as const,
  },
  headline: {
    fontSize: scale.headline,
    fontWeight: '700' as const,
  },
} as const satisfies Record<string, TextStyle>;

export const fontScale = scale;

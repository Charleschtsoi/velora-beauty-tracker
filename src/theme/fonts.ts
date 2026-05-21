import { Platform } from 'react-native';

/**
 * Font family names — display must match useFonts() in App.tsx.
 */
export const fontFamily = {
  /** Cormorant Garamond — loaded via @expo-google-fonts/cormorant-garamond */
  display: 'CormorantGaramond_400Regular',
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
} as const;

/** @deprecated Use fontFamily.display */
export const brandFontFamily = {
  logo: fontFamily.display,
} as const;

export const brandLogoSize = 32;

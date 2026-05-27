import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

type ScanCameraHintProps = {
  title: string;
  subtitle?: string;
  /** 0–1 fraction of screen width for max width */
  maxWidthFactor?: number;
  /** Tighter padding for top-of-frame chips */
  compact?: boolean;
};

/**
 * Frosted editorial pill for hints over the live camera (title + optional subtitle).
 */
export function ScanCameraHint({
  title,
  subtitle,
  maxWidthFactor = 0.9,
  compact = false,
}: ScanCameraHintProps) {
  const titleStyle =
    compact && !subtitle ? [styles.title, styles.titleCompact] : styles.title;

  return (
    <View
      style={[
        styles.pill,
        compact && styles.pillCompact,
        { maxWidth: screenWidth * maxWidthFactor },
      ]}
    >
      <Text
        style={titleStyle}
        numberOfLines={compact && !subtitle ? 2 : 4}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.overlayPillBg,
    borderWidth: 1,
    borderColor: colors.overlayPillBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  pillCompact: {
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  titleCompact: {
    ...typography.body,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xxs,
    color: colors.overlayPillSubtitle,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
});

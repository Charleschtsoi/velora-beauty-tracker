import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  subtitle: string;
  buttonLabel?: string;
  onButtonPress?: () => void;
  testID?: string;
}

/**
 * Shared empty state: icon, one-line benefit copy, optional CTA.
 * Uses theme tokens for consistent look across Home, Inventory, Reminders, Categories.
 */
export default function EmptyState({
  icon = 'cube-outline',
  title,
  subtitle,
  buttonLabel,
  onButtonPress,
  testID,
}: EmptyStateProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Ionicons name={icon} size={64} color={colors.textTertiary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {buttonLabel && onButtonPress && (
        <TouchableOpacity
          style={styles.button}
          onPress={onButtonPress}
          activeOpacity={0.8}
          testID={testID ? `${testID}-button` : undefined}
        >
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    ...typography.bodyLargeStrong,
    color: colors.white,
  },
});

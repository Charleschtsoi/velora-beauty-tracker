import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface EmptyStateProps {
  icon?: IconName;
  image?: ImageSourcePropType;
  title: string;
  subtitle: string;
  buttonLabel?: string;
  onButtonPress?: () => void;
  testID?: string;
}

/**
 * Shared empty state: icon or image, display headline, sans body, optional CTA.
 */
export default function EmptyState({
  icon = 'cube-outline',
  image,
  title,
  subtitle,
  buttonLabel,
  onButtonPress,
  testID,
}: EmptyStateProps) {
  const [imageError, setImageError] = React.useState(false);
  const showImage = Boolean(image && !imageError);

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.iconCircle, showImage && styles.iconCircleImage]}>
        {showImage && image ? (
          <Image
            source={image}
            style={styles.image}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <Ionicons name={icon} size={56} color={colors.textTertiary} />
        )}
      </View>
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
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconCircleImage: {
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    ...typography.emptyStateTitle,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
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
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.bodyLargeStrong,
    color: colors.white,
  },
});

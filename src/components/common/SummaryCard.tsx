import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageSourcePropType,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, typography } from '../../theme';

export type SummaryCardVariant = 'default' | 'compact' | 'compactGrid';

interface SummaryCardProps {
  title: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  /** Optional background tint for the icon panel (e.g. statusExpiringSoonBg). Makes the icon area more representative. */
  iconBackgroundColor?: string;
  /** Optional soft card background (K-beauty compact tiles). */
  surfaceTint?: string;
  /** Optional representative image. When set and loaded, shown instead of icon; icon is fallback. */
  image?: ImageSourcePropType;
  onPress?: () => void;
  testID?: string;
  /** Optional delay in ms for staggered entrance (e.g. index * 50). */
  entranceDelay?: number;
  variant?: SummaryCardVariant;
  style?: ViewStyle;
}

export default function SummaryCard({
  title,
  count,
  icon,
  color,
  iconBackgroundColor,
  surfaceTint,
  image,
  onPress,
  testID,
  entranceDelay = 0,
  variant = 'default',
  style,
}: SummaryCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(variant === 'default' ? 8 : 6)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    }, entranceDelay);
    return () => clearTimeout(timer);
  }, [entranceDelay, opacity, translateY, variant]);
  const showImage = Boolean(image && !imageError);
  const bgColor = iconBackgroundColor ?? colors.primaryTint;
  const isCompact = variant === 'compact';
  const isCompactGrid = variant === 'compactGrid';

  if (isCompactGrid) {
    const gridCard = (
      <View
        style={[
          styles.cardGrid,
          surfaceTint ? { backgroundColor: surfaceTint } : null,
          style,
        ]}
      >
        <View style={[styles.iconGrid, styles.imageContainer, { backgroundColor: bgColor }]}>
          {showImage && image ? (
            <Image
              source={image}
              style={styles.cardImage}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <Ionicons name={icon} size={20} color={color} />
          )}
        </View>
        <Text style={styles.countGrid}>{count}</Text>
        <Text style={styles.titleGrid} numberOfLines={2}>
          {title}
        </Text>
      </View>
    );
    const animatedGrid = (
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>{gridCard}</Animated.View>
    );
    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} testID={testID} activeOpacity={0.72}>
          {animatedGrid}
        </TouchableOpacity>
      );
    }
    return <View testID={testID}>{animatedGrid}</View>;
  }

  const CardContent = (
    <View
      style={[
        styles.card,
        isCompact ? styles.cardCompact : null,
        isCompact && surfaceTint ? { backgroundColor: surfaceTint } : null,
        !isCompact ? { borderLeftColor: color } : null,
        style,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          styles.imageContainer,
          { backgroundColor: bgColor },
          isCompact ? styles.iconContainerCompact : null,
        ]}
      >
        {showImage && image ? (
          <Image source={image} style={styles.cardImage} resizeMode="cover" onError={() => setImageError(true)} />
        ) : (
          <Ionicons name={icon} size={isCompact ? 22 : 32} color={color} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.count, isCompact && styles.countCompact]}>{count}</Text>
        <Text style={[styles.title, isCompact && styles.titleCompact]} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </View>
  );

  const animatedContent = (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>{CardContent}</Animated.View>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} testID={testID} activeOpacity={0.72}>
        {animatedContent}
      </TouchableOpacity>
    );
  }

  return <View testID={testID}>{animatedContent}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderLeftWidth: 3,
    ...shadow.cardRaised,
  },
  cardCompact: {
    borderLeftWidth: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minWidth: 148,
    maxWidth: 168,
    marginRight: spacing.sm,
    marginVertical: 0,
    ...shadow.cardSubtle,
  },
  /** Equal-width column tile for home “At a glance” row */
  cardGrid: {
    width: '100%',
    minHeight: 108,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.cardSubtle,
  },
  iconGrid: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  countGrid: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  titleGrid: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  iconContainerCompact: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    marginRight: spacing.xs,
  },
  imageContainer: {
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  count: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  countCompact: {
    fontSize: 22,
    marginBottom: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
  titleCompact: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageSourcePropType, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, typography } from '../../theme';

interface SummaryCardProps {
  title: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  /** Optional background tint for the icon panel (e.g. statusExpiringSoonBg). Makes the icon area more representative. */
  iconBackgroundColor?: string;
  /** Optional representative image. When set and loaded, shown instead of icon; icon is fallback. */
  image?: ImageSourcePropType;
  onPress?: () => void;
  testID?: string;
  /** Optional delay in ms for staggered entrance (e.g. index * 50). */
  entranceDelay?: number;
  /** When 'hero', uses vertical layout (icon on top, count, title) and glassmorphism styling for homepage. */
  variant?: 'default' | 'hero';
}

export default function SummaryCard({ title, count, icon, color, iconBackgroundColor, image, onPress, testID, entranceDelay = 0, variant = 'default' }: SummaryCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    }, entranceDelay);
    return () => clearTimeout(timer);
  }, [entranceDelay, opacity, translateY]);
  const showImage = Boolean(image && !imageError);
  const bgColor = iconBackgroundColor ?? colors.primaryTint;
  const isHero = variant === 'hero';

  const CardContent = isHero ? (
    <View style={[styles.cardHero, { shadowColor: color }]}>
      <View style={[styles.iconCircleHero, { backgroundColor: bgColor, shadowColor: color }]}>
        {showImage ? (
          <Image
            source={image!}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Ionicons name={icon} size={28} color={color} />
        )}
      </View>
      <Text style={[styles.countHero, { color }]}>{count}</Text>
      <Text style={styles.titleHero}>{title}</Text>
    </View>
  ) : (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={[styles.iconContainer, styles.imageContainer, { backgroundColor: bgColor }]}>
        {showImage ? (
          <Image
            source={image}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Ionicons name={icon} size={32} color={color} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );

  const animatedContent = (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {CardContent}
    </Animated.View>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} testID={testID} activeOpacity={0.7}>
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
    borderRadius: 14,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderLeftWidth: 4,
    ...shadow.cardRaised,
  },
  cardHero: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xxs,
    minWidth: 0,
    flex: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircleHero: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 2,
  },
  countHero: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  titleHero: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
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
  title: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
});

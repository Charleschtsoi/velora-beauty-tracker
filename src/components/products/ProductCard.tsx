import React, { useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Product } from '../../types/product.types';
import { getExpirationStatus, formatDate } from '../../utils/dateHelpers';
import { ExpirationStatus } from '../../types/product.types';
import { colors, spacing, radius, shadow, typography } from '../../theme';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  testID?: string;
  /** Optional delay in ms for staggered entrance (e.g. index * 50). */
  entranceDelay?: number;
}

const getStatusColor = (status: ExpirationStatus): string => {
  switch (status) {
    case ExpirationStatus.EXPIRED:
      return colors.statusExpired;
    case ExpirationStatus.EXPIRING_SOON:
      return colors.statusExpiringSoon;
    case ExpirationStatus.WARNING:
      return colors.statusWarning;
    case ExpirationStatus.SAFE:
      return colors.statusSafe;
    default:
      return colors.statusMuted;
  }
};

const getStatusTint = (status: ExpirationStatus): string => {
  switch (status) {
    case ExpirationStatus.EXPIRED:
      return colors.statusExpiredBg;
    case ExpirationStatus.EXPIRING_SOON:
      return colors.statusExpiringSoonBg;
    case ExpirationStatus.WARNING:
      return colors.statusWarningBg;
    case ExpirationStatus.SAFE:
      return colors.statusSafeBg;
    default:
      return colors.surfaceMuted;
  }
};

export default function ProductCard({ product, onPress, testID, entranceDelay = 0 }: ProductCardProps) {
  const status = getExpirationStatus(product.expirationDate);
  const statusColor = getStatusColor(status);
  const statusTint = getStatusTint(status);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    }, entranceDelay);
    return () => clearTimeout(timer);
  }, [entranceDelay, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.72} testID={testID}>
        {product.photoUrl ? (
          <Image source={{ uri: product.photoUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>{product.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          {product.brand ? (
            <Text style={styles.brand} numberOfLines={1}>
              {product.brand}
            </Text>
          ) : null}
          <View style={[styles.expiryPill, { backgroundColor: statusTint }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.expiryText, { color: colors.textPrimary }]}>Expires {formatDate(product.expirationDate)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const IMAGE_SIZE = 88;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.card,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: radius.lg,
    marginRight: spacing.md,
    backgroundColor: colors.surfaceMuted,
  },
  imagePlaceholder: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: radius.lg,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.mintSoft,
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    minHeight: IMAGE_SIZE,
  },
  name: {
    ...typography.bodyLargeStrong,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
    letterSpacing: -0.2,
  },
  brand: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  expiryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  expiryText: {
    ...typography.caption,
    fontWeight: '600',
  },
});

import React, { useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      return colors.accentGold;
    case ExpirationStatus.WARNING:
      return colors.statusWarning;
    case ExpirationStatus.SAFE:
      return colors.statusSafe;
    default:
      return colors.statusMuted;
  }
};

export default function ProductCard({ product, onPress, testID, entranceDelay = 0 }: ProductCardProps) {
  const status = getExpirationStatus(product.expirationDate);
  const statusColor = getStatusColor(status);
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
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.72}
      testID={testID}
    >
      {product.photoUrl ? (
        <Image source={{ uri: product.photoUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>
            {product.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        {product.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
        )}
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{formatDate(product.expirationDate)}</Text>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} style={styles.chevron} />
    </TouchableOpacity>
    </Animated.View>
  );
}

const THUMB_SIZE = 60;
const THUMB_RADIUS = 10;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    ...shadow.cardSubtle,
  },
  image: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_RADIUS,
    marginRight: spacing.sm,
    ...shadow.cardSubtle,
  },
  imagePlaceholder: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_RADIUS,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryTint,
    ...shadow.cardSubtle,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...typography.bodyLargeStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  brand: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});

import React, { useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, ProductCategory } from '../../types/product.types';
import { getExpirationStatus, formatDate, getDaysUntilExpiration } from '../../utils/dateHelpers';
import { ExpirationStatus } from '../../types/product.types';
import { colors, spacing, radius, shadow, typography } from '../../theme';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.SKINCARE]: 'Skincare',
  [ProductCategory.MAKEUP]: 'Makeup',
  [ProductCategory.HAIRCARE]: 'Haircare',
  [ProductCategory.FRAGRANCE]: 'Fragrance',
  [ProductCategory.BODYCARE]: 'Bodycare',
  [ProductCategory.NAILCARE]: 'Nailcare',
  [ProductCategory.OTHER]: 'Other',
};

interface ProductListItemProps {
  product: Product;
  onPress: () => void;
  onDelete?: () => void;
  compact?: boolean;
  testID?: string;
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

const IMAGE_SIZE_DEFAULT = 76;
const IMAGE_SIZE_COMPACT = 44;

export default function ProductListItem({
  product,
  onPress,
  onDelete,
  compact = false,
  testID,
  entranceDelay = 0,
}: ProductListItemProps) {
  const status = getExpirationStatus(product.expirationDate);
  const daysUntil = getDaysUntilExpiration(product.expirationDate);
  const statusColor = getStatusColor(status);
  const statusTint = getStatusTint(status);
  const categoryLabel = CATEGORY_LABELS[product.category];

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]).start();
    }, entranceDelay);
    return () => clearTimeout(timer);
  }, [entranceDelay, opacity, translateY]);

  const imageSize = compact ? IMAGE_SIZE_COMPACT : IMAGE_SIZE_DEFAULT;
  const imageStyle = [styles.image, { width: imageSize, height: imageSize, borderRadius: compact ? radius.md : radius.lg }];
  const placeholderStyle = [
    styles.imagePlaceholder,
    { width: imageSize, height: imageSize, borderRadius: compact ? radius.md : radius.lg },
  ];

  const expiryLabel = compact
    ? daysUntil >= 0
      ? `${daysUntil}d left`
      : `${Math.abs(daysUntil)}d ago`
    : `Expires ${formatDate(product.expirationDate)}`;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        style={[styles.container, compact && styles.containerCompact]}
        onPress={onPress}
        activeOpacity={0.72}
        testID={testID}
      >
        <View style={[styles.imageColumn, { width: imageSize, marginRight: compact ? spacing.sm : spacing.md }]}>
          {product.photoUrl ? (
            <Image source={{ uri: product.photoUrl }} style={imageStyle} />
          ) : (
            <View style={placeholderStyle}>
              {compact ? (
                <Ionicons name="cube-outline" size={20} color={colors.primary} />
              ) : (
                <Text style={styles.placeholderLetter}>{product.name.charAt(0).toUpperCase()}</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.infoContainer} pointerEvents="box-none">
          <Text style={compact ? styles.productNameCompact : styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          {!compact && product.brand ? (
            <Text style={styles.brand} numberOfLines={1}>
              {product.brand}
            </Text>
          ) : null}
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{categoryLabel}</Text>
          </View>
          <View style={[styles.expiryPill, { backgroundColor: statusTint }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.expiryText}>{expiryLabel}</Text>
          </View>
        </View>

        {onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="delete-button"
            accessibilityLabel="Remove product"
          >
            <Ionicons name="trash-outline" size={compact ? 18 : 20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.card,
  },
  containerCompact: {
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: radius.lg,
  },
  imageColumn: {
    alignItems: 'center',
  },
  image: {
    backgroundColor: colors.surfaceMuted,
  },
  imagePlaceholder: {
    backgroundColor: colors.mintSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLetter: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.primary,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  productName: {
    ...typography.bodyLargeStrong,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
    letterSpacing: -0.2,
  },
  productNameCompact: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  brand: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.heroTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryPillText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
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
    color: colors.textPrimary,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});

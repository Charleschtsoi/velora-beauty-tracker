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
  /** Optional delay in ms for staggered entrance (e.g. index * 40). */
  entranceDelay?: number;
}

const getStatusConfig = (status: ExpirationStatus, daysUntil: number) => {
  switch (status) {
    case ExpirationStatus.EXPIRED:
      return { text: 'Expired', color: colors.statusExpired, bgColor: colors.statusExpiredBg };
    case ExpirationStatus.EXPIRING_SOON:
      if (daysUntil === 0) {
        return { text: 'Expires today', color: colors.statusExpiringSoon, bgColor: colors.statusExpiringSoonBg };
      }
      return { text: 'Expiring', color: colors.statusExpiringSoon, bgColor: colors.statusExpiringSoonBg };
    case ExpirationStatus.WARNING:
      return { text: 'Warning', color: colors.statusWarning, bgColor: colors.statusWarningBg };
    case ExpirationStatus.SAFE:
      return { text: 'Safe', color: colors.statusSafe, bgColor: colors.statusSafeBg };
    default:
      return { text: '—', color: colors.statusMuted, bgColor: colors.statusMutedBg };
  }
};

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
  const statusConfig = getStatusConfig(status, daysUntil);
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

  const containerStyle = compact ? [styles.container, styles.containerCompact] : styles.container;
  const imageSize = compact ? 44 : 60;
  const imageStyle = [styles.image, compact && { width: imageSize, height: imageSize }];
  const placeholderStyle = [styles.imagePlaceholder, compact && { width: imageSize, height: imageSize }];

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      activeOpacity={0.72}
      testID={testID}
    >
      {/* Image column */}
      <View style={[styles.imageColumn, compact && styles.imageColumnCompact]}>
        <View style={styles.imageContainer}>
          {product.photoUrl ? (
            <Image source={{ uri: product.photoUrl }} style={imageStyle} />
          ) : (
            <View style={placeholderStyle}>
              <Ionicons name="cube-outline" size={compact ? 20 : 24} color={colors.primary} />
            </View>
          )}
        </View>
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer} pointerEvents="box-none">
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>
        <View style={styles.titleRow} pointerEvents="box-none">
          <Text style={compact ? styles.productNameCompact : styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
        </View>
        <View style={styles.categoryRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{categoryLabel}</Text>
          </View>
        </View>
        {!compact && product.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
        )}
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={compact ? 12 : 14} color={colors.textSecondary} />
          <Text style={compact ? styles.expiryDateCompact : styles.expiryDate}>
            {compact
              ? daysUntil >= 0
                ? `${daysUntil} ${daysUntil === 1 ? 'day' : 'days'} left`
                : `Expired ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? 'day' : 'days'} ago`
              : `Expires: ${formatDate(product.expirationDate)}`}
          </Text>
        </View>
      </View>

      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          testID="delete-button"
        >
          <Ionicons name="trash-outline" size={20} color={colors.white} />
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
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    ...shadow.cardSubtle,
  },
  containerCompact: {
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  imageColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    width: 60,
    marginRight: spacing.sm,
  },
  imageColumnCompact: {
    width: 44,
  },
  imageContainer: {},
  image: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    minWidth: 0,
    marginBottom: 2,
  },
  productName: {
    flex: 1,
    minWidth: 0,
    ...typography.bodyLargeStrong,
    color: colors.textPrimary,
  },
  productNameCompact: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  categoryPill: {
    flexShrink: 0,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  brand: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  expiryDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  expiryDateCompact: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  deleteButton: {
    backgroundColor: colors.destructive,
    width: 50,
    height: 50,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});

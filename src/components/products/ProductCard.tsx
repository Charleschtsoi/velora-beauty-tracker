import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../../types/product.types';
import { getExpirationStatus, formatDate } from '../../utils/dateHelpers';
import { ExpirationStatus } from '../../types/product.types';
import { colors, spacing, radius, shadow, typography } from '../../theme';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  testID?: string;
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

export default function ProductCard({ product, onPress, testID }: ProductCardProps) {
  const status = getExpirationStatus(product.expirationDate);
  const statusColor = getStatusColor(status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
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
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.date}>
            Expires: {formatDate(product.expirationDate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    ...shadow.card,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryTint,
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
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

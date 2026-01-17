import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types/product.types';
import { getExpirationStatus, formatDate, getDaysUntilExpiration } from '../../utils/dateHelpers';
import { ExpirationStatus } from '../../types/product.types';

interface ProductListItemProps {
  product: Product;
  onPress: () => void;
  onDelete?: () => void;
  testID?: string;
}

const getStatusConfig = (status: ExpirationStatus, daysUntil: number) => {
  switch (status) {
    case ExpirationStatus.EXPIRED:
      return { text: 'EXPIRED', color: '#ef4444', bgColor: '#fee2e2' };
    case ExpirationStatus.EXPIRING_SOON:
      if (daysUntil === 0) {
        return { text: 'EXPIRES TODAY', color: '#f97316', bgColor: '#fed7aa' };
      }
      return { text: 'EXPIRING SOON', color: '#f97316', bgColor: '#fed7aa' };
    case ExpirationStatus.WARNING:
      return { text: 'WARNING', color: '#fbbf24', bgColor: '#fef3c7' };
    case ExpirationStatus.SAFE:
      return { text: 'SAFE', color: '#10b981', bgColor: '#d1fae5' };
    default:
      return { text: 'UNKNOWN', color: '#6b7280', bgColor: '#f3f4f6' };
  }
};

export default function ProductListItem({
  product,
  onPress,
  onDelete,
  testID,
}: ProductListItemProps) {
  const status = getExpirationStatus(product.expirationDate);
  const daysUntil = getDaysUntilExpiration(product.expirationDate);
  const statusConfig = getStatusConfig(status, daysUntil);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.photoUrl ? (
          <Image source={{ uri: product.photoUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="cube-outline"
              size={24}
              color="#10b981"
            />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>
        {product.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
        )}
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color="#6b7280" />
          <Text style={styles.expiryDate}>
            Expires: {formatDate(product.expirationDate)}
          </Text>
        </View>
      </View>

      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: statusConfig.bgColor },
        ]}
      >
        <Text style={[styles.statusText, { color: statusConfig.color }]}>
          {statusConfig.text}
        </Text>
      </View>

      {/* Delete Button (shown on swipe or long press) */}
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          testID="delete-button"
        >
          <Ionicons name="trash-outline" size={20} color="#ffffff" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

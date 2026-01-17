import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../../types/product.types';
import { getExpirationStatus, formatDate } from '../../utils/dateHelpers';
import { ExpirationStatus } from '../../types/product.types';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  testID?: string;
}

const getStatusColor = (status: ExpirationStatus): string => {
  switch (status) {
    case ExpirationStatus.EXPIRED:
      return '#ef4444';
    case ExpirationStatus.EXPIRING_SOON:
      return '#f97316';
    case ExpirationStatus.WARNING:
      return '#fbbf24';
    case ExpirationStatus.SAFE:
      return '#10b981';
    default:
      return '#6b7280';
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
        <View style={[styles.imagePlaceholder, { backgroundColor: '#f0fdf4' }]}>
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#10b981',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
  },
});

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types/product.types';
import { formatDate, getDaysUntilExpiration } from '../../utils/dateHelpers';

interface NotificationCardProps {
  product: Product;
  onPress: () => void;
  onMarkAsRead?: () => void;
  isRead?: boolean;
  testID?: string;
}

export default function NotificationCard({
  product,
  onPress,
  onMarkAsRead,
  isRead = false,
  testID,
}: NotificationCardProps) {
  const daysUntil = getDaysUntilExpiration(product.expirationDate);
  
  const getUrgencyColor = () => {
    if (daysUntil < 0) return '#ef4444'; // Expired
    if (daysUntil === 0) return '#f97316'; // Expires today
    if (daysUntil === 1) return '#f97316'; // Expires in 1 day
    if (daysUntil <= 3) return '#fbbf24'; // Expires in 3 days
    return '#10b981'; // More than 3 days
  };

  const getUrgencyText = () => {
    if (daysUntil < 0) return `Expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago`;
    if (daysUntil === 0) return 'Expires today';
    if (daysUntil === 1) return 'Expires in 1 day';
    if (daysUntil <= 3) return `Expires in ${daysUntil} days`;
    return `Expires in ${daysUntil} days`;
  };

  return (
    <TouchableOpacity
      style={[styles.container, isRead && styles.readContainer]}
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
            <Ionicons name="cube-outline" size={20} color="#10b981" />
          </View>
        )}
      </View>

      {/* Notification Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.productName, isRead && styles.readText]} numberOfLines={1}>
            {product.name}
          </Text>
          {onMarkAsRead && !isRead && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onMarkAsRead();
              }}
              style={styles.markReadButton}
              testID="mark-read-button"
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        {product.brand && (
          <Text style={[styles.brand, isRead && styles.readText]} numberOfLines={1}>
            {product.brand}
          </Text>
        )}
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color="#6b7280" />
          <Text style={styles.expiryDate}>
            {formatDate(product.expirationDate)}
          </Text>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor() + '20' }]}>
          <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor() }]} />
          <Text style={[styles.urgencyText, { color: getUrgencyColor() }]}>
            {getUrgencyText()}
          </Text>
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
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
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  readContainer: {
    opacity: 0.6,
    borderLeftColor: '#d1d5db',
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  imagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  readText: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  markReadButton: {
    padding: 4,
    marginLeft: 8,
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
    marginBottom: 6,
  },
  expiryDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

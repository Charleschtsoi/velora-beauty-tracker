import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Product } from '../../types/product.types';
import { getDaysUntilExpiration, getExpirationStatus } from '../../utils/dateHelpers';
import { ExpirationStatus } from '../../types/product.types';

interface ExpirationIndicatorProps {
  product: Product;
  showDays?: boolean;
  showStatus?: boolean;
  size?: 'small' | 'medium' | 'large';
  testID?: string;
}

export default function ExpirationIndicator({
  product,
  showDays = true,
  showStatus = true,
  size = 'medium',
  testID,
}: ExpirationIndicatorProps) {
  const daysUntil = getDaysUntilExpiration(product.expirationDate);
  const status = getExpirationStatus(product.expirationDate);

  const getStatusConfig = () => {
    switch (status) {
      case ExpirationStatus.EXPIRED:
        return { color: '#ef4444', bgColor: '#fee2e2', text: 'Expired' };
      case ExpirationStatus.EXPIRING_SOON:
        return { color: '#f97316', bgColor: '#fed7aa', text: 'Expiring' };
      case ExpirationStatus.WARNING:
        return { color: '#fbbf24', bgColor: '#fef3c7', text: 'Warning' };
      case ExpirationStatus.SAFE:
        return { color: '#10b981', bgColor: '#d1fae5', text: 'Safe' };
      default:
        return { color: '#6b7280', bgColor: '#f3f4f6', text: 'Unknown' };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: 12, dotSize: 6, padding: 4 };
      case 'medium':
        return { fontSize: 14, dotSize: 8, padding: 6 };
      case 'large':
        return { fontSize: 16, dotSize: 10, padding: 8 };
      default:
        return { fontSize: 14, dotSize: 8, padding: 6 };
    }
  };

  const statusConfig = getStatusConfig();
  const sizeStyles = getSizeStyles();

  const getDaysText = () => {
    if (daysUntil < 0) {
      return `Expired ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? 'day' : 'days'} ago`;
    }
    if (daysUntil === 0) {
      return 'Expires today';
    }
    return `${daysUntil} ${daysUntil === 1 ? 'day' : 'days'} until expiry`;
  };

  return (
    <View style={styles.container} testID={testID}>
      {showDays && (
        <Text
          style={[
            styles.daysText,
            { fontSize: sizeStyles.fontSize, color: statusConfig.color },
          ]}
        >
          {getDaysText()}
        </Text>
      )}
      {showStatus && (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusConfig.bgColor,
              paddingHorizontal: sizeStyles.padding,
              paddingVertical: sizeStyles.padding / 2,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: statusConfig.color,
                width: sizeStyles.dotSize,
                height: sizeStyles.dotSize,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { fontSize: sizeStyles.fontSize - 2, color: statusConfig.color },
            ]}
          >
            {statusConfig.text}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  daysText: {
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    borderRadius: 999,
  },
  statusText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

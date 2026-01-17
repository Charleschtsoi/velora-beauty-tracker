import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExpirationStatus } from '../../types/product.types';

interface StatusBadgeProps {
  status: ExpirationStatus;
  size?: 'small' | 'medium' | 'large';
  testID?: string;
}

const getStatusConfig = (status: ExpirationStatus) => {
  switch (status) {
    case ExpirationStatus.EXPIRED:
      return { text: 'Expired', color: '#ef4444', bgColor: '#fee2e2' };
    case ExpirationStatus.EXPIRING_SOON:
      return { text: 'Expiring Soon', color: '#f97316', bgColor: '#fed7aa' };
    case ExpirationStatus.WARNING:
      return { text: 'Warning', color: '#fbbf24', bgColor: '#fef3c7' };
    case ExpirationStatus.SAFE:
      return { text: 'Safe', color: '#10b981', bgColor: '#d1fae5' };
    default:
      return { text: 'Unknown', color: '#6b7280', bgColor: '#f3f4f6' };
  }
};

export default function StatusBadge({ status, size = 'medium', testID }: StatusBadgeProps) {
  const config = getStatusConfig(status);

  const sizeStyles = {
    small: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 11,
    },
    medium: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 12,
    },
    large: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
    },
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bgColor },
        sizeStyles[size],
      ]}
      testID={testID}
    >
      <Text style={[styles.text, { color: config.color }, { fontSize: sizeStyles[size].fontSize }]}>
        {config.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

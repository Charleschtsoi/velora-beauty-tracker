import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExpirationStatus } from '../../types/product.types';
import { colors } from '../../theme';

interface StatusBadgeProps {
  status: ExpirationStatus;
  size?: 'small' | 'medium' | 'large';
  testID?: string;
}

const getStatusConfig = (status: ExpirationStatus) => {
  switch (status) {
    case ExpirationStatus.EXPIRED:
      return { text: 'Expired', color: colors.statusExpired, bgColor: colors.statusExpiredBg };
    case ExpirationStatus.EXPIRING_SOON:
      return { text: 'Expiring', color: colors.statusExpiringSoon, bgColor: colors.statusExpiringSoonBg };
    case ExpirationStatus.WARNING:
      return { text: 'Warning', color: colors.statusWarning, bgColor: colors.statusWarningBg };
    case ExpirationStatus.SAFE:
      return { text: 'Safe', color: colors.statusSafe, bgColor: colors.statusSafeBg };
    default:
      return { text: 'Unknown', color: colors.statusMuted, bgColor: colors.statusMutedBg };
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

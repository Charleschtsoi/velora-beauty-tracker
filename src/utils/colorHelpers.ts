import { ExpirationStatus } from '../types/product.types';

/**
 * Get color for expiration status
 */
export const getStatusColor = (status: ExpirationStatus): string => {
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

/**
 * Get background color for expiration status
 */
export const getStatusBgColor = (status: ExpirationStatus): string => {
  switch (status) {
    case ExpirationStatus.EXPIRED:
      return '#fee2e2';
    case ExpirationStatus.EXPIRING_SOON:
      return '#fed7aa';
    case ExpirationStatus.WARNING:
      return '#fef3c7';
    case ExpirationStatus.SAFE:
      return '#d1fae5';
    default:
      return '#f3f4f6';
  }
};

/**
 * Get category color
 */
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    skincare: '#10b981',
    makeup: '#f97316',
    haircare: '#8b5cf6',
    fragrance: '#ec4899',
    bodycare: '#06b6d4',
    nailcare: '#f59e0b',
    other: '#6b7280',
  };
  return colors[category.toLowerCase()] || colors.other;
};

import { useMemo } from 'react';
import { useProducts } from '../context/ProductContext';
import { getDaysUntilExpiration } from '../utils/dateHelpers';
import { Product } from '../types/product.types';

/**
 * Custom hook for notification-related functionality
 */
export const useNotifications = () => {
  const { products } = useProducts();

  // Get products that need notifications
  const expiringProducts = useMemo(() => {
    return products.filter((product) => {
      const daysUntil = getDaysUntilExpiration(product.expirationDate);
      return daysUntil <= 3 && daysUntil >= -7; // Within 3 days or expired within last week
    });
  }, [products]);

  const expiredProducts = useMemo(() => {
    return products.filter((product) => {
      const daysUntil = getDaysUntilExpiration(product.expirationDate);
      return daysUntil < 0;
    });
  }, [products]);

  const expiringSoonProducts = useMemo(() => {
    return products.filter((product) => {
      const daysUntil = getDaysUntilExpiration(product.expirationDate);
      return daysUntil >= 0 && daysUntil <= 3;
    });
  }, [products]);

  return {
    expiringProducts,
    expiredProducts,
    expiringSoonProducts,
    totalNotifications: expiringProducts.length,
  };
};

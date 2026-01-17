import { Product } from '../types/product.types';
import { supabase } from './supabase';
import { getDaysUntilExpiration } from '../utils/dateHelpers';

/**
 * Get products that need notifications
 */
export const getProductsNeedingNotifications = async (userId: string): Promise<Product[]> => {
  // TODO: Replace with real Supabase call
  // const { data, error } = await supabase
  //   .from('products')
  //   .select('*')
  //   .eq('user_id', userId);
  // 
  // if (error) throw error;
  // 
  // return data
  //   .map(convertProductDates)
  //   .filter((product) => {
  //     const daysUntil = getDaysUntilExpiration(product.expirationDate);
  //     return daysUntil <= 3 && daysUntil >= -7; // Within 3 days or expired within last week
  //   });

  // Mock implementation
  return Promise.resolve([]);
};

/**
 * Group products by expiration urgency
 */
export const groupProductsByExpiration = (products: Product[]) => {
  const expired: Product[] = [];
  const expiringIn1Day: Product[] = [];
  const expiringIn3Days: Product[] = [];

  products.forEach((product) => {
    const daysUntil = getDaysUntilExpiration(product.expirationDate);
    
    if (daysUntil < 0) {
      expired.push(product);
    } else if (daysUntil === 0 || daysUntil === 1) {
      expiringIn1Day.push(product);
    } else if (daysUntil <= 3) {
      expiringIn3Days.push(product);
    }
  });

  return {
    expired,
    expiringIn1Day,
    expiringIn3Days,
  };
};

/**
 * Mark notification as read (future implementation)
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  // TODO: Implement when notification table is created
  // const { error } = await supabase
  //   .from('notifications')
  //   .update({ read: true })
  //   .eq('id', notificationId);
  // 
  // if (error) throw error;
  
  // Notification marked as read
};

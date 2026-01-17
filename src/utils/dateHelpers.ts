import { ExpirationStatus } from '../types/product.types';

export const getExpirationStatus = (expirationDate: Date): ExpirationStatus => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  
  const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiration < 0) return ExpirationStatus.EXPIRED;
  if (daysUntilExpiration <= 30) return ExpirationStatus.EXPIRING_SOON;
  if (daysUntilExpiration <= 60) return ExpirationStatus.WARNING;
  return ExpirationStatus.SAFE;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const getDaysUntilExpiration = (expirationDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  
  return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

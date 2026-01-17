export interface Product {
  id: string;
  userId: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  
  // Dates
  purchaseDate?: Date;
  expirationDate: Date;
  openedDate?: Date;
  paoMonths?: number; // Period After Opening in months
  
  // Storage & Organization
  location?: string; // e.g., "Bathroom Cabinet", "Bedroom Drawer"
  barcode?: string;
  
  // Media
  photoUrl?: string;
  
  // Tracking
  usageCount?: number;
  notes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export enum ProductCategory {
  SKINCARE = 'skincare',
  MAKEUP = 'makeup',
  HAIRCARE = 'haircare',
  FRAGRANCE = 'fragrance',
  BODYCARE = 'bodycare',
  NAILCARE = 'nailcare',
  OTHER = 'other'
}

export enum ExpirationStatus {
  EXPIRED = 'expired',      // Past expiration date
  EXPIRING_SOON = 'expiring_soon',  // Within 30 days
  WARNING = 'warning',      // Within 60 days
  SAFE = 'safe'             // More than 60 days
}

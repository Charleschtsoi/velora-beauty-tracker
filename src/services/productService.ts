import { Product } from '../types/product.types';
import { supabase } from './supabase';

// Mock data for initial development
// TODO: Replace with real Supabase queries when ready

// Demo data for presentation - 10 realistic beauty products
const mockProducts: Product[] = [
  // 2 EXPIRED products
  {
    id: '1',
    userId: 'demo-user',
    name: 'Niacinamide 10% + Zinc',
    brand: 'The Ordinary',
    category: 'skincare',
    expirationDate: new Date('2025-01-10'), // Expired
    purchaseDate: new Date('2024-06-01'),
    openedDate: new Date('2024-06-15'),
    paoMonths: 6,
    location: 'Bathroom Cabinet',
    photoUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
    usageCount: 42,
    notes: 'Great for reducing pores and oil control',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '2',
    userId: 'demo-user',
    name: 'Matte Lipstick',
    brand: 'MAC Cosmetics',
    category: 'makeup',
    expirationDate: new Date('2025-01-05'), // Expired
    purchaseDate: new Date('2024-08-15'),
    openedDate: new Date('2024-08-20'),
    paoMonths: 12,
    location: 'Makeup Bag',
    photoUrl: 'https://images.unsplash.com/photo-1583241800619-2d0d3e07b4c5?w=400',
    usageCount: 25,
    notes: 'Ruby Woo shade - favorite red',
    createdAt: new Date('2024-08-15'),
    updatedAt: new Date('2024-08-15'),
  },
  // 3 EXPIRING SOON products
  {
    id: '3',
    userId: 'demo-user',
    name: 'Hyaluronic Acid Serum',
    brand: 'The Ordinary',
    category: 'skincare',
    expirationDate: new Date('2026-02-12'), // Expiring soon (within 30 days)
    purchaseDate: new Date('2025-11-01'),
    openedDate: new Date('2025-11-10'),
    paoMonths: 6,
    location: 'Bathroom Cabinet',
    photoUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
    usageCount: 18,
    notes: 'Apply on damp skin for best results',
    createdAt: new Date('2025-11-01'),
    updatedAt: new Date('2025-11-01'),
  },
  {
    id: '4',
    userId: 'demo-user',
    name: 'Volume Mascara',
    brand: 'L\'Oréal',
    category: 'makeup',
    expirationDate: new Date('2026-02-20'), // Expiring soon
    purchaseDate: new Date('2025-10-15'),
    openedDate: new Date('2025-10-18'),
    paoMonths: 3,
    location: 'Makeup Bag',
    photoUrl: 'https://images.unsplash.com/photo-1631210867761-65e61b0eab3c?w=400',
    usageCount: 60,
    notes: 'Waterproof formula',
    createdAt: new Date('2025-10-15'),
    updatedAt: new Date('2025-10-15'),
  },
  {
    id: '5',
    userId: 'demo-user',
    name: 'Repairing Shampoo',
    brand: 'Olaplex',
    category: 'haircare',
    expirationDate: new Date('2026-02-25'), // Expiring soon
    purchaseDate: new Date('2025-09-20'),
    openedDate: new Date('2025-09-25'),
    paoMonths: 12,
    location: 'Shower',
    photoUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    usageCount: 35,
    notes: 'For damaged hair - use weekly',
    createdAt: new Date('2025-09-20'),
    updatedAt: new Date('2025-09-20'),
  },
  // 5 SAFE products
  {
    id: '6',
    userId: 'demo-user',
    name: 'Vitamin C Brightening Serum',
    brand: 'CeraVe',
    category: 'skincare',
    expirationDate: new Date('2026-08-15'), // Safe
    purchaseDate: new Date('2025-12-01'),
    openedDate: new Date('2025-12-05'),
    paoMonths: 6,
    location: 'Bathroom Cabinet',
    photoUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
    usageCount: 12,
    notes: 'Use in morning routine',
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2025-12-01'),
  },
  {
    id: '7',
    userId: 'demo-user',
    name: 'Retinol Night Cream',
    brand: 'La Roche-Posay',
    category: 'skincare',
    expirationDate: new Date('2026-09-20'), // Safe
    purchaseDate: new Date('2025-11-15'),
    openedDate: new Date('2025-11-20'),
    paoMonths: 12,
    location: 'Bedroom Drawer',
    photoUrl: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400',
    usageCount: 20,
    notes: 'Apply before bed',
    createdAt: new Date('2025-11-15'),
    updatedAt: new Date('2025-11-15'),
  },
  {
    id: '8',
    userId: 'demo-user',
    name: 'Chance Eau de Parfum',
    brand: 'Chanel',
    category: 'fragrance',
    expirationDate: new Date('2027-06-10'), // Safe
    purchaseDate: new Date('2025-08-10'),
    openedDate: new Date('2025-08-12'),
    paoMonths: 36,
    location: 'Dresser Top',
    photoUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
    usageCount: 8,
    notes: 'Evening wear',
    createdAt: new Date('2025-08-10'),
    updatedAt: new Date('2025-08-10'),
  },
  {
    id: '9',
    userId: 'demo-user',
    name: 'Daily Moisturizer SPF 30',
    brand: 'Neutrogena',
    category: 'skincare',
    expirationDate: new Date('2026-10-05'), // Safe
    purchaseDate: new Date('2025-11-01'),
    openedDate: new Date('2025-11-02'),
    paoMonths: 12,
    location: 'Bathroom Cabinet',
    photoUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
    usageCount: 45,
    notes: 'Daily essential',
    createdAt: new Date('2025-11-01'),
    updatedAt: new Date('2025-11-01'),
  },
  {
    id: '10',
    userId: 'demo-user',
    name: 'Nourishing Hair Mask',
    brand: 'Moroccanoil',
    category: 'haircare',
    expirationDate: new Date('2026-11-18'), // Safe
    purchaseDate: new Date('2025-10-20'),
    openedDate: new Date('2025-10-25'),
    paoMonths: 24,
    location: 'Shower',
    photoUrl: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400',
    usageCount: 5,
    notes: 'Deep conditioning treatment',
    createdAt: new Date('2025-10-20'),
    updatedAt: new Date('2025-10-20'),
  },
];

// Convert date strings to Date objects for Supabase responses
const convertProductDates = (product: any): Product => {
  return {
    ...product,
    purchaseDate: product.purchase_date ? new Date(product.purchase_date) : undefined,
    expirationDate: new Date(product.expiration_date),
    openedDate: product.opened_date ? new Date(product.opened_date) : undefined,
    createdAt: new Date(product.created_at),
    updatedAt: new Date(product.updated_at),
    category: product.category as Product['category'],
    paoMonths: product.pao_months,
    photoUrl: product.photo_url,
    usageCount: product.usage_count,
    userId: product.user_id,
    barcode: product.barcode,
    location: product.location,
  };
};

/**
 * Fetch all products for the current user
 * 
 * Supabase Query Example:
 * const { data, error } = await supabase
 *   .from('products')
 *   .select('*')
 *   .order('created_at', { ascending: false });
 * 
 * if (error) throw error;
 * return data.map(convertProductDates);
 */
export const fetchProducts = async (): Promise<Product[]> => {
  // TODO: Uncomment when Supabase is configured
  // const { data, error } = await supabase
  //   .from('products')
  //   .select('*')
  //   .order('created_at', { ascending: false });
  // 
  // if (error) throw error;
  // return data ? data.map(convertProductDates) : [];

  // Mock implementation for now
  return Promise.resolve(mockProducts);
};

/**
 * Fetch recently added products (limit 3)
 * 
 * Supabase Query Example:
 * const { data, error } = await supabase
 *   .from('products')
 *   .select('*')
 *   .order('created_at', { ascending: false })
 *   .limit(3);
 */
export const fetchRecentProducts = async (limit: number = 3): Promise<Product[]> => {
  // TODO: Uncomment when Supabase is configured
  // const { data, error } = await supabase
  //   .from('products')
  //   .select('*')
  //   .order('created_at', { ascending: false })
  //   .limit(limit);
  // 
  // if (error) throw error;
  // return data ? data.map(convertProductDates) : [];

  // Mock implementation
  const products = await fetchProducts();
  return products.slice(0, limit);
};

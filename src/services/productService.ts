import { Product } from '../types/product.types';
import { supabase } from './supabase';

// Mock data for initial development / investor demo
// TODO: Replace with real Supabase queries when ready

/** Add days to today (at midnight) for stable demo dates relative to "now". */
const daysFromNow = (days: number): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

const now = new Date();
const baseCreated = (daysAgo: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d;
};

// Demo data: dates relative to today so "Expiring soon" and "Expired" always show correctly
const mockProducts: Product[] = [
  // —— EXPIRED (2) ——
  {
    id: '1',
    userId: 'demo-user',
    name: 'Niacinamide 10% + Zinc',
    brand: 'The Ordinary',
    category: 'skincare',
    expirationDate: daysFromNow(-8),
    purchaseDate: baseCreated(120),
    openedDate: baseCreated(105),
    paoMonths: 6,
    location: 'Bathroom Cabinet',
    photoUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
    usageCount: 42,
    notes: 'Great for reducing pores and oil control',
    createdAt: baseCreated(120),
    updatedAt: baseCreated(120),
  },
  {
    id: '2',
    userId: 'demo-user',
    name: 'Matte Lipstick',
    brand: 'MAC Cosmetics',
    category: 'makeup',
    expirationDate: daysFromNow(-3),
    purchaseDate: baseCreated(90),
    openedDate: baseCreated(85),
    paoMonths: 12,
    location: 'Makeup Bag',
    photoUrl: 'https://images.unsplash.com/photo-1583241800619-2d0d3e07b4c5?w=400',
    usageCount: 25,
    notes: 'Ruby Woo shade - favorite red',
    createdAt: baseCreated(90),
    updatedAt: baseCreated(90),
  },
  // —— EXPIRING SOON (within 30 days) ——
  {
    id: '3',
    userId: 'demo-user',
    name: 'Hyaluronic Acid 2% + B5',
    brand: 'The Ordinary',
    category: 'skincare',
    expirationDate: daysFromNow(5),
    purchaseDate: baseCreated(60),
    openedDate: baseCreated(55),
    paoMonths: 6,
    location: 'Bathroom Cabinet',
    photoUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
    usageCount: 18,
    notes: 'Apply on damp skin for best results',
    createdAt: baseCreated(60),
    updatedAt: baseCreated(60),
  },
  {
    id: '4',
    userId: 'demo-user',
    name: 'Volume Mascara',
    brand: "L'Oréal",
    category: 'makeup',
    expirationDate: daysFromNow(12),
    purchaseDate: baseCreated(70),
    openedDate: baseCreated(67),
    paoMonths: 3,
    location: 'Makeup Bag',
    photoUrl: 'https://images.unsplash.com/photo-1631210867761-65e61b0eab3c?w=400',
    usageCount: 60,
    notes: 'Waterproof formula',
    createdAt: baseCreated(70),
    updatedAt: baseCreated(70),
  },
  {
    id: '5',
    userId: 'demo-user',
    name: 'Repairing Shampoo',
    brand: 'Olaplex',
    category: 'haircare',
    expirationDate: daysFromNow(18),
    purchaseDate: baseCreated(80),
    openedDate: baseCreated(75),
    paoMonths: 12,
    location: 'Shower',
    photoUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    usageCount: 35,
    notes: 'For damaged hair - use weekly',
    createdAt: baseCreated(80),
    updatedAt: baseCreated(80),
  },
  {
    id: '6',
    userId: 'demo-user',
    name: 'Cicaplast Baume B5',
    brand: 'La Roche-Posay',
    category: 'skincare',
    expirationDate: daysFromNow(25),
    purchaseDate: baseCreated(45),
    openedDate: baseCreated(42),
    paoMonths: 6,
    location: 'Bathroom Cabinet',
    photoUrl: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400',
    usageCount: 22,
    notes: 'Soothing repair balm',
    createdAt: baseCreated(45),
    updatedAt: baseCreated(45),
  },
  {
    id: '7',
    userId: 'demo-user',
    name: 'Glow Recipe Watermelon Glow Niacinamide Dew Drops',
    brand: 'Glow Recipe',
    category: 'skincare',
    expirationDate: daysFromNow(30),
    purchaseDate: baseCreated(50),
    openedDate: baseCreated(48),
    paoMonths: 12,
    location: 'Bathroom Shelf',
    photoUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
    usageCount: 15,
    notes: 'Lightweight serum for glow',
    createdAt: baseCreated(50),
    updatedAt: baseCreated(50),
  },
  // —— SAFE (rest) ——
  {
    id: '8',
    userId: 'demo-user',
    name: 'Vitamin C Brightening Serum',
    brand: 'CeraVe',
    category: 'skincare',
    expirationDate: daysFromNow(90),
    purchaseDate: baseCreated(30),
    openedDate: baseCreated(26),
    paoMonths: 6,
    location: 'Bathroom Cabinet',
    photoUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
    usageCount: 12,
    notes: 'Use in morning routine',
    createdAt: baseCreated(30),
    updatedAt: baseCreated(30),
  },
  {
    id: '9',
    userId: 'demo-user',
    name: 'Chance Eau de Parfum',
    brand: 'Chanel',
    category: 'fragrance',
    expirationDate: daysFromNow(180),
    purchaseDate: baseCreated(100),
    openedDate: baseCreated(98),
    paoMonths: 36,
    location: 'Dresser Top',
    photoUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
    usageCount: 8,
    notes: 'Evening wear',
    createdAt: baseCreated(100),
    updatedAt: baseCreated(100),
  },
  {
    id: '10',
    userId: 'demo-user',
    name: 'Nourishing Hair Mask',
    brand: 'Moroccanoil',
    category: 'haircare',
    expirationDate: daysFromNow(200),
    purchaseDate: baseCreated(60),
    openedDate: baseCreated(55),
    paoMonths: 24,
    location: 'Shower',
    photoUrl: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400',
    usageCount: 5,
    notes: 'Deep conditioning treatment',
    createdAt: baseCreated(60),
    updatedAt: baseCreated(60),
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

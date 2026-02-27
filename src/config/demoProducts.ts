import { ProductCategory } from '../types/product.types';

/**
 * Demo products for investor demo. When no camera image is available (barcode scan or AI timeout),
 * demoPhotoUri is used so the product in inventory still has an image.
 */
export type DemoProductInput = {
  name: string;
  brand?: string;
  category: ProductCategory;
  expirationDate: Date;
  notes?: string;
  /** Optional image URL for the product when no photo is captured during scan. */
  demoPhotoUri?: string;
};

/** Neutrogena Hydro Boost – single demo product for recording (exp 2027-12-10). */
const NEUTROGENA_HYDRO_BOOST_IMAGE =
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400';

export const DEMO_PRODUCTS: DemoProductInput[] = [
  {
    name: 'Hydro Boost Hyaluronic Acid Water Gel',
    brand: 'Neutrogena',
    category: ProductCategory.SKINCARE,
    expirationDate: new Date('2027-12-10'),
    notes: 'Water gel 50g, hyaluronic acid, NMF complex.',
    demoPhotoUri: NEUTROGENA_HYDRO_BOOST_IMAGE,
  },
];

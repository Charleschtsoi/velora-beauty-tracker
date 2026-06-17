import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Product, ProductCategory } from '../types/product.types';
import { GUEST_USER_ID, isGuestUserId } from '../constants/auth';
import { supabase } from './supabase';

const PRODUCTS_STORAGE_KEY = '@hermes/products';
const DEMO_DATA_PURGED_KEY = '@hermes/demoDataPurgedV1';
const LOCAL_MIGRATED_KEY = '@hermes/localProductsMigratedV1';
const LEGACY_DEMO_USER_ID = 'demo-user';

type ProductRow = {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  category: string;
  purchase_date: string | null;
  expiration_date: string;
  opened_date: string | null;
  pao_months: number | null;
  location: string | null;
  barcode: string | null;
  photo_url: string | null;
  usage_count: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    brand: row.brand ?? undefined,
    category: row.category as ProductCategory,
    purchaseDate: row.purchase_date ? new Date(row.purchase_date) : undefined,
    expirationDate: new Date(row.expiration_date),
    openedDate: row.opened_date ? new Date(row.opened_date) : undefined,
    paoMonths: row.pao_months ?? undefined,
    location: row.location ?? undefined,
    barcode: row.barcode ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    usageCount: row.usage_count ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function productToInsertRow(
  userId: string,
  product: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) {
  return {
    user_id: userId,
    name: product.name,
    brand: product.brand ?? null,
    category: product.category,
    purchase_date: product.purchaseDate?.toISOString() ?? null,
    expiration_date: product.expirationDate.toISOString(),
    opened_date: product.openedDate?.toISOString() ?? null,
    pao_months: product.paoMonths ?? null,
    location: product.location ?? null,
    barcode: product.barcode ?? null,
    photo_url: product.photoUrl ?? null,
    usage_count: product.usageCount ?? 0,
    notes: product.notes ?? null,
  };
}

function productToUpdateRow(updates: Partial<Product>) {
  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.brand !== undefined) row.brand = updates.brand ?? null;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.purchaseDate !== undefined) {
    row.purchase_date = updates.purchaseDate?.toISOString() ?? null;
  }
  if (updates.expirationDate !== undefined) {
    row.expiration_date = updates.expirationDate.toISOString();
  }
  if (updates.openedDate !== undefined) {
    row.opened_date = updates.openedDate?.toISOString() ?? null;
  }
  if (updates.paoMonths !== undefined) row.pao_months = updates.paoMonths ?? null;
  if (updates.location !== undefined) row.location = updates.location ?? null;
  if (updates.barcode !== undefined) row.barcode = updates.barcode ?? null;
  if (updates.photoUrl !== undefined) row.photo_url = updates.photoUrl ?? null;
  if (updates.usageCount !== undefined) row.usage_count = updates.usageCount ?? 0;
  if (updates.notes !== undefined) row.notes = updates.notes ?? null;
  return row;
}

/** Serialize Product for local storage (dates to ISO strings). */
function productToStored(p: Product): Record<string, unknown> {
  return {
    ...p,
    purchaseDate: p.purchaseDate?.toISOString?.() ?? null,
    expirationDate: p.expirationDate?.toISOString?.() ?? null,
    openedDate: p.openedDate?.toISOString?.() ?? null,
    createdAt: p.createdAt?.toISOString?.() ?? null,
    updatedAt: p.updatedAt?.toISOString?.() ?? null,
  };
}

function storedToProduct(raw: Record<string, unknown>): Product {
  return {
    ...raw,
    purchaseDate: raw.purchaseDate ? new Date(raw.purchaseDate as string) : undefined,
    expirationDate: new Date(raw.expirationDate as string),
    openedDate: raw.openedDate ? new Date(raw.openedDate as string) : undefined,
    createdAt: new Date(raw.createdAt as string),
    updatedAt: new Date(raw.updatedAt as string),
  } as Product;
}

async function loadProductsFromStorage(): Promise<Product[] | null> {
  try {
    const raw = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw) as Record<string, unknown>[];
    if (!Array.isArray(arr)) return null;
    return arr.map(storedToProduct);
  } catch {
    return null;
  }
}

async function loadGuestProducts(): Promise<Product[]> {
  const stored = await loadProductsFromStorage();
  if (!stored?.length) return [];
  return stored
    .filter((p) => p.userId === GUEST_USER_ID || p.userId === LEGACY_DEMO_USER_ID)
    .map((p) => ({ ...p, userId: GUEST_USER_ID }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

async function saveGuestProducts(products: Product[]): Promise<void> {
  const otherUsers = (await loadProductsFromStorage())?.filter(
    (p) => p.userId !== GUEST_USER_ID && p.userId !== LEGACY_DEMO_USER_ID
  );
  const merged = [...(otherUsers ?? []), ...products];
  if (merged.length === 0) {
    await clearLocalProducts();
    return;
  }
  await AsyncStorage.setItem(
    PRODUCTS_STORAGE_KEY,
    JSON.stringify(merged.map(productToStored))
  );
}

async function clearLocalProducts(): Promise<void> {
  await AsyncStorage.removeItem(PRODUCTS_STORAGE_KEY);
}

/** Remove seeded demo inventory from earlier builds (runs once per install). */
export async function purgeLegacyDemoProductsIfNeeded(): Promise<void> {
  try {
    const purged = await AsyncStorage.getItem(DEMO_DATA_PURGED_KEY);
    if (purged === 'true') return;

    const stored = await loadProductsFromStorage();
    if (stored?.length) {
      const cleaned = stored.filter((p) => p.userId !== LEGACY_DEMO_USER_ID);
      if (cleaned.length === 0) {
        await clearLocalProducts();
      } else {
        await AsyncStorage.setItem(
          PRODUCTS_STORAGE_KEY,
          JSON.stringify(cleaned.map(productToStored))
        );
      }
    }

    await AsyncStorage.setItem(DEMO_DATA_PURGED_KEY, 'true');
  } catch {
    // Non-fatal
  }
}

/** Upload any on-device products created before sign-in, then clear local cache. */
export async function migrateLocalProductsToCloud(userId: string): Promise<void> {
  const migrated = await AsyncStorage.getItem(LOCAL_MIGRATED_KEY);
  if (migrated === userId) return;

  const local = await loadGuestProducts();
  if (local?.length) {
    const rows = local
      .filter((p) => p.userId !== LEGACY_DEMO_USER_ID)
      .map((p) =>
        productToInsertRow(userId, {
          name: p.name,
          brand: p.brand,
          category: p.category,
          purchaseDate: p.purchaseDate,
          expirationDate: p.expirationDate,
          openedDate: p.openedDate,
          paoMonths: p.paoMonths,
          location: p.location,
          barcode: p.barcode,
          photoUrl: p.photoUrl,
          usageCount: p.usageCount,
          notes: p.notes,
        })
      );

    if (rows.length > 0) {
      const { error } = await supabase.from('products').insert(rows);
      if (error) throw error;
    }
  }

  await clearLocalProducts();
  await AsyncStorage.setItem(LOCAL_MIGRATED_KEY, userId);
}

export async function fetchProducts(userId: string): Promise<Product[]> {
  await purgeLegacyDemoProductsIfNeeded();

  if (isGuestUserId(userId)) {
    return loadGuestProducts();
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ProductRow[] | null)?.map(rowToProduct) ?? [];
}

export async function fetchRecentProducts(userId: string, limit: number = 3): Promise<Product[]> {
  const products = await fetchProducts(userId);
  return products.slice(0, limit);
}

export async function createProduct(
  userId: string,
  product: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  if (isGuestUserId(userId)) {
    const now = new Date();
    const newProduct: Product = {
      ...product,
      id: Crypto.randomUUID(),
      userId: GUEST_USER_ID,
      createdAt: now,
      updatedAt: now,
    };
    const products = await loadGuestProducts();
    products.unshift(newProduct);
    await saveGuestProducts(products);
    return newProduct;
  }

  const { data, error } = await supabase
    .from('products')
    .insert(productToInsertRow(userId, product))
    .select('*')
    .single();

  if (error) throw error;
  return rowToProduct(data as ProductRow);
}

export async function updateProductById(
  userId: string,
  id: string,
  updates: Partial<Product>
): Promise<Product> {
  if (isGuestUserId(userId)) {
    const products = await loadGuestProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const updated: Product = {
      ...products[index],
      ...updates,
      updatedAt: new Date(),
    };
    products[index] = updated;
    await saveGuestProducts(products);
    return updated;
  }

  const { data, error } = await supabase
    .from('products')
    .update(productToUpdateRow(updates))
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return rowToProduct(data as ProductRow);
}

export async function deleteProductById(userId: string, id: string): Promise<void> {
  if (isGuestUserId(userId)) {
    const products = await loadGuestProducts();
    await saveGuestProducts(products.filter((p) => p.id !== id));
    return;
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

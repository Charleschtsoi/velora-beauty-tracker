import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { Product } from '../types/product.types';
import * as productService from '../services/productService';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from '../services/supabase';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Product | void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const { user, effectiveUserId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedProducts = await productService.fetchProducts(effectiveUserId);
      setProducts(fetchedProducts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (user?.id && isSupabaseConfigured()) {
          await productService.migrateLocalProductsToCloud(user.id);
        }
        if (cancelled) return;
        const fetchedProducts = await productService.fetchProducts(effectiveUserId);
        if (!cancelled) setProducts(fetchedProducts);
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveUserId, user?.id]);

  const addProduct = async (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ): Promise<Product | void> => {
    setLoading(true);
    setError(null);
    try {
      const newProduct = await productService.createProduct(effectiveUserId, product);
      setProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add product';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await productService.updateProductById(effectiveUserId, id, updates);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await productService.deleteProductById(effectiveUserId, id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductContext.Provider
      value={{ products, loading, error, fetchProducts, addProduct, updateProduct, deleteProduct }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

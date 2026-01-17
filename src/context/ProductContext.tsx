import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { Product } from '../types/product.types';
import * as productService from '../services/productService';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate network delay for demo
      await new Promise(resolve => setTimeout(resolve, 500));
      const fetchedProducts = await productService.fetchProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      // Silently handle error for demo - no console.error
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate network delay for demo
      await new Promise(resolve => setTimeout(resolve, 300));
      const newProduct: Product = {
        ...product,
        id: Date.now().toString(),
        userId: 'demo-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProducts([newProduct, ...products]);
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
      // Simulate network delay for demo
      await new Promise(resolve => setTimeout(resolve, 300));
      setProducts(products.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p));
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
      // Simulate network delay for demo
      await new Promise(resolve => setTimeout(resolve, 300));
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, loading, error, fetchProducts, addProduct, updateProduct, deleteProduct }}>
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

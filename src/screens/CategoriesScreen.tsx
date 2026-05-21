import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import { ProductCategory } from '../types/product.types';
import { getExpirationStatus } from '../utils/dateHelpers';
import { ExpirationStatus } from '../types/product.types';
import ProductCard from '../components/products/ProductCard';
import EmptyState from '../components/common/EmptyState';
import { typography } from '../theme';

const categoryConfig: Record<ProductCategory, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  [ProductCategory.SKINCARE]: {
    label: 'Skincare',
    icon: 'water',
    color: '#10b981',
  },
  [ProductCategory.MAKEUP]: {
    label: 'Makeup',
    icon: 'color-palette',
    color: '#f97316',
  },
  [ProductCategory.HAIRCARE]: {
    label: 'Haircare',
    icon: 'cut',
    color: '#8b5cf6',
  },
  [ProductCategory.FRAGRANCE]: {
    label: 'Fragrance',
    icon: 'flower',
    color: '#ec4899',
  },
  [ProductCategory.BODYCARE]: {
    label: 'Bodycare',
    icon: 'body',
    color: '#06b6d4',
  },
  [ProductCategory.NAILCARE]: {
    label: 'Nailcare',
    icon: 'hand-left',
    color: '#f59e0b',
  },
  [ProductCategory.OTHER]: {
    label: 'Other',
    icon: 'cube',
    color: '#6b7280',
  },
};

export default function CategoriesScreen() {
  const navigation = useNavigation<any>();
  const { products, loading } = useProducts();

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped: Record<ProductCategory, typeof products> = {
      [ProductCategory.SKINCARE]: [],
      [ProductCategory.MAKEUP]: [],
      [ProductCategory.HAIRCARE]: [],
      [ProductCategory.FRAGRANCE]: [],
      [ProductCategory.BODYCARE]: [],
      [ProductCategory.NAILCARE]: [],
      [ProductCategory.OTHER]: [],
    };

    products.forEach((product) => {
      grouped[product.category].push(product);
    });

    return grouped;
  }, [products]);

  // Calculate stats for each category
  const categoryStats = useMemo(() => {
    const stats: Record<ProductCategory, { total: number; expired: number; expiringSoon: number }> = {
      [ProductCategory.SKINCARE]: { total: 0, expired: 0, expiringSoon: 0 },
      [ProductCategory.MAKEUP]: { total: 0, expired: 0, expiringSoon: 0 },
      [ProductCategory.HAIRCARE]: { total: 0, expired: 0, expiringSoon: 0 },
      [ProductCategory.FRAGRANCE]: { total: 0, expired: 0, expiringSoon: 0 },
      [ProductCategory.BODYCARE]: { total: 0, expired: 0, expiringSoon: 0 },
      [ProductCategory.NAILCARE]: { total: 0, expired: 0, expiringSoon: 0 },
      [ProductCategory.OTHER]: { total: 0, expired: 0, expiringSoon: 0 },
    };

    products.forEach((product) => {
      const status = getExpirationStatus(product.expirationDate);
      stats[product.category].total++;
      if (status === ExpirationStatus.EXPIRED) {
        stats[product.category].expired++;
      }
      if (status === ExpirationStatus.EXPIRING_SOON) {
        stats[product.category].expiringSoon++;
      }
    });

    return stats;
  }, [products]);

  const handleCategoryPress = (category: ProductCategory) => {
    // Navigate to MainTabs > Inventory with category filter (Inventory is inside tab navigator)
    navigation.navigate('MainTabs', { screen: 'Inventory', params: { categoryFilter: category } });
  };

  const handleProductPress = (productId: string) => {
    navigation.getParent()?.navigate('ProductDetail' as never, { productId });
  };

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          testID="categories-back-button"
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Grid */}
        <View style={styles.categoryGrid}>
          {Object.values(ProductCategory).map((category) => {
            const config = categoryConfig[category];
            const categoryProducts = productsByCategory[category];
            const stats = categoryStats[category];

            return (
              <TouchableOpacity
                key={category}
                style={[styles.categoryCard, { borderLeftColor: config.color }]}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
                testID={`category-${category}`}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: config.color + '20' }]}>
                  <Ionicons name={config.icon} size={32} color={config.color} />
                </View>
                <Text style={styles.categoryName}>{config.label}</Text>
                <Text style={styles.categoryCount}>{stats.total} items</Text>
                {(stats.expired > 0 || stats.expiringSoon > 0) && (
                  <View style={styles.categoryAlerts}>
                    {stats.expired > 0 && (
                      <View style={styles.alertBadge}>
                        <Text style={styles.alertText}>{stats.expired} expired</Text>
                      </View>
                    )}
                    {stats.expiringSoon > 0 && (
                      <View style={[styles.alertBadge, styles.warningBadge]}>
                        <Text style={styles.alertText}>{stats.expiringSoon} expiring</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Products by Category */}
        {Object.values(ProductCategory).map((category) => {
          const config = categoryConfig[category];
          const categoryProducts = productsByCategory[category];

          if (categoryProducts.length === 0) return null;

          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name={config.icon} size={20} color={config.color} />
                  </View>
                  <Text style={styles.sectionTitle}>{config.label}</Text>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{categoryProducts.length}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleCategoryPress(category)}
                  testID={`view-all-${category}`}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {categoryProducts.slice(0, 3).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => handleProductPress(product.id)}
                  testID={`product-${product.id}`}
                />
              ))}
            </View>
          );
        })}

        {products.length === 0 && (
          <EmptyState
            icon="grid-outline"
            title="No products yet"
            subtitle="Add your first product to see your collection by category"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    ...typography.screenHeader,
    fontSize: 26,
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  categoryAlerts: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  alertBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  warningBadge: {
    backgroundColor: '#fed7aa',
  },
  alertText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.cardTitle,
    fontSize: 18,
    color: '#1f2937',
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
});

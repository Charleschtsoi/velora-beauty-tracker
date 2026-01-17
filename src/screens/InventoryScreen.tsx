import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import { Product, ProductCategory } from '../types/product.types';
import { getExpirationStatus } from '../utils/dateHelpers';
import { ExpirationStatus } from '../types/product.types';
import ProductListItem from '../components/products/ProductListItem';
import SearchBar from '../components/common/SearchBar';
import FilterMenu, {
  SortOption,
  StatusFilter,
  CategoryFilter,
} from '../components/common/FilterMenu';
import { SkeletonCard } from '../components/common/SkeletonLoader';

type InventoryRouteParams = {
  categoryFilter?: ProductCategory;
  filter?: 'expiring_soon' | 'expired' | 'all';
};

type InventoryRouteProp = RouteProp<{ Inventory: InventoryRouteParams }, 'Inventory'>;

export default function InventoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<InventoryRouteProp>();
  const { products, loading, deleteProduct, fetchProducts } = useProducts();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('expiry_date');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  // Handle route params for filtering
  useEffect(() => {
    if (route.params?.categoryFilter) {
      setCategoryFilter(route.params.categoryFilter);
    }
    if (route.params?.filter) {
      if (route.params.filter === 'expiring_soon') {
        setStatusFilter(ExpirationStatus.EXPIRING_SOON);
      } else if (route.params.filter === 'expired') {
        setStatusFilter(ExpirationStatus.EXPIRED);
      }
    }
  }, [route.params]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (p) => getExpirationStatus(p.expirationDate) === statusFilter
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'expiry_date':
          return a.expirationDate.getTime() - b.expirationDate.getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recently_added':
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, statusFilter, categoryFilter, sortOption]);

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleAddProduct = () => {
    navigation.navigate('AddProduct');
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductListItem
      product={item}
      onPress={() => handleProductPress(item.id)}
      onDelete={() => handleDelete(item)}
      testID={`product-item-${item.id}`}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptyText}>
        {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
          ? 'Try adjusting your search or filters'
          : 'Start tracking your beauty products by adding your first item'}
      </Text>
      {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={handleAddProduct}
          testID="empty-add-button"
        >
          <Text style={styles.emptyButtonText}>Add Your First Product</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Inventory</Text>
        </View>
        <View style={styles.skeletonContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="leaf" size={24} color="#10b981" />
          <Text style={styles.logo}>HERMES</Text>
        </View>
        <Text style={styles.headerTitle}>My Inventory</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setFilterMenuVisible(true)}
          onSortPress={() => setFilterMenuVisible(true)}
          testID="search-bar"
        />
      </View>

      {/* Section Header */}
      {filteredAndSortedProducts.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? `Results (${filteredAndSortedProducts.length})`
              : 'Recently Added'}
          </Text>
        </View>
      )}

      {/* Product List */}
      <FlatList
        data={filteredAndSortedProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filteredAndSortedProducts.length === 0
            ? styles.emptyListContainer
            : styles.listContainer
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        testID="product-list"
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddProduct}
        activeOpacity={0.8}
        testID="add-product-fab"
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Filter Menu */}
      <FilterMenu
        visible={filterMenuVisible}
        onClose={() => setFilterMenuVisible(false)}
        sortOption={sortOption}
        onSortChange={setSortOption}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 100, // Balance the header
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#ffffff',
    paddingBottom: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  skeletonContainer: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

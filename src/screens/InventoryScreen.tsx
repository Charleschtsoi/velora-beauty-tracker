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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import EmptyState from '../components/common/EmptyState';
import { colors, spacing, radius, shadow, typography } from '../theme';
import * as settingsStorage from '../services/settingsStorage';

type InventoryRouteParams = {
  categoryFilter?: ProductCategory;
  filter?: 'expiring_soon' | 'expired' | 'all';
};

type InventoryRouteProp = RouteProp<{ Inventory: InventoryRouteParams }, 'Inventory'>;

const FAB_SIZE = 56;
const FAB_BOTTOM_OFFSET = 24;
const TAB_BAR_HEIGHT = 60;

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<InventoryRouteProp>();
  const { products, loading, deleteProduct, fetchProducts } = useProducts();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('recently_added');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [compactList, setCompactList] = useState(false);

  useEffect(() => {
    settingsStorage.getCompactList().then(setCompactList);
  }, []);

  const handleCompactListChange = (value: boolean) => {
    setCompactList(value);
    settingsStorage.setCompactList(value);
  };

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
      } else if (route.params.filter === 'all') {
        setStatusFilter('all');
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
    navigation.getParent()?.navigate('ProductDetail' as never, { productId });
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
    navigation.getParent()?.navigate('AddProduct' as never);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductListItem
      product={item}
      onPress={() => handleProductPress(item.id)}
      onDelete={() => handleDelete(item)}
      compact={compactList}
      testID={`product-item-${item.id}`}
    />
  );

  const isFiltered = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all';
  const renderEmptyState = () => (
    <EmptyState
      icon="cube-outline"
      title={isFiltered ? 'No products match' : 'No products yet'}
      subtitle={
        isFiltered
          ? 'Try adjusting your search or filters'
          : 'Add your first product to get reminders before they expire'
      }
      buttonLabel={!isFiltered ? 'Add Your First Product' : undefined}
      onButtonPress={!isFiltered ? handleAddProduct : undefined}
      testID="empty-state"
    />
  );

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your products</Text>
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
          <Text style={styles.logo}>Velora</Text>
        </View>
        <Text style={styles.headerTitle}>Your products</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.categoriesButton}
            onPress={() => navigation.getParent()?.navigate('Categories' as never)}
            testID="browse-categories-button"
          >
            <Ionicons name="grid-outline" size={22} color="#10b981" />
            <Text style={styles.categoriesButtonText}>Categories</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setFilterMenuVisible(true)}
          onSortPress={() => setFilterMenuVisible(true)}
          filterSortLabel="Filter & sort"
          testID="search-bar"
        />
      </View>

      {/* Section Header */}
      {filteredAndSortedProducts.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? `Results (${filteredAndSortedProducts.length})`
              : sortOption === 'expiry_date'
                ? 'By expiry date'
                : sortOption === 'name'
                  ? 'By name (A–Z)'
                  : sortOption === 'recently_added'
                    ? 'Recently added'
                    : 'Your products'}
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
            ? [styles.emptyListContainer, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + FAB_SIZE + FAB_BOTTOM_OFFSET }]
            : [styles.listContainer, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + FAB_SIZE + FAB_BOTTOM_OFFSET }]
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        testID="product-list"
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + TAB_BAR_HEIGHT + FAB_BOTTOM_OFFSET }]}
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
        compactList={compactList}
        onCompactListChange={handleCompactListChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logo: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 100,
    alignItems: 'flex-end',
  },
  categoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  categoriesButtonText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    paddingBottom: spacing.xs,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  listContainer: {
    padding: spacing.md,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonContainer: {
    padding: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.fab,
  },
});

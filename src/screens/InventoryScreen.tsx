import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
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
import { cancelExpiryReminder, cancelPAOReminder } from '../services/localNotificationService';

type InventoryRouteParams = {
  categoryFilter?: ProductCategory;
  filter?: 'expiring_soon' | 'expired' | 'all';
};

type InventoryRouteProp = RouteProp<{ Inventory: InventoryRouteParams }, 'Inventory'>;

const FAB_SIZE = 56;
const FAB_BOTTOM_OFFSET = 24;
const TAB_BAR_HEIGHT = 60;

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.SKINCARE]: 'Skincare',
  [ProductCategory.MAKEUP]: 'Makeup',
  [ProductCategory.HAIRCARE]: 'Haircare',
  [ProductCategory.FRAGRANCE]: 'Fragrance',
  [ProductCategory.BODYCARE]: 'Bodycare',
  [ProductCategory.NAILCARE]: 'Nailcare',
  [ProductCategory.OTHER]: 'Other',
};

const STATUS_CHIP_LABELS: Record<ExpirationStatus, string> = {
  [ExpirationStatus.SAFE]: 'Safe',
  [ExpirationStatus.EXPIRING_SOON]: 'Expiring soon',
  [ExpirationStatus.WARNING]: 'Warning',
  [ExpirationStatus.EXPIRED]: 'Expired',
};

function sortChipLabel(option: SortOption): string {
  switch (option) {
    case 'expiry_date':
      return 'Expiry date';
    case 'name':
      return 'Name A–Z';
    case 'recently_added':
      return 'Recently added';
    default:
      return 'Sort';
  }
}

function FABWithEnterAnimation({
  style,
  onPress,
  testID,
}: {
  style: object;
  onPress: () => void;
  testID?: string;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 8 }).start();
  }, [scale]);
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={styles.fabInner}
        onPress={onPress}
        activeOpacity={0.85}
        testID={testID}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </Animated.View>
  );
}

type FilterChipConfig = { key: string; label: string; onClear: () => void };

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<InventoryRouteProp>();
  const { products, loading, deleteProduct } = useProducts();

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

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => getExpirationStatus(p.expirationDate) === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

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

  const filterChips = useMemo((): FilterChipConfig[] => {
    const chips: FilterChipConfig[] = [];
    const q = searchQuery.trim();
    if (q) {
      chips.push({
        key: 'search',
        label: `“${q.length > 18 ? `${q.slice(0, 18)}…` : q}”`,
        onClear: () => setSearchQuery(''),
      });
    }
    if (statusFilter !== 'all') {
      chips.push({
        key: 'status',
        label: STATUS_CHIP_LABELS[statusFilter],
        onClear: () => setStatusFilter('all'),
      });
    }
    if (categoryFilter !== 'all') {
      chips.push({
        key: 'category',
        label: CATEGORY_LABELS[categoryFilter],
        onClear: () => setCategoryFilter('all'),
      });
    }
    if (sortOption !== 'recently_added') {
      chips.push({
        key: 'sort',
        label: sortChipLabel(sortOption),
        onClear: () => setSortOption('recently_added'),
      });
    }
    return chips;
  }, [searchQuery, statusFilter, categoryFilter, sortOption]);

  const hasActiveFilters =
    !!searchQuery.trim() || statusFilter !== 'all' || categoryFilter !== 'all' || sortOption !== 'recently_added';

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSortOption('recently_added');
  }, []);

  const sectionEyebrow = useMemo(() => {
    if (searchQuery.trim() || statusFilter !== 'all' || categoryFilter !== 'all') {
      return 'Filtered';
    }
    if (sortOption === 'expiry_date') {
      return 'By date';
    }
    if (sortOption === 'name') {
      return 'Alphabetical';
    }
    return 'New on your shelf';
  }, [searchQuery, statusFilter, categoryFilter, sortOption]);

  const sectionTitle = useMemo(() => {
    if (searchQuery.trim() || statusFilter !== 'all' || categoryFilter !== 'all') {
      return `${filteredAndSortedProducts.length} ${filteredAndSortedProducts.length === 1 ? 'product' : 'products'}`;
    }
    if (sortOption === 'expiry_date') {
      return 'Soonest expiry first';
    }
    if (sortOption === 'name') {
      return 'By name (A–Z)';
    }
    return 'Recently added';
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    sortOption,
    filteredAndSortedProducts.length,
  ]);

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
              await cancelExpiryReminder(product.id);
              await cancelPAOReminder(product.id);
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

  const renderProductItem = ({ item, index }: { item: Product; index: number }) => (
    <ProductListItem
      product={item}
      onPress={() => handleProductPress(item.id)}
      onDelete={() => handleDelete(item)}
      compact={compactList}
      testID={`product-item-${item.id}`}
      entranceDelay={(index ?? 0) * 40}
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

  const listHeader = useMemo(
    () =>
      filteredAndSortedProducts.length > 0 ? (
        <View style={styles.listSectionHeader}>
          <Text style={styles.sectionEyebrow}>{sectionEyebrow}</Text>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        </View>
      ) : null,
    [filteredAndSortedProducts.length, sectionEyebrow, sectionTitle]
  );

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={styles.logo}>Velora</Text>
          <View style={{ width: 40 }} />
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
      <View style={styles.topBar}>
        <Text style={styles.logo}>Velora</Text>
        <TouchableOpacity
          style={styles.categoriesIconButton}
          onPress={() => navigation.getParent()?.navigate('Categories' as never)}
          testID="browse-categories-button"
          accessibilityLabel="Categories"
        >
          <Ionicons name="grid-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBlock}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setFilterMenuVisible(true)}
          onSortPress={() => setFilterMenuVisible(true)}
          filterSortLabel="Filter & sort"
          variant="editorial"
          bottomSpacing={false}
          testID="search-bar"
        />
        {hasActiveFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            style={styles.chipsScroll}
          >
            {filterChips.map((chip) => (
              <TouchableOpacity
                key={chip.key}
                style={styles.filterChip}
                onPress={chip.onClear}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Remove filter ${chip.label}`}
              >
                <Text style={styles.filterChipText}>{chip.label}</Text>
                <Ionicons name="close-circle" size={18} color={colors.primary} />
              </TouchableOpacity>
            ))}
            {filterChips.length > 1 && (
              <TouchableOpacity style={styles.clearAllChip} onPress={clearAllFilters} activeOpacity={0.85}>
                <Text style={styles.clearAllChipText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={filteredAndSortedProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={10}
        contentContainerStyle={
          filteredAndSortedProducts.length === 0
            ? [
                styles.emptyListContainer,
                { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + FAB_SIZE + FAB_BOTTOM_OFFSET },
              ]
            : [styles.listContainer, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + FAB_SIZE + FAB_BOTTOM_OFFSET }]
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        testID="product-list"
      />

      <FABWithEnterAnimation
        style={[styles.fab, { bottom: insets.bottom + TAB_BAR_HEIGHT + FAB_BOTTOM_OFFSET }]}
        onPress={handleAddProduct}
        testID="add-product-fab"
      />

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
    backgroundColor: colors.cream,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  logo: {
    ...typography.display,
    color: colors.primary,
  },
  categoriesIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.mintSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  searchBlock: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  chipsScroll: {
    marginTop: spacing.sm,
    maxHeight: 44,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.lg,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xxs + 2,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  filterChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    maxWidth: 160,
  },
  clearAllChip: {
    paddingVertical: spacing.xxs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.blush,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  clearAllChipText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  listSectionHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionEyebrow: {
    ...typography.sectionLabel,
    color: colors.textTertiary,
    marginBottom: spacing.xxs,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: spacing.sm,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  skeletonContainer: {
    padding: spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.fab,
  },
  fabInner: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

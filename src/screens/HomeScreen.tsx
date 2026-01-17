import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import { getExpirationStatus } from '../utils/dateHelpers';
import { ExpirationStatus } from '../types/product.types';
import SummaryCard from '../components/common/SummaryCard';
import ProductCard from '../components/products/ProductCard';
import { useNavigation } from '@react-navigation/native';
import { SkeletonCard } from '../components/common/SkeletonLoader';

// Navigation types
type RootStackParamList = {
  Inventory: { filter?: 'expiring_soon' | 'expired' | 'all' };
  Scan: undefined;
  ProductDetail: { productId: string };
};

export default function HomeScreen() {
  const { products, loading } = useProducts();
  const navigation = useNavigation<any>();

  // Calculate summary statistics
  const stats = useMemo(() => {
    const expiringSoon = products.filter(
      (p) => getExpirationStatus(p.expirationDate) === ExpirationStatus.EXPIRING_SOON
    ).length;
    const expired = products.filter(
      (p) => getExpirationStatus(p.expirationDate) === ExpirationStatus.EXPIRED
    ).length;
    const total = products.length;

    return { expiringSoon, expired, total };
  }, [products]);

  // Get recently added products (last 3, ordered by created_at DESC)
  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3);
  }, [products]);

  const handleSummaryCardPress = (filter?: 'expiring_soon' | 'expired') => {
    navigation.navigate('Inventory', { filter });
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const handleScanPress = () => {
    navigation.navigate('Scan');
  };

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Skeleton */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.logo}>HERMES</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={[styles.iconButton, { opacity: 0.3 }]} />
              <View style={[styles.avatar, { opacity: 0.3 }]} />
            </View>
          </View>

          {/* Summary Cards Skeleton */}
          <View style={styles.summarySection}>
            <View style={[styles.skeletonCard, { opacity: 0.3 }]} />
            <View style={[styles.skeletonCard, { opacity: 0.3 }]} />
            <View style={[styles.skeletonCard, { opacity: 0.3 }]} />
          </View>

          {/* Product Cards Skeleton */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recently Added</Text>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>HERMES</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} testID="search-button">
              <Ionicons name="search-outline" size={24} color="#1f2937" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} testID="profile-button">
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#10b981" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <SummaryCard
            title="Expiring Soon"
            count={stats.expiringSoon}
            icon="warning"
            color="#f97316"
            onPress={() => handleSummaryCardPress('expiring_soon')}
            testID="expiring-soon-card"
          />
          <SummaryCard
            title="Expired Items"
            count={stats.expired}
            icon="alert-circle"
            color="#ef4444"
            onPress={() => handleSummaryCardPress('expired')}
            testID="expired-items-card"
          />
          <SummaryCard
            title="Total Items"
            count={stats.total}
            icon="cube"
            color="#10b981"
            testID="total-items-card"
          />
        </View>

        {/* Recently Added Section */}
        {recentProducts.length > 0 ? (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recently Added</Text>
            {recentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => handleProductPress(product.id)}
                testID={`recent-product-${product.id}`}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptyText}>
              Start tracking your beauty products by adding your first item
            </Text>
          </View>
        )}

        {/* Scan Button */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanPress}
          activeOpacity={0.8}
          testID="scan-button"
        >
          <Ionicons name="camera" size={24} color="#ffffff" />
          <Text style={styles.scanButtonText}>Scan New Product</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1fae5',
  },
  summarySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  recentSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
  },
  skeletonCard: {
    flex: 1,
    height: 100,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    marginHorizontal: 6,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
  Pressable,
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
import EmptyState from '../components/common/EmptyState';
import { colors, spacing, radius, shadow, typography } from '../theme';
import * as settingsStorage from '../services/settingsStorage';

// Navigation types
type RootStackParamList = {
  Inventory: { filter?: 'expiring_soon' | 'expired' | 'all' };
  Scan: undefined;
  ProductDetail: { productId: string };
};

function ScanButtonWithPressFeedback({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.timing(scale, { toValue: 0.98, duration: 80, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 200 }).start()}
    >
      <Animated.View style={[styles.scanButton, { transform: [{ scale }] }]}>
        <Ionicons name="camera" size={24} color={colors.white} />
        <Text style={styles.scanButtonText}>Scan New Product</Text>
      </Animated.View>
    </Pressable>
  );
}

function FirstRunModal({
  visible,
  onDismiss,
  onScan,
  onAddManual,
}: {
  visible: boolean;
  onDismiss: () => void;
  onScan: () => void;
  onAddManual: () => void;
}) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(24)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      overlayOpacity.setValue(0);
      cardTranslateY.setValue(24);
      cardOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(cardOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.spring(cardTranslateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 8 }),
        ]),
      ]).start();
    }
  }, [visible, overlayOpacity, cardTranslateY, cardOpacity]);

  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <Animated.View style={[styles.firstRunOverlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onDismiss} />
        <Animated.View
          style={[
            styles.firstRunCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
              zIndex: 1,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <Text style={styles.firstRunTitle}>Never miss a use-by date</Text>
          <Text style={styles.firstRunSubtitle}>Scan or add your first product to get reminders.</Text>
          <TouchableOpacity
            style={styles.firstRunButton}
            onPress={onScan}
            activeOpacity={0.8}
            testID="first-run-scan"
          >
            <Ionicons name="camera" size={20} color={colors.white} />
            <Text style={styles.firstRunButtonText}>Scan product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.firstRunButtonSecondary}
            onPress={onAddManual}
            activeOpacity={0.8}
            testID="first-run-add"
          >
            <Text style={styles.firstRunButtonSecondaryText}>Add manually</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.firstRunSkip} onPress={onDismiss} testID="first-run-skip">
            <Text style={styles.firstRunSkipText}>Skip</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function HomeScreen() {
  const { products, loading } = useProducts();
  const navigation = useNavigation<any>();
  const [hasSeenFirstRun, setHasSeenFirstRunState] = useState<boolean | null>(null);
  const [firstRunVisible, setFirstRunVisible] = useState(false);

  useEffect(() => {
    settingsStorage.getHasSeenFirstRun().then((seen) => {
      setHasSeenFirstRunState(seen);
      if (!seen && !loading && products.length === 0) setFirstRunVisible(true);
    });
  }, [loading, products.length]);

  useEffect(() => {
    if (hasSeenFirstRun === false && !loading && products.length === 0) {
      setFirstRunVisible(true);
    }
  }, [hasSeenFirstRun, loading, products.length]);

  const dismissFirstRun = () => {
    setFirstRunVisible(false);
    settingsStorage.setHasSeenFirstRun();
  };

  const handleFirstRunScan = () => {
    dismissFirstRun();
    navigation.navigate('Scan');
  };

  const handleFirstRunAdd = () => {
    dismissFirstRun();
    navigation.getParent()?.navigate('AddProduct' as never);
  };

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

  // Expiring soon: next 3 by expiry date (soonest first)
  const expiringSoonProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime())
      .slice(0, 3);
  }, [products]);

  const handleSummaryCardPress = (filter?: 'expiring_soon' | 'expired' | 'all') => {
    navigation.navigate('Inventory', { filter });
  };

  const handleProductPress = (productId: string) => {
    navigation.getParent()?.navigate('ProductDetail' as never, { productId });
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
              <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Home' as never)} activeOpacity={0.7}>
                <Text style={styles.logo}>Velora</Text>
              </TouchableOpacity>
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
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Home' as never)} activeOpacity={0.7}>
              <Text style={styles.logo}>Velora</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Inventory')}
              testID="search-button"
            >
              <Ionicons name="search-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} testID="profile-button">
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <SummaryCard
            title="Expiring Soon"
            count={stats.expiringSoon}
            icon="time"
            color={colors.statusExpiringSoon}
            iconBackgroundColor={colors.statusExpiringSoonBg}
            onPress={() => handleSummaryCardPress('expiring_soon')}
            testID="expiring-soon-card"
            entranceDelay={0}
          />
          <SummaryCard
            title="Expired"
            count={stats.expired}
            icon="alert-circle"
            color={colors.statusExpired}
            iconBackgroundColor={colors.statusExpiredBg}
            onPress={() => handleSummaryCardPress('expired')}
            testID="expired-items-card"
            entranceDelay={50}
          />
          <SummaryCard
            title="In collection"
            count={stats.total}
            icon="cube"
            color={colors.primary}
            iconBackgroundColor={colors.statusSafeBg}
            onPress={() => handleSummaryCardPress('all')}
            testID="total-items-card"
            entranceDelay={100}
          />
        </View>

        <TouchableOpacity
          style={styles.browseCategoriesLink}
          onPress={() => navigation.getParent()?.navigate('Categories' as never)}
          testID="browse-categories-link"
        >
          <Ionicons name="grid-outline" size={18} color={colors.primary} />
          <Text style={styles.browseCategoriesLinkText}>Browse by category</Text>
        </TouchableOpacity>

        {/* Expiring Soon Section */}
        {expiringSoonProducts.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Expiring soon</Text>
            {expiringSoonProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => handleProductPress(product.id)}
                testID={`expiring-soon-product-${product.id}`}
                entranceDelay={index * 50}
              />
            ))}
          </View>
        )}

        {/* Recently Added Section */}
        {recentProducts.length > 0 ? (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recently Added</Text>
            {recentProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => handleProductPress(product.id)}
                testID={`recent-product-${product.id}`}
                entranceDelay={index * 50}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="cube-outline"
            title="No products yet"
            subtitle="Add your first product to get reminders before they expire"
          />
        )}

        {/* Scan Button */}
        <ScanButtonWithPressFeedback onPress={handleScanPress} />
        <TouchableOpacity
          style={styles.manualEntryLink}
          onPress={() => navigation.getParent()?.navigate('AddProduct' as never)}
          testID="add-manually-link"
        >
          <Text style={styles.manualEntryLinkText}>Add manually</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* First-run: one line of value + CTA, skippable */}
      <FirstRunModal
        visible={firstRunVisible}
        onDismiss={dismissFirstRun}
        onScan={handleFirstRunScan}
        onAddManual={handleFirstRunAdd}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    ...typography.display,
    color: colors.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xxs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  summarySection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  recentSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  skeletonCard: {
    flex: 1,
    height: 100,
    backgroundColor: colors.border,
    borderRadius: radius.md,
    marginHorizontal: spacing.xs,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.fab,
  },
  scanButtonText: {
    ...typography.subtitle,
    color: colors.white,
  },
  manualEntryLink: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  manualEntryLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.link,
  },
  browseCategoriesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
  },
  browseCategoriesLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.link,
  },
  firstRunOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  firstRunCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...shadow.cardRaised,
  },
  firstRunTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  firstRunSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  firstRunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    width: '100%',
    marginBottom: spacing.sm,
  },
  firstRunButtonText: {
    ...typography.bodyLargeStrong,
    color: colors.white,
  },
  firstRunButtonSecondary: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  firstRunButtonSecondaryText: {
    ...typography.body,
    color: colors.link,
    fontWeight: '600',
  },
  firstRunSkip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  firstRunSkipText: {
    ...typography.body,
    color: colors.textTertiary,
  },
});

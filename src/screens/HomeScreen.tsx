import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
  Pressable,
  Dimensions,
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
import { colors, spacing, radius, shadow, typography, brandFontFamily } from '../theme';
import * as settingsStorage from '../services/settingsStorage';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(Math.max(64, WINDOW_HEIGHT * 0.1));
/** Zoom-out factor for hero banner: image is scaled to cover a larger area so more of the image is visible. */
const HERO_ZOOM_OUT = 1.3;

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
          {/* Hero Skeleton */}
          <View style={styles.heroSkeleton}>
            <Text style={[styles.logo, { opacity: 0.5 }]}>VELORA</Text>
            <View style={styles.taglineSkeleton} />
          </View>

          {/* Summary Cards Skeleton: vertical full-width rows */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitleTop}>Product Status</Text>
            <View style={[styles.skeletonCardVertical, { opacity: 0.3 }]} />
            <View style={[styles.skeletonCardVertical, { opacity: 0.3 }]} />
            <View style={[styles.skeletonCardVertical, { opacity: 0.3 }]} />
          </View>

          {/* Product Cards Skeleton */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitleSecondary}>Recently Added</Text>
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
        {/* Hero: image as background (zoomed out so more of banner is visible), VELORA + tagline on top */}
        <View style={styles.heroGradient}>
          <View
            style={[
              styles.heroImageWrapper,
              {
                width: WINDOW_WIDTH * HERO_ZOOM_OUT,
                height: HERO_HEIGHT * HERO_ZOOM_OUT,
                left: -((WINDOW_WIDTH * (HERO_ZOOM_OUT - 1)) / 2),
                top: -((HERO_HEIGHT * (HERO_ZOOM_OUT - 1)) / 2),
              },
            ]}
          >
            <Image
              source={require('../assets/hero-banner.png')}
              style={styles.heroImageBackground}
              resizeMode="cover"
              onError={(e) => console.warn('Hero image failed to load:', e.nativeEvent.error)}
            />
          </View>
          <View style={styles.heroOverlay} />
          <View style={styles.heroTopBarWrapper}>
            <View style={styles.heroTopBar}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Home' as never)} activeOpacity={0.8} style={styles.logoTouchable}>
                  <Text style={styles.logo}>VELORA</Text>
                </TouchableOpacity>
                <Text style={styles.tagline}>Track. Protect. Glow.</Text>
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
          </View>
        </View>

        {/* Summary Cards: vertical stack, full width (icon left, count+label right) */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitleTop}>Product Status</Text>
          <SummaryCard
            title="Expiring"
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
            <Text style={styles.sectionTitleSecondary}>Expiring soon</Text>
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
            <Text style={styles.sectionTitleSecondary}>Recently Added</Text>
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
  heroGradient: {
    paddingHorizontal: spacing.lg,
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  heroImageWrapper: {
    position: 'absolute',
  },
  heroImageBackground: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(236, 253, 245, 0.55)',
  },
  heroTopBarWrapper: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
  },
  logoTouchable: {
    alignSelf: 'flex-start',
  },
  logo: {
    fontFamily: brandFontFamily,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.primary,
  },
  tagline: {
    fontFamily: brandFontFamily,
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  heroSkeleton: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
    alignItems: 'flex-start',
    minHeight: 72,
  },
  taglineSkeleton: {
    marginTop: spacing.xs,
    width: 160,
    height: 14,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  summarySection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  sectionTitleTop: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  recentSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionTitleSecondary: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  skeletonCard: {
    flex: 1,
    height: 100,
    backgroundColor: colors.border,
    borderRadius: radius.md,
    marginHorizontal: spacing.xs,
  },
  skeletonCardVertical: {
    height: 72,
    backgroundColor: colors.border,
    borderRadius: radius.lg,
    marginVertical: spacing.xs,
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
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    ...shadow.cardSubtle,
  },
  browseCategoriesLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
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

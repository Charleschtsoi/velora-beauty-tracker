import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  Image,
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
import { colors, spacing, radius, shadow, typography, TAB_BAR_HEIGHT } from '../theme';
import * as settingsStorage from '../services/settingsStorage';
import { HOME_HERO_IMAGE } from '../assets/homeHeroImage';
import { summaryCardImages } from '../assets/cardImages';

const HERO_MIN_HEIGHT = 232;
/** Clear fixed tab bar + safe breathing room when scrolling last sections */
const SCROLL_BOTTOM_PADDING = TAB_BAR_HEIGHT + spacing.xxl + spacing.lg;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function HeroBanner({ onPress, translateY }: { onPress: () => void; translateY: Animated.Value }) {
  const scale = useRef(new Animated.Value(1)).current;
  const [heroImageError, setHeroImageError] = React.useState(false);

  return (
    <Animated.View
      style={[
        styles.heroWrap,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.timing(scale, { toValue: 0.98, duration: 80, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 200 }).start()}
        testID="hero-banner-press"
        accessibilityRole="button"
        accessibilityLabel="Tap to add to collection"
      >
        <Animated.View style={[styles.heroCardAnimated, { transform: [{ scale }] }]}>
          <View style={styles.heroCard}>
            {!heroImageError ? (
              <Image
                source={HOME_HERO_IMAGE}
                style={styles.heroImage}
                resizeMode="cover"
                onError={() => setHeroImageError(true)}
              />
            ) : (
              <View style={[styles.heroImage, styles.heroImageFallback]}>
                <Ionicons name="sparkles-outline" size={40} color={colors.primary} />
              </View>
            )}
            <View style={styles.heroOverlay} pointerEvents="none">
              <View style={styles.heroOverlayContent}>
                <View style={styles.heroIconRing}>
                  <Ionicons name="add" size={22} color={colors.white} />
                </View>
                <Text style={styles.heroOverlayText}>Tap to add to collection</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
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
          <TouchableOpacity style={styles.firstRunButton} onPress={onScan} activeOpacity={0.8} testID="first-run-scan">
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

  const heroTranslate = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.spring(heroTranslate, {
      toValue: 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 4,
    }).start();
  }, [heroTranslate]);

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
    navigation.getParent()?.navigate('Scan' as never);
  };

  const handleFirstRunAdd = () => {
    dismissFirstRun();
    navigation.getParent()?.navigate('AddProduct' as never);
  };

  const stats = useMemo(() => {
    const expiringSoon = products.filter(
      (p) => getExpirationStatus(p.expirationDate) === ExpirationStatus.EXPIRING_SOON
    ).length;
    const expired = products.filter((p) => getExpirationStatus(p.expirationDate) === ExpirationStatus.EXPIRED).length;
    const total = products.length;
    return { expiringSoon, expired, total };
  }, [products]);

  const recentProducts = useMemo(() => {
    return [...products].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 3);
  }, [products]);

  const expiringSoonProducts = useMemo(() => {
    return [...products].sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime()).slice(0, 3);
  }, [products]);

  const greeting = useMemo(() => getGreeting(), []);

  const reminderTone = useMemo(() => {
    if (stats.expiringSoon > 0) {
      return {
        eyebrow: 'What needs care',
        title:
          stats.expiringSoon === 1
            ? '1 product is coming up soon'
            : `${stats.expiringSoon} products are coming up soon`,
        subtitle: 'Start with the ones expiring first so nothing you love slips past its best date.',
      };
    }
    if (stats.expired > 0) {
      return {
        eyebrow: 'What needs care',
        title: stats.expired === 1 ? '1 item needs a reset' : `${stats.expired} items need a reset`,
        subtitle: 'Review anything past date and decide what to keep, finish, or let go of.',
      };
    }
    return {
      eyebrow: 'What needs care',
      title: 'Your shelf is looking fresh',
      subtitle: 'Nothing urgent right now, so you can simply enjoy what is already in your routine.',
    };
  }, [stats.expired, stats.expiringSoon]);

  const priorityFilter = useMemo<'expiring_soon' | 'expired' | 'all'>(() => {
    if (stats.expiringSoon > 0) return 'expiring_soon';
    if (stats.expired > 0) return 'expired';
    return 'all';
  }, [stats.expired, stats.expiringSoon]);

  const handleSummaryCardPress = (filter?: 'expiring_soon' | 'expired' | 'all') => {
    navigation.navigate('Inventory', { filter });
  };

  const handleProductPress = (productId: string) => {
    navigation.getParent()?.navigate('ProductDetail' as never, { productId });
  };

  const handleScanPress = () => {
    navigation.getParent()?.navigate('Scan' as never);
  };

  const handleSettingsPress = () => {
    navigation.getParent()?.navigate('Settings' as never);
  };

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <View style={[styles.skeletonBlock, { width: 88, height: 24 }]} />
            <View style={[styles.skeletonBlock, { width: 44, height: 44, borderRadius: 22 }]} />
          </View>
          <View style={styles.greetingRow}>
            <View style={[styles.skeletonBlock, { width: 140, height: 16 }]} />
          </View>
          <View style={styles.prioritySection}>
            <View style={[styles.skeletonBlock, { height: 120, borderRadius: radius.xl }]} />
          </View>
          <View style={styles.heroWrap}>
            <View style={[styles.skeletonBlock, { height: HERO_MIN_HEIGHT, borderRadius: radius.xl }]} />
          </View>
          <View style={styles.statsRow}>
            {[1, 2, 3].map((k) => (
              <View key={k} style={styles.statsCol}>
                <View style={[styles.skeletonBlock, { flex: 1, height: 108, borderRadius: radius.lg }]} />
              </View>
            ))}
          </View>
          <View style={styles.section}>
            <View style={[styles.skeletonBlock, { width: 120, height: 14, marginBottom: spacing.sm }]} />
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
        <View style={styles.topBar}>
          <Text style={styles.logo}>Velora</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettingsPress}
            activeOpacity={0.7}
            testID="settings-button"
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>{greeting}.</Text>
        </View>

        <View style={styles.prioritySection}>
          <View style={styles.priorityCard}>
            <Text style={styles.priorityEyebrow}>{reminderTone.eyebrow}</Text>
            <Text style={styles.priorityTitle}>{reminderTone.title}</Text>
            <Text style={styles.prioritySubtitle}>{reminderTone.subtitle}</Text>
            <TouchableOpacity
              style={styles.priorityButton}
              activeOpacity={0.7}
              onPress={() => handleSummaryCardPress(priorityFilter)}
              testID="priority-review-button"
            >
              <Text style={styles.priorityButtonText}>Review now</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <HeroBanner onPress={handleScanPress} translateY={heroTranslate} />

        <View style={styles.statsSection}>
          <Text style={styles.sectionEyebrow}>Shelf summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statsCol}>
              <SummaryCard
                variant="compactGrid"
                title="Use soon"
                count={stats.expiringSoon}
                icon="time"
                image={summaryCardImages.expiring_soon ?? undefined}
                color={colors.statusExpiringSoon}
                iconBackgroundColor={colors.surfaceMuted}
                surfaceTint={colors.surface}
                onPress={() => handleSummaryCardPress('expiring_soon')}
                testID="expiring-soon-card"
                entranceDelay={0}
              />
            </View>
            <View style={styles.statsCol}>
              <SummaryCard
                variant="compactGrid"
                title="Past date"
                count={stats.expired}
                icon="alert-circle"
                image={summaryCardImages.expired ?? undefined}
                color={colors.statusExpired}
                iconBackgroundColor={colors.surfaceMuted}
                surfaceTint={colors.surface}
                onPress={() => handleSummaryCardPress('expired')}
                testID="expired-items-card"
                entranceDelay={60}
              />
            </View>
            <View style={styles.statsCol}>
              <SummaryCard
                variant="compactGrid"
                title="Total collection"
                count={stats.total}
                icon="cube"
                image={summaryCardImages.in_collection ?? undefined}
                color={colors.textPrimary}
                iconBackgroundColor={colors.surfaceMuted}
                surfaceTint={colors.surface}
                onPress={() => handleSummaryCardPress('all')}
                testID="total-items-card"
                entranceDelay={120}
              />
            </View>
          </View>
        </View>

        {expiringSoonProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>Start here</Text>
            <Text style={styles.sectionTitle}>Products to review first</Text>
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

        {recentProducts.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>New on your shelf</Text>
            <Text style={styles.sectionTitle}>Recently added</Text>
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
        ) : null}
      </ScrollView>

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
    paddingBottom: SCROLL_BOTTOM_PADDING,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  logo: {
    ...typography.brandLogo,
    color: colors.primary,
  },
  settingsButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  greetingText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  heroWrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroCardAnimated: {
    borderRadius: radius.xl,
    ...shadow.heroSoft,
  },
  heroCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: HERO_MIN_HEIGHT,
  },
  heroImage: {
    width: '100%',
    height: HERO_MIN_HEIGHT,
    backgroundColor: colors.heroTint,
  },
  heroImageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(26,26,26,0.28)',
  },
  heroOverlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  heroIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroOverlayText: {
    ...typography.caption,
    color: colors.white,
    letterSpacing: 0.3,
    flex: 1,
  },
  prioritySection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  priorityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.cardSubtle,
  },
  priorityEyebrow: {
    ...typography.editorialLabel,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  priorityTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  prioritySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    minHeight: 44,
    paddingVertical: spacing.xs,
  },
  priorityButtonText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  statsSection: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  statsCol: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  sectionEyebrow: {
    ...typography.editorialLabel,
    color: colors.textTertiary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.cardTitle,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  skeletonBlock: {
    backgroundColor: colors.border,
    borderRadius: radius.md,
  },
  firstRunOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,26,26,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  firstRunCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.heroSoft,
  },
  firstRunTitle: {
    ...typography.modalHeader,
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
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    width: '100%',
    marginBottom: spacing.sm,
    minHeight: 44,
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
    minHeight: 44,
    justifyContent: 'center',
  },
  firstRunButtonSecondaryText: {
    ...typography.body,
    color: colors.link,
    fontWeight: '600',
  },
  firstRunSkip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  firstRunSkipText: {
    ...typography.body,
    color: colors.textTertiary,
  },
});

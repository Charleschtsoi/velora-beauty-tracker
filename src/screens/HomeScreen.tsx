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
import EmptyState from '../components/common/EmptyState';
import { colors, spacing, radius, shadow, typography } from '../theme';
import * as settingsStorage from '../services/settingsStorage';
import { HOME_HERO_IMAGE } from '../assets/homeHeroImage';

function ScanButtonWithPressFeedback({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.timing(scale, { toValue: 0.98, duration: 80, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 200 }).start()}
    >
      <Animated.View style={[styles.scanButton, { transform: [{ scale }] }]}>
        <Ionicons name="camera" size={22} color={colors.white} />
        <Text style={styles.scanButtonText}>Scan a product</Text>
      </Animated.View>
    </Pressable>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={styles.quickActionPressable}
      onPressIn={() => Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 200 }).start()}
    >
      <Animated.View style={[styles.quickAction, { transform: [{ scale }] }]}>
        <View style={styles.quickActionIconWrap}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.quickActionLabelWrap}>
          <Text style={styles.quickActionLabel} numberOfLines={2}>
            {label}
          </Text>
        </View>
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

  /** Keep hero at full opacity — fading the whole card (with overflow + Image) can blank the image after reload on some devices. */
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
    navigation.navigate('Scan');
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
          <View style={styles.topBar}>
            <View style={[styles.skeletonBlock, { width: 100, height: 22 }]} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={[styles.skeletonBlock, { width: 36, height: 36, borderRadius: 18 }]} />
              <View style={[styles.skeletonBlock, { width: 36, height: 36, borderRadius: 18 }]} />
            </View>
          </View>
          <View style={[styles.heroCard, { overflow: 'hidden' }]}>
            <View style={[styles.skeletonBlock, { height: 228, borderRadius: 0, marginHorizontal: -1 }]} />
            <View style={{ padding: spacing.lg }}>
              <View style={[styles.skeletonBlock, { width: '60%', height: 14, marginBottom: spacing.sm }]} />
              <View style={[styles.skeletonBlock, { width: '85%', height: 22, marginBottom: spacing.xs }]} />
              <View style={[styles.skeletonBlock, { width: '50%', height: 12 }]} />
            </View>
          </View>
          <View style={styles.quickActionsRow}>
            {[1, 2, 3].map((k) => (
              <View key={k} style={styles.quickActionPressable}>
                <View style={[styles.quickAction, { opacity: 0.35 }]} />
              </View>
            ))}
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
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Home' as never)} activeOpacity={0.7}>
            <Text style={styles.logo}>Velora</Text>
          </TouchableOpacity>
          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Inventory')}
              testID="search-button"
            >
              <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} testID="profile-button">
              <View style={styles.avatar}>
                <Ionicons name="person" size={18} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.heroOrbMint} pointerEvents="none" />
          <View style={styles.heroOrbBlush} pointerEvents="none" />
          <Animated.View
            style={[
              styles.heroCardAnimated,
              {
                transform: [{ translateY: heroTranslate }],
              },
            ]}
          >
            <View style={styles.heroCard}>
            <Image source={HOME_HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Your beauty shelf</Text>
              <Text style={styles.heroTitle}>Beautifully organized</Text>
              <Text style={styles.heroSubtitle}>Keep track of what to use next.</Text>
              <Pressable
                style={({ pressed }) => [styles.heroScanPill, pressed && { opacity: 0.88 }]}
                onPress={handleScanPress}
              >
                <Ionicons name="scan-outline" size={18} color={colors.primary} />
                <Text style={styles.heroScanPillText}>Scan a product</Text>
              </Pressable>
            </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.quickActionsRow}>
          <QuickAction icon="scan-outline" label="Scan" onPress={handleScanPress} testID="quick-scan" />
          <QuickAction
            icon="add-circle-outline"
            label="Add"
            onPress={() => navigation.getParent()?.navigate('AddProduct' as never)}
            testID="quick-add"
          />
          <QuickAction
            icon="grid-outline"
            label="Categories"
            onPress={() => navigation.getParent()?.navigate('Categories' as never)}
            testID="quick-categories"
          />
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionEyebrow}>At a glance</Text>
          <View style={styles.statsRow}>
            <View style={styles.statsCol}>
              <SummaryCard
                variant="compactGrid"
                title="Expiring soon"
                count={stats.expiringSoon}
                icon="time"
                color={colors.statusExpiringSoon}
                iconBackgroundColor={colors.statusExpiringSoonBg}
                surfaceTint={colors.peach}
                onPress={() => handleSummaryCardPress('expiring_soon')}
                testID="expiring-soon-card"
                entranceDelay={0}
              />
            </View>
            <View style={styles.statsCol}>
              <SummaryCard
                variant="compactGrid"
                title="Expired"
                count={stats.expired}
                icon="alert-circle"
                color={colors.statusExpired}
                iconBackgroundColor={colors.statusExpiredBg}
                surfaceTint={colors.blush}
                onPress={() => handleSummaryCardPress('expired')}
                testID="expired-items-card"
                entranceDelay={60}
              />
            </View>
            <View style={styles.statsCol}>
              <SummaryCard
                variant="compactGrid"
                title="In collection"
                count={stats.total}
                icon="cube"
                color={colors.primary}
                iconBackgroundColor={colors.mintSoft}
                surfaceTint={colors.mintSoft}
                onPress={() => handleSummaryCardPress('all')}
                testID="total-items-card"
                entranceDelay={120}
              />
            </View>
          </View>
        </View>

        {expiringSoonProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>Finish soon</Text>
            <Text style={styles.sectionTitle}>Fresh picks</Text>
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
        ) : (
          <View style={styles.section}>
            <EmptyState
              icon="cube-outline"
              title="No products yet"
              subtitle="Add your first product to get reminders before they expire"
            />
          </View>
        )}

        <ScanButtonWithPressFeedback onPress={handleScanPress} />
        <TouchableOpacity
          style={styles.manualEntryLink}
          onPress={() => navigation.getParent()?.navigate('AddProduct' as never)}
          testID="add-manually-link"
        >
          <Text style={styles.manualEntryLinkText}>Add manually</Text>
        </TouchableOpacity>
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
    backgroundColor: colors.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
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
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    padding: spacing.xxs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.blush,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  heroWrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  heroOrbMint: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.sage,
    opacity: 0.12,
    top: -10,
    right: -18,
    zIndex: 0,
  },
  heroOrbBlush: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.blushDeep,
    opacity: 0.1,
    bottom: 28,
    left: -14,
    zIndex: 0,
  },
  /** Outer wrapper: transform + shadow; inner card clips image. Avoids RN opacity+overflow+Image glitches after reload. */
  heroCardAnimated: {
    zIndex: 1,
    borderRadius: radius.xl,
    ...shadow.heroSoft,
  },
  heroCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  heroImage: {
    width: '100%',
    height: 228,
    backgroundColor: colors.heroTint,
  },
  heroCopy: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  heroEyebrow: {
    ...typography.sectionLabel,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    ...typography.heroTitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.heroTagline,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  heroScanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  heroScanPillText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    marginTop: 0,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  quickActionPressable: {
    flex: 1,
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  quickAction: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.cardSubtle,
  },
  quickActionLabelWrap: {
    minHeight: 34,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  quickActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.mintSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  statsCol: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  sectionEyebrow: {
    ...typography.sectionLabel,
    color: colors.textTertiary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  skeletonBlock: {
    backgroundColor: colors.border,
    borderRadius: radius.md,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
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
    fontSize: 17,
    color: colors.white,
  },
  manualEntryLink: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  manualEntryLinkText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.link,
  },
  firstRunOverlay: {
    flex: 1,
    backgroundColor: 'rgba(31,41,55,0.45)',
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
    borderRadius: radius.full,
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

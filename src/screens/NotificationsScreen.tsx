import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import { Product } from '../types/product.types';
import { getDaysUntilExpiration } from '../utils/dateHelpers';
import NotificationCard from '../components/notifications/NotificationCard';
import EmptyState from '../components/common/EmptyState';
import { colors, spacing, radius, typography } from '../theme';
import * as settingsStorage from '../services/settingsStorage';

interface NotificationGroup {
  title: string;
  products: Product[];
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { products, loading } = useProducts();
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [expiredAlert, setExpiredAlert] = useState(true);
  const [expiringSoonAlert, setExpiringSoonAlert] = useState(true);

  useEffect(() => {
    Promise.all([
      settingsStorage.getExpiredAlert(),
      settingsStorage.getExpiringSoonAlert(),
    ]).then(([expired, soon]) => {
      setExpiredAlert(expired);
      setExpiringSoonAlert(soon);
    });
  }, []);

  useEffect(() => {
    settingsStorage.getReadReminderIds().then(setReadNotifications);
  }, []);

  // Group products by expiration urgency; hide groups when user turned off in Settings
  const notificationGroups = useMemo(() => {
    const groups: NotificationGroup[] = [
      {
        title: 'Expired Now',
        products: [],
        icon: 'alert-circle',
        color: '#ef4444',
      },
      {
        title: 'Expiring in 1 day',
        products: [],
        icon: 'warning',
        color: '#f97316',
      },
      {
        title: 'Expiring in 3 days',
        products: [],
        icon: 'time',
        color: '#fbbf24',
      },
    ];

    if (!expiredAlert && !expiringSoonAlert) return [];

    products.forEach((product) => {
      const daysUntil = getDaysUntilExpiration(product.expirationDate);
      if (daysUntil < 0 && expiredAlert) {
        groups[0].products.push(product);
      } else if ((daysUntil === 0 || daysUntil === 1) && expiringSoonAlert) {
        groups[1].products.push(product);
      } else if (daysUntil <= 3 && expiringSoonAlert) {
        groups[2].products.push(product);
      }
    });

    groups.forEach((group) => {
      group.products.sort((a, b) => {
        const daysA = getDaysUntilExpiration(a.expirationDate);
        const daysB = getDaysUntilExpiration(b.expirationDate);
        return daysA - daysB;
      });
    });

    return groups.filter((group) => group.products.length > 0);
  }, [products, expiredAlert, expiringSoonAlert]);

  const handleProductPress = (productId: string) => {
    navigation.getParent()?.navigate('ProductDetail' as never, { productId });
  };

  const handleMarkAsRead = (productId: string) => {
    setReadNotifications((prev) => {
      const next = new Set(prev).add(productId);
      settingsStorage.setReadReminderIds(Array.from(next));
      return next;
    });
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear all reminders',
      'Mark all reminders as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          onPress: () => {
            const allProductIds = notificationGroups
              .flatMap((group) => group.products.map((p) => p.id));
            setReadNotifications(new Set(allProductIds));
            settingsStorage.setReadReminderIds(allProductIds);
          },
        },
      ]
    );
  };

  const getTotalUnreadCount = () => {
    return notificationGroups.reduce((total, group) => {
      return total + group.products.filter((p) => !readNotifications.has(p.id)).length;
    }, 0);
  };

  const renderEmptyState = () => (
    <EmptyState
      icon="notifications-off-outline"
      title="No expiration alerts"
      subtitle="All your products are safe! You'll see reminders here when products are about to expire."
    />
  );

  if (loading && products.length === 0) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading reminders...</Text>
      </View>
    </SafeAreaView>
  );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="notifications" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Reminders</Text>
          {getTotalUnreadCount() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getTotalUnreadCount()}</Text>
            </View>
          )}
        </View>
        {notificationGroups.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
            testID="clear-all-button"
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {notificationGroups.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notificationGroups.map((group, groupIndex) => {
            const unreadProducts = group.products.filter(
              (p) => !readNotifications.has(p.id)
            );

            return (
              <View key={groupIndex} style={styles.groupContainer}>
                {/* Group Header */}
                <View style={styles.groupHeader}>
                  <View style={styles.groupHeaderLeft}>
                    <View
                      style={[styles.groupIconContainer, { backgroundColor: group.color + '20' }]}
                    >
                      <Ionicons name={group.icon} size={20} color={group.color} />
                    </View>
                    <Text style={styles.groupTitle}>{group.title}</Text>
                    <View style={styles.groupBadge}>
                      <Text style={styles.groupBadgeText}>
                        {unreadProducts.length > 0 ? unreadProducts.length : group.products.length}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Notification Cards */}
                {group.products.map((product) => (
                  <NotificationCard
                    key={product.id}
                    product={product}
                    onPress={() => handleProductPress(product.id)}
                    onMarkAsRead={() => handleMarkAsRead(product.id)}
                    isRead={readNotifications.has(product.id)}
                    testID={`notification-${product.id}`}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.statusExpired,
    borderRadius: radius.sm,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    color: colors.white,
    ...typography.caption,
    fontWeight: '700',
  },
  clearButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  clearButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyScrollContent: {
    flex: 1,
  },
  groupContainer: {
    marginBottom: spacing.lg,
  },
  groupHeader: {
    marginBottom: spacing.sm,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  groupIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    flex: 1,
  },
  groupBadge: {
    backgroundColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  groupBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

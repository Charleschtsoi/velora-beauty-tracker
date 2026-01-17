import React, { useState, useMemo } from 'react';
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

  // Group products by expiration urgency
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

    products.forEach((product) => {
      const daysUntil = getDaysUntilExpiration(product.expirationDate);
      
      if (daysUntil < 0) {
        // Expired
        groups[0].products.push(product);
      } else if (daysUntil === 0 || daysUntil === 1) {
        // Expiring today or in 1 day
        groups[1].products.push(product);
      } else if (daysUntil <= 3) {
        // Expiring in 2-3 days
        groups[2].products.push(product);
      }
    });

    // Sort products within each group by days until expiration
    groups.forEach((group) => {
      group.products.sort((a, b) => {
        const daysA = getDaysUntilExpiration(a.expirationDate);
        const daysB = getDaysUntilExpiration(b.expirationDate);
        return daysA - daysB;
      });
    });

    // Only return groups that have products
    return groups.filter((group) => group.products.length > 0);
  }, [products]);

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const handleMarkAsRead = (productId: string) => {
    setReadNotifications((prev) => new Set(prev).add(productId));
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          onPress: () => {
            const allProductIds = notificationGroups
              .flatMap((group) => group.products.map((p) => p.id));
            setReadNotifications(new Set(allProductIds));
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
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Expiration Alerts</Text>
      <Text style={styles.emptyText}>
        All your products are safe! You'll see notifications here when products are about to expire.
      </Text>
    </View>
  );

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="notifications" size={24} color="#10b981" />
          <Text style={styles.headerTitle}>Notifications</Text>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyScrollContent: {
    flex: 1,
  },
  groupContainer: {
    marginBottom: 24,
  },
  groupHeader: {
    marginBottom: 12,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  groupBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  groupBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
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
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductCategory, ExpirationStatus } from '../../types/product.types';
import { colors, spacing, radius, typography } from '../../theme';

export type SortOption = 'expiry_date' | 'name' | 'recently_added';
export type StatusFilter = ExpirationStatus | 'all';
export type CategoryFilter = ProductCategory | 'all';

interface FilterMenuProps {
  visible: boolean;
  onClose: () => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
  compactList?: boolean;
  onCompactListChange?: (value: boolean) => void;
}

const sortOptions = [
  { label: 'By Expiry Date (Nearest First)', value: 'expiry_date' as SortOption },
  { label: 'By Name (A-Z)', value: 'name' as SortOption },
  { label: 'Recently Added', value: 'recently_added' as SortOption },
];

const statusOptions = [
  { label: 'All', value: 'all' as StatusFilter },
  { label: 'Safe', value: ExpirationStatus.SAFE },
  { label: 'Expiring Soon', value: ExpirationStatus.EXPIRING_SOON },
  { label: 'Warning', value: ExpirationStatus.WARNING },
  { label: 'Expired', value: ExpirationStatus.EXPIRED },
];

const categoryOptions = [
  { label: 'All Categories', value: 'all' as CategoryFilter },
  { label: 'Skincare', value: ProductCategory.SKINCARE },
  { label: 'Makeup', value: ProductCategory.MAKEUP },
  { label: 'Haircare', value: ProductCategory.HAIRCARE },
  { label: 'Fragrance', value: ProductCategory.FRAGRANCE },
  { label: 'Bodycare', value: ProductCategory.BODYCARE },
  { label: 'Nailcare', value: ProductCategory.NAILCARE },
  { label: 'Other', value: ProductCategory.OTHER },
];

export default function FilterMenu({
  visible,
  onClose,
  sortOption,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  compactList = false,
  onCompactListChange,
}: FilterMenuProps) {
  const [activeTab, setActiveTab] = useState<'sort' | 'status' | 'category'>('sort');

  const renderOption = (
    label: string,
    value: string,
    isSelected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[styles.option, isSelected && styles.optionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
        {label}
      </Text>
      {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter & Sort</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'sort' && styles.tabActive]}
              onPress={() => setActiveTab('sort')}
            >
              <Text
                style={[styles.tabText, activeTab === 'sort' && styles.tabTextActive]}
              >
                Sort
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'status' && styles.tabActive]}
              onPress={() => setActiveTab('status')}
            >
              <Text
                style={[styles.tabText, activeTab === 'status' && styles.tabTextActive]}
              >
                Status
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'category' && styles.tabActive]}
              onPress={() => setActiveTab('category')}
            >
              <Text
                style={[styles.tabText, activeTab === 'category' && styles.tabTextActive]}
              >
                Category
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {activeTab === 'sort' && (
              <FlatList
                data={sortOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) =>
                  renderOption(
                    item.label,
                    item.value,
                    sortOption === item.value,
                    () => onSortChange(item.value)
                  )
                }
              />
            )}

            {activeTab === 'status' && (
              <FlatList
                data={statusOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) =>
                  renderOption(
                    item.label,
                    item.value,
                    statusFilter === item.value,
                    () => onStatusFilterChange(item.value)
                  )
                }
              />
            )}

            {activeTab === 'category' && (
              <FlatList
                data={categoryOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) =>
                  renderOption(
                    item.label,
                    item.value,
                    categoryFilter === item.value,
                    () => onCategoryFilterChange(item.value)
                  )
                }
              />
            )}
          </View>

          {onCompactListChange != null && (
            <View style={styles.compactRow}>
              <Text style={styles.compactLabel}>Compact list</Text>
              <Switch
                value={compactList}
                onValueChange={onCompactListChange}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '80%',
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    maxHeight: 400,
    padding: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  optionSelected: {
    backgroundColor: colors.primaryTint,
  },
  optionText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  compactLabel: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
  },
});

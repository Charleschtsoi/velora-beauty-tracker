import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductCategory, ExpirationStatus } from '../../types/product.types';

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
      {isSelected && <Ionicons name="checkmark" size={20} color="#10b981" />}
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
              <Ionicons name="close" size={24} color="#1f2937" />
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
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#10b981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#10b981',
    fontWeight: '600',
  },
  content: {
    maxHeight: 400,
    padding: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: '#f0fdf4',
  },
  optionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  optionTextSelected: {
    color: '#10b981',
    fontWeight: '600',
  },
});

import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  onSortPress?: () => void;
  /** When set, show a single "Filter & sort" button instead of separate filter/sort icons. */
  filterSortLabel?: string;
  testID?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search products...',
  onFilterPress,
  onSortPress,
  filterSortLabel,
  testID,
}: SearchBarProps) {
  const openFilterSort = onFilterPress ?? onSortPress;
  const showSingleFilterSort = filterSortLabel && openFilterSort;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          testID="search-input"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            style={styles.clearButton}
            testID="clear-search-button"
          >
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
      {showSingleFilterSort ? (
        <TouchableOpacity
          style={styles.filterSortButton}
          onPress={openFilterSort}
          testID="filter-sort-button"
        >
          <Ionicons name="options-outline" size={18} color="#10b981" style={styles.filterSortIcon} />
          <Text style={styles.filterSortLabel}>{filterSortLabel}</Text>
        </TouchableOpacity>
      ) : (
        <>
          {onFilterPress && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onFilterPress}
              testID="filter-button"
            >
              <Ionicons name="options" size={20} color="#10b981" />
            </TouchableOpacity>
          )}
          {onSortPress && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onSortPress}
              testID="sort-button"
            >
              <Ionicons name="swap-vertical" size={20} color="#10b981" />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 10,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    minWidth: 44,
  },
  filterSortIcon: {
    marginRight: 6,
  },
  filterSortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
});

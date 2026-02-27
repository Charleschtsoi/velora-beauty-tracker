import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';

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
        <Ionicons name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          testID="search-input"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            style={styles.clearButton}
            testID="clear-search-button"
          >
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
      {showSingleFilterSort ? (
        <TouchableOpacity
          style={styles.filterSortButton}
          onPress={openFilterSort}
          testID="filter-sort-button"
        >
          <Ionicons name="options-outline" size={18} color={colors.primary} style={styles.filterSortIcon} />
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
              <Ionicons name="options" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onSortPress && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onSortPress}
              testID="sort-button"
            >
              <Ionicons name="swap-vertical" size={20} color={colors.primary} />
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
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  clearButton: {
    marginLeft: spacing.xs,
    padding: spacing.xxs,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: 22,
    backgroundColor: colors.primaryTint,
    minWidth: 44,
  },
  filterSortIcon: {
    marginRight: 6,
  },
  filterSortLabel: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
});

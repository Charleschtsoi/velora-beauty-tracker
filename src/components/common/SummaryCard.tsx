import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SummaryCardProps {
  title: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
  testID?: string;
}

export default function SummaryCard({ title, count, icon, color, onPress, testID }: SummaryCardProps) {
  const CardContent = (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} testID={testID} activeOpacity={0.7}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return <View testID={testID}>{CardContent}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  count: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});

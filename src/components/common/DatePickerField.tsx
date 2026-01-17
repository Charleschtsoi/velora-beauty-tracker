import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../utils/dateHelpers';

interface DatePickerFieldProps {
  label: string;
  value?: Date;
  onDateChange: (date: Date) => void;
  placeholder?: string;
  required?: boolean;
  highlighted?: boolean;
  testID?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function DatePickerField({
  label,
  value,
  onDateChange,
  placeholder = 'Select date',
  required = false,
  highlighted = false,
  testID,
  minimumDate,
  maximumDate,
}: DatePickerFieldProps) {
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const handleConfirm = (date: Date) => {
    onDateChange(date);
    setDatePickerVisible(false);
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[
          styles.dateInput,
          highlighted && styles.highlighted,
          value && styles.hasValue,
        ]}
        onPress={() => setDatePickerVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
      </TouchableOpacity>

      <DatePicker
        modal
        open={datePickerVisible}
        date={value || new Date()}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={() => setDatePickerVisible(false)}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        theme={Platform.OS === 'ios' ? 'light' : 'auto'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  highlighted: {
    backgroundColor: '#fef3c7', // Yellow background
    borderColor: '#fbbf24',
  },
  hasValue: {
    borderColor: '#10b981',
  },
  dateText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  placeholder: {
    color: '#9ca3af',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
  const handleChange = (event: any) => {
    const dateValue = event.target.value;
    if (dateValue) {
      const selectedDate = new Date(dateValue);
      onDateChange(selectedDate);
    }
  };

  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatMinMax = (date?: Date) => {
    if (!date) return undefined;
    return formatDateForInput(date);
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <input
        type="date"
        value={formatDateForInput(value)}
        onChange={handleChange}
        placeholder={placeholder}
        min={formatMinMax(minimumDate)}
        max={formatMinMax(maximumDate)}
        style={{
          backgroundColor: highlighted ? '#fef3c7' : '#ffffff',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: value ? '#10b981' : (highlighted ? '#fbbf24' : '#e5e7eb'),
          borderRadius: 8,
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 14,
          paddingBottom: 14,
          fontSize: 16,
          color: '#1f2937',
          minHeight: 48,
          width: '100%',
          boxSizing: 'border-box' as any,
        }}
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
    fontWeight: '500' as any,
    color: '#1f2937',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
});

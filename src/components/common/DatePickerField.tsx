import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [tempDate, setTempDate] = useState(value || new Date());

  const handleConfirm = () => {
    onDateChange(tempDate);
    setDatePickerVisible(false);
  };

  const handleCancel = () => {
    setTempDate(value || new Date());
    setDatePickerVisible(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setDatePickerVisible(false);
      if (selectedDate) {
        onDateChange(selectedDate);
      }
    } else {
      // iOS - update temp date
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
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
        onPress={() => {
          setTempDate(value || new Date());
          setDatePickerVisible(true);
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={datePickerVisible}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity onPress={handleConfirm} style={styles.modalButton}>
                  <Text style={[styles.modalButtonText, styles.modalButtonConfirm]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                themeVariant="light"
              />
            </View>
          </View>
        </Modal>
      ) : (
        datePickerVisible && (
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        )
      )}
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
    backgroundColor: '#fef3c7',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalButtonConfirm: {
    color: '#10b981',
    fontWeight: '600',
  },
});

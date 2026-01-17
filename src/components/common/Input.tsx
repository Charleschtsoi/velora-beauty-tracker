import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
  testID?: string;
}

export default function Input({
  label,
  error,
  icon,
  containerStyle,
  style,
  testID,
  ...textInputProps
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color="#6b7280"
            style={styles.icon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            error && styles.inputError,
            style,
          ]}
          placeholderTextColor="#9ca3af"
          {...textInputProps}
          testID={testID ? `${testID}-input` : undefined}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  icon: {
    marginLeft: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
});

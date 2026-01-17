import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#d1d5db' : '#10b981',
          borderColor: disabled ? '#d1d5db' : '#10b981',
          textColor: '#ffffff',
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? '#f3f4f6' : '#6b7280',
          borderColor: disabled ? '#f3f4f6' : '#6b7280',
          textColor: '#ffffff',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: disabled ? '#d1d5db' : '#10b981',
          textColor: disabled ? '#d1d5db' : '#10b981',
        };
      case 'danger':
        return {
          backgroundColor: disabled ? '#fee2e2' : '#ef4444',
          borderColor: disabled ? '#fee2e2' : '#ef4444',
          textColor: '#ffffff',
        };
      default:
        return {
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          textColor: '#ffffff',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14, iconSize: 16 };
      case 'medium':
        return { paddingVertical: 12, paddingHorizontal: 20, fontSize: 16, iconSize: 20 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18, iconSize: 24 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 20, fontSize: 16, iconSize: 20 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.textColor} />
      ) : (
        <React.Fragment>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={sizeStyles.iconSize}
              color={variantStyles.textColor}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.text,
              {
                color: variantStyles.textColor,
                fontSize: sizeStyles.fontSize,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={sizeStyles.iconSize}
              color={variantStyles.textColor}
              style={styles.iconRight}
            />
          )}
        </React.Fragment>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

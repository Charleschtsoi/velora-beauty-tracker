import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onDismiss: () => void;
}

let toastId = 0;
const toastQueue: Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }> = [];
let currentToast: ((toast: ToastProps) => void) | null = null;

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const id = toastId++;
  toastQueue.push({ id, message, type });
  
  if (currentToast) {
    currentToast({ message, type, onDismiss: () => {} });
  }
};

export const ToastContainer = () => {
  const [toast, setToast] = useState<ToastProps | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    currentToast = (toastProps: ToastProps) => {
      setToast(toastProps);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        dismissToast();
      }, toastProps.duration || 3000);
    };

    return () => {
      currentToast = null;
    };
  }, []);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
      toastQueue.shift();
      if (toastQueue.length > 0 && currentToast) {
        const next = toastQueue[0];
        currentToast({ message: next.message, type: next.type, onDismiss: () => {} });
      }
    });
  };

  if (!toast) return null;

  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return { backgroundColor: '#d1fae5', borderColor: '#10b981', icon: 'checkmark-circle' as const, iconColor: '#10b981' };
      case 'error':
        return { backgroundColor: '#fee2e2', borderColor: '#ef4444', icon: 'alert-circle' as const, iconColor: '#ef4444' };
      default:
        return { backgroundColor: '#dbeafe', borderColor: '#3b82f6', icon: 'information-circle' as const, iconColor: '#3b82f6' };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.toast, { backgroundColor: toastStyle.backgroundColor, borderColor: toastStyle.borderColor }]}>
        <Ionicons name={toastStyle.icon} size={24} color={toastStyle.iconColor} />
        <Text style={styles.message}>{toast.message}</Text>
        <TouchableOpacity onPress={dismissToast} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 280,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import InventoryScreen from '../screens/InventoryScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const tabBarShadow = {
  shadowColor: '#1f2937',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 8,
};

function AnimatedTabButton(props: BottomTabBarButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(scale, { toValue: 1.08, useNativeDriver: true, speed: 200 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 200 }).start();
  };
  return (
    <Pressable
      {...props}
      onPressIn={(e) => {
        onPressIn();
        props.onPressIn?.(e as any);
      }}
      onPressOut={(e) => {
        onPressOut();
        props.onPressOut?.(e as any);
      }}
      style={[{ flex: 1 }, props.style]}
    >
      <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', transform: [{ scale }] }}>
        {props.children}
      </Animated.View>
    </Pressable>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: spacing.xxs,
          paddingTop: spacing.xxs,
          height: 60,
          ...tabBarShadow,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        tabBarButton: (props) => <AnimatedTabButton {...props} />,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          headerShown: true,
          headerTitle: 'Scan or add product',
          headerTitleStyle: {
            color: colors.primary,
            fontWeight: '600',
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Reminders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

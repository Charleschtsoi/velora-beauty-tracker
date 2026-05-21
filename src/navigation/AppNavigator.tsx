import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import AddProductScreen from '../screens/AddProductScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ScanScreen from '../screens/ScanScreen';
import SettingsScreen from '../screens/SettingsScreen';
import type { AIFieldMap, AIFieldKey } from '../services/aiService';

export type RootStackParamList = {
  MainTabs: undefined;
  Scan: undefined;
  Settings: undefined;
  AddProduct:
    | {
        barcode?: string;
        upcData?: Partial<AIFieldMap>;
        aiData?: AIFieldMap;
        aiFlatData?: Partial<Record<AIFieldKey, string>>;
        photoUri?: string;
        scanNotFound?: boolean;
      }
    | undefined;
  ProductDetail: { productId: string };
  Categories: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          headerShown: true,
          headerTitle: 'Scan or add product',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          headerShown: false,
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}

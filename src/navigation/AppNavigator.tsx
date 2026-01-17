import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import AddProductScreen from '../screens/AddProductScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CategoriesScreen from '../screens/CategoriesScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  AddProduct: { barcode?: string } | undefined;
  ProductDetail: { productId: string };
  Categories: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ProductProvider } from './src/context/ProductContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { ToastContainer } from './src/utils/toast';

export default function App() {
  return (
    <ErrorBoundary>
      <ProductProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppNavigator />
          <ToastContainer />
        </NavigationContainer>
      </ProductProvider>
    </ErrorBoundary>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, CormorantGaramond_400Regular } from '@expo-google-fonts/cormorant-garamond';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProductProvider } from './src/context/ProductContext';
import AppNavigator from './src/navigation/AppNavigator';
import type { RootStackParamList } from './src/navigation/AppNavigator';
import WelcomeScreen from './src/screens/welcome/WelcomeScreen';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { ToastContainer } from './src/utils/toast';
import * as settingsStorage from './src/services/settingsStorage';
import { DEMO_MODE } from './src/config/demoMode';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

function navigateToProduct(productId: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('ProductDetail', { productId });
  }
}

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
  });

  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  /** In demo mode, welcome is shown every launch; this tracks "dismissed this session" so we can show main app after Get started. */
  const [demoWelcomeDismissed, setDemoWelcomeDismissed] = useState(false);
  const lastResponseHandled = useRef<string | null>(null);
  const lastNotificationResponse = Platform.OS !== 'web' ? Notifications.useLastNotificationResponse() : null;

  useEffect(() => {
    settingsStorage.getHasSeenWelcome().then(setHasSeenWelcome);
  }, []);

  const handleWelcomeComplete = () => {
    if (DEMO_MODE) {
      setDemoWelcomeDismissed(true);
    } else {
      settingsStorage.setHasSeenWelcome();
      setHasSeenWelcome(true);
    }
  };

  const appReady = (DEMO_MODE && demoWelcomeDismissed) || (!DEMO_MODE && hasSeenWelcome === true);

  // Handle notification tap (foreground/background)
  useEffect(() => {
    if (!appReady || Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const productId = response.notification.request.content.data?.productId as string | undefined;
      if (productId) navigateToProduct(productId);
    });
    return () => sub.remove();
  }, [appReady]);

  // Handle notification tap when app was killed (cold start)
  useEffect(() => {
    if (!appReady || !lastNotificationResponse) return;
    const { notification, actionIdentifier } = lastNotificationResponse;
    if (actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const productId = notification.request.content.data?.productId as string | undefined;
    if (!productId) return;
    const key = `${notification.request.identifier}-${productId}`;
    if (lastResponseHandled.current === key) return;
    lastResponseHandled.current = key;
    setTimeout(() => navigateToProduct(productId), 300);
  }, [appReady, lastNotificationResponse]);

  if (!fontsLoaded || hasSeenWelcome === null) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  const showWelcome =
    (DEMO_MODE && !demoWelcomeDismissed) || (!DEMO_MODE && hasSeenWelcome === false);
  if (showWelcome) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <WelcomeScreen onComplete={handleWelcomeComplete} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ProductProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="dark" />
            <AppNavigator />
            <ToastContainer />
          </NavigationContainer>
        </ProductProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { isAppleSignInAvailable } from '../../services/authService';
import { isSupabaseConfigured } from '../../config/supabaseConfig';
import { colors, spacing, radius, typography } from '../../theme';
import { showToast } from '../../utils/toast';

/** Native Sign in with Apple requires App ID capability + provisioning profile refresh on EAS. */
const APPLE_SIGN_IN_ENABLED = false;

export default function LoginScreen() {
  const navigation = useNavigation();
  const { signInWithGoogle, signInWithApple, isAuthenticated } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(Platform.OS === 'ios');
  const cloudSignInReady = isSupabaseConfigured();

  useEffect(() => {
    if (isAuthenticated) {
      navigation.goBack();
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    if (!APPLE_SIGN_IN_ENABLED) {
      setAppleAvailable(false);
      return;
    }
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const handleGoogle = async () => {
    setLoadingProvider('google');
    try {
      await signInWithGoogle();
      showToast('Signed in successfully', 'success');
      navigation.goBack();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Google sign-in failed', 'error');
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleApple = async () => {
    setLoadingProvider('apple');
    try {
      await signInWithApple();
      showToast('Signed in successfully', 'success');
      navigation.goBack();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'ERR_REQUEST_CANCELED') return;
      showToast(err instanceof Error ? err.message : 'Apple sign-in failed', 'error');
    } finally {
      setLoadingProvider(null);
    }
  };

  const busy = loadingProvider !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.logoRing}>
            <Text style={styles.logoText}>V</Text>
          </View>
          <Text style={styles.title}>Sign in to sync</Text>
          <Text style={styles.subtitle}>
            Optional — back up your collection and access it on other devices. You can keep using
            Velora locally without signing in.
          </Text>
        </View>

        {!cloudSignInReady && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Cloud sign-in is not configured for this build yet. Your products stay saved on this
              device.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.googleButton, !cloudSignInReady && styles.buttonDisabled]}
            onPress={handleGoogle}
            disabled={busy || !cloudSignInReady}
            activeOpacity={0.85}
            testID="google-sign-in-button"
          >
            {loadingProvider === 'google' ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {appleAvailable && (
            <TouchableOpacity
              style={[styles.button, styles.appleButton]}
              onPress={handleApple}
              disabled={busy}
              activeOpacity={0.85}
              testID="apple-sign-in-button"
            >
              {loadingProvider === 'apple' ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={22} color={colors.white} />
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.goBack()}
            disabled={busy}
            testID="skip-sign-in-button"
          >
            <Text style={styles.skipButtonText}>Continue without signing in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    alignItems: 'flex-start',
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: 42,
    color: colors.primary,
    fontFamily: typography.screenHeader.fontFamily,
  },
  title: {
    ...typography.screenHeader,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  notice: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  actions: {
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleButtonText: {
    ...typography.bodyLargeStrong,
    color: colors.textPrimary,
  },
  appleButton: {
    backgroundColor: colors.primary,
  },
  appleButtonText: {
    ...typography.bodyLargeStrong,
    color: colors.white,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});

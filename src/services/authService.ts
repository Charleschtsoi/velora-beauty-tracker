import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { isSupabaseConfigured } from '../config/supabaseConfig';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const AUTH_CALLBACK_PATH = 'auth/callback';

export function getAuthRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'velora',
    path: AUTH_CALLBACK_PATH,
  });
}

async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    throw new Error(errorCode);
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  const access_token = params.access_token;
  const refresh_token = params.refresh_token;

  if (!access_token || !refresh_token) {
    throw new Error('Sign-in was cancelled or did not return a session.');
  }

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) throw error;
  return data.session;
}

export async function signInWithGoogle(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Cloud sign-in is not configured yet. You can keep using Velora locally on this device.'
    );
  }

  const redirectTo = getAuthRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) {
    throw new Error('Could not start Google sign-in.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    throw new Error('Google sign-in was cancelled.');
  }

  await createSessionFromUrl(result.url);
}

export async function signInWithApple(): Promise<void> {
  throw new Error('Sign in with Apple is temporarily disabled until provisioning is refreshed on EAS.');
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  return false;
}

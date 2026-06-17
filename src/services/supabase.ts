import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from '../config/supabaseConfig';

export { isSupabaseConfigured };

const supabaseUrl = getSupabaseUrl() || 'https://invalid.supabase.co';
const supabaseAnonKey = getSupabaseAnonKey() || 'invalid';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

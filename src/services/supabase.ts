import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase Configuration
// Project reference: jkwzfmafeiylypbwiqca
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://jkwzfmafeiylypbwiqca.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprd3pmbWFmZWl5bHlwYndpcWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTgwNzQsImV4cCI6MjA5NTM5NDA3NH0.FL9YTc_e7Hh1jxuErcdk4d3bRAyckd1DK-tlseQoGSw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

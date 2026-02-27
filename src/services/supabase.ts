import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase Configuration
// Project reference: zpckakekmowkticuazsa
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zpckakekmowkticuazsa.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY2tha2VrbW93a3RpY3VhenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMTM1NTQsImV4cCI6MjA4MzU4OTU1NH0.9qZTjx6YnduG4qZIx3bYWiFr9CQjTLFbjG13JfaJAhY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

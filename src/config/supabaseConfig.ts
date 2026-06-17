export function getSupabaseUrl(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
}

export function getSupabaseAnonKey(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return (
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    !url.includes('your_supabase') &&
    key.length > 20 &&
    !key.includes('your_anon')
  );
}

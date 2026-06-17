# Environment Variables Setup

## Client (.env) – No AI Keys

The app **does not** use AI API keys in the client. AI calls go through a Supabase Edge Function, which holds secrets server-side.

### Required variables

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://zpckakekmowkticuazsa.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Removed variables

Do **not** put these in the client `.env` anymore:
- ~~EXPO_PUBLIC_OPENAI_API_KEY~~
- ~~EXPO_PUBLIC_GEMINI_API_KEY~~
- ~~EXPO_PUBLIC_AI_SERVICE~~

## Server-Side: Supabase Secrets

Configure secrets so edge functions can call external APIs and the Supabase database:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Optional: keys for alternative UPC providers
# supabase secrets set UPC_API_KEY=...
```

Run database migrations and deploy both edge functions:

```bash
supabase db push
supabase functions deploy lookup-product
supabase functions deploy analyze-product-image
```

## Auth (Google + Apple)

Social login uses **Supabase Auth**. Products are stored in the `products` table, scoped to each user via Row Level Security.

### 1. Run the database migration

```bash
supabase db push
```

This creates the `products` table and RLS policies.

### 2. Supabase Dashboard → Authentication → Providers

**Google**
- Enable Google provider
- Add OAuth client ID + secret from [Google Cloud Console](https://console.cloud.google.com/)
- Under **Redirect URLs**, add:
  - `velora://auth/callback`
  - `https://auth.expo.io/@charlestsoi/velora` (for Expo Go dev only)

**Apple**
- Enable Apple provider
- Add Apple Services ID, secret key, and team/bundle details from Apple Developer
- Bundle ID: `com.velorascanner.app`

### 3. Apple Developer

- Enable **Sign in with Apple** on the App ID `com.velorascanner.app`
- Rebuild the iOS app after auth changes (`eas build --platform ios --profile production`)

### 4. Google Cloud (iOS + Android)

- Create OAuth 2.0 client IDs for iOS (`com.velorascanner.app`) and Android (package + SHA-1)
- Use the **Web client** credentials in Supabase Google provider settings

---


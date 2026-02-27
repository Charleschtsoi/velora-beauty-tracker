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

See [docs/AI_SCANNING_ARCHITECTURE.md](docs/AI_SCANNING_ARCHITECTURE.md) for full deployment steps.

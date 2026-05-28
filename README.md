# Velora - Beauty Product Expiration Tracker

Velora is an Expo React Native app for tracking beauty product expiration dates with barcode scanning, AI-assisted label capture, and reminder notifications.

## Highlights

- Barcode scan flow with Supabase lookup (`lookup-product` edge function)
- AI photo flow for label extraction (`analyze-product-image`) with barcode-assisted fallback
- One-tap camera experience in AI mode (auto-captures post-barcode label photo)
- Expiration reminders and inventory status (expired / expiring soon / safe)
- Demo catalog mode for investor/demo walkthroughs

## Tech Stack

- React Native + Expo SDK 54
- TypeScript
- React Navigation
- Supabase (Edge Functions + Postgres)
- NativeWind/Tailwind

## Requirements

- Node.js 20.19+ (or newer LTS)
- npm
- Expo Go (iOS/Android) for physical-device testing

## Getting Started

1. Clone and install:

```bash
git clone https://github.com/Charleschtsoi/velora-beauty-tracker.git
cd velora-beauty-tracker
npm install
```

2. Configure environment (`.env.local`):

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start app:

```bash
npm start
```

## Development Commands

- Start (default): `npm start`
- Start tunnel (strict helper): `npm run start:tunnel`
- iOS simulator: `npm run ios`
- Android emulator: `npm run android`
- Web: `npm run web`

## Supabase Migrations

Project includes Supabase migrations under `supabase/migrations` (demo catalog + updates).

Apply migrations to remote:

```bash
supabase db push --include-all
```

## Scan Experience (Current)

- **Barcode mode**: scans barcode and looks up metadata via Supabase edge function.
- **AI Photo mode**: captures product photo, analyzes label, and merges barcode lookup when available.
- If barcode is recognized during AI capture, Velora uses it to improve matching and expiry prefill.
- Post-barcode label capture is now automatic once camera is ready (no extra tap required).

## Demo Catalog Notes

Demo products are configured in:

- `src/config/demoProducts.ts`
- `supabase/migrations/*demo*`

Recent demo updates include Chanel, Hada Labo, and Neutrogena catalog entries (with expiry metadata aligned in Supabase).

## Troubleshooting

### Expo package compatibility warning

If Expo suggests patch updates, run:

```bash
npx expo install expo expo-file-system expo-image-picker expo-notifications
```

Then restart Metro.

### Tunnel errors (`remote gone away`)

Tunnel uses ngrok and can be intermittent.

- Retry `npx expo start --tunnel`
- Check https://status.ngrok.com/
- Try another network/hotspot
- If phone and Mac are on same Wi-Fi, use LAN (`npm start`) instead

### Camera issues

- Grant camera permission in OS settings
- Use Manual entry fallback if camera is unavailable

## Project Structure

```text
src/
  components/
  config/
  context/
  navigation/
  screens/
  services/
  theme/
  types/
  utils/
supabase/
  functions/
  migrations/
```

## License

Private project. All rights reserved.

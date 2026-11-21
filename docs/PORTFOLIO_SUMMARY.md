# Velora — short portfolio summary

**What it is:** An Expo / React Native (TypeScript) beauty-product expiration tracker with
barcode lookup and optional AI label-photo extraction via Supabase Edge Functions (Gemini).

**What this polish demonstrates:** An AI-assisted intake loop that stays honest —
extract → human review with visible uncertainty → validate → save — rather than
treating model output as ground truth.

## Built / verified in this workshop iteration

- Review summary on Add Product when arriving from scan/AI/barcode prefills
- High / Medium / Low / unknown confidence labels and amber borders for uncertain fields
- Specific validation messages + scroll toward first error; clearer saving state
- Sanitized AI/Edge/save errors (no raw status/JSON in toasts)
- Prefills applied once so revisiting the screen does not wipe edits
- `DEMO_MODE` defaulted to `false` so the review path is the demo path
- Focused unit tests (`npm test`) for confidence, validation, and error sanitization
- Workshop demo notes in `docs/WORKSHOP_DEMO.md`

## Stack (actual)

React Native + Expo SDK 54, TypeScript, React Navigation, AsyncStorage (guest) /
Supabase (optional auth + Edge Functions), NativeWind.

## Not claimed

- Production adoption, DAU, or retention metrics
- Medical / dermatology / skin diagnosis
- Live Gemini verification in CI without configured secrets
- Full rewrite of scan camera or catalog systems

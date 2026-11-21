# Velora workshop demo — Add → Review → Save

Honest, reproducible steps for a short hands-on workshop. This documents what the app
actually does today after the Add Product review polish.

## What this demo shows

1. Open **Add Product** (manual or after a scan).
2. When fields come from barcode lookup or AI label photo, a **review summary** explains
   what was pre-filled and which fields look uncertain.
3. Low / unknown confidence fields use amber borders and plain-language source tags
   (High / Medium / Low / unknown — please verify).
4. Save requires **product name** and **expiration date**; validation names the missing
   fields and scrolls toward the first error.
5. AI / Edge failures surface short user-facing messages — not raw status/JSON blobs.

No medical or skin-diagnosis claims. No production user metrics.

## Configuration (no secrets in repo)

| Need | Where | Notes |
|------|--------|--------|
| Client Supabase | `.env.local`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Fallbacks exist in `src/services/supabase.ts` so the app can boot offline |
| Gemini API key | Supabase Edge Function secret `GEMINI_API_KEY` only | Never put the model key in the client |
| Edge functions | `analyze-product-image`, `lookup-product` | See `ENV_SETUP.md` / `AI_CAMERA_SETUP.md` |

Copy from `.env.example`. Do not commit `.env.local`.

## `DEMO_MODE`

`src/config/demoMode.ts` defaults to **`false`** for this portfolio path so scan/AI opens
the review form instead of auto-saving curated catalog products.

- `false` — barcode/AI → **Add Product** review → save (this workshop).
- `true` — investor-style catalog match / often auto-add (skips most of the review story).

## Reproducible demo (web / cloud VM)

Camera is unavailable on the headless web target. Use manual entry to exercise the form;
use a device/simulator for live barcode/AI.

```bash
npm install
npx expo start --web --port 8081
# open http://localhost:8081
```

### Manual path (always works offline)

1. Home or Scan → **Manual entry** / navigate to Add Product.
2. Leave name or expiration empty → tap **Save Product** → see specific validation.
3. Fill name + expiration → Save → product detail.
4. Confirm inventory lists the product (guest data in AsyncStorage).

### Review UX without live Gemini (`__DEV__` fixture)

In development builds (including `expo start --web`), Scan shows:

**Dev: open review form with fixture AI fields (not live Gemini)**

(Also visible on the camera-permission fallback screen used by headless web.)

That opens Add Product with `FIXTURE_AI_FIELDS_MIXED` (low-confidence name, missing expiry).
Use it to demo the review summary + amber uncertain fields. It is **not** a live API call.

Optional headless walkthrough (after `npm install` + Expo web running):

```bash
node scripts/workshop-web-demo.mjs
```

### Live AI path (device + secrets)

On a device with Edge Functions + `GEMINI_API_KEY` deployed:

1. Scan → **AI Photo** → capture a clear front label.
2. Expect toast: suggested fields filled — review uncertain ones.
3. On Add Product: review summary + amber fields where confidence is low/unknown.
4. Correct fields → Save.

If Gemini / Edge is not configured, AI mode stays unavailable or fails with a friendly
message and you can still add manually. **Live Gemini was not required for the unit tests
in this PR** (deterministic fixtures only).

### Barcode path

1. Scan barcode (device) or rely on lookup Edge Function.
2. Matched → Add Product with barcode prefill + review summary.
3. Miss → collaborative not-found banner + empty/partial form.

## Automated checks

```bash
npm test
```

Runs Node tests for confidence banding, form validation, and user-facing error sanitization
(`src/utils/*.test.ts`). Fixtures live in `src/utils/addProductFixtures.ts` and are marked
as non-live.

There is no project-wide `tsc` / lint gate; known pre-existing type noise exists on `main`
(see `AGENTS.md`).

## Known limitations (factual)

- Web: no camera; barcode/AI capture cannot be exercised in the cloud VM browser.
- AI quality depends on photo clarity and the deployed `analyze-product-image` function;
  confidence scores are model-reported estimates, not ground truth.
- Guest inventory is local (AsyncStorage); signed-in sync needs a working Supabase project.
- `DEMO_READY.md` describes an older investor demo narrative and may not match this
  workshop default (`DEMO_MODE=false`, empty inventory until you add products).
- Open Food Facts barcode hits can map poorly into beauty categories.
- Live AI integration is **not** claimed verified in CI without secrets.

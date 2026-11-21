# Product screenshots

Used at the top of the root `README.md` for a quick product skim.

| File | Screen |
|------|--------|
| `01-home.png` | Home — shelf care overview |
| `02-add-review.png` | Add Product — AI review + confidence |
| `03-product-detail.png` | Product Detail — SAFE / expiry |

Regenerate (Expo web must be running on port 8081):

```bash
npx expo start --web --port 8081
node scripts/capture-readme-screens.mjs
```

Captured from the web target; camera is unavailable there, so the review shot uses the `__DEV__` fixture path (not live Gemini).

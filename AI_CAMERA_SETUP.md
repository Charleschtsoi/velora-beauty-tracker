# AI Camera Feature Setup & Usage

## ✅ What's Been Implemented

### 1. **Hybrid Autofill Pipeline**
   - Barcode lookup via Supabase Edge Function `lookup-product` (cached in `product_cache`)
   - AI photo analysis via `analyze-product-image` with known field hints
   - Per-field `{ value, confidence, source }` returned to the app

### 2. **Enhanced Scan Screen** (`src/screens/ScanScreen.tsx`)
   - **Barcode mode** triggers UPC lookup and preserves results for AI fallback
   - **AI Photo mode** passes known fields to Gemini and merges responses
   - Loading states/alerts for lookup and AI analysis

### 3. **Auto-Fill Form** (`src/screens/AddProductScreen.tsx`)
   - Displays source badges (Barcode vs AI vs Manual) with confidence scores
   - Highlights low-confidence fields for manual confirmation
   - Merges ingredients/notes while keeping manual edits

### 4. **Environment Configuration**
   - Client: only Supabase URL and anon key (see `ENV_SETUP.md`)
   - Secrets (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, optional UPC keys) live in Supabase

---

## 🔑 Backend Setup (Required for Hybrid Autofill)

1. Install Supabase CLI: `npm i -g supabase`
2. Log in: `supabase login`
3. Link project: `supabase link --project-ref zpckakekmowkticuazsa`
4. Configure secrets:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_key
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   # Optional: supabase secrets set UPC_API_KEY=...
   ```
5. Apply migrations & deploy functions:
   ```bash
   supabase db push
   supabase functions deploy lookup-product
   supabase functions deploy analyze-product-image
   ```

---

## 🚀 How to Use

### Recommended Flow (Hybrid)

1. Open the **Scan** tab (barcode mode by default).
2. Scan the UPC/EAN — the app performs the lookup and pre-fills key fields.
3. Switch to **AI Photo** mode and capture the label to fetch expiry/notes.
4. Review confidence badges in the Add Product screen (red text signals low confidence).
5. Adjust anything that looks wrong and tap **Save Product**.

> You can still jump straight to AI Photo, but barcode → photo gives the most accurate results.

---

## ⚙️ Configuration

### Client `.env` (no AI keys):
```env
EXPO_PUBLIC_SUPABASE_URL=https://zpckakekmowkticuazsa.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Supabase Secrets (Edge Functions):
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Optional UPC provider secrets...
```

AI/UPC keys are stored server-side only; they are never in the app.

---

## 🎯 What the AI Extracts

The AI analyzes product labels and extracts:

- ✅ **Product Name**: e.g., "Neutrogena Ultra Gentle Daily Cleanser"
- ✅ **Brand**: e.g., "Neutrogena"
- ✅ **Category**: Skincare, Makeup, Haircare, Fragrance, etc.
- ✅ **Expiration Date**: Parsed and formatted as YYYY-MM-DD
- ✅ **Ingredients**: Key ingredients list (if visible)
- ✅ **Notes**: Any additional information found

**Note**: Not all fields may be detected - depends on label clarity and visibility.

---

## 🔧 Troubleshooting

### "AI service not configured" error
- Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart Expo server with `npx expo start --clear`

### AI analysis fails / Edge Function error
- Ensure `analyze-product-image` is deployed and secrets exist (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Check Supabase Dashboard > Edge Functions > analyze-product-image > Logs

### Barcode lookup fails
- Ensure `lookup-product` is deployed
- Confirm `SUPABASE_SERVICE_ROLE_KEY` secret is set so the function can call the cache
- UPC databases don’t know every product — manual entry may be required

### Camera not capturing photos
- Wait for "Camera ready" indicator
- Ensure good lighting
- Hold phone steady while capturing
- Check camera permissions

### AI returns poor or empty data
- Ensure product label is clearly visible
- Good lighting helps significantly
- Try different angles if first attempt fails
- Scan barcode first so Gemini receives known fields

### Form not auto-filling
- Check that navigation params include `aiData`
- Verify AI response contains expected fields
- Review console logs for errors

---

## 💡 Tips for Best Results

1. **Lighting**: Ensure good, even lighting on the product label
2. **Distance**: Keep phone 6-12 inches from label
3. **Focus**: Wait for camera to focus before capturing
4. **Angle**: Hold phone parallel to label (avoid glare)
5. **Clarity**: Ensure text on label is readable
6. **Review**: Always review auto-filled data before saving

---

## 📁 Files Changed

- ✅ `src/services/aiService.ts` - Sends known fields & parses confidence map
- ✅ `src/services/upcService.ts` - UPC lookup helper
- ✅ `supabase/functions/analyze-product-image/` - Gemini extraction w/ confidence
- ✅ `supabase/functions/lookup-product/` - Barcode lookup + caching
- ✅ `supabase/migrations/20260211_create_product_cache.sql` - Cache table
- ✅ `src/screens/ScanScreen.tsx` - Hybrid scan workflow
- ✅ `src/screens/AddProductScreen.tsx` - Source badges & confirmation UI
- ✅ `docs/AI_SCANNING_ARCHITECTURE.md` - Architecture and deployment guide

---

## 🎉 Ready to Test!

1. **Restart Expo server**:
   ```bash
   npx expo start --clear
   ```

2. **Open app** in Expo Go

3. **Navigate to Scan tab**

4. **Switch to "AI Photo" mode**

5. **Test with a real beauty product**!

---

**Current Status**: ✅ Hybrid flow ready — run migrations, set secrets, deploy `lookup-product` & `analyze-product-image`, then test barcode → AI capture.

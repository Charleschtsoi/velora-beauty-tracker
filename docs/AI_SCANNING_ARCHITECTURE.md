# AI Photo Scanning Architecture

## 1. Current Client-Side Flow and Risks

### Flow
1. User selects "AI Photo" mode on Scan screen
2. User taps capture; `expo-camera` takes a photo
3. `aiService.analyzeProductImage(photo.uri)` reads image as base64 via `expo-file-system`
4. Client calls either OpenAI (`/v1/chat/completions`) or Gemini (`generateContent`) directly from the app
5. Response is parsed for JSON; structured `{ field: { value, confidence } }` is passed to Add Product via navigation params
6. Add Product screen autofills name, category, expiration date, notes, photo

### Risks
- **API key exposure**: `EXPO_PUBLIC_*` keys are bundled into the app and visible to anyone who inspects the bundle
- **Abuse**: No server-side rate limiting; keys can be extracted and used for arbitrary API calls
- **Cost governance**: Hard to enforce quotas or monitor usage per user
- **Reliability**: No centralized retry/fallback logic or observability

---

## 2. Architecture Options

| Option | Description | Pros | Cons | Effort |
|--------|-------------|------|------|--------|
| **1. Client-Direct** | Keep AI calls in app; improve prompts/retries only | Fastest; minimal changes | Key exposure; weak controls | Low |
| **2. Edge Function Proxy** | Supabase Edge Function calls Gemini/OpenAI; app calls function | Protects keys; observability; quotas | Moderate setup | Medium |
| **3. Multi-Provider Gateway** | Edge Function + provider fallback + confidence scoring | Highest resilience | Most complexity | High |

---

## 3. Recommended Path

**Option 2 (Supabase Edge Function Proxy)** is recommended for production:
- Secrets stay in Supabase; no AI keys in the mobile bundle
- Centralized validation, rate limiting, and telemetry
- Same UX: Scan -> AI extract -> prefilled Add Product
- Can evolve to Option 3 later if SLA/scale demands increase

---

## 4. Implementation (Option 2)

### Components
- **Client**: `aiService.ts` sends image + known fields to Supabase Edge Functions and receives per-field `{ value, confidence, source }`.
- **Edge Functions**:
  - `analyze-product-image` receives image and known fields, calls Gemini, returns structured JSON with confidences.
  - `lookup-product` receives a barcode, queries a product API (Open Food Facts), and caches normalized data in `product_cache`.
- **Secrets**: `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and optional UPC API keys are stored as Supabase secrets; never in `EXPO_PUBLIC_*`.

### Validation
- No AI provider keys in mobile bundle
- Graceful fallback to manual entry on failure
- End-to-end flow preserved: Scan -> AI extract -> prefilled Add Product

---

## 5. Limitations of Single-Photo Extraction

- **Low-text fidelity**: One snapshot often includes glare, curvature, or small expiry stamps; Gemini tends to skip unreadable tokens instead of OCR-ing them.
- **Incomplete coverage**: Front labels rarely include batch or expiry data, while the back label may hide branding—one photo cannot show both.
- **LLM summarization**: Vision LLMs guess based on context; ambiguous packaging can lead to hallucinated brand names or misread dates.
- **Format diversity**: Expiration/batch formats vary widely (`MM/YY`, `Best before 2025-04`, dot matrices). Without regex post-processing the model misses them.
- **No confidence scores**: Responses lack certainty metadata, so users cannot tell whether returned values are trustworthy.

**Takeaway:** Expect only partial autofill from a single photo. To reliably populate key fields (name, brand, expiry) you need clearer captures, multiple angles, or an external product database (barcode/UPC lookup).

---

## 6. Hybrid Flow Proposal (Barcode + AI Fallback)

### Sequence
1. **Primary barcode scan**  
   - Use existing scanner to obtain UPC/EAN.  
   - Immediately call a product database (Open Food Facts, UPCitemDB, or private catalog) via Edge Function `lookup-product`.  
   - Cache successful lookups in Supabase to avoid repeated external calls.
2. **Populate structured fields**  
   - Map API response to `name`, `brand`, `category`, `size`, `ingredients`.  
   - Persist source + confidence (e.g., `"source": "upc_lookup"`).
3. **Request AI fill only for gaps**  
   - If no expiry/date info returned, prompt user to capture label.  
   - Send photo + already known fields to `analyze-product-image`, asking Gemini to locate missing attributes.  
   - Merge AI output with UPC metadata; mark AI-derived fields with confidence.
4. **User confirmation**  
   - Highlight fields by source (“From barcode”, “From photo AI”).  
   - Allow quick edits before saving.

### Edge Functions Needed
- `lookup-product` (new):  
  - Input: barcode string.  
  - Calls external UPC API, performs schema normalization, caches result in Supabase table (e.g., `product_cache`).  
  - Returns structured payload + confidence flag.
- Existing `analyze-product-image`:  
  - Add optional `knownFields` to prompt so the LLM can focus on missing data.

### Benefits
- Barcode DB provides high-confidence name/brand without user effort.  
- Gemini is used only when unavoidable (e.g., expiry printed physically).  
- Combined approach reduces hallucination risk and leverages strengths of both data sources.

---

## 7. Deployment: Edge Functions & Cache

### Prerequisites
- Supabase CLI: `npm i -g supabase`
- Logged in: `supabase login`
- Service role key accessible (Settings → API → service key)

### Configure secrets (run once per project)
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Optional: UPC API credentials if you switch providers
# supabase secrets set UPC_API_KEY=...
```

### Database migration
```bash
supabase db push   # applies product_cache table
```

### Deploy functions
```bash
supabase functions deploy analyze-product-image
supabase functions deploy lookup-product
```

### Local development
```bash
supabase secrets set GEMINI_API_KEY=your_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Requires `supabase start --no-analytics`
supabase functions serve analyze-product-image
supabase functions serve lookup-product
```

### Client env vars (no AI keys)
The app still only needs:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Keep AI provider keys and service role key out of the client bundle.

---

## 8. Prompt & Confidence Strategy

### Prompt Template (Edge Function)
```json
{
  "role": "system",
  "content": "You are a diligent assistant extracting beauty product metadata. Use the image plus any known fields. Return strict JSON with: name, brand, category, expirationDate, ingredients, notes. Include confidence scores (0-1) for each field. If unsure, omit the field."
}
```
User message payload should include:
- `knownFields`: object containing UPC-derived data (`{ "name": "...", "brand": "..." }`).
- Clear instruction: “Only fill fields you are confident about; otherwise omit.”

### Post-processing
- Parse JSON and attach to response as `{ value, source, confidence }`.
- If `confidence < 0.6`, flag field for user confirmation (highlight in UI).
- If field missing, trigger “Need manual input” prompt with quick entry UI.

### Telemetry
- Log confidence distributions to Supabase (bucketed counts) to tune threshold.
- Track manual overrides to refine regex/date extraction.

**Outcome:** Users see which fields are reliable, while low-confidence values no longer silently autofill.

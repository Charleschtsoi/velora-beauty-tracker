import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_MODEL = "gemini-2.0-flash-lite";
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB
const FIELDS = ["name", "brand", "category", "packagingColor", "expirationDate", "ingredients", "notes"] as const;

type FieldKey = typeof FIELDS[number];

interface DemoProductRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  volume: string;
  expiration_date: string;
  production_date: string | null;
  notes: string;
  demo_photo_uri: string | null;
  barcode: string | null;
  primary_ocr_cues: string[];
  secondary_ocr_cues: string[];
  packaging_color: string;
  ingredients_summary: string;
  routine_advice: string;
  enabled: boolean;
  sort_order: number;
}

interface AIFieldEntry {
  value: string | null;
  confidence: number | null;
  source: string;
}

type AIFieldMap = Record<FieldKey, AIFieldEntry>;

interface MatchResult {
  product: DemoProductRow | null;
  score: number;
  matchedCues: string[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = SUPABASE_URL && SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

const PROMPT_TEMPLATE = (knownFieldsSummary: string) => `
You are a diligent assistant extracting beauty product metadata. Use the provided label image and known fields.

Known fields (JSON):
${knownFieldsSummary}

Return STRICT JSON with the following shape:
{
  "name": {"value": string | null, "confidence": number},
  "brand": {"value": string | null, "confidence": number},
  "category": {"value": string | null, "confidence": number},
  "packagingColor": {"value": string | null, "confidence": number},
  "expirationDate": {"value": string | null, "confidence": number, "format": "YYYY-MM-DD"},
  "ingredients": {"value": string | null, "confidence": number},
  "notes": {"value": string | null, "confidence": number}
}

- confidence MUST be between 0 and 1.
- If a value is unknown, set value to null and confidence to 0.
- packagingColor should be a short lowercase hyphenated description of the package appearance, e.g. "yellow-gold", "white-silver", "transparent-brown", "dark-red", "glass-pink", "matte-black".
- Do not invent information.`;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeColor(value: string | null | undefined): string[] {
  if (!value) return [];
  return normalize(value)
    .split(/[\s-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function mapDemoProductRow(row: DemoProductRow) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    volume: row.volume,
    expirationDate: row.expiration_date,
    productionDate: row.production_date,
    notes: row.notes,
    demoPhotoUri: row.demo_photo_uri,
    barcode: row.barcode,
    matcherHints: {
      primaryOcrCues: row.primary_ocr_cues,
      secondaryOcrCues: row.secondary_ocr_cues,
      packagingColor: row.packaging_color,
    },
    mockAiEnrichment: {
      ingredientsSummary: row.ingredients_summary,
      routineAdvice: row.routine_advice,
    },
  };
}

function parseJsonFromContent(content: string): unknown {
  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in response");
  return JSON.parse(match[0]);
}

function summariseKnownFields(knownFields: Record<string, unknown> | null): string {
  if (!knownFields || Object.keys(knownFields).length === 0) {
    return "None";
  }
  try {
    return JSON.stringify(knownFields, null, 2);
  } catch {
    return "Provided but could not stringify";
  }
}

function normaliseFieldEntry(entry: unknown): { value: string | null; confidence: number | null } {
  if (entry == null) {
    return { value: null, confidence: null };
  }

  if (typeof entry === "object" && "value" in entry) {
    const typedEntry = entry as { value?: unknown; confidence?: unknown };
    const rawValue = typedEntry.value;
    const rawConfidence = typedEntry.confidence;
    return {
      value: typeof rawValue === "string" ? rawValue : rawValue == null ? null : String(rawValue),
      confidence: typeof rawConfidence === "number"
        ? rawConfidence
        : typeof rawConfidence === "string"
        ? Number.parseFloat(rawConfidence)
        : null,
    };
  }

  return {
    value: typeof entry === "string" ? entry : String(entry),
    confidence: null,
  };
}

function buildHaystack(fields: Partial<AIFieldMap>): string {
  return normalize(
    FIELDS
      .map((key) => fields[key]?.value)
      .filter(Boolean)
      .join(" ")
  );
}

function scoreColorHint(expectedColor: string, detectedColor: string | null | undefined) {
  const expected = normalize(expectedColor);
  const detected = normalize(detectedColor ?? "");

  if (!expected || !detected) {
    return { score: 0, cue: null as string | null };
  }

  if (expected === detected) {
    return { score: 5, cue: `color:${detectedColor}` };
  }

  const expectedTokens = tokenizeColor(expectedColor);
  const detectedTokens = tokenizeColor(detectedColor);
  const overlap = expectedTokens.filter((token) => detectedTokens.includes(token));

  if (overlap.length >= 2) {
    return { score: 4, cue: `color:${detectedColor}` };
  }

  if (overlap.length === 1) {
    return { score: 2, cue: `color:${detectedColor}` };
  }

  return { score: 0, cue: null as string | null };
}

function scoreProductAgainstFields(product: DemoProductRow, fields: Partial<AIFieldMap>): MatchResult {
  const haystack = buildHaystack(fields);
  const detectedColor = fields.packagingColor?.value ?? null;

  if (!haystack && !detectedColor) {
    return { product: null, score: 0, matchedCues: [] };
  }

  const matchedCues: string[] = [];
  let score = 0;

  const brand = normalize(product.brand);
  const name = normalize(product.name);

  if (haystack.includes(brand)) {
    score += 7;
    matchedCues.push(product.brand);
  }

  const nameTokens = name
    .split(" ")
    .filter((token) => token.length >= 4)
    .slice(0, 3);
  const matchedNameTokens = nameTokens.filter((token) => haystack.includes(token));
  score += matchedNameTokens.length * 3;
  matchedCues.push(...matchedNameTokens);

  product.primary_ocr_cues.forEach((cue) => {
    const normalizedCue = normalize(cue);
    if (normalizedCue && haystack.includes(normalizedCue)) {
      score += 10;
      matchedCues.push(cue);
    }
  });

  product.secondary_ocr_cues.forEach((cue) => {
    const normalizedCue = normalize(cue);
    if (normalizedCue && haystack.includes(normalizedCue)) {
      score += 4;
      matchedCues.push(cue);
    }
  });

  const colorScore = scoreColorHint(product.packaging_color, detectedColor);
  score += colorScore.score;
  if (colorScore.cue) {
    matchedCues.push(colorScore.cue);
  }

  if (score === 0) {
    return { product: null, score: 0, matchedCues: [] };
  }

  return {
    product,
    score,
    matchedCues: Array.from(new Set(matchedCues)),
  };
}

async function fetchEnabledDemoProducts(): Promise<DemoProductRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from<DemoProductRow>("demo_products")
    .select(`
      id,
      name,
      brand,
      category,
      volume,
      expiration_date,
      production_date,
      notes,
      demo_photo_uri,
      barcode,
      primary_ocr_cues,
      secondary_ocr_cues,
      packaging_color,
      ingredients_summary,
      routine_advice,
      enabled,
      sort_order
    `)
    .eq("enabled", true)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

async function fetchDemoProductByBarcode(barcode: string): Promise<DemoProductRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from<DemoProductRow>("demo_products")
    .select(`
      id,
      name,
      brand,
      category,
      volume,
      expiration_date,
      production_date,
      notes,
      demo_photo_uri,
      barcode,
      primary_ocr_cues,
      secondary_ocr_cues,
      packaging_color,
      ingredients_summary,
      routine_advice,
      enabled,
      sort_order
    `)
    .eq("barcode", barcode)
    .eq("enabled", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function analyzeImage(
  imageBase64: string,
  knownFields: Record<string, unknown> | null,
): Promise<AIFieldMap> {
  if (!GEMINI_API_KEY) {
    throw new Error("AI service not configured");
  }

  const rawBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1]! : imageBase64;
  const sizeBytes = (rawBase64.length * 3) / 4;
  if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image too large");
  }

  const prompt = PROMPT_TEMPLATE(summariseKnownFields(knownFields));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: rawBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1024,
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } })?.error?.message ?? res.statusText;
    throw new Error(`AI service error: ${msg}`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const raw = parseJsonFromContent(content);

  if (typeof raw !== "object" || raw === null) {
    throw new Error("Model response was not an object");
  }

  return FIELDS.reduce((acc, field) => {
    const { value, confidence } = normaliseFieldEntry((raw as Record<string, unknown>)[field]);
    acc[field] = {
      value: value ?? null,
      confidence: confidence ?? null,
      source: "ai",
    };
    return acc;
  }, {} as AIFieldMap);
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const start = Date.now();

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => null);
    const barcode = body?.barcode?.toString().trim() || null;
    const imageBase64 = body?.imageBase64 ?? body?.image ?? null;
    const knownFields =
      body?.knownFields && typeof body.knownFields === "object" ? body.knownFields : null;

    if (barcode) {
      const exactMatch = await fetchDemoProductByBarcode(barcode);
      if (exactMatch) {
        return new Response(
          JSON.stringify({
            success: true,
            matched: true,
            confidence: 1,
            product: mapDemoProductRow(exactMatch),
            matchedCues: [barcode],
            extractedFields: null,
            candidates: [],
            telemetry: {
              latencyMs: Date.now() - start,
              knownFieldsProvided: !!knownFields,
              matchSource: "barcode",
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Missing imageBase64 in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const products = await fetchEnabledDemoProducts();
    if (products.length === 0) {
      throw new Error("No demo products configured");
    }

    const extractedFields = await analyzeImage(imageBase64, knownFields);
    const ranked = products
      .map((product) => scoreProductAgainstFields(product, extractedFields))
      .filter((result) => result.product)
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    const runnerUp = ranked[1];
    const matched =
      !!best?.product &&
      best.score >= 10 &&
      (!runnerUp || best.score - runnerUp.score >= 3);

    return new Response(
      JSON.stringify({
        success: true,
        matched,
        confidence: best?.score ?? 0,
        product: matched && best?.product ? mapDemoProductRow(best.product) : null,
        matchedCues: matched ? best.matchedCues : [],
        extractedFields,
        candidates: ranked
          .slice(0, 3)
          .map((result) => result.product)
          .filter(Boolean)
          .map((product) => mapDemoProductRow(product as DemoProductRow)),
        telemetry: {
          latencyMs: Date.now() - start,
          knownFieldsProvided: !!knownFields,
          matchSource: matched ? "ocr-hints" : "candidate-list",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        telemetry: {
          latencyMs: Date.now() - start,
        },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// Supabase Edge Function: lookup-product
// Looks up product metadata by barcode using a cache + Open Food Facts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CacheRecord {
  barcode: string;
  payload: Record<string, unknown>;
  confidence: number | null;
  source: string | null;
  updated_at: string;
}

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

interface LookupResponse {
  success: boolean;
  fromCache: boolean;
  data?: Record<string, unknown>;
  confidence?: number;
  error?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL) {
  console.warn("SUPABASE_URL is not set. Edge function will fail.");
}

const supabase = SUPABASE_URL && SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

const CACHE_TTL_HOURS = 24 * 7; // 7 days

function mapDemoProductRow(row: DemoProductRow): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    size: row.volume,
    volume: row.volume,
    expirationDate: row.expiration_date,
    productionDate: row.production_date,
    notes: row.notes,
    ingredients: row.ingredients_summary,
    routineAdvice: row.routine_advice,
    demoPhotoUri: row.demo_photo_uri,
    barcode: row.barcode,
    packagingColor: row.packaging_color,
    primaryOcrCues: row.primary_ocr_cues,
    secondaryOcrCues: row.secondary_ocr_cues,
    source: "demo_catalog",
    confidence: 1,
    demoProduct: {
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
    },
  };
}

async function fetchFromDemoCatalog(barcode: string): Promise<LookupResponse | null> {
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

  return {
    success: true,
    fromCache: false,
    data: mapDemoProductRow(data),
    confidence: 1,
  };
}

async function fetchFromCache(barcode: string): Promise<LookupResponse | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from<CacheRecord>("product_cache")
    .select("payload, confidence, updated_at")
    .eq("barcode", barcode)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const updatedAt = new Date(data.updated_at).getTime();
  const isFresh = Date.now() - updatedAt < CACHE_TTL_HOURS * 60 * 60 * 1000;
  if (!isFresh) {
    return null;
  }

  return {
    success: true,
    fromCache: true,
    data: data.payload,
    confidence: data.confidence ?? undefined,
  };
}

async function saveToCache(
  barcode: string,
  payload: Record<string, unknown>,
  confidence: number | undefined,
) {
  if (!supabase) return;
  await supabase
    .from("product_cache")
    .upsert(
      {
        barcode,
        payload,
        confidence: confidence ?? null,
        source: "openfoodfacts",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "barcode" },
    );
}

function mapOpenFoodFacts(
  raw: Record<string, any>,
): { data: Record<string, unknown>; confidence: number } {
  const product = raw.product ?? {};
  const status = raw.status;

  const confidence = status === 1 ? 0.9 : 0.3;

  const cleaned = {
    name: product.product_name || null,
    brand: product.brands ? String(product.brands).split(",")[0]?.trim() ?? null : null,
    category: product.categories_tags?.[0]?.replace("en:", "") ?? null,
    size: product.quantity || null,
    ingredients: product.ingredients_text || null,
    image: product.image_front_small_url || product.image_url || null,
    source: "openfoodfacts",
    confidence,
    barcode: product._id || raw.code,
  };

  return { data: cleaned, confidence };
}

async function fetchFromOpenFoodFacts(
  barcode: string,
): Promise<LookupResponse> {
  const url =
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    return {
      success: false,
      fromCache: false,
      error: `External API error: ${res.status} ${res.statusText}`,
    };
  }

  const json = await res.json();
  if (json.status !== 1) {
    return {
      success: false,
      fromCache: false,
      error: "Product not found in Open Food Facts",
    };
  }

  const { data, confidence } = mapOpenFoodFacts(json);
  await saveToCache(barcode, data, confidence);

  return {
    success: true,
    fromCache: false,
    data,
    confidence,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const barcode = body?.barcode?.toString().trim();

    if (!barcode || barcode.length < 5) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid barcode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const demoCatalogResult = await fetchFromDemoCatalog(barcode);
    if (demoCatalogResult) {
      return new Response(JSON.stringify(demoCatalogResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try cache next
    const cached = await fetchFromCache(barcode);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch from upstream
    const result = await fetchFromOpenFoodFacts(barcode);
    const status = result.success ? 200 : 404;

    return new Response(JSON.stringify(result), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("lookup-product error", error);
    return new Response(
      JSON.stringify({ success: false, error: "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

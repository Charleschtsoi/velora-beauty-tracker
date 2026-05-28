// Supabase Edge Function: analyze-product-image
// Calls Gemini Vision API with server-side secret; returns strict JSON schema.
// No AI keys are exposed to the client.

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB
const GEMINI_MODEL = "gemini-2.0-flash-lite";

const FIELDS = ["name", "brand", "category", "packagingColor", "expirationDate", "ingredients", "notes"] as const;

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResponsePayload {
  success: boolean;
  data?: Record<string, { value: string | null; confidence: number | null; source: string }>;
  error?: string;
  telemetry?: {
    latencyMs: number;
    parseSuccess: boolean;
    knownFieldsProvided: boolean;
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

function normaliseFieldEntry(entry: any): { value: string | null; confidence: number | null } {
  if (entry == null) {
    return { value: null, confidence: null };
  }

  if (typeof entry === "object" && "value" in entry) {
    const rawValue = entry.value;
    const rawConfidence = entry.confidence;
    return {
      value: typeof rawValue === "string" ? rawValue : rawValue == null ? null : String(rawValue),
      confidence: typeof rawConfidence === "number"
        ? rawConfidence
        : typeof rawConfidence === "string"
        ? Number.parseFloat(rawConfidence)
        : null,
    };
  }

  // backwards compatibility if plain string returned
  return {
    value: typeof entry === "string" ? entry : entry == null ? null : String(entry),
    confidence: null,
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const start = Date.now();
  let parseSuccess = false;

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI service not configured",
          telemetry: { latencyMs: Date.now() - start, parseSuccess: false },
        } as ResponsePayload),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" } as ResponsePayload),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const imageBase64 = body?.imageBase64 ?? body?.image;
    const knownFields =
      body?.knownFields && typeof body.knownFields === "object" ? body.knownFields : null;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing imageBase64 in request body",
          telemetry: {
            latencyMs: Date.now() - start,
            parseSuccess: false,
            knownFieldsProvided: !!knownFields,
          },
        } as ResponsePayload),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1]! : imageBase64;
    const sizeBytes = (rawBase64.length * 3) / 4;
    if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Image too large",
          telemetry: {
            latencyMs: Date.now() - start,
            parseSuccess: false,
            knownFieldsProvided: !!knownFields,
          },
        } as ResponsePayload),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as { error?: { message?: string } })?.error?.message ?? res.statusText;
      return new Response(
        JSON.stringify({
          success: false,
          error: `AI service error: ${msg}`,
          telemetry: {
            latencyMs: Date.now() - start,
            parseSuccess: false,
            knownFieldsProvided: !!knownFields,
          },
        } as ResponsePayload),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const raw = parseJsonFromContent(content);
    const result: Record<string, { value: string | null; confidence: number | null; source: string }> =
      {};

    if (typeof raw !== "object" || raw === null) {
      throw new Error("Model response was not an object");
    }

    for (const field of FIELDS) {
      const { value, confidence } = normaliseFieldEntry((raw as Record<string, unknown>)[field]);
      result[field] = {
        value: value ?? null,
        confidence: confidence ?? null,
        source: "ai",
      };
    }

    // Backwards compatibility: treat missing expirationDate with known field fallback
    if (knownFields?.expirationDate && (!result.expirationDate.value || result.expirationDate.confidence === null)) {
      result.expirationDate = {
        value: String(knownFields.expirationDate),
        confidence: 1,
        source: "knownField",
      };
    }

    parseSuccess = true;

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        telemetry: {
          latencyMs: Date.now() - start,
          parseSuccess: true,
          knownFieldsProvided: !!knownFields,
        },
      } as ResponsePayload),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        telemetry: {
          latencyMs: Date.now() - start,
          parseSuccess,
          knownFieldsProvided: false,
        },
      } as ResponsePayload),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

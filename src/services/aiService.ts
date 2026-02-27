import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

export type AIFieldKey =
  | 'name'
  | 'brand'
  | 'category'
  | 'expirationDate'
  | 'ingredients'
  | 'notes';

export interface AIFieldResult {
  value: string | null;
  confidence: number | null;
  source: string;
}

export type AIFieldMap = Record<AIFieldKey, AIFieldResult>;

export interface AIAnalysisResult {
  success: boolean;
  fields?: AIFieldMap;
  flatData?: Partial<Record<AIFieldKey, string>>;
  error?: string;
  rawResponse?: unknown;
}

const EDGE_FUNCTION_NAME = 'analyze-product-image';

/**
 * Convert image URI to base64 string for API requests
 */
async function imageToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64' as FileSystem.EncodingType,
  });
  const mimeType = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Analyze product image via Supabase Edge Function.
 * No AI API keys are used in the client; the Edge Function holds secrets server-side.
 */
export async function analyzeProductImage(
  imageUri: string,
  knownFields?: Partial<Record<AIFieldKey, string | null>>,
): Promise<AIAnalysisResult> {
  try {
    const imageBase64 = await imageToBase64(imageUri);

    const { data, error } = await supabase.functions.invoke<{
      success: boolean;
      data?: Record<string, { value: string | null; confidence: number | null; source: string }>;
      error?: string;
      telemetry?: { latencyMs: number; parseSuccess: boolean };
    }>(EDGE_FUNCTION_NAME, {
      body: { imageBase64, knownFields },
    });

    if (error) {
      const status = (error as any)?.status;
      const responseText = (error as any)?.context?.response;
      let formattedResp: string | null = null;
      if (responseText && typeof responseText === 'string') {
        try {
          formattedResp = JSON.stringify(JSON.parse(responseText), null, 2);
        } catch {
          formattedResp = responseText;
        }
      }
      const messageParts = [
        status ? `status ${status}` : null,
        error.message || 'Edge Function error',
        formattedResp ? `response: ${formattedResp}` : null,
      ].filter(Boolean);
      const message = messageParts.join(' | ');

      return {
        success: false,
        error: message,
        rawResponse: error,
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'No response from AI service',
      };
    }

    if (!data.success || !data.data) {
      return {
        success: false,
        error: data.error || 'Analysis failed',
        rawResponse: data,
      };
    }

    const fields: AIFieldMap = ['name', 'brand', 'category', 'expirationDate', 'ingredients', 'notes'].reduce(
      (acc, key) => {
        const entry = data.data?.[key] ?? { value: null, confidence: null, source: 'ai' };
        acc[key as AIFieldKey] = {
          value: entry?.value ?? null,
          confidence: entry?.confidence ?? null,
          source: entry?.source ?? 'ai',
        };
        return acc;
      },
      {} as AIFieldMap,
    );

    const flatData: Partial<Record<AIFieldKey, string>> = {};
    (Object.keys(fields) as AIFieldKey[]).forEach((field) => {
      if (fields[field].value) {
        flatData[field] = fields[field].value!;
      }
    });

    return {
      success: true,
      fields,
      flatData,
      rawResponse: data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process image';
    return { success: false, error: message };
  }
}

/**
 * Check if AI service is available.
 * Returns true when Supabase is configured (Edge Function is expected to be deployed).
 * Mirrors supabase.ts config so AI mode is enabled when the project is set up.
 */
export function isAIServiceConfigured(): boolean {
  const url =
    process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zpckakekmowkticuazsa.supabase.co';
  const key =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY2tha2VrbW93a3RpY3VhenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMTM1NTQsImV4cCI6MjA4MzU4OTU1NH0.9qZTjx6YnduG4qZIx3bYWiFr9CQjTLFbjG13JfaJAhY';
  return !!(url && key);
}

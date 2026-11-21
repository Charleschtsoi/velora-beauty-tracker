/**
 * Deterministic fixtures for workshop tests / offline demos.
 * Clearly marked as fixtures — not live Gemini or Supabase responses.
 */

import type { AIFieldMap } from '../services/aiService';

/** Fixture: mixed confidence AI extraction (name uncertain, expiry missing). */
export const FIXTURE_AI_FIELDS_MIXED: AIFieldMap = {
  name: { value: 'Hydrating Serum', confidence: 0.42, source: 'ai' },
  brand: { value: 'Velora Labs', confidence: 0.88, source: 'ai' },
  category: { value: 'skincare', confidence: 0.75, source: 'ai' },
  packagingColor: { value: 'clear glass', confidence: 0.55, source: 'ai' },
  expirationDate: { value: null, confidence: null, source: 'ai' },
  ingredients: { value: null, confidence: null, source: 'ai' },
  notes: { value: null, confidence: null, source: 'ai' },
};

/** Fixture: high-confidence barcode-style prefill. */
export const FIXTURE_UPC_FIELDS_HIGH: Partial<AIFieldMap> = {
  name: { value: 'Daily Moisturizer SPF 30', confidence: 0.94, source: 'barcode' },
  brand: { value: 'CeraVe', confidence: 0.91, source: 'barcode' },
  category: { value: 'skincare', confidence: 0.8, source: 'barcode' },
  expirationDate: { value: '2027-06-15', confidence: 0.7, source: 'barcode' },
};

/** Fixture: Edge failure payload shape (for sanitizer tests only). */
export const FIXTURE_EDGE_ERROR_BLOB =
  'status 500 | Edge Function error | response: {"error":"model unavailable"}';

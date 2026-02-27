import { supabase } from './supabase';

export interface BarcodeLookupField {
  value: string | null;
  confidence: number | null;
  source: string;
}

export type BarcodeLookupResult = {
  success: boolean;
  fromCache: boolean;
  data?: Record<string, BarcodeLookupField | string | null>;
  confidence?: number;
  error?: string;
};

const EDGE_FUNCTION_NAME = 'lookup-product';

export async function lookupProductByBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const { data, error } = await supabase.functions.invoke<BarcodeLookupResult>(EDGE_FUNCTION_NAME, {
    body: { barcode },
  });

  if (error) {
    const status = (error as any)?.status;
    const responseText = (error as any)?.context?.response;
    const messageParts = [
      status ? `status ${status}` : null,
      error.message || 'Lookup function error',
      responseText ?? null,
    ].filter(Boolean);
    return {
      success: false,
      error: messageParts.join(' | '),
      fromCache: false,
    };
  }

  if (!data) {
    return {
      success: false,
      error: 'No response from lookup-product function',
      fromCache: false,
    };
  }

  return data;
}

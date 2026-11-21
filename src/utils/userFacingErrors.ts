/**
 * Map raw Edge Function / network errors to short user-facing copy.
 * Never surface status codes, raw JSON bodies, or stack traces in toasts.
 */

const AI_LABEL_FAILURE =
  "Couldn't read this label clearly. Edit the form manually or try another photo.";

const AI_SERVICE_UNAVAILABLE =
  'Label reading is temporarily unavailable. You can still add the product manually.';

const GENERIC_SAVE_FAILURE = 'Could not save product. Please try again.';

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
}

function looksLikeEdgeOrTransportNoise(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('status ') ||
    lower.includes('edge function') ||
    lower.includes('response:') ||
    lower.includes('functions.invoke') ||
    lower.includes('failed to send') ||
    lower.includes('network request failed') ||
    lower.includes('fetch failed') ||
    lower.includes('non-2xx') ||
    /\{\s*"/.test(message) ||
    lower.includes('jwt') ||
    lower.includes('apikey')
  );
}

/** Sanitize errors from analyze-product-image / resolve-demo-product paths. */
export function toUserFacingAiError(error: unknown): string {
  const message = extractMessage(error).trim();
  if (!message) return AI_LABEL_FAILURE;

  if (looksLikeEdgeOrTransportNoise(message)) {
    if (
      message.toLowerCase().includes('network') ||
      message.toLowerCase().includes('fetch failed') ||
      message.toLowerCase().includes('failed to send')
    ) {
      return AI_SERVICE_UNAVAILABLE;
    }
    return AI_LABEL_FAILURE;
  }

  // Keep short, already-friendly messages from our own code.
  if (message.length <= 120 && !looksLikeEdgeOrTransportNoise(message)) {
    return message;
  }

  return AI_LABEL_FAILURE;
}

/** Sanitize save / persistence errors shown on the review form. */
export function toUserFacingSaveError(error: unknown): string {
  const message = extractMessage(error).trim();
  if (!message) return GENERIC_SAVE_FAILURE;
  if (looksLikeEdgeOrTransportNoise(message)) return GENERIC_SAVE_FAILURE;
  if (message.length > 120) return GENERIC_SAVE_FAILURE;
  return message;
}

export const userFacingErrorCopy = {
  aiLabelFailure: AI_LABEL_FAILURE,
  aiServiceUnavailable: AI_SERVICE_UNAVAILABLE,
  genericSaveFailure: GENERIC_SAVE_FAILURE,
} as const;

/**
 * Helpers for presenting AI/barcode field confidence honestly in the review form.
 * Confidence is model-reported (0–1); treat missing confidence as needing a check.
 */

export type ConfidenceBand = 'high' | 'medium' | 'low' | 'unknown';

export const LOW_CONFIDENCE_THRESHOLD = 0.6;
export const MEDIUM_CONFIDENCE_THRESHOLD = 0.8;

export function getConfidenceBand(confidence: number | null | undefined): ConfidenceBand {
  if (confidence === null || confidence === undefined || Number.isNaN(confidence)) {
    return 'unknown';
  }
  if (confidence < LOW_CONFIDENCE_THRESHOLD) return 'low';
  if (confidence < MEDIUM_CONFIDENCE_THRESHOLD) return 'medium';
  return 'high';
}

export function confidenceBandLabel(band: ConfidenceBand): string {
  switch (band) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Low confidence — double-check';
    case 'unknown':
      return 'Confidence unknown — please verify';
  }
}

/** Fields that look filled but should be visually flagged for human review. */
export function fieldNeedsReview(confidence: number | null | undefined): boolean {
  const band = getConfidenceBand(confidence);
  return band === 'low' || band === 'unknown';
}

export type ReviewFieldSnapshot = {
  key: string;
  label: string;
  hasValue: boolean;
  confidence: number | null | undefined;
};

export type ReviewSummary = {
  filledCount: number;
  needsReviewCount: number;
  missingCritical: string[];
  headline: string;
  detail: string;
};

const CRITICAL_KEYS = new Set(['name', 'expirationDate']);

/**
 * Build a short review summary for scan/AI prefilled forms.
 * Does not invent product claims — only summarizes field fill / uncertainty.
 */
export function buildReviewSummary(fields: ReviewFieldSnapshot[]): ReviewSummary {
  const filled = fields.filter((f) => f.hasValue);
  const needsReview = filled.filter((f) => fieldNeedsReview(f.confidence));
  const missingCritical = fields
    .filter((f) => CRITICAL_KEYS.has(f.key) && !f.hasValue)
    .map((f) => f.label);

  let headline = 'Please review before saving';
  let detail = 'Confirm name and expiration. Edit anything that looks off.';

  if (filled.length > 0 && needsReview.length > 0) {
    headline = 'AI suggested values — please verify';
    detail = `${needsReview.length} field${needsReview.length === 1 ? '' : 's'} ${needsReview.length === 1 ? 'looks' : 'look'} uncertain. Correct them if needed, then save.`;
  } else if (filled.length > 0) {
    headline = 'Pre-filled from scan — please confirm';
    detail = 'Values look reasonably confident, but still double-check before saving.';
  }

  if (missingCritical.length > 0) {
    detail = `${detail} Still needed: ${missingCritical.join(', ')}.`;
  }

  return {
    filledCount: filled.length,
    needsReviewCount: needsReview.length,
    missingCritical,
    headline,
    detail,
  };
}

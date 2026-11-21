import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildReviewSummary,
  confidenceBandLabel,
  fieldNeedsReview,
  getConfidenceBand,
  LOW_CONFIDENCE_THRESHOLD,
} from './fieldConfidence.ts';

describe('getConfidenceBand', () => {
  it('maps null/undefined to unknown', () => {
    assert.equal(getConfidenceBand(null), 'unknown');
    assert.equal(getConfidenceBand(undefined), 'unknown');
  });

  it('maps numeric bands', () => {
    assert.equal(getConfidenceBand(0.4), 'low');
    assert.equal(getConfidenceBand(LOW_CONFIDENCE_THRESHOLD - 0.01), 'low');
    assert.equal(getConfidenceBand(0.7), 'medium');
    assert.equal(getConfidenceBand(0.9), 'high');
  });
});

describe('fieldNeedsReview', () => {
  it('flags low and unknown confidence', () => {
    assert.equal(fieldNeedsReview(0.5), true);
    assert.equal(fieldNeedsReview(null), true);
    assert.equal(fieldNeedsReview(0.85), false);
  });
});

describe('confidenceBandLabel', () => {
  it('uses plain-language labels', () => {
    assert.match(confidenceBandLabel('low'), /double-check/i);
    assert.match(confidenceBandLabel('unknown'), /verify/i);
    assert.equal(confidenceBandLabel('high'), 'High confidence');
  });
});

describe('buildReviewSummary', () => {
  it('summarizes uncertain AI prefills without inventing values', () => {
    const summary = buildReviewSummary([
      { key: 'name', label: 'Product name', hasValue: true, confidence: 0.4 },
      { key: 'brand', label: 'Brand', hasValue: true, confidence: 0.9 },
      { key: 'expirationDate', label: 'Expiration date', hasValue: false, confidence: null },
    ]);

    assert.equal(summary.filledCount, 2);
    assert.equal(summary.needsReviewCount, 1);
    assert.deepEqual(summary.missingCritical, ['Expiration date']);
    assert.match(summary.headline, /verify/i);
    assert.match(summary.detail, /Expiration date/);
  });

  it('uses calmer copy when filled fields look confident', () => {
    const summary = buildReviewSummary([
      { key: 'name', label: 'Product name', hasValue: true, confidence: 0.95 },
      { key: 'expirationDate', label: 'Expiration date', hasValue: true, confidence: 0.9 },
    ]);

    assert.equal(summary.needsReviewCount, 0);
    assert.match(summary.headline, /confirm/i);
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  toUserFacingAiError,
  toUserFacingSaveError,
  userFacingErrorCopy,
} from './userFacingErrors.ts';

describe('toUserFacingAiError', () => {
  it('hides Edge status/response blobs', () => {
    const raw =
      'status 500 | Edge Function error | response: {"error":"GEMINI_API_KEY missing"}';
    assert.equal(toUserFacingAiError(raw), userFacingErrorCopy.aiLabelFailure);
    assert.doesNotMatch(toUserFacingAiError(raw), /GEMINI|status 500|response:/i);
  });

  it('maps network failures to unavailable copy', () => {
    assert.equal(
      toUserFacingAiError(new Error('Network request failed')),
      userFacingErrorCopy.aiServiceUnavailable,
    );
  });

  it('keeps short friendly messages', () => {
    assert.equal(
      toUserFacingAiError('Analysis failed'),
      'Analysis failed',
    );
  });
});

describe('toUserFacingSaveError', () => {
  it('sanitizes noisy transport errors', () => {
    assert.equal(
      toUserFacingSaveError('status 401 | jwt expired'),
      userFacingErrorCopy.genericSaveFailure,
    );
  });

  it('passes through short app errors', () => {
    assert.equal(
      toUserFacingSaveError(new Error('Product was not created')),
      'Product was not created',
    );
  });
});

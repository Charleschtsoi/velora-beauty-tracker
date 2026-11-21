import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parsePriceInput, validateAddProductForm } from './addProductValidation.ts';

describe('parsePriceInput', () => {
  it('accepts empty as undefined and rejects negatives', () => {
    assert.equal(parsePriceInput(''), undefined);
    assert.equal(parsePriceInput('  '), undefined);
    assert.equal(parsePriceInput('12.5'), 12.5);
    assert.equal(parsePriceInput('-1'), undefined);
    assert.equal(parsePriceInput('abc'), undefined);
  });
});

describe('validateAddProductForm', () => {
  it('requires name and expiration with specific messages', () => {
    const result = validateAddProductForm({
      productName: '  ',
      expirationDate: undefined,
      price: '',
    });

    assert.equal(result.valid, false);
    assert.equal(result.errors.productName, 'Product name is required');
    assert.equal(result.errors.expirationDate, 'Expiration date is required');
    assert.match(result.alertMessage ?? '', /Product name is required/);
    assert.match(result.alertMessage ?? '', /Expiration date is required/);
  });

  it('validates price only when provided', () => {
    const bad = validateAddProductForm({
      productName: 'Serum',
      expirationDate: new Date('2027-01-01'),
      price: '-3',
    });
    assert.equal(bad.valid, false);
    assert.match(bad.errors.price ?? '', /valid price/i);

    const ok = validateAddProductForm({
      productName: 'Serum',
      expirationDate: new Date('2027-01-01'),
      price: '18',
    });
    assert.equal(ok.valid, true);
    assert.equal(ok.alertMessage, null);
  });
});

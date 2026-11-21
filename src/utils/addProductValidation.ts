/**
 * Pure validation for the Add Product review form.
 */

export type AddProductFormInput = {
  productName: string;
  expirationDate: Date | undefined | null;
  price: string;
};

export type AddProductFormErrors = {
  productName?: string;
  expirationDate?: string;
  price?: string;
};

export function parsePriceInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

export function validateAddProductForm(input: AddProductFormInput): {
  valid: boolean;
  errors: AddProductFormErrors;
  /** First human-readable message suitable for an alert. */
  alertMessage: string | null;
} {
  const errors: AddProductFormErrors = {};

  if (!input.productName.trim()) {
    errors.productName = 'Product name is required';
  }

  if (!input.expirationDate) {
    errors.expirationDate = 'Expiration date is required';
  } else if (Number.isNaN(input.expirationDate.getTime())) {
    errors.expirationDate = 'Expiration date is invalid';
  }

  if (input.price.trim() && parsePriceInput(input.price) === undefined) {
    errors.price = 'Enter a valid price (0 or greater)';
  }

  const messages = [
    errors.productName,
    errors.expirationDate,
    errors.price,
  ].filter(Boolean) as string[];

  return {
    valid: messages.length === 0,
    errors,
    alertMessage: messages.length === 0 ? null : messages.join('\n'),
  };
}

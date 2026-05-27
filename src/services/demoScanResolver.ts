import { DEMO_PRODUCTS, DemoProductInput } from '../config/demoProducts';
import type { AIFieldKey, AIFieldMap } from './aiService';

type DemoMatchSource = 'barcode' | 'ocr-hints' | 'presenter';

export interface DemoMatchResult {
  product: DemoProductInput | null;
  matchedBy: DemoMatchSource | null;
  score: number;
  matchedCues: string[];
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildHaystackFromText(parts: Array<string | null | undefined>): string {
  return normalize(parts.filter(Boolean).join(' '));
}

function tokenizeColor(value: string | null | undefined): string[] {
  if (!value) return [];
  return normalize(value)
    .split(/[\s-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function scoreColorHint(
  expectedColor: string,
  detectedColor: string | null | undefined
): { score: number; cue?: string } {
  const expected = normalize(expectedColor);
  const detected = normalize(detectedColor ?? '');

  if (!expected || !detected) {
    return { score: 0 };
  }

  if (expected === detected) {
    return { score: 5, cue: `color:${detectedColor}` };
  }

  const expectedTokens = tokenizeColor(expectedColor);
  const detectedTokens = tokenizeColor(detectedColor);
  const overlap = expectedTokens.filter((token) => detectedTokens.includes(token));

  if (overlap.length >= 2) {
    return { score: 4, cue: `color:${detectedColor}` };
  }

  if (overlap.length === 1) {
    return { score: 2, cue: `color:${detectedColor}` };
  }

  return { score: 0 };
}

function scoreProductAgainstHaystack(
  product: DemoProductInput,
  haystack: string,
  detectedColor?: string | null
): DemoMatchResult {
  if (!haystack && !detectedColor) {
    return { product: null, matchedBy: null, score: 0, matchedCues: [] };
  }

  const matchedCues: string[] = [];
  let score = 0;

  const brand = normalize(product.brand);
  const name = normalize(product.name);

  if (haystack.includes(brand)) {
    score += 7;
    matchedCues.push(product.brand);
  }

  const nameTokens = name
    .split(' ')
    .filter((token) => token.length >= 4)
    .slice(0, 3);
  const matchedNameTokens = nameTokens.filter((token) => haystack.includes(token));
  score += matchedNameTokens.length * 3;
  matchedCues.push(...matchedNameTokens);

  product.matcherHints.primaryOcrCues.forEach((cue) => {
    const normalizedCue = normalize(cue);
    if (normalizedCue && haystack.includes(normalizedCue)) {
      score += 10;
      matchedCues.push(cue);
    }
  });

  product.matcherHints.secondaryOcrCues.forEach((cue) => {
    const normalizedCue = normalize(cue);
    if (normalizedCue && haystack.includes(normalizedCue)) {
      score += 4;
      matchedCues.push(cue);
    }
  });

  const colorScore = scoreColorHint(
    product.matcherHints.packagingColor,
    detectedColor
  );
  score += colorScore.score;
  if (colorScore.cue) {
    matchedCues.push(colorScore.cue);
  }

  if (score === 0) {
    return { product: null, matchedBy: null, score: 0, matchedCues: [] };
  }

  return {
    product,
    matchedBy: 'ocr-hints',
    score,
    matchedCues: Array.from(new Set(matchedCues)),
  };
}

export function resolveDemoProductByBarcode(
  barcode: string | null | undefined
): DemoMatchResult {
  const normalizedBarcode = barcode?.replace(/\D/g, '');
  if (!normalizedBarcode) {
    return { product: null, matchedBy: null, score: 0, matchedCues: [] };
  }

  const product = DEMO_PRODUCTS.find(
    (entry) => entry.barcode?.replace(/\D/g, '') === normalizedBarcode
  );

  if (!product) {
    return { product: null, matchedBy: null, score: 0, matchedCues: [] };
  }

  return {
    product,
    matchedBy: 'barcode',
    score: 100,
    matchedCues: [normalizedBarcode],
  };
}

export function resolveDemoProductByAiFields(
  fields?: Partial<AIFieldMap>,
  flatData?: Partial<Record<AIFieldKey, string>>
): DemoMatchResult {
  const fieldText = fields
    ? (Object.keys(fields) as AIFieldKey[])
        .map((key) => fields[key]?.value)
        .filter(Boolean)
    : [];

  const flatText = flatData ? Object.values(flatData) : [];
  const detectedColor =
    fields?.packagingColor?.value ??
    flatData?.packagingColor ??
    null;
  const haystack = buildHaystackFromText([
    ...fieldText,
    ...flatText,
  ]);

  const ranked = DEMO_PRODUCTS.map((product) =>
    scoreProductAgainstHaystack(product, haystack, detectedColor)
  )
    .filter((result) => result.product)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return { product: null, matchedBy: null, score: 0, matchedCues: [] };
  }

  const best = ranked[0];
  const runnerUp = ranked[1];

  if (best.score < 10) {
    return { product: null, matchedBy: null, score: best.score, matchedCues: best.matchedCues };
  }

  if (runnerUp && best.score - runnerUp.score < 3) {
    return { product: null, matchedBy: null, score: best.score, matchedCues: best.matchedCues };
  }

  return best;
}

export function resolveDemoProductManually(productId: string): DemoMatchResult {
  const product = DEMO_PRODUCTS.find((entry) => entry.id === productId) ?? null;
  return {
    product,
    matchedBy: product ? 'presenter' : null,
    score: product ? 100 : 0,
    matchedCues: product ? ['manual'] : [],
  };
}

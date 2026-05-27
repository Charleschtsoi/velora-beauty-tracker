import { ProductCategory } from '../types/product.types';

/**
 * Demo catalog for investor mode.
 * The app stores products locally, but demo matching resolves against this curated list.
 */
export type DemoProductCategory =
  | 'skincare'
  | 'sunscreen'
  | 'makeup'
  | 'haircare'
  | 'fragrance';

export interface DemoProductInput {
  id: string;
  name: string;
  brand: string;
  category: DemoProductCategory;
  volume: string;
  expirationDate: string;
  productionDate?: string;
  notes: string;
  /**
   * Content-facing path to the curated demo asset.
   * This is intentionally a string so the catalog can be authored without importing the asset.
   */
  demoPhotoUri: string;
  barcode?: string;
  matcherHints: {
    primaryOcrCues: string[];
    secondaryOcrCues: string[];
    packagingColor: string;
  };
  mockAiEnrichment: {
    ingredientsSummary: string;
    routineAdvice: string;
  };
}

export function mapDemoCategoryToProductCategory(
  category: DemoProductCategory
): ProductCategory {
  switch (category) {
    case 'makeup':
      return ProductCategory.MAKEUP;
    case 'haircare':
      return ProductCategory.HAIRCARE;
    case 'fragrance':
      return ProductCategory.FRAGRANCE;
    case 'sunscreen':
    case 'skincare':
    default:
      return ProductCategory.SKINCARE;
  }
}

export function getDemoExpirationDate(product: DemoProductInput): Date {
  return new Date(product.expirationDate);
}

export function getDemoProductNotes(product: DemoProductInput): string {
  return [
    product.notes,
    `Ingredients summary: ${product.mockAiEnrichment.ingredientsSummary}`,
    `Routine advice: ${product.mockAiEnrichment.routineAdvice}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export const DEMO_PRODUCTS: DemoProductInput[] = [
  {
    id: 'demo_001_suncut',
    name: 'Suncut UV Perfect Milk SPF50+ PA++++',
    brand: 'KOSÉ Cosmeport',
    category: 'sunscreen',
    volume: '50ml',
    expirationDate: '2027-02-28',
    notes: 'Super waterproof milk sunscreen for face and body; shake well before use.',
    demoPhotoUri: "require('../assets/demo/suncut_uv_milk.jpg')",
    matcherHints: {
      primaryOcrCues: ['SUNCUT', 'UV', 'PERFECT MILK'],
      secondaryOcrCues: ['SPF50+', 'PA++++', 'KOSÉ'],
      packagingColor: 'yellow-gold',
    },
    mockAiEnrichment: {
      ingredientsSummary:
        'A waterproof Japanese sunscreen milk that combines high-SPF UV filters with lightweight film-formers for strong outdoor protection.',
      routineAdvice:
        'Shake well, apply generously as the last step of your morning skincare, and reapply after sweating, swimming, or towel-drying.',
    },
  },
  {
    id: 'demo_002_chanel_uv',
    name: 'UV Essentiel Protection Globale SPF 50+/PA++++',
    brand: 'CHANEL',
    category: 'sunscreen',
    volume: '30ml',
    expirationDate: '2026-12-31',
    notes:
      'Global protection formula enriched with ginger from Madagascar; made in France.',
    demoPhotoUri: "require('../assets/demo/chanel_uv_essentiel.jpg')",
    barcode: '3145891418989',
    matcherHints: {
      primaryOcrCues: ['CHANEL', 'UV ESSENTIEL', 'SPF 50+'],
      secondaryOcrCues: ['PROTECTION GLOBALE', 'GLOBAL PROTECTION', '30 ml'],
      packagingColor: 'white-silver',
    },
    mockAiEnrichment: {
      ingredientsSummary:
        'A high-protection daily UV fluid featuring broad-spectrum sunscreen filters with antioxidant botanical extracts, including ginger, to help defend against environmental stress.',
      routineAdvice:
        'Apply evenly as the final skincare step before makeup, and reapply every two hours when exposed to direct sunlight.',
    },
  },
  {
    id: 'demo_003_fresh_toner',
    name: 'Rose Deep Hydration Facial Toner',
    brand: 'fresh',
    category: 'skincare',
    volume: '250ml',
    expirationDate: '2027-11-30',
    notes:
      'Hydrating facial toner with visible rose petals; removes impurities and softens skin.',
    demoPhotoUri: "require('../assets/demo/fresh_rose_toner.jpg')",
    barcode: '809280126758',
    matcherHints: {
      primaryOcrCues: ['fresh', 'ROSE', 'DEEP HYDRATION'],
      secondaryOcrCues: ['FACIAL TONER', 'REMOVES IMPURITIES', '250ml'],
      packagingColor: 'transparent-brown',
    },
    mockAiEnrichment: {
      ingredientsSummary:
        'A hydrating toner with rose fruit extract, rosewater, and humectants such as hyaluronic acid to soften skin while sweeping away residual impurities.',
      routineAdvice:
        'Use after cleansing by applying with a cotton pad or palms, then follow with serum and moisturizer morning and night.',
    },
  },
  {
    id: 'demo_004_skii_aura',
    name: 'Genoptics Ultraura Essence',
    brand: 'SK-II',
    category: 'skincare',
    volume: '50ml',
    productionDate: '2023-06-01',
    expirationDate: '2026-06-30',
    notes: 'Brightening essence made in Japan.',
    demoPhotoUri: "require('../assets/demo/skii_genoptics_ultraura_essence.jpg')",
    barcode: '4979006085747',
    matcherHints: {
      primaryOcrCues: ['SK-II', 'GENOPTICS', 'ULTRAURA ESSENCE'],
      secondaryOcrCues: ['50mL', 'Made in Japan', 'Ultraura'],
      packagingColor: 'dark-red',
    },
    mockAiEnrichment: {
      ingredientsSummary:
        'A brightening essence built around SK-II’s PITERA technology and a pigment-targeting complex to support clarity and even-looking skin tone.',
      routineAdvice:
        'Apply after toner and before moisturizer, smoothing a few drops across the face morning and evening for best brightening results.',
    },
  },
  {
    id: 'demo_005_hada_labo_gokujyun_milk',
    name: 'Gokujyun Hydrating Milk',
    brand: 'Hada Labo',
    category: 'skincare',
    volume: '90ml',
    expirationDate: '2027-12-31',
    notes:
      'Lightweight moisturizing milk/emulsion with multiple hyaluronic acids; fragrance-free, colorant-free, mineral oil-free, alcohol-free, and paraben-free.',
    demoPhotoUri: "require('../assets/demo/hada_labo_gokujyun_milk.jpg')",
    barcode: '4895186013007',
    matcherHints: {
      primaryOcrCues: ['Hada Labo', 'GOKU JYUN', '極潤'],
      secondaryOcrCues: ['保濕乳液', '90ml', '肌研'],
      packagingColor: 'white-blue',
    },
    mockAiEnrichment: {
      ingredientsSummary:
        'A lightweight hydrating emulsion centered on multiple forms of hyaluronic acid to replenish surface moisture, soften skin, and support a smoother barrier.',
      routineAdvice:
        'Apply after toner and serum, then smooth 1 to 2 pumps across the face as your lightweight moisturizing step morning and night.',
    },
  },
];

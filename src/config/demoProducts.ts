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
    productionDate: '2025-03-01',
    expirationDate: '2026-12-31',
    notes:
      'Global protection formula enriched with ginger from Madagascar; made in France. Batch code: 1502. Manufactured: March 2025.',
    demoPhotoUri: "require('../assets/demo/chanel_uv_essentiel.jpg')",
    barcode: '3145891418989',
    matcherHints: {
      primaryOcrCues: ['CHANEL', 'UV ESSENTIEL', 'SPF 50+'],
      secondaryOcrCues: ['PROTECTION GLOBALE', 'GLOBAL PROTECTION', '30 ml', '1502'],
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
  {
    id: 'demo_006_neutrogena_hydro_boost_water_gel_50g',
    name: 'Hydro Boost Hyaluronic Acid Water Gel',
    brand: 'Neutrogena',
    category: 'skincare',
    volume: '50g',
    productionDate: '2026-01-21',
    expirationDate: '2029-01-20',
    notes:
      'Refillable Hydro Boost water gel jar for AM/PM use. Compatible with Hydro Boost refill pods only. Batch lot: 004. Label code: 128870.',
    demoPhotoUri: "require('../assets/demo/neutrogena_hydro_boost_water_gel_50g.jpg')",
    matcherHints: {
      primaryOcrCues: ['Neutrogena', 'HYDRO BOOST', 'WATER GEL', 'HYALURONIC ACID'],
      secondaryOcrCues: ['50g', '004', '128870', 'Refillable'],
      packagingColor: 'translucent-blue',
    },
    mockAiEnrichment: {
      ingredientsSummary:
        'A lightweight gel moisturizer with hyaluronic acid and humectants that helps attract water, support hydration, and leave skin feeling refreshed.',
      routineAdvice:
        'Apply to clean skin morning and night after toner or serum, then seal with sunscreen in the daytime.',
    },
  },
  {
    id: 'demo_007_vecs_gardenia_airy_sunscreen',
    name: 'Gardenia Airy Sunscreen SPF50+',
    brand: 'VECs',
    category: 'sunscreen',
    volume: '50g',
    expirationDate: '2028-03-31',
    notes:
      'Lightweight “airy” sunscreen designed for daily wear with high SPF protection. Shake gently before use.',
    // This string is for future demo photo display; matching does not depend on it right now.
    demoPhotoUri: "require('../assets/demo/vecs_gardenia_airy_sunscreen.jpg')",
    matcherHints: {
      primaryOcrCues: ['VECs', 'GARDENIA', 'AIRY', 'SUNSCREEN'],
      secondaryOcrCues: ['SPF50+', 'PA', 'SKIN'],
      packagingColor: 'glass-pink',
    },
    mockAiEnrichment: {
      ingredientsSummary:
        'An airy sunscreen texture that spreads easily, forming a protective film. Built for daily UV defense with a comfortable finish.',
      routineAdvice:
        'Use as your final step in the morning routine. Reapply after sweating, swimming, or towel-drying.',
    },
  },
  {
    id: 'demo_008_mild_eye_makeup_remover',
    name: 'Mild Eye Makeup Remover',
    brand: 'MUJI',
    category: 'makeup',
    volume: '110ml',
    expirationDate: '2027-10-31',
    notes:
      'MUJI gentle eye makeup remover; fragrance-free, mineral-oil-free, paraben-free, and alcohol-free. Shake well before use.',
    demoPhotoUri: "require('../assets/demo/mild_eye_makeup_remover.jpg')",
    barcode: '4547315859696',
    matcherHints: {
      primaryOcrCues: ['MUJI', '無印良品', 'MILD', 'EYE MAKEUP REMOVER'],
      secondaryOcrCues: ['110ml', '110 mL', 'マイルド', '15859696'],
      packagingColor: 'clear',
    },
    mockAiEnrichment: {
      ingredientsSummary:
        'A MUJI eye makeup remover with olive squalane, chamomile extract, peach leaf extract, and hyaluronic acid to dissolve eye makeup while staying gentle on sensitive skin.',
      routineAdvice:
        'Shake well, apply a coin-sized amount to a cotton pad, hold on the eyelid for a few seconds, then gently wipe. Follow with your regular cleanser.',
    },
  },
  {
    id: 'demo_009_skii_facial_treatment_clear_lotion',
    name: 'Facial Treatment Clear Lotion',
    brand: 'SK-II',
    category: 'skincare',
    volume: '30ml',
    productionDate: '2024-01-01',
    expirationDate: '2026-11-30',
    notes:
      'SK-II clear lotion for balanced, clean-feeling skin. Suitable for consistent daily use.',
    demoPhotoUri: "require('../assets/demo/skii_clear_lotion.jpg')",
    matcherHints: {
      primaryOcrCues: ['SK-II', 'FACIAL TREATMENT', 'CLEAR LOTION'],
      secondaryOcrCues: ['30mL', '無香', 'クリア'],
      packagingColor: 'glass-silver',
    },
    mockAiEnrichment: {
      ingredientsSummary:
        'A clear lotion designed to support skin clarity with lightweight hydration and a refreshing finish for daily routines.',
      routineAdvice:
        'Apply after cleansing and before moisturizer, using a few smooth passes to help absorb effectively.',
    },
  },
];

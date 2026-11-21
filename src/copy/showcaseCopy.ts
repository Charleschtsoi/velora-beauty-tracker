import { scanCameraCopy } from './scanCamera';

/** Production-voice copy for investor showcase (used when DEMO_MODE is on). */
export const showcaseCopy = {
  idleSubcopy: scanCameraCopy.idleSubcopyLive,

  pickerEyebrow: 'Product catalog',
  pickerTitle: 'Choose a product',
  pickerBarcodeMiss:
    "We couldn't confirm this barcode automatically. Choose the closest match below.",
  pickerAiMiss:
    "We couldn't confirm this product label automatically. Choose the closest match below.",
  pickerChooser: "Choose the product you're adding.",
  browseCatalogButton: 'Browse product catalog',

  toastProductLoadFailed: 'Unable to load that product.',
  toastBarcodeCatalogMiss: (barcode: string) =>
    `Barcode ${barcode} did not match our product catalog.`,

  fieldSourceBarcode: 'Barcode scan',
  fieldSourceAi: 'AI photo',
  fieldSourceCatalog: 'Product catalog',

  scanNotFoundBanner:
    "We couldn't find this product in our database. Please help us add it below — take or keep a product photo for your shelf record.",
  aiPrefillBanner:
    'AI suggested values from the label photo. Please verify before saving — extraction can be wrong.',
  aiAnalyzedReviewToast:
    'Suggested fields filled from the photo. Review anything uncertain, then save.',
} as const;

export function getPresenterPickerCopy(
  source: 'barcode' | 'ai' | 'chooser' | undefined,
  detectedSummary?: string
): string {
  if (source === 'barcode') {
    return showcaseCopy.pickerBarcodeMiss;
  }
  if (source === 'ai') {
    if (detectedSummary) {
      return `We read “${detectedSummary}” on the label. Choose the closest match below.`;
    }
    return showcaseCopy.pickerAiMiss;
  }
  return showcaseCopy.pickerChooser;
}

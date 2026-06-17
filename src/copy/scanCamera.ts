/**
 * On-camera and idle copy for Scan — luxury-beauty voice (calm, concise, benefit-led).
 */

export const scanCameraCopy = {
  idleHeadline: 'Add a product in seconds',
  idleSubcopyDemo:
    'Scan a demo barcode or capture the label—Velora fills in the details for you.',
  idleSubcopyLive:
    'Prefer a flat box? Scan the barcode. Tubes and jars love a quick label photo.',
  idleTips: [
    'A steady hand, a calm frame',
    'Dim light? Tap the light icon',
    'No code? Try a label photo',
  ] as const,

  barcodeInstructionTop: 'Rest the flat side of the pack in frame.',
  barcodeScanningSecondary: 'Hold still—soft light helps on glossy glass.',

  aiCaptureTitle: 'Fill the frame with the front label.',
  aiCaptureSubtitle: "We'll note a side barcode when it's visible.",

  postBarcodeCaptureTitle: 'One clear shot of the front label.',
  postBarcodeCaptureSubtitle: 'Optional—refines your shelf notes.',

  cameraWaiting: 'Preparing your view…',
  analyzing: 'Reading your label…',

  postBarcodeMatchedPrefix: 'Got it',
  postBarcodeScannedFallback: 'Barcode captured',

  /** Shown when barcode lookup returns no catalog match — collaborative tone, not an error. */
  notFoundReminderToast:
    "We couldn't find this product — we'll need your help adding it.",
  notFoundTopTitle: 'Not in our catalog yet',
  notFoundTopSubtitle: 'Help us add it — a photo keeps it on your shelf record',
  notFoundCaptureTitle: 'Take a photo of the front label',
  notFoundCaptureSubtitle: "We'll save it with your entry for your records",
  notFoundCaptureRetry: "Tap the button when you're ready — or skip for now",

  sessionBarcodePrefix: 'Using barcode',

  manualEntryLead: 'Having trouble?',
  manualEntryAction: 'Manual entry',

  skipPhotoForNow: 'Skip for now',
} as const;

const SESSION_BARCODE_MAX = 18;

export function truncateBarcodeForDisplay(code: string, maxLen = SESSION_BARCODE_MAX): string {
  const t = code.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

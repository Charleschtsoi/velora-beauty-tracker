import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Vibration,
  Platform,
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult, type CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { showToast } from '../utils/toast';
import {
  analyzeProductImage,
  isAIServiceConfigured,
  resolveDemoProductImage,
  type AIFieldKey,
  type AIFieldMap,
} from '../services/aiService';
import { lookupProductByBarcode } from '../services/upcService';
import { useProducts } from '../context/ProductContext';
import { DEMO_MODE } from '../config/demoMode';
import {
  DEMO_PRODUCTS,
  type DemoProductInput,
  getDemoExpirationDate,
  getDemoProductNotes,
  mapDemoCategoryToProductCategory,
} from '../config/demoProducts';
import {
  resolveDemoProductByAiFields,
  resolveDemoProductByBarcode,
  resolveDemoProductManually,
  type DemoMatchResult,
} from '../services/demoScanResolver';
import { onProductSaved } from '../services/localNotificationService';
import { colors, spacing, radius, shadow, typography } from '../theme';
import { scanCameraCopy, truncateBarcodeForDisplay } from '../copy/scanCamera';
import { ScanCameraHint } from '../components/scan/ScanCameraHint';

const { width, height } = Dimensions.get('window');
/** Portrait-leaning frame: better for tubes, bottles, vertical labels */
const SCAN_FRAME_WIDTH = width * 0.72;
const SCAN_FRAME_HEIGHT = Math.min(width * 0.5, height * 0.36);

// Vibration pattern for successful scan
const VIBRATION_PATTERN = 100;
// AI photo runs Gemini vision + catalog match; needs more than barcode lookup.
const DEMO_AI_BACKEND_TIMEOUT_MS = 8000;
const DEMO_BARCODE_BACKEND_TIMEOUT_MS = 4000;

const BARCODE_SCAN_TYPES = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'code93',
  'codabar',
  'itf14',
  'qr',
] as const;

type ScanMode = 'barcode' | 'ai';

type PostBarcodeCaptureContext =
  | { kind: 'demo'; product: DemoProductInput; barcode: string }
  | {
      kind: 'add';
      barcode: string;
      upcData?: Record<string, { value: string | null; confidence: number | null; source: string }>;
      scanNotFound?: boolean;
    };

function formatDemoProductLabel(product: DemoProductInput): string {
  return `${product.brand} · ${product.name}`;
}

function formatDetectionSummary(fields?: Partial<AIFieldMap> | null): string | null {
  if (!fields) return null;
  const brand = fields.brand?.value?.trim();
  const name = fields.name?.value?.trim();
  const parts = [brand, name].filter(Boolean) as string[];
  if (parts.length > 0) return parts.join(' · ');
  const color = fields.packagingColor?.value?.trim();
  if (color) return `packaging (${color})`;
  return null;
}

type ScanNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Scan'>;

export default function ScanScreen() {
  const navigation = useNavigation<ScanNavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('barcode'); // 'barcode' or 'ai'
  const [flashlightEnabled, setFlashlightEnabled] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lookupInProgress, setLookupInProgress] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isAddingDemo, setIsAddingDemo] = useState(false); // demo "thinking" state
  const [presenterPickerVisible, setPresenterPickerVisible] = useState(false);
  const [pendingDemoContext, setPendingDemoContext] = useState<{
    barcode?: string;
    photoUri?: string;
    source?: ScanMode | 'chooser';
    detectedSummary?: string;
  }>({});
  const [postBarcodeCapture, setPostBarcodeCapture] = useState<PostBarcodeCaptureContext | null>(
    null
  );
  const [aiSessionBarcode, setAiSessionBarcode] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const { addProduct } = useProducts();

  const openAddProduct = (params: RootStackParamList['AddProduct']) => {
    navigation.navigate('AddProduct', params);
  };

  const openProductDetail = (productId: string) => {
    navigation.replace('ProductDetail', { productId });
  };

  const openPresenterPicker = (
    context?: {
      barcode?: string;
      photoUri?: string;
      source?: ScanMode | 'chooser';
      detectedSummary?: string;
    }
  ) => {
    setPendingDemoContext(context ?? {});
    setPresenterPickerVisible(true);
  };

  const closePresenterPicker = () => {
    setPresenterPickerVisible(false);
    setPendingDemoContext({});
  };

  const presenterPickerCopy =
    pendingDemoContext.source === 'barcode'
      ? "We couldn't confirm this barcode automatically. Choose the matching demo product below."
      : pendingDemoContext.source === 'ai'
        ? pendingDemoContext.detectedSummary
          ? `We read “${pendingDemoContext.detectedSummary}” on the label. Choose the closest match below.`
          : "We couldn't confirm this product label automatically. Choose the closest demo product below."
        : 'Choose one of the demo products below to keep moving through the demo.';

  const handlePresenterSelect = async (productId: string) => {
    const resolved = resolveDemoProductManually(productId);
    closePresenterPicker();
    if (!resolved.product) {
      showToast('Unable to load that demo product.', 'error');
      return;
    }
    if (pendingDemoContext.photoUri) {
      await saveDemoAndShowDetail(resolved.product, pendingDemoContext);
      return;
    }
    beginPostBarcodePhotoFlow(resolved.product, pendingDemoContext.barcode);
  };

  const beginPostBarcodePhotoFlow = (product: DemoProductInput, barcode?: string) => {
    const barcodeValue = barcode ?? product.barcode ?? '';
    setPostBarcodeCapture({ kind: 'demo', product, barcode: barcodeValue });
    setScanMode('ai');
    setIsScanning(true);
    setScanned(false);
    setCameraReady(false);
    processingScanRef.current = false;
    showToast('Now take a quick photo of the product', 'info');
  };

  const beginAddProductPhotoFlow = (params: {
    barcode: string;
    upcData?: Record<string, { value: string | null; confidence: number | null; source: string }>;
    scanNotFound?: boolean;
  }) => {
    setPostBarcodeCapture({
      kind: 'add',
      barcode: params.barcode,
      upcData: params.upcData,
      scanNotFound: params.scanNotFound,
    });
    setScanMode('ai');
    setIsScanning(true);
    setScanned(false);
    setCameraReady(false);
    processingScanRef.current = false;
    showToast('Now take a quick photo of the product', 'info');
  };

  const finishPostBarcodePhotoStep = async (photoUri?: string) => {
    const ctx = postBarcodeCapture;
    if (!ctx) return;
    setPostBarcodeCapture(null);
    setIsScanning(false);
    setIsAnalyzing(false);

    if (ctx.kind === 'demo') {
      await saveDemoAndShowDetail(ctx.product, {
        barcode: ctx.barcode,
        photoUri,
      });
      return;
    }

    openAddProduct({
      barcode: ctx.barcode,
      photoUri,
      upcData: ctx.upcData,
      scanNotFound: ctx.scanNotFound,
    });
  };

  const saveDemoAndShowDetail = async (
    demo: DemoProductInput,
    options?: { barcode?: string; photoUri?: string }
  ) => {
    try {
      const newProduct = await addProduct({
        name: demo.name,
        brand: demo.brand,
        category: mapDemoCategoryToProductCategory(demo.category),
        expirationDate: getDemoExpirationDate(demo),
        photoUrl: options?.photoUri,
        notes: getDemoProductNotes(demo),
        barcode: options?.barcode ?? demo.barcode,
      });
      if (!newProduct?.id) {
        showToast('Could not save product. Please try again.', 'error');
        return;
      }
      await onProductSaved(newProduct);
      showToast('Product added to your collection', 'success');
      openProductDetail(newProduct.id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save product', 'error');
      openAddProduct({
        barcode: options?.barcode ?? demo.barcode,
        photoUri: options?.photoUri,
        aiData: {
          name: { value: demo.name, confidence: 0.92, source: 'Demo' },
          brand: { value: demo.brand ?? null, confidence: 0.92, source: 'Demo' },
          category: {
            value: demo.category === 'sunscreen' ? 'skincare' : demo.category,
            confidence: 0.92,
            source: 'Demo',
          },
          packagingColor: {
            value: demo.matcherHints.packagingColor,
            confidence: 0.9,
            source: 'Demo',
          },
          expirationDate: {
            value: demo.expirationDate,
            confidence: 0.92,
            source: 'Demo',
          },
          notes: {
            value: `${demo.notes} Routine advice: ${demo.mockAiEnrichment.routineAdvice}`,
            confidence: 0.92,
            source: 'Demo',
          },
          ingredients: {
            value: demo.mockAiEnrichment.ingredientsSummary,
            confidence: 0.92,
            source: 'Demo',
          },
        },
      });
    }
  };
  const aiConfigured = isAIServiceConfigured();
  const aiModeAvailable = DEMO_MODE || aiConfigured; // In demo, AI Photo works without backend
  const knownFieldsRef = useRef<Partial<Record<AIFieldKey, string>>>({});
  const processingScanRef = useRef(false); // prevent double-handling one scan
  const aiSessionBarcodeRef = useRef<string | null>(null);
  const lastAiBarcodeToastRef = useRef<string | null>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const resetAiSessionBarcode = () => {
    aiSessionBarcodeRef.current = null;
    lastAiBarcodeToastRef.current = null;
    setAiSessionBarcode(null);
  };

  const rememberAiSessionBarcode = (raw: string) => {
    const normalized = raw.replace(/\D/g, '');
    if (normalized.length < 5) return;
    if (aiSessionBarcodeRef.current === normalized) return;
    aiSessionBarcodeRef.current = normalized;
    setAiSessionBarcode(normalized);
    if (lastAiBarcodeToastRef.current !== normalized) {
      lastAiBarcodeToastRef.current = normalized;
      showToast('Barcode captured — we will use it if the photo match needs help', 'info');
    }
  };

  const resolveDemoViaBarcode = async (barcode: string): Promise<DemoProductInput | null> => {
    const localMatch = resolveDemoProductByBarcode(barcode);
    if (localMatch.product) {
      return localMatch.product;
    }

    try {
      const lookup = await Promise.race([
        lookupProductByBarcode(barcode),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Demo barcode timeout')), DEMO_BARCODE_BACKEND_TIMEOUT_MS)
        ),
      ]);
      const backendDemoProduct = (lookup.data as { demoProduct?: DemoProductInput } | undefined)
        ?.demoProduct;
      if (lookup.success && backendDemoProduct) {
        return backendDemoProduct;
      }
    } catch {
      // Backend barcode lookup is best-effort during AI photo.
    }

    return null;
  };

  const toDemoMatchFromProduct = (
    product: DemoProductInput,
    matchedBy: DemoMatchResult['matchedBy'],
    cue: string
  ): DemoMatchResult => ({
    product,
    matchedBy,
    score: 100,
    matchedCues: [cue],
  });

  const primeKnownFieldsFromDemo = (demo: DemoProductInput) => {
    knownFieldsRef.current = {
      name: demo.name,
      brand: demo.brand,
      category: demo.category,
      ingredients: demo.mockAiEnrichment.ingredientsSummary,
    };
  };

  const getPostBarcodeProductLabel = (): string | null => {
    if (!postBarcodeCapture) return null;
    if (postBarcodeCapture.kind === 'demo') {
      return formatDemoProductLabel(postBarcodeCapture.product);
    }
    const name = knownFieldsRef.current.name;
    if (name) {
      const brand = knownFieldsRef.current.brand;
      return brand ? `${brand} · ${name}` : name;
    }
    return 'your product';
  };

  useEffect(() => {
    if (permission?.granted) {
      setCameraAvailable(true);
    }
  }, [permission]);

  // Demo: if camera never fires onCameraReady, allow capture after a short delay so the screen doesn't stay frozen on "Waiting for camera..."
  useEffect(() => {
    if (!DEMO_MODE || scanMode !== 'ai' || !isScanning || cameraReady) return;
    const t = setTimeout(() => setCameraReady(true), 2500);
    return () => clearTimeout(t);
  }, [DEMO_MODE, scanMode, isScanning, cameraReady]);

  useEffect(() => {
    if (!isScanning || scanMode !== 'barcode') {
      scanLineAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isScanning, scanMode, scanLineAnim]);

  // Cleanup when component unmounts or when leaving scanning mode
  useEffect(() => {
    return () => {
      // Reset states when component unmounts
      setScanned(false);
      setIsScanning(false);
    };
  }, []);

  const handleCameraBarcodeDetected = (result: BarcodeScanningResult) => {
    if (postBarcodeCapture || isAnalyzing) return;

    if (scanMode === 'ai' && isScanning) {
      rememberAiSessionBarcode(result.data);
      return;
    }

    if (scanMode === 'barcode' && !scanned && !processingScanRef.current) {
      handleBarCodeScanned(result);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    if (scanned || processingScanRef.current) return;

    const barcodeValue = data;
    if (!barcodeValue || !barcodeValue.trim()) return;

    processingScanRef.current = true;
    setScanned(true);

    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          Vibration.vibrate(VIBRATION_PATTERN);
        } catch {
          // ignore
        }
      }
      setIsScanning(false);

      if (DEMO_MODE) {
        setIsAddingDemo(true);
        const THINKING_MS = 900;
        await new Promise((r) => setTimeout(r, THINKING_MS));

        let demoProduct: DemoProductInput | null = null;

        try {
          const lookup = await Promise.race([
            lookupProductByBarcode(barcodeValue),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Demo barcode timeout')), DEMO_BARCODE_BACKEND_TIMEOUT_MS)
            ),
          ]);

          const backendDemoProduct = (lookup.data as { demoProduct?: DemoProductInput } | undefined)
            ?.demoProduct;

          if (lookup.success && backendDemoProduct) {
            demoProduct = backendDemoProduct;
          }
        } catch {
          // Fall back to the local demo resolver if the backend is unavailable.
        }

        if (!demoProduct) {
          demoProduct = resolveDemoProductByBarcode(barcodeValue).product;
        }

        setIsAddingDemo(false);
        setScanned(false);
        processingScanRef.current = false;
        if (demoProduct) {
          primeKnownFieldsFromDemo(demoProduct);
          showToast(`Found: ${formatDemoProductLabel(demoProduct)}`, 'success');
          beginPostBarcodePhotoFlow(demoProduct, barcodeValue);
        } else {
          showToast("We couldn't confirm this automatically yet.", 'info');
          openPresenterPicker({ barcode: barcodeValue, source: 'barcode' });
        }
        return;
      }

      showToast(`Barcode scanned: ${barcodeValue}`, 'success');
      setLookupInProgress(true);
      showToast('Looking up barcode metadata...', 'info');
      const lookup = await lookupProductByBarcode(barcodeValue);
      setLookupInProgress(false);

      let upcData: Record<string, { value: string | null; confidence: number | null; source: string }> | undefined;

      if (lookup.success && lookup.data) {
        const confidence = lookup.confidence ?? null;
        upcData = {
          name: { value: (lookup.data as any)?.name ?? null, confidence, source: 'barcode' },
          brand: { value: (lookup.data as any)?.brand ?? null, confidence, source: 'barcode' },
          category: { value: (lookup.data as any)?.category ?? null, confidence, source: 'barcode' },
          expirationDate: { value: null, confidence: null, source: 'barcode' },
          ingredients: { value: (lookup.data as any)?.ingredients ?? null, confidence, source: 'barcode' },
          notes: { value: null, confidence: null, source: 'barcode' },
        };

        knownFieldsRef.current = {
          name: upcData.name.value ?? undefined,
          brand: upcData.brand.value ?? undefined,
          category: upcData.category.value ?? undefined,
          ingredients: upcData.ingredients.value ?? undefined,
        };

        showToast('Product info retrieved from barcode lookup.', 'success');
      } else {
        knownFieldsRef.current = {};
        const errorMessage = lookup.error || 'Barcode lookup failed.';
        showToast(errorMessage, 'error');
      }

      beginAddProductPhotoFlow({
        barcode: barcodeValue,
        upcData,
        scanNotFound: !lookup.success || !lookup.data,
      });
      setScanned(false);
      processingScanRef.current = false;
    } catch (error) {
      setScanned(false);
      setIsScanning(false);
      setIsAddingDemo(false);
      processingScanRef.current = false;
      setLookupInProgress(false);
      showToast('Error scanning barcode. Please try again.', 'error');
      openAddProduct({
        barcode: barcodeValue,
        scanNotFound: true,
      });
    }
  };

  const handleScanPress = async () => {
    if (!permission) {
      await requestPermission();
      return;
    }

    if (!permission.granted) {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to scan products.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: requestPermission },
        ]
      );
      return;
    }

    if (!cameraAvailable) {
      Alert.alert(
        'Camera Not Available',
        'Camera is not available on this device. Please use manual entry.',
        [{ text: 'OK' }]
      );
      return;
    }

    // If AI mode but not configured (and not demo), fallback to barcode
    if (scanMode === 'ai' && !aiModeAvailable) {
      Alert.alert(
        'AI Service Not Configured',
        'Please configure your AI API key in environment variables. Falling back to barcode scan.',
        [{ text: 'OK', onPress: () => setScanMode('barcode') }]
      );
      return;
    }

    resetAiSessionBarcode();
    setIsScanning(true);
    setScanned(false);
    setCameraReady(false); // Reset camera ready state when starting scan
  };

  const toggleScanMode = () => {
    setScanned(false);
    processingScanRef.current = false;
    const nextMode = scanMode === 'barcode' ? 'ai' : 'barcode';
    // Leaving AI: clear any in-frame barcode chip so Barcode mode starts clean.
    if (scanMode === 'ai' && nextMode === 'barcode') {
      resetAiSessionBarcode();
    }
    setScanMode(nextMode);
  };

  const handleManualEntry = () => {
    openAddProduct(undefined);
  };

  const toggleFlashlight = () => {
    if (cameraRef.current) {
      setFlashlightEnabled(!flashlightEnabled);
    }
  };

  const handlePostBarcodePhotoCapture = async () => {
    if (!cameraRef.current || isAnalyzing || !cameraReady) {
      if (!cameraReady) {
        showToast('Camera not ready. Please wait...', 'error');
      }
      return;
    }

    try {
      setIsAnalyzing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });
      if (!photo?.uri) {
        throw new Error('Failed to capture photo');
      }
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          Vibration.vibrate(VIBRATION_PATTERN);
        } catch {
          // ignore
        }
      }
      showToast('Photo saved with product', 'success');
      await finishPostBarcodePhotoStep(photo.uri);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to capture photo';
      showToast(message, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current || isAnalyzing || !cameraReady) {
      if (!cameraReady) {
        showToast('Camera not ready. Please wait...', 'error');
      }
      return;
    }

    let photo: { uri: string } | null = null;
    try {
      setIsAnalyzing(true);
      const takePicture = cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });
      const timeoutMs = DEMO_MODE ? 6000 : 15000;
      try {
        photo = await Promise.race([
          takePicture,
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Capture timeout')), timeoutMs)
          ),
        ]);
      } catch (e) {
        if (DEMO_MODE) {
          // Proceed without photo so the form still opens with demo analysis
          photo = null;
        } else {
          throw e;
        }
      }

      if (!DEMO_MODE && !photo?.uri) {
        throw new Error('Failed to capture photo');
      }

      if (DEMO_MODE) {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          try {
            Vibration.vibrate(VIBRATION_PATTERN);
          } catch {
            // ignore
          }
        }
        showToast('Identifying product...', 'info');
        setIsScanning(false);
        const sourceFields: Partial<AIFieldMap> = {};
        let lastExtractedFields: Partial<AIFieldMap> | null = null;
        if (knownFieldsRef.current.name) {
          sourceFields.name = {
            value: knownFieldsRef.current.name,
            confidence: 0.88,
            source: 'Known field',
          };
        }
        if (knownFieldsRef.current.brand) {
          sourceFields.brand = {
            value: knownFieldsRef.current.brand,
            confidence: 0.88,
            source: 'Known field',
          };
        }
        if (knownFieldsRef.current.category) {
          sourceFields.category = {
            value: knownFieldsRef.current.category,
            confidence: 0.8,
            source: 'Known field',
          };
        }
        if (knownFieldsRef.current.ingredients) {
          sourceFields.ingredients = {
            value: knownFieldsRef.current.ingredients,
            confidence: 0.78,
            source: 'Known field',
          };
        }

        const barcodeHint = aiSessionBarcodeRef.current;
        let resolved = resolveDemoProductByAiFields(
          Object.keys(sourceFields).length ? sourceFields : undefined,
          knownFieldsRef.current
        );

        if (!resolved.product && barcodeHint) {
          const viaBarcode = await resolveDemoViaBarcode(barcodeHint);
          if (viaBarcode) {
            resolved = toDemoMatchFromProduct(viaBarcode, 'barcode', barcodeHint);
            primeKnownFieldsFromDemo(viaBarcode);
          }
        }

        if (photo?.uri && aiConfigured) {
          try {
            const backendResolution = await Promise.race([
              resolveDemoProductImage(photo.uri, knownFieldsRef.current, barcodeHint ?? undefined),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Demo AI timeout')), DEMO_AI_BACKEND_TIMEOUT_MS)
              ),
            ]);

            if (backendResolution.extractedFields) {
              lastExtractedFields = backendResolution.extractedFields;
            }

            if (backendResolution.success && backendResolution.matched && backendResolution.product) {
              resolved = {
                product: backendResolution.product,
                score: backendResolution.confidence ?? 0,
                matchedCues: backendResolution.matchedCues ?? [],
                matchedBy: 'ocr-hints',
              };
              primeKnownFieldsFromDemo(backendResolution.product);
            } else if (backendResolution.success && backendResolution.extractedFields) {
              resolved = resolveDemoProductByAiFields(
                backendResolution.extractedFields,
                knownFieldsRef.current
              );
            } else if (!backendResolution.success && backendResolution.error) {
              showToast(backendResolution.error, 'error');
            }
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Photo match unavailable';
            if (message.includes('timeout')) {
              showToast('Photo check is taking longer than usual…', 'info');
            }
          }
        } else if (!photo?.uri) {
          showToast('Photo capture was slow. Try again or pick from the list.', 'info');
        }

        if (!resolved.product && barcodeHint) {
          const viaBarcode = await resolveDemoViaBarcode(barcodeHint);
          if (viaBarcode) {
            resolved = toDemoMatchFromProduct(viaBarcode, 'barcode', barcodeHint);
            primeKnownFieldsFromDemo(viaBarcode);
          }
        }

        setIsAnalyzing(false);
        setScanned(false);
        resetAiSessionBarcode();

        if (resolved.product) {
          const matchLabel =
            resolved.matchedBy === 'barcode'
              ? `Found via barcode: ${formatDemoProductLabel(resolved.product)}`
              : `Found: ${formatDemoProductLabel(resolved.product)}`;
          showToast(matchLabel, 'success');
          await saveDemoAndShowDetail(resolved.product, {
            photoUri: photo?.uri,
            barcode: barcodeHint ?? resolved.product.barcode,
          });
        } else {
          const detectedSummary =
            formatDetectionSummary(lastExtractedFields) ??
            formatDetectionSummary(
              Object.keys(sourceFields).length ? sourceFields : undefined
            );
          if (detectedSummary) {
            showToast(`Read: ${detectedSummary}. Pick the closest match.`, 'info');
          } else if (barcodeHint) {
            showToast(`Barcode ${barcodeHint} did not match our demo catalog.`, 'info');
          } else {
            showToast("We couldn't identify this product yet.", 'info');
          }
          openPresenterPicker({
            photoUri: photo?.uri,
            source: 'ai',
            barcode: barcodeHint ?? undefined,
            detectedSummary: detectedSummary ?? undefined,
          });
        }
        return;
      }

      if (!photo?.uri) throw new Error('Failed to capture photo');
      const capturedPhotoUri = photo.uri;
      const barcodeHint = aiSessionBarcodeRef.current;

      showToast('Capturing and analyzing image...', 'info');
      const analysisResult = await analyzeProductImage(capturedPhotoUri, knownFieldsRef.current);

      if (!analysisResult.success || !analysisResult.fields) {
        if (barcodeHint) {
          setIsAnalyzing(false);
          setIsScanning(false);
          resetAiSessionBarcode();
          showToast('Photo analysis failed — using barcode instead.', 'info');
          beginAddProductPhotoFlow({ barcode: barcodeHint, scanNotFound: true });
          return;
        }
        throw new Error(analysisResult.error || 'Failed to analyze image');
      }

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          Vibration.vibrate(VIBRATION_PATTERN);
        } catch {
          // ignore
        }
      }
      setIsScanning(false);

      resetAiSessionBarcode();
      setTimeout(() => {
        showToast('Product analyzed! Filling form...', 'success');
        openAddProduct({
          aiData: analysisResult.fields,
          aiFlatData: analysisResult.flatData,
          photoUri: capturedPhotoUri,
          barcode: barcodeHint ?? undefined,
        });
        setIsAnalyzing(false);
        setScanned(false);
      }, 300);
    } catch (error: any) {
      setIsAnalyzing(false);
      setIsScanning(false);
      setScanned(false);
      showToast(error.message || 'Failed to analyze image. Please try again.', 'error');
      openAddProduct({
        photoUri: photo?.uri,
        scanNotFound: true,
      });
    }
  };

  // Loading state
  if (!permission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied state
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to scan product barcodes. Please grant permission in your device settings.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            testID="request-permission-button"
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualEntryButton}
            onPress={handleManualEntry}
            testID="manual-entry-fallback-button"
          >
            <Text style={styles.manualEntryButtonText}>Use Manual Entry Instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Camera not available state
  if (!cameraAvailable) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.statusExpired} />
          <Text style={styles.permissionTitle}>Camera Not Available</Text>
          <Text style={styles.permissionText}>
            Camera is not available on this device. Please use manual entry to add products.
          </Text>
          <TouchableOpacity
            style={styles.manualEntryButton}
            onPress={handleManualEntry}
            testID="manual-entry-button"
          >
            <Text style={styles.manualEntryButtonText}>Use Manual Entry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Modal
        visible={presenterPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={closePresenterPicker}
      >
        <View style={styles.presenterModalBackdrop}>
          <View style={styles.presenterModalCard}>
            <Text style={styles.presenterModalEyebrow}>Demo products</Text>
            <Text style={styles.presenterModalTitle}>Choose demo product</Text>
            <Text style={styles.presenterModalCopy}>{presenterPickerCopy}</Text>
            <ScrollView
              style={styles.presenterList}
              contentContainerStyle={styles.presenterListContent}
              showsVerticalScrollIndicator={false}
            >
              {DEMO_PRODUCTS.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.presenterItem}
                  onPress={() => handlePresenterSelect(product.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.presenterItemContent}>
                    <Text style={styles.presenterItemBrand}>{product.brand}</Text>
                    <Text style={styles.presenterItemName}>{product.name}</Text>
                    <Text style={styles.presenterItemMeta}>
                      {product.volume} • {product.matcherHints.packagingColor}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.presenterCloseButton} onPress={closePresenterPicker}>
              <Text style={styles.presenterCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {DEMO_MODE && (
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>Demo mode</Text>
        </View>
      )}
      {isAddingDemo && (
        <View style={styles.thinkingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.thinkingText}>Adding to your collection...</Text>
        </View>
      )}
      <View style={styles.cameraContainer}>
        {isScanning && permission?.granted && cameraAvailable ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            enableTorch={flashlightEnabled}
            onBarcodeScanned={
              isScanning && !postBarcodeCapture ? handleCameraBarcodeDetected : undefined
            }
            barcodeScannerSettings={
              isScanning && (scanMode === 'barcode' || scanMode === 'ai')
                ? { barcodeTypes: [...BARCODE_SCAN_TYPES] }
                : undefined
            }
            onMountError={(error) => {
              // Handle camera mount errors
              setIsScanning(false);
              setCameraAvailable(false);
              showToast('Camera initialization failed. Please try again.', 'error');
            }}
            onCameraReady={() => {
              // Camera is ready for capture
              setCameraReady(true);
            }}
          >
            <View style={styles.overlay}>
              {/* Flashlight toggle button (top-left) */}
              <TouchableOpacity
                style={styles.flashlightButton}
                onPress={toggleFlashlight}
                testID="flashlight-toggle-button"
              >
                <Ionicons
                  name={flashlightEnabled ? 'flash' : 'flash-off'}
                  size={24}
                  color={colors.white}
                />
              </TouchableOpacity>

              {postBarcodeCapture && (
                <View style={styles.instructionChipTop} pointerEvents="none">
                  <ScanCameraHint
                    compact
                    maxWidthFactor={0.92}
                    title={
                      getPostBarcodeProductLabel()
                        ? `${scanCameraCopy.postBarcodeMatchedPrefix} — ${getPostBarcodeProductLabel()}`
                        : scanCameraCopy.postBarcodeScannedFallback
                    }
                  />
                </View>
              )}

              {scanMode === 'barcode' && !scanned && !postBarcodeCapture && (
                <View style={styles.instructionChipTop} pointerEvents="none">
                  <ScanCameraHint
                    compact
                    maxWidthFactor={0.92}
                    title={scanCameraCopy.barcodeInstructionTop}
                  />
                </View>
              )}

              {/* Scanning area with soft corner brackets */}
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                {scanMode === 'barcode' && !scanned && (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.scanLine,
                      {
                        transform: [
                          {
                            translateY: scanLineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [6, SCAN_FRAME_HEIGHT - 10],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                )}
              </View>

              {!scanned && scanMode === 'barcode' && (
                <View style={styles.scanningIndicator}>
                  <ScanCameraHint
                    maxWidthFactor={0.92}
                    title={scanCameraCopy.barcodeScanningSecondary}
                  />
                </View>
              )}

              {/* Post-barcode product photo */}
              {postBarcodeCapture && !isAnalyzing && (
                <View style={styles.aiCaptureContainer}>
                  <TouchableOpacity
                    style={[styles.captureButton, !cameraReady && styles.captureButtonDisabled]}
                    onPress={handlePostBarcodePhotoCapture}
                    activeOpacity={0.8}
                    disabled={!cameraReady}
                  >
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                  <View style={styles.captureHintBelowShutter}>
                    {cameraReady ? (
                      <ScanCameraHint
                        title={scanCameraCopy.postBarcodeCaptureTitle}
                        subtitle={scanCameraCopy.postBarcodeCaptureSubtitle}
                      />
                    ) : (
                      <ScanCameraHint title={scanCameraCopy.cameraWaiting} compact />
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.skipPhotoButton}
                    onPress={() => finishPostBarcodePhotoStep()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.skipPhotoButtonText}>{scanCameraCopy.skipPhotoForNow}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* AI Mode - Capture button */}
              {!postBarcodeCapture && scanMode === 'ai' && !isAnalyzing && (
                <View style={styles.aiCaptureContainer}>
                  {aiSessionBarcode ? (
                    <View style={styles.aiBarcodeChipWrap} pointerEvents="none">
                      <ScanCameraHint
                        compact
                        title={scanCameraCopy.sessionBarcodePrefix}
                        subtitle={truncateBarcodeForDisplay(aiSessionBarcode)}
                      />
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.captureButton, !cameraReady && styles.captureButtonDisabled]}
                    onPress={handleCapturePhoto}
                    activeOpacity={0.8}
                    disabled={!cameraReady}
                  >
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                  <View style={styles.captureHintBelowShutter}>
                    {cameraReady ? (
                      <ScanCameraHint
                        title={scanCameraCopy.aiCaptureTitle}
                        subtitle={scanCameraCopy.aiCaptureSubtitle}
                      />
                    ) : (
                      <ScanCameraHint title={scanCameraCopy.cameraWaiting} compact />
                    )}
                  </View>
                </View>
              )}

              {/* AI Analyzing indicator */}
              {isAnalyzing && (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="large" color={colors.white} />
                  <Text style={styles.analyzingText}>{scanCameraCopy.analyzing}</Text>
                </View>
              )}
            </View>
          </CameraView>
        ) : (
          <View style={styles.placeholderView}>
            <View style={styles.idleIconWrap}>
              <Ionicons name="camera-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.idleHeadline}>{scanCameraCopy.idleHeadline}</Text>
            <Text style={styles.idleSubcopy}>
              {DEMO_MODE ? scanCameraCopy.idleSubcopyDemo : scanCameraCopy.idleSubcopyLive}
            </Text>
            <View style={styles.tipsWrap}>
              {scanCameraCopy.idleTips.map((tip) => (
                <View key={tip} style={styles.tipChip}>
                  <Text style={styles.tipChipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.controlsContainer}>
        {/* Mode toggle buttons */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[styles.modeButton, scanMode === 'barcode' && styles.modeButtonActive]}
            onPress={() => {
              if (scanMode !== 'barcode') {
                toggleScanMode();
              }
            }}
            disabled={isAnalyzing || !!postBarcodeCapture}
          >
            <Ionicons
              name="barcode-outline"
              size={20}
              color={scanMode === 'barcode' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.modeButtonText,
                scanMode === 'barcode' && styles.modeButtonTextActive,
              ]}
            >
              Barcode
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              scanMode === 'ai' && styles.modeButtonActive,
              !aiModeAvailable && styles.modeButtonDisabled,
            ]}
            onPress={() => {
              if (scanMode !== 'ai' && aiModeAvailable) {
                toggleScanMode();
              } else if (!aiModeAvailable) {
                showToast('AI service not configured. Please set API key.', 'error');
              }
            }}
            disabled={isAnalyzing || !aiModeAvailable || !!postBarcodeCapture}
          >
            <Ionicons
              name="sparkles-outline"
              size={20}
              color={
                scanMode === 'ai'
                  ? colors.primary
                  : !aiModeAvailable
                    ? colors.iconMuted
                    : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.modeButtonText,
                scanMode === 'ai' && styles.modeButtonTextActive,
                !aiModeAvailable && styles.modeButtonTextDisabled,
              ]}
            >
              AI Photo
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.scanButton,
            (isAnalyzing || lookupInProgress) && styles.scanButtonDisabled,
          ]}
          onPress={handleScanPress}
          activeOpacity={0.8}
          disabled={isAnalyzing || lookupInProgress}
          testID="scan-barcode-button"
        >
          {isAnalyzing || lookupInProgress ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons
                name={scanMode === 'ai' ? 'camera' : 'search'}
                size={24}
                color={colors.white}
              />
              <Text style={styles.scanButtonText}>Open camera</Text>
            </>
          )}
        </TouchableOpacity>

        {DEMO_MODE && (
          <TouchableOpacity
            style={styles.demoChooserButton}
            onPress={() => openPresenterPicker({ source: 'chooser' })}
            activeOpacity={0.8}
            testID="choose-demo-product-button"
          >
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            <Text style={styles.demoChooserButtonText}>Choose from demo products</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.manualEntryLink}
          onPress={handleManualEntry}
          testID="manual-entry-link"
        >
          <Text style={styles.manualEntryText}>
            {scanCameraCopy.manualEntryLead}{' '}
            <Text style={styles.manualEntryLinkText}>{scanCameraCopy.manualEntryAction}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  demoBadge: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  demoBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  presenterModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  presenterModalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  presenterModalEyebrow: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  presenterModalTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  presenterModalCopy: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  presenterList: {
    marginTop: spacing.md,
  },
  presenterListContent: {
    gap: spacing.sm,
  },
  presenterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  presenterItemContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  presenterItemBrand: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  presenterItemName: {
    ...typography.bodyLargeStrong,
    color: colors.textPrimary,
    marginTop: 2,
  },
  presenterItemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  presenterCloseButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  presenterCloseButtonText: {
    ...typography.bodyStrong,
    color: colors.link,
  },
  thinkingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  thinkingText: {
    marginTop: spacing.md,
    ...typography.bodyLargeStrong,
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  permissionTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionButtonText: {
    ...typography.bodyLargeStrong,
    color: colors.white,
  },
  manualEntryButton: {
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  manualEntryButtonText: {
    ...typography.bodyLargeStrong,
    color: colors.primary,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  camera: {
    flex: 1,
  },
  placeholderView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.lg,
  },
  idleIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  idleHeadline: {
    ...typography.subtitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  idleSubcopy: {
    marginTop: spacing.xs,
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  tipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  tipChip: {
    paddingVertical: spacing.xxs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tipChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xxs + 2,
    marginBottom: spacing.md,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  modeButtonActive: {
    backgroundColor: colors.mintSoft,
  },
  modeButtonDisabled: {
    opacity: 0.5,
  },
  modeButtonText: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
  modeButtonTextActive: {
    color: colors.primary,
  },
  modeButtonTextDisabled: {
    color: colors.iconMuted,
  },
  aiCaptureContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    alignItems: 'center',
    alignSelf: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primaryLight,
    ...shadow.fab,
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureHintBelowShutter: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  aiBarcodeChipWrap: {
    marginBottom: spacing.sm,
  },
  skipPhotoButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.overlayButton,
    borderWidth: 1,
    borderColor: colors.overlayPillBorder,
  },
  skipPhotoButtonText: {
    color: colors.white,
    ...typography.bodyStrong,
  },
  analyzingContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.overlayPillBg,
    borderWidth: 1,
    borderColor: colors.overlayPillBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  analyzingText: {
    marginTop: spacing.sm,
    color: colors.white,
    ...typography.bodyStrong,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionChipTop: {
    position: 'absolute',
    top: 76,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    zIndex: 5,
  },
  flashlightButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.overlayButton,
    borderWidth: 1,
    borderColor: colors.overlayPillBorder,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scanArea: {
    width: SCAN_FRAME_WIDTH,
    height: SCAN_FRAME_HEIGHT,
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: colors.white,
    borderWidth: 2,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: radius.sm,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: radius.sm,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: radius.sm,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: radius.sm,
  },
  scanningIndicator: {
    position: 'absolute',
    bottom: spacing.xxl,
    alignSelf: 'center',
    maxWidth: width * 0.92,
  },
  controlsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.cream,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.fab,
  },
  scanButtonText: {
    ...typography.subtitle,
    color: colors.white,
  },
  demoChooserButton: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  demoChooserButtonText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  manualEntryLink: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  manualEntryText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  manualEntryLinkText: {
    color: colors.link,
    fontWeight: '600',
  },
});

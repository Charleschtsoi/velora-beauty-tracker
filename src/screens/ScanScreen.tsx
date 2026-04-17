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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult, type CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { showToast } from '../utils/toast';
import { analyzeProductImage, isAIServiceConfigured, type AIFieldKey, type AIFieldMap } from '../services/aiService';
import { lookupProductByBarcode } from '../services/upcService';
import { useProducts } from '../context/ProductContext';
import { DEMO_MODE } from '../config/demoMode';
import { DEMO_PRODUCTS } from '../config/demoProducts';
import { onProductSaved } from '../services/localNotificationService';
import { colors, spacing, radius, shadow, typography } from '../theme';

const { width, height } = Dimensions.get('window');
/** Portrait-leaning frame: better for tubes, bottles, vertical labels */
const SCAN_FRAME_WIDTH = width * 0.72;
const SCAN_FRAME_HEIGHT = Math.min(width * 0.5, height * 0.36);

const IDLE_TIPS = [
  'Flat surface works best',
  'Try torch in dim light',
  'No barcode? Use AI photo',
] as const;

// Vibration pattern for successful scan
const VIBRATION_PATTERN = 100;

type ScanMode = 'barcode' | 'ai';

export default function ScanScreen() {
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
  const cameraRef = useRef<any>(null);
  const navigation = useNavigation<any>();
  const { addProduct } = useProducts();
  const aiConfigured = isAIServiceConfigured();
  const aiModeAvailable = DEMO_MODE || aiConfigured; // In demo, AI Photo works without backend
  const knownFieldsRef = useRef<Partial<Record<AIFieldKey, string>>>({});
  const demoProductIndexRef = useRef(0);
  const processingScanRef = useRef(false); // prevent double-handling one scan
  const scanLineAnim = useRef(new Animated.Value(0)).current;

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
        // Simulate barcode lookup so the app doesn't feel instant
        const THINKING_MS = 1800;
        await new Promise((r) => setTimeout(r, THINKING_MS));
        const idx = demoProductIndexRef.current % DEMO_PRODUCTS.length;
        demoProductIndexRef.current += 1;
        const demo = DEMO_PRODUCTS[idx];
        const source = 'Barcode lookup';
        const confidence = 0.92;
        const upcData: Partial<AIFieldMap> = {
          name: { value: demo.name, confidence, source },
          brand: { value: demo.brand ?? null, confidence, source },
          category: { value: demo.category, confidence, source },
          expirationDate: {
            value: demo.expirationDate.toISOString().slice(0, 10),
            confidence,
            source,
          },
          notes: { value: demo.notes ?? null, confidence, source },
        };
        setIsAddingDemo(false);
        setScanned(false);
        processingScanRef.current = false;
        navigation.getParent()?.navigate('AddProduct' as never, {
          barcode: barcodeValue,
          upcData,
          photoUri: demo.demoPhotoUri ?? undefined,
        });
        showToast('Barcode lookup complete. Confirm details and save.', 'success');
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

      navigation.getParent()?.navigate('AddProduct' as never, {
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
      navigation.getParent()?.navigate('AddProduct' as never, {
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

    setIsScanning(true);
    setScanned(false);
    setCameraReady(false); // Reset camera ready state when starting scan
  };

  const toggleScanMode = () => {
    if (isScanning) {
      setIsScanning(false);
      setScanned(false);
    }
    setScanMode(scanMode === 'barcode' ? 'ai' : 'barcode');
  };

  const handleManualEntry = () => {
    navigation.getParent()?.navigate('AddProduct' as never);
  };

  const toggleFlashlight = () => {
    if (cameraRef.current) {
      setFlashlightEnabled(!flashlightEnabled);
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
        // Simulate "analyzing" briefly so the flow feels real
        await new Promise((r) => setTimeout(r, 1200));
        const idx = demoProductIndexRef.current % DEMO_PRODUCTS.length;
        demoProductIndexRef.current += 1;
        const demo = DEMO_PRODUCTS[idx];
        const source = 'AI photo';
        const confidence = 0.92;
        const aiData: Partial<AIFieldMap> = {
          name: { value: demo.name, confidence, source },
          brand: { value: demo.brand ?? null, confidence, source },
          category: { value: demo.category, confidence, source },
          expirationDate: {
            value: demo.expirationDate.toISOString().slice(0, 10),
            confidence,
            source,
          },
          notes: { value: demo.notes ?? null, confidence, source },
        };
        setIsScanning(false);
        setIsAnalyzing(false);
        setScanned(false);
        navigation.getParent()?.navigate('AddProduct' as never, {
          photoUri: photo?.uri ?? demo.demoPhotoUri ?? undefined,
          aiData,
        });
        showToast('Analysis complete. Confirm details and save.', 'success');
        return;
      }

      if (!photo?.uri) throw new Error('Failed to capture photo');
      const capturedPhotoUri = photo.uri;

      showToast('Capturing and analyzing image...', 'info');
      const analysisResult = await analyzeProductImage(capturedPhotoUri, knownFieldsRef.current);

      if (!analysisResult.success || !analysisResult.fields) {
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

      setTimeout(() => {
        showToast('Product analyzed! Filling form...', 'success');
        navigation.getParent()?.navigate('AddProduct' as never, {
          aiData: analysisResult.fields,
          aiFlatData: analysisResult.flatData,
          photoUri: capturedPhotoUri,
        });
        setIsAnalyzing(false);
        setScanned(false);
      }, 300);
    } catch (error: any) {
      setIsAnalyzing(false);
      setIsScanning(false);
      setScanned(false);
      showToast(error.message || 'Failed to analyze image. Please try again.', 'error');
      navigation.getParent()?.navigate('AddProduct' as never, {
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
            onBarcodeScanned={scanMode === 'barcode' && !scanned ? handleBarCodeScanned : undefined}
            barcodeScannerSettings={
              scanMode === 'barcode'
                ? {
                    barcodeTypes: [
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
                    ],
                  }
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

              {scanMode === 'barcode' && !scanned && (
                <View style={styles.instructionChipTop} pointerEvents="none">
                  <Text style={styles.instructionChipText}>
                    Align the barcode on the flat side of the package.
                  </Text>
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
                  <Text style={styles.scanningText}>Hold steady — glossy labels may need the torch</Text>
                </View>
              )}

              {/* AI Mode - Capture button */}
              {scanMode === 'ai' && !isAnalyzing && (
                <View style={styles.aiCaptureContainer}>
                  <TouchableOpacity
                    style={[styles.captureButton, !cameraReady && styles.captureButtonDisabled]}
                    onPress={handleCapturePhoto}
                    activeOpacity={0.8}
                    disabled={!cameraReady}
                  >
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                  <Text style={styles.captureHintText}>
                    {cameraReady
                      ? 'Fill the frame with the product name and size, then tap to capture'
                      : 'Waiting for camera...'}
                  </Text>
                </View>
              )}

              {/* AI Analyzing indicator */}
              {isAnalyzing && (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="large" color={colors.white} />
                  <Text style={styles.analyzingText}>Analyzing product...</Text>
                </View>
              )}
            </View>
          </CameraView>
        ) : (
          <View style={styles.placeholderView}>
            <View style={styles.idleIconWrap}>
              <Ionicons name="camera-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.idleHeadline}>Add a product in seconds</Text>
            <Text style={styles.idleSubcopy}>
              Use barcode for boxed items, or AI photo for labels and curved packaging.
            </Text>
            <View style={styles.tipsWrap}>
              {IDLE_TIPS.map((tip) => (
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
            disabled={isScanning}
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
            disabled={isScanning || !aiModeAvailable}
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

        <TouchableOpacity
          style={styles.manualEntryLink}
          onPress={handleManualEntry}
          testID="manual-entry-link"
        >
          <Text style={styles.manualEntryText}>
            Having trouble? <Text style={styles.manualEntryLinkText}>Manual Entry</Text>
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
  captureHintText: {
    marginTop: spacing.sm,
    color: colors.white,
    ...typography.bodyStrong,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    maxWidth: width * 0.9,
  },
  analyzingContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
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
  instructionChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  flashlightButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    maxWidth: width * 0.92,
  },
  scanningText: {
    color: colors.white,
    ...typography.body,
    fontWeight: '500',
    textAlign: 'center',
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

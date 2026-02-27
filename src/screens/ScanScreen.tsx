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
import { SUBMISSION_DISABLE_PAID_APIS } from '../config/submissionConfig';
import { onProductSaved } from '../services/localNotificationService';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

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

      // Barcode lookup disabled for academic submission to avoid API costs; re-enable for production.
      if (SUBMISSION_DISABLE_PAID_APIS) {
        showToast('Add product details manually (barcode lookup disabled for submission).', 'info');
        navigation.getParent()?.navigate('AddProduct' as never, {
          barcode: barcodeValue,
          scanNotFound: true,
        });
        setScanned(false);
        processingScanRef.current = false;
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

    try {
      setIsAnalyzing(true);

      let photo: { uri: string } | null = null;
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

      // AI analysis disabled for academic submission to avoid API costs; re-enable for production.
      if (SUBMISSION_DISABLE_PAID_APIS) {
        setIsScanning(false);
        setIsAnalyzing(false);
        setScanned(false);
        showToast('Add product details manually (AI analysis disabled for submission).', 'info');
        navigation.getParent()?.navigate('AddProduct' as never, {
          photoUri: photo.uri,
          scanNotFound: true,
        });
        return;
      }

      showToast('Capturing and analyzing image...', 'info');
      const analysisResult = await analyzeProductImage(photo.uri, knownFieldsRef.current);

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
          photoUri: photo.uri,
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
          <ActivityIndicator size="large" color="#10b981" />
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
          <Ionicons name="camera-outline" size={64} color="#9ca3af" />
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
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
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
          <ActivityIndicator size="large" color="#ffffff" />
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
                  color="#ffffff"
                />
              </TouchableOpacity>

              {/* Scanning area with corner guides */}
              <View style={styles.scanArea}>
                {/* Top-left corner */}
                <View style={[styles.corner, styles.topLeft]} />
                {/* Top-right corner */}
                <View style={[styles.corner, styles.topRight]} />
                {/* Bottom-left corner */}
                <View style={[styles.corner, styles.bottomLeft]} />
                {/* Bottom-right corner */}
                <View style={[styles.corner, styles.bottomRight]} />
                
                {/* Center dot with crosshair */}
                <View style={styles.centerDot} />
                <View style={[styles.crosshair, styles.crosshairHorizontal]} />
                <View style={[styles.crosshair, styles.crosshairVertical]} />
              </View>

              {/* Scanning indicator */}
              {!scanned && scanMode === 'barcode' && (
                <View style={styles.scanningIndicator}>
                  <Text style={styles.scanningText}>Position barcode within the frame</Text>
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
                      ? 'Position product label in frame and tap to capture'
                      : 'Waiting for camera...'}
                  </Text>
                </View>
              )}

              {/* AI Analyzing indicator */}
              {isAnalyzing && (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.analyzingText}>Analyzing product...</Text>
                </View>
              )}
            </View>
          </CameraView>
        ) : (
          <View style={styles.placeholderView}>
            <Ionicons name="camera-outline" size={80} color="#d1d5db" />
            <Text style={styles.placeholderText}>Ready to scan</Text>
            <Text style={styles.placeholderSubtext}>
              Tap the button below to start scanning
            </Text>
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
              color={scanMode === 'barcode' ? '#ffffff' : '#6b7280'}
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
                scanMode === 'ai' ? '#ffffff' : !aiModeAvailable ? '#d1d5db' : '#6b7280'
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
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons
                name={scanMode === 'ai' ? 'camera' : 'search'}
                size={24}
                color="#ffffff"
              />
              <Text style={styles.scanButtonText}>
                {scanMode === 'ai' ? 'Start AI Capture' : 'Scan Barcode'}
              </Text>
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
    backgroundColor: '#ffffff',
  },
  demoBadge: {
    backgroundColor: '#10b981',
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'center',
    borderRadius: 8,
    marginTop: 8,
  },
  demoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  thinkingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  thinkingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  manualEntryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  manualEntryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  placeholderView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholderSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#10b981',
  },
  modeButtonDisabled: {
    opacity: 0.5,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  modeButtonTextDisabled: {
    color: '#d1d5db',
  },
  aiCaptureContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    alignSelf: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureHintText: {
    marginTop: 12,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  analyzingContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  analyzingText: {
    marginTop: 12,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
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
  flashlightButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10b981',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  centerDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    transform: [{ translateX: -4 }, { translateY: -4 }],
    zIndex: 2,
  },
  crosshair: {
    position: 'absolute',
    backgroundColor: '#10b981',
  },
  crosshairHorizontal: {
    top: '50%',
    left: '20%',
    width: '60%',
    height: 2,
    transform: [{ translateY: -1 }],
  },
  crosshairVertical: {
    left: '50%',
    top: '20%',
    height: '60%',
    width: 2,
    transform: [{ translateX: -1 }],
  },
  scanningIndicator: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanningText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#ffffff',
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  manualEntryLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  manualEntryText: {
    fontSize: 14,
    color: '#6b7280',
  },
  manualEntryLinkText: {
    color: '#10b981',
    fontWeight: '600',
  },
});

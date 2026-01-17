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

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

// Vibration pattern for successful scan
const VIBRATION_PATTERN = 100;

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [flashlightEnabled, setFlashlightEnabled] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const cameraRef = useRef<any>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    // Check if camera is available
    if (permission?.granted) {
      // Camera is available when permission is granted
      setCameraAvailable(true);
    }
  }, [permission]);

  // Cleanup when component unmounts or when leaving scanning mode
  useEffect(() => {
    return () => {
      // Reset states when component unmounts
      setScanned(false);
      setIsScanning(false);
    };
  }, []);

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (scanned) return;
    
    try {
      // Stop scanning immediately to prevent multiple scans
      setScanned(true);
      
      // Extract barcode value
      const barcodeValue = data;
      
      if (!barcodeValue || !barcodeValue.trim()) {
        setScanned(false);
        return;
      }
      
      // Vibrate on successful scan
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          Vibration.vibrate(VIBRATION_PATTERN);
        } catch (vibrationError) {
          // Silently handle vibration errors
        }
      }
      
      // Stop camera immediately before navigation
      setIsScanning(false);
      
      // Small delay to ensure camera is fully stopped
      setTimeout(() => {
        // Show success toast
        showToast(`Barcode scanned: ${barcodeValue}`, 'success');
        
        // Navigate to AddProductScreen with barcode
        navigation.navigate('AddProduct', { barcode: barcodeValue });
        setScanned(false);
      }, 300);
    } catch (error) {
      // Handle any errors during barcode scanning
      setScanned(false);
      setIsScanning(false);
      showToast('Error scanning barcode. Please try again.', 'error');
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
        'Please grant camera permission to scan barcodes.',
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

    setIsScanning(true);
    setScanned(false);
  };

  const handleManualEntry = () => {
    // Navigate to AddProductScreen with empty barcode field
    navigation.navigate('AddProduct');
  };

  const toggleFlashlight = () => {
    if (cameraRef.current) {
      setFlashlightEnabled(!flashlightEnabled);
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
      <View style={styles.cameraContainer}>
        {isScanning && permission?.granted && cameraAvailable ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            enableTorch={flashlightEnabled}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
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
            }}
            onMountError={(error) => {
              // Handle camera mount errors
              setIsScanning(false);
              setCameraAvailable(false);
              showToast('Camera initialization failed. Please try again.', 'error');
            }}
            onCameraReady={() => {
              // Camera is ready - no action needed, but this helps ensure proper initialization
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
              {!scanned && (
                <View style={styles.scanningIndicator}>
                  <Text style={styles.scanningText}>Position barcode within the frame</Text>
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
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanPress}
          activeOpacity={0.8}
          testID="scan-barcode-button"
        >
          <Ionicons name="search" size={24} color="#ffffff" />
          <Text style={styles.scanButtonText}>Scan Barcode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualEntryLink}
          onPress={handleManualEntry}
          testID="manual-entry-link"
        >
          <Text style={styles.manualEntryText}>
            Having trouble scanning? <Text style={styles.manualEntryLinkText}>Manual Entry</Text>
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

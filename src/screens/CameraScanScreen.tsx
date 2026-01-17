import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

export default function CameraScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (scanned) return;
    
    setScanned(true);
    setIsScanning(false);
    
    // Handle scanned barcode
    Alert.alert(
      'Barcode Scanned',
      `Type: ${type}\nData: ${data}`,
      [
        {
          text: 'Scan Again',
          onPress: () => {
            setScanned(false);
            setIsScanning(true);
          },
        },
        {
          text: 'Continue',
          onPress: () => {
            // TODO: Navigate to product entry screen with barcode data
            // navigation.navigate('AddProduct', { barcode: data });
            // Barcode scanned successfully
            setScanned(false);
          },
        },
      ]
    );
  };

  const handleScanPress = () => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    setIsScanning(true);
    setScanned(false);
  };

  const handleManualEntry = () => {
    // TODO: Navigate to manual entry screen
    // navigation.navigate('AddProduct');
    Alert.alert('Manual Entry', 'Navigate to manual entry form');
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#9ca3af" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to scan product barcodes.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            testID="request-permission-button"
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.cameraContainer}>
        {isScanning ? (
          <CameraView
            style={styles.camera}
            facing={CameraType.back}
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
          >
            <View style={styles.overlay}>
              {/* Scanning area with corner brackets */}
              <View style={styles.scanArea}>
                {/* Top-left corner */}
                <View style={[styles.corner, styles.topLeft]} />
                {/* Top-right corner */}
                <View style={[styles.corner, styles.topRight]} />
                {/* Bottom-left corner */}
                <View style={[styles.corner, styles.bottomLeft]} />
                {/* Bottom-right corner */}
                <View style={[styles.corner, styles.bottomRight]} />
                {/* Center dot */}
                <View style={styles.centerDot} />
              </View>
            </View>
          </CameraView>
        ) : (
          <View style={styles.placeholderView}>
            <Ionicons name="camera-outline" size={80} color="#d1d5db" />
            <Text style={styles.placeholderText}>Ready to scan</Text>
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
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
    fontSize: 16,
    color: '#9ca3af',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
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

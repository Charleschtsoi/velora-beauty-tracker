import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface PhotoUploaderProps {
  photoUri?: string;
  onPhotoSelected: (uri: string) => void;
  onPhotoRemoved?: () => void;
  testID?: string;
}

export default function PhotoUploader({
  photoUri,
  onPhotoSelected,
  onPhotoRemoved,
  testID,
}: PhotoUploaderProps) {
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to upload product images.'
      );
      return false;
    }
    return true;
  };

  const handlePickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your camera to take product photos.'
      );
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handlePickImage },
      ]
    );
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (onPhotoRemoved) {
              onPhotoRemoved();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>Product Photo</Text>
      <View style={styles.photoContainer}>
        {photoUri ? (
          <View style={styles.photoWrapper}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemovePhoto}
              testID="remove-photo-button"
            >
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleShowOptions}
            activeOpacity={0.7}
            disabled={loading}
            testID="add-photo-button"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#10b981" />
            ) : (
              <>
                <Ionicons name="add" size={32} color="#9ca3af" />
                <Text style={styles.uploadText}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  photoContainer: {
    alignItems: 'flex-start',
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  uploadButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});

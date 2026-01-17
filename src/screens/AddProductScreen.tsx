import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import { ProductCategory } from '../types/product.types';
import PhotoUploader from '../components/common/PhotoUploader';
import DatePickerField from '../components/common/DatePickerField';
import DropdownSelect from '../components/common/DropdownSelect';
import { showToast } from '../utils/toast';

// Navigation types - matching AppNavigator
type RootStackParamList = {
  MainTabs: undefined;
  AddProduct: { barcode?: string } | undefined;
};

type AddProductRouteProp = RouteProp<RootStackParamList, 'AddProduct'>;

// Category options
const categoryOptions = [
  { label: 'Skincare', value: ProductCategory.SKINCARE },
  { label: 'Makeup', value: ProductCategory.MAKEUP },
  { label: 'Haircare', value: ProductCategory.HAIRCARE },
  { label: 'Fragrance', value: ProductCategory.FRAGRANCE },
  { label: 'Bodycare', value: ProductCategory.BODYCARE },
  { label: 'Nailcare', value: ProductCategory.NAILCARE },
  { label: 'Other', value: ProductCategory.OTHER },
];

export default function AddProductScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<AddProductRouteProp>();
  const { addProduct } = useProducts();

  // Form state
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<ProductCategory>(ProductCategory.SKINCARE);
  const [barcode, setBarcode] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Pre-fill barcode from route params
  useEffect(() => {
    if (route.params?.barcode) {
      setBarcode(route.params.barcode);
    }
  }, [route.params]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    if (!expirationDate) {
      newErrors.expirationDate = 'Expiration date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      await addProduct({
        name: productName.trim(),
        category,
        barcode: barcode.trim() || undefined,
        expirationDate: expirationDate!,
        purchaseDate,
        photoUrl: photoUri,
        notes: notes.trim() || undefined,
        usageCount: quantity,
        userId: 'demo-user',
      });

      showToast('Product added successfully!', 'success');
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Failed to save product. Please try again.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityIncrease = () => {
    setQuantity(quantity + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
        <TouchableOpacity
          style={styles.headerButton}
          testID="menu-button"
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Uploader */}
        <View style={styles.photoSection}>
          <PhotoUploader
            photoUri={photoUri}
            onPhotoSelected={setPhotoUri}
            onPhotoRemoved={() => setPhotoUri(undefined)}
            testID="photo-uploader"
          />
        </View>

        {/* Product Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Product Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.productName && styles.inputError]}
            value={productName}
            onChangeText={(text) => {
              setProductName(text);
              if (errors.productName) {
                setErrors({ ...errors, productName: '' });
              }
            }}
            placeholder="Enter product name"
            placeholderTextColor="#9ca3af"
            testID="product-name-input"
          />
          {errors.productName && (
            <Text style={styles.errorText}>{errors.productName}</Text>
          )}
        </View>

        {/* Category */}
        <DropdownSelect
          label="Category"
          options={categoryOptions}
          value={category}
          onValueChange={(value) => setCategory(value as ProductCategory)}
          placeholder="Select category"
          testID="category-dropdown"
        />

        {/* Barcode */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Barcode</Text>
          <View style={styles.barcodeContainer}>
            <TextInput
              style={[styles.input, styles.barcodeInput, barcode && styles.readOnly]}
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Enter or scan barcode"
              placeholderTextColor="#9ca3af"
              editable={!route.params?.barcode}
              testID="barcode-input"
            />
            {route.params?.barcode && (
              <Ionicons name="barcode-outline" size={20} color="#10b981" style={styles.barcodeIcon} />
            )}
          </View>
        </View>

        {/* Expiration Date */}
        <DatePickerField
          label="Expiration Date"
          value={expirationDate}
          onDateChange={setExpirationDate}
          placeholder="Select expiration date"
          required
          highlighted
          testID="expiration-date-picker"
          minimumDate={new Date()}
        />
        {errors.expirationDate && (
          <Text style={styles.errorText}>{errors.expirationDate}</Text>
        )}

        {/* Purchase Date */}
        <DatePickerField
          label="Purchase Date"
          value={purchaseDate}
          onDateChange={setPurchaseDate}
          placeholder="Select purchase date"
          testID="purchase-date-picker"
          maximumDate={new Date()}
        />

        {/* Quantity */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Quantity</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleQuantityDecrease}
              disabled={quantity <= 1}
              testID="quantity-decrease-button"
            >
              <Ionicons
                name="remove"
                size={20}
                color={quantity <= 1 ? '#d1d5db' : '#1f2937'}
              />
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleQuantityIncrease}
              testID="quantity-increase-button"
            >
              <Ionicons name="add" size={20} color="#1f2937" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional notes..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            testID="notes-input"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
          testID="save-button"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save Product</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  photoSection: {
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 48,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  readOnly: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  barcodeInput: {
    flex: 1,
    paddingRight: 40,
  },
  barcodeIcon: {
    position: 'absolute',
    right: 12,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  quantityValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

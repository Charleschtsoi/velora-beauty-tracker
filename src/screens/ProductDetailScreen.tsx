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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import { Product, ProductCategory } from '../types/product.types';
import { getExpirationStatus, formatDate, getDaysUntilExpiration } from '../utils/dateHelpers';
import { ExpirationStatus } from '../types/product.types';
import PhotoUploader from '../components/common/PhotoUploader';
import DatePickerField from '../components/common/DatePickerField';
import DropdownSelect from '../components/common/DropdownSelect';
import { showToast } from '../utils/toast';
import { onProductUpdated, cancelExpiryReminder, cancelPAOReminder } from '../services/localNotificationService';
import { colors, typography } from '../theme';

// Navigation types
type RootStackParamList = {
  MainTabs: undefined;
  AddProduct: { barcode?: string } | undefined;
  ProductDetail: { productId: string };
};

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

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

const getStatusConfig = (status: ExpirationStatus, daysUntil: number) => {
  switch (status) {
    case ExpirationStatus.EXPIRED:
      return {
        text: 'EXPIRED',
        color: colors.statusExpired,
        bgColor: colors.statusExpiredBg,
        description: 'This product has expired',
      };
    case ExpirationStatus.EXPIRING_SOON:
      if (daysUntil === 0) {
        return {
          text: 'EXPIRES TODAY',
          color: colors.statusExpiringSoon,
          bgColor: colors.statusExpiringSoonBg,
          description: 'Expires today!',
        };
      }
      return {
        text: 'EXPIRING SOON',
        color: colors.statusExpiringSoon,
        bgColor: colors.statusExpiringSoonBg,
        description: `Expires in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
      };
    case ExpirationStatus.WARNING:
      return {
        text: 'WARNING',
        color: colors.statusWarning,
        bgColor: colors.statusWarningBg,
        description: `Expires in ${daysUntil} days`,
      };
    case ExpirationStatus.SAFE:
      return {
        text: 'SAFE',
        color: colors.statusSafe,
        bgColor: colors.statusSafeBg,
        description: `Expires in ${daysUntil} days`,
      };
    default:
      return {
        text: 'UNKNOWN',
        color: colors.statusMuted,
        bgColor: colors.statusMutedBg,
        description: 'Status unknown',
      };
  }
};

export default function ProductDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<ProductDetailRouteProp>();
  const { products, updateProduct, deleteProduct } = useProducts();

  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Find product
  const product = products.find((p) => p.id === route.params.productId);

  // Form state (for edit mode)
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ProductCategory>(ProductCategory.SKINCARE);
  const [barcode, setBarcode] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Initialize form state when product loads or edit mode is enabled
  useEffect(() => {
    if (product) {
      setProductName(product.name);
      setBrand(product.brand || '');
      setCategory(product.category);
      setBarcode(product.barcode || '');
      setPhotoUri(product.photoUrl);
      setExpirationDate(product.expirationDate);
      setPurchaseDate(product.purchaseDate);
      setQuantity(product.usageCount || 1);
      setNotes(product.notes || '');
    }
  }, [product, isEditMode]);

  if (!product) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = getExpirationStatus(product.expirationDate);
  const daysUntil = getDaysUntilExpiration(product.expirationDate);
  const statusConfig = getStatusConfig(status, daysUntil);

  const handleSave = async () => {
    if (!productName.trim()) {
      Alert.alert('Validation Error', 'Product name is required.');
      return;
    }

    if (!expirationDate) {
      Alert.alert('Validation Error', 'Expiration date is required.');
      return;
    }

    setSaving(true);
    try {
      const updates = {
        name: productName.trim(),
        brand: brand.trim() || undefined,
        category,
        barcode: barcode.trim() || undefined,
        photoUrl: photoUri,
        expirationDate,
        purchaseDate,
        usageCount: quantity,
        notes: notes.trim() || undefined,
        openedDate: product.openedDate,
        paoMonths: product.paoMonths,
      };
      await updateProduct(product.id, updates);

      // Update expiry reminder so it reflects the new date (e.g. if now safe, reminder moves)
      const updatedProduct: Product = {
        ...product,
        ...updates,
        expirationDate: expirationDate!,
        updatedAt: new Date(),
      };
      await onProductUpdated(updatedProduct);

      showToast('Product updated successfully!', 'success');
      setIsEditMode(false);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Failed to update product. Please try again.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelExpiryReminder(product.id);
              await cancelPAOReminder(product.id);
              await deleteProduct(product.id);
              showToast('Product deleted successfully!', 'success');
              setTimeout(() => navigation.goBack(), 500);
            } catch (error) {
              showToast('Failed to delete product. Please try again.', 'error');
            }
          },
        },
      ]
    );
  };

  const handleMarkAsUsed = () => {
    const currentQuantity = product.usageCount || 1;
    if (currentQuantity <= 1) {
      showToast('Quantity is already at minimum (1)', 'info');
      return;
    }

    Alert.alert(
      'Mark as Used',
      'Decrement quantity by 1?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateProduct(product.id, {
                usageCount: Math.max(1, currentQuantity - 1),
              });
              showToast('Quantity updated', 'success');
            } catch (error) {
              showToast('Failed to update quantity. Please try again.', 'error');
            }
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Product' : 'Product Details'}
        </Text>
        <View style={styles.headerRight}>
          {!isEditMode && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsEditMode(true)}
              testID="edit-button"
            >
              <Ionicons name="create-outline" size={24} color="#10b981" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge (View Mode Only) */}
        {!isEditMode && (
          <View
            style={[styles.statusBadgeContainer, { backgroundColor: statusConfig.bgColor }]}
          >
            <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
            <Text style={styles.statusDescription}>{statusConfig.description}</Text>
          </View>
        )}

        {/* Photo */}
        {isEditMode ? (
          <View style={styles.photoSection}>
            <PhotoUploader
              photoUri={photoUri}
              onPhotoSelected={setPhotoUri}
              onPhotoRemoved={() => setPhotoUri(undefined)}
              testID="photo-uploader"
            />
          </View>
        ) : (
          <View style={styles.photoDisplayContainer}>
            {product.photoUrl ? (
              <Image source={{ uri: product.photoUrl }} style={styles.photoDisplay} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="cube-outline" size={64} color="#d1d5db" />
              </View>
            )}
          </View>
        )}

        {/* Product Name */}
        {isEditMode ? (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Product Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="Enter product name"
              placeholderTextColor="#9ca3af"
              testID="product-name-input"
            />
          </View>
        ) : (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Product Name</Text>
            <Text style={styles.value}>{product.name}</Text>
          </View>
        )}

        {/* Brand */}
        {isEditMode ? (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Brand</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. CeraVe, The Ordinary"
              placeholderTextColor="#9ca3af"
              testID="brand-input"
            />
          </View>
        ) : (
          product.brand ? (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Brand</Text>
              <Text style={styles.value}>{product.brand}</Text>
            </View>
          ) : null
        )}

        {/* Category */}
        {isEditMode ? (
          <DropdownSelect
            label="Category"
            options={categoryOptions}
            value={category}
            onValueChange={(value) => setCategory(value as ProductCategory)}
            placeholder="Select category"
            testID="category-dropdown"
          />
        ) : (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.value}>
              {categoryOptions.find((opt) => opt.value === product.category)?.label ||
                product.category}
            </Text>
          </View>
        )}

        {/* Barcode */}
        {isEditMode ? (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Barcode</Text>
            <TextInput
              style={styles.input}
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Enter barcode"
              placeholderTextColor="#9ca3af"
              testID="barcode-input"
            />
          </View>
        ) : (
          product.barcode && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Barcode</Text>
              <Text style={styles.value}>{product.barcode}</Text>
            </View>
          )
        )}

        {/* Expiration Date */}
        {isEditMode ? (
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
        ) : (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Expiration Date</Text>
            <Text style={styles.value}>{formatDate(product.expirationDate)}</Text>
            <Text style={styles.daysUntil}>
              {daysUntil < 0
                ? `Expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago`
                : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} until expiration`}
            </Text>
          </View>
        )}

        {/* Purchase Date */}
        {isEditMode ? (
          <DatePickerField
            label="Purchase Date"
            value={purchaseDate}
            onDateChange={setPurchaseDate}
            placeholder="Select purchase date"
            testID="purchase-date-picker"
            maximumDate={new Date()}
          />
        ) : (
          product.purchaseDate && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Purchase Date</Text>
              <Text style={styles.value}>{formatDate(product.purchaseDate)}</Text>
            </View>
          )
        )}

        {/* Quantity */}
        {isEditMode ? (
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
        ) : (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Quantity</Text>
            <Text style={styles.value}>{product.usageCount || 1}</Text>
          </View>
        )}

        {/* Notes */}
        {isEditMode ? (
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
        ) : (
          product.notes && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{product.notes}</Text>
            </View>
          )
        )}

        {/* Action Buttons */}
        {isEditMode ? (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setIsEditMode(false);
                // Reset form to original values
                if (product) {
                  setProductName(product.name);
                  setBrand(product.brand || '');
                  setCategory(product.category);
                  setBarcode(product.barcode || '');
                  setPhotoUri(product.photoUrl);
                  setExpirationDate(product.expirationDate);
                  setPurchaseDate(product.purchaseDate);
                  setQuantity(product.usageCount || 1);
                  setNotes(product.notes || '');
                }
              }}
              testID="cancel-button"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              testID="save-button"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.markUsedButton]}
              onPress={handleMarkAsUsed}
              testID="mark-used-button"
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={styles.markUsedButtonText}>Mark as Used</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              testID="delete-button"
            >
              <Ionicons name="trash-outline" size={20} color="#ffffff" />
              <Text style={styles.deleteButtonText}>Delete Product</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    ...typography.modalHeader,
    color: '#1f2937',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusBadgeContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadgeText: {
    fontSize: 24,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  photoSection: {
    marginBottom: 16,
  },
  photoDisplayContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoDisplay: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f3f4f6',
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
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
  value: {
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  daysUntil: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
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
  actionButtonsContainer: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#10b981',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  markUsedButton: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  markUsedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

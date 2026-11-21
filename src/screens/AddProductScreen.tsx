import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import { ProductCategory } from '../types/product.types';
import { showcaseCopy } from '../copy/showcaseCopy';
import PhotoUploader from '../components/common/PhotoUploader';
import DatePickerField from '../components/common/DatePickerField';
import DropdownSelect from '../components/common/DropdownSelect';
import { showToast } from '../utils/toast';
import type { AIFieldMap, AIFieldKey } from '../services/aiService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { onProductSaved } from '../services/localNotificationService';
import { typography } from '../theme';
import {
  buildReviewSummary,
  confidenceBandLabel,
  fieldNeedsReview,
  getConfidenceBand,
} from '../utils/fieldConfidence';
import { parsePriceInput, validateAddProductForm } from '../utils/addProductValidation';
import { toUserFacingSaveError } from '../utils/userFacingErrors';

type AddProductRouteProp = RouteProp<RootStackParamList, 'AddProduct'>;

// Helper function to map AI category to ProductCategory enum
const mapAICategoryToEnum = (aiCategory?: string): ProductCategory => {
  if (!aiCategory) return ProductCategory.SKINCARE;

  const normalized = aiCategory.toLowerCase().trim();
  switch (normalized) {
    case 'skincare':
      return ProductCategory.SKINCARE;
    case 'makeup':
      return ProductCategory.MAKEUP;
    case 'haircare':
    case 'hair care':
      return ProductCategory.HAIRCARE;
    case 'fragrance':
      return ProductCategory.FRAGRANCE;
    case 'bodycare':
    case 'body care':
      return ProductCategory.BODYCARE;
    case 'nailcare':
    case 'nail care':
      return ProductCategory.NAILCARE;
    default:
      return ProductCategory.OTHER;
  }
};

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

type FieldSourceInfo = { source: string; confidence: number | null } | null;

const initialFieldSources: Record<AIFieldKey, FieldSourceInfo> = {
  name: null,
  brand: null,
  category: null,
  packagingColor: null,
  expirationDate: null,
  ingredients: null,
  notes: null,
};

type AddProductNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddProduct'>;

export default function AddProductScreen() {
  const navigation = useNavigation<AddProductNavigationProp>();
  const route = useRoute<AddProductRouteProp>();
  const { addProduct } = useProducts();
  const scrollRef = useRef<ScrollView>(null);
  const nameFieldY = useRef(0);
  const expiryFieldY = useRef(0);
  const priceFieldY = useRef(0);
  const prefillsAppliedRef = useRef(false);

  // Form state
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ProductCategory>(ProductCategory.SKINCARE);
  const [barcode, setBarcode] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>();
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [fieldSources, setFieldSources] = useState<Record<AIFieldKey, FieldSourceInfo>>(initialFieldSources);
  const [showScanNotFoundBanner, setShowScanNotFoundBanner] = useState(Boolean(route.params?.scanNotFound));
  const [cameFromScan, setCameFromScan] = useState(false);

  const mergeNotes = useCallback((incoming: string | null) => {
    if (!incoming) return;
    setNotes((prev) => {
      if (!prev) return incoming;
      if (prev.includes(incoming)) return prev;
      return `${incoming}\n\n${prev}`;
    });
  }, []);

  const applyIncomingFields = useCallback(
    (fields: Partial<AIFieldMap> | undefined, sourceLabel: string) => {
      if (!fields) return;
      const updates: Partial<Record<AIFieldKey, FieldSourceInfo>> = {};

      const assignSource = (key: AIFieldKey, value: string | null, confidence: number | null) => {
        if (!value) return;
        updates[key] = { source: sourceLabel, confidence };
        switch (key) {
          case 'name':
            setProductName(value);
            break;
          case 'brand':
            setBrand(value);
            break;
          case 'category':
            setCategory(mapAICategoryToEnum(value));
            break;
          case 'packagingColor':
            // Demo resolver uses this signal; no dedicated form field is needed.
            break;
          case 'expirationDate':
            try {
              const parsed = new Date(value);
              if (!isNaN(parsed.getTime())) {
                setExpirationDate(parsed);
              }
            } catch {
              // Ignore parse errors
            }
            break;
          case 'ingredients':
            mergeNotes(`Ingredients: ${value}`);
            break;
          case 'notes':
            mergeNotes(value);
            break;
          default:
            break;
        }
      };

      (Object.keys(fields) as AIFieldKey[]).forEach((key) => {
        const entry = fields[key];
        if (entry && typeof entry === 'object' && 'value' in entry) {
          assignSource(key, entry.value ?? null, entry.confidence ?? null);
        }
      });

      if (Object.keys(updates).length > 0) {
        setFieldSources((prev) => ({ ...prev, ...updates }));
      }
    },
    [mergeNotes],
  );

  const applyRouteParams = useCallback(() => {
    const params = route.params;
    if (!params) return;

    const fromScan = Boolean(
      params.aiData || params.upcData || params.aiFlatData || params.barcode || params.scanNotFound || params.photoUri,
    );
    if (fromScan) {
      setCameFromScan(true);
    }

    if (params.scanNotFound) {
      setShowScanNotFoundBanner(true);
    }

    if (params.barcode) {
      setBarcode(params.barcode);
    }

    if (params.photoUri) {
      setPhotoUri(params.photoUri);
    }

    if (params.upcData) {
      applyIncomingFields(params.upcData, 'Barcode lookup');
    }

    if (params.aiData) {
      applyIncomingFields(params.aiData, 'AI photo');
    }

    if (params.aiFlatData) {
      const flatAsMap: Partial<AIFieldMap> = {};
      (Object.keys(params.aiFlatData) as AIFieldKey[]).forEach((key) => {
        const value = params.aiFlatData?.[key];
        if (value) {
          flatAsMap[key] = { value, confidence: null, source: 'AI photo' };
        }
      });
      applyIncomingFields(flatAsMap, 'AI photo');
    }
  }, [route.params, applyIncomingFields]);

  // Apply scan prefills once so returning to this screen does not overwrite edits.
  useEffect(() => {
    if (prefillsAppliedRef.current) return;
    prefillsAppliedRef.current = true;
    applyRouteParams();
  }, [applyRouteParams]);

  const reviewSummary = useMemo(() => {
    if (!cameFromScan) return null;
    return buildReviewSummary([
      {
        key: 'name',
        label: 'Product name',
        hasValue: Boolean(productName.trim()),
        confidence: fieldSources.name?.confidence,
      },
      {
        key: 'brand',
        label: 'Brand',
        hasValue: Boolean(brand.trim()),
        confidence: fieldSources.brand?.confidence,
      },
      {
        key: 'category',
        label: 'Category',
        hasValue: Boolean(fieldSources.category),
        confidence: fieldSources.category?.confidence,
      },
      {
        key: 'expirationDate',
        label: 'Expiration date',
        hasValue: Boolean(expirationDate),
        confidence: fieldSources.expirationDate?.confidence,
      },
    ]);
  }, [cameFromScan, productName, brand, expirationDate, fieldSources]);

  const isUncertain = (field: AIFieldKey): boolean => {
    const info = fieldSources[field];
    if (!info || info.source === 'Manual') return false;
    return fieldNeedsReview(info.confidence);
  };

  const renderSourceTag = (field: AIFieldKey) => {
    const info = fieldSources[field];
    if (!info) return null;
    const band = getConfidenceBand(info.confidence);
    const needsCheck = info.source !== 'Manual' && fieldNeedsReview(info.confidence);
    return (
      <Text
        style={[styles.sourceTag, needsCheck && styles.sourceTagLow]}
        testID={`source-tag-${field}`}
      >
        {info.source === 'Manual'
          ? 'Edited manually'
          : `${info.source} · ${confidenceBandLabel(band)}`}
      </Text>
    );
  };

  const scrollToFirstError = (nextErrors: { [key: string]: string }) => {
    const y =
      nextErrors.productName
        ? nameFieldY.current
        : nextErrors.expirationDate
          ? expiryFieldY.current
          : nextErrors.price
            ? priceFieldY.current
            : 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
  };

  const validateForm = (): boolean => {
    const result = validateAddProductForm({
      productName,
      expirationDate,
      price,
    });
    setErrors(result.errors);
    if (!result.valid) {
      Alert.alert('Almost ready', result.alertMessage ?? 'Please fix the highlighted fields.');
      scrollToFirstError(result.errors);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const newProduct = await addProduct({
        name: productName.trim(),
        brand: brand.trim() || undefined,
        category,
        barcode: barcode.trim() || undefined,
        expirationDate: expirationDate!,
        purchaseDate,
        price: parsePriceInput(price),
        photoUrl: photoUri,
        notes: notes.trim() || undefined,
        usageCount: quantity,
      });
      if (!newProduct?.id) {
        throw new Error('Product was not created');
      }
      await onProductSaved(newProduct);
      showToast('Product added successfully!', 'success');
      navigation.replace('ProductDetail', { productId: newProduct.id });
    } catch (error) {
      showToast(toUserFacingSaveError(error), 'error');
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

  const markManual = (key: AIFieldKey, hasValue: boolean) => {
    setFieldSources((prev) => ({
      ...prev,
      [key]: hasValue ? { source: 'Manual', confidence: null } : prev[key],
    }));
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
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Value copy: set expectation for reminders */}
        <View style={styles.reminderBanner}>
          <Text style={styles.reminderBannerText}>
            We'll remind you before it expires.
          </Text>
        </View>

        {/* Product not in catalog — collaborative reminder */}
        {showScanNotFoundBanner && (
          <View style={styles.scanNotFoundBanner}>
            <Ionicons name="information-circle" size={20} color="#059669" />
            <Text style={styles.scanNotFoundBannerText}>
              {showcaseCopy.scanNotFoundBanner}
            </Text>
            <TouchableOpacity
              onPress={() => setShowScanNotFoundBanner(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.scanNotFoundDismiss}
            >
              <Ionicons name="close" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Honest review summary for scan / AI prefills */}
        {reviewSummary && (
          <View
            style={[
              styles.reviewSummary,
              reviewSummary.needsReviewCount > 0 || reviewSummary.missingCritical.length > 0
                ? styles.reviewSummaryCaution
                : styles.reviewSummaryCalm,
            ]}
            testID="review-summary"
          >
            <Ionicons
              name={reviewSummary.needsReviewCount > 0 ? 'alert-circle' : 'checkmark-circle'}
              size={22}
              color={reviewSummary.needsReviewCount > 0 ? '#b45309' : '#047857'}
            />
            <View style={styles.reviewSummaryCopy}>
              <Text style={styles.reviewSummaryHeadline}>{reviewSummary.headline}</Text>
              <Text style={styles.reviewSummaryDetail}>{reviewSummary.detail}</Text>
              <Text style={styles.reviewSummaryMeta}>
                {reviewSummary.filledCount} pre-filled
                {reviewSummary.needsReviewCount > 0
                  ? ` · ${reviewSummary.needsReviewCount} to double-check`
                  : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Barcode Data Indicator */}
        {route.params?.upcData && !reviewSummary && (
          <View style={styles.barcodeIndicator}>
            <Ionicons name="barcode-outline" size={20} color="#2563eb" />
            <Text style={styles.barcodeIndicatorText}>
              Barcode lookup pre-filled available fields.
            </Text>
          </View>
        )}

        {/* AI Data Indicator (shown only when review summary is not) */}
        {route.params?.aiData && !reviewSummary && (
          <View style={styles.aiIndicator}>
            <Ionicons name="sparkles" size={20} color="#10b981" />
            <Text style={styles.aiIndicatorText}>
              {showcaseCopy.aiPrefillBanner}
            </Text>
          </View>
        )}

        {/* Photo Uploader */}
        <View style={styles.photoSection}>
          {showScanNotFoundBanner && !photoUri && (
            <Text style={styles.photoHelper}>
              A quick product photo helps you spot it on your shelf later — optional but nice to have.
            </Text>
          )}
          <PhotoUploader
            photoUri={photoUri}
            onPhotoSelected={setPhotoUri}
            onPhotoRemoved={() => setPhotoUri(undefined)}
            testID="photo-uploader"
          />
        </View>

        {/* Product Name */}
        <View
          style={styles.fieldContainer}
          onLayout={(e) => {
            nameFieldY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>
            Product Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              isUncertain('name') && !errors.productName && styles.inputUncertain,
              errors.productName && styles.inputError,
            ]}
            value={productName}
            onChangeText={(text) => {
              setProductName(text);
              if (errors.productName) {
                setErrors({ ...errors, productName: '' });
              }
              markManual('name', Boolean(text));
            }}
            placeholder="Enter product name"
            placeholderTextColor="#9ca3af"
            testID="product-name-input"
          />
          {renderSourceTag('name')}
          {errors.productName && (
            <Text style={styles.errorText}>{errors.productName}</Text>
          )}
        </View>

        {/* Brand (optional) */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Brand</Text>
          <TextInput
            style={[
              styles.input,
              isUncertain('brand') && styles.inputUncertain,
            ]}
            value={brand}
            onChangeText={(text) => {
              setBrand(text);
              markManual('brand', Boolean(text));
            }}
            placeholder="e.g. CeraVe, The Ordinary"
            placeholderTextColor="#9ca3af"
            testID="brand-input"
          />
          {renderSourceTag('brand')}
        </View>

        {/* Category */}
        <DropdownSelect
          label="Category"
          options={categoryOptions}
          value={category}
          onValueChange={(value) => {
            setCategory(value as ProductCategory);
            markManual('category', true);
          }}
          placeholder="Select category"
          testID="category-dropdown"
        />
        {renderSourceTag('category')}

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

        {/* Expiration Date — no minimumDate so AI-extracted past dates remain editable */}
        <View
          onLayout={(e) => {
            expiryFieldY.current = e.nativeEvent.layout.y;
          }}
        >
          <DatePickerField
            label="Expiration Date"
            value={expirationDate}
            onDateChange={(date) => {
              setExpirationDate(date);
              if (errors.expirationDate) {
                setErrors({ ...errors, expirationDate: '' });
              }
              markManual('expirationDate', true);
            }}
            placeholder="Select expiration date"
            required
            highlighted
            error={Boolean(errors.expirationDate)}
            uncertain={isUncertain('expirationDate')}
            testID="expiration-date-picker"
          />
          <Text style={styles.expiryHelper}>We'll remind you 1 day before.</Text>
          {renderSourceTag('expirationDate')}
          {errors.expirationDate && (
            <Text style={styles.errorText}>{errors.expirationDate}</Text>
          )}
        </View>

        {/* Purchase Date */}
        <DatePickerField
          label="Purchase Date"
          value={purchaseDate}
          onDateChange={setPurchaseDate}
          placeholder="Select purchase date"
          testID="purchase-date-picker"
          maximumDate={new Date()}
        />

        {/* Price */}
        <View
          style={styles.fieldContainer}
          onLayout={(e) => {
            priceFieldY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>Price (optional)</Text>
          <TextInput
            style={[styles.input, errors.price && styles.inputError]}
            value={price}
            onChangeText={(text) => {
              setPrice(text);
              if (errors.price) {
                setErrors({ ...errors, price: '' });
              }
            }}
            placeholder="e.g. 68"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
            testID="price-input"
          />
          {errors.price && (
            <Text style={styles.errorText}>{errors.price}</Text>
          )}
        </View>

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
            onChangeText={(text) => {
              setNotes(text);
              markManual('notes', Boolean(text));
            }}
            placeholder="Add any additional notes..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            testID="notes-input"
          />
          {renderSourceTag('ingredients')}
          {renderSourceTag('notes')}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
          testID="save-button"
          accessibilityState={{ busy: saving, disabled: saving }}
        >
          {saving ? (
            <View style={styles.savingRow}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.saveButtonText}>Saving…</Text>
            </View>
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
    ...typography.modalHeader,
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  reminderBanner: {
    backgroundColor: '#ecfdf5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  reminderBannerText: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
  },
  scanNotFoundBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  scanNotFoundBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
    lineHeight: 20,
  },
  scanNotFoundDismiss: {
    padding: 4,
  },
  reviewSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  reviewSummaryCaution: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  reviewSummaryCalm: {
    backgroundColor: '#ecfdf5',
    borderColor: '#6ee7b7',
  },
  reviewSummaryCopy: {
    flex: 1,
    gap: 4,
  },
  reviewSummaryHeadline: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  reviewSummaryDetail: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  reviewSummaryMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  expiryHelper: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  photoSection: {
    marginBottom: 16,
  },
  photoHelper: {
    fontSize: 14,
    color: '#065f46',
    lineHeight: 20,
    marginBottom: 10,
    fontWeight: '500',
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
    backgroundColor: '#fef2f2',
  },
  inputUncertain: {
    borderColor: '#d97706',
    backgroundColor: '#fffbeb',
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
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  aiIndicatorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#065f46',
  },
  barcodeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  barcodeIndicatorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1e3a8a',
  },
  sourceTag: {
    marginTop: 4,
    fontSize: 12,
    color: '#2563eb',
  },
  sourceTagLow: {
    color: '#b45309',
    fontWeight: '600',
  },
});

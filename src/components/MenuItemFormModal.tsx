import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
  Alert,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Switch,
  IconButton,
  HelperText,
  Chip,
  Divider,
} from 'react-native-paper';
import { MenuItem, Customization, CustomizationType } from '../types';
import { ImageEditorModal } from './ImageEditorModal';
import { uploadService } from '../services';
import api from '../config/api';

export interface MenuItemFormValues {
  id?: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string | null;
  isPopular: boolean;
  popularRank?: number | null;
  displayOrder?: number | null;
  allergens: string[];
  customizations: Customization[];
}

interface MenuItemFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  initialValues?: MenuItem | null;
  onSubmit: (values: MenuItemFormValues) => Promise<void>;
  loading?: boolean;
  categoryOptions: string[];
}

const defaultCustomization = (): Customization => ({
  id: `tmp-${Math.random().toString(36).substring(2, 9)}`,
  menuItemId: '',
  name: '',
  type: 'option',
  options: [
    { name: '', price: 0, isDefault: false },
  ],
  allowMultiple: false,
  required: false,
});

export const MenuItemFormModal: React.FC<MenuItemFormModalProps> = ({
  visible,
  onDismiss,
  initialValues,
  onSubmit,
  loading = false,
  categoryOptions,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [imageEditorVisible, setImageEditorVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [popularRank, setPopularRank] = useState('');
  const [displayOrder, setDisplayOrder] = useState('');
  const [allergens, setAllergens] = useState<string>('');
  const [customizations, setCustomizations] = useState<Customization[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(initialValues?.name || '');
      setDescription(initialValues?.description || '');
      setCategory(initialValues?.category || '');
      setPrice(initialValues?.price ? String(initialValues.price) : '0');
      setImageUrl(initialValues?.imageUrl || '');
      setIsPopular(Boolean(initialValues?.isPopular));
      setPopularRank(
        initialValues?.popularRank !== undefined && initialValues?.popularRank !== null
          ? String(initialValues.popularRank)
          : ''
      );
      setDisplayOrder(
        initialValues?.displayOrder !== undefined && initialValues?.displayOrder !== null
          ? String(initialValues.displayOrder)
          : ''
      );
      setAllergens((initialValues?.allergens || []).join(', '));
      setCustomizations(
        initialValues?.customizations?.map((c) => ({
          ...c,
          id: c.id || `tmp-${Math.random().toString(36).substring(2, 9)}`,
        })) || []
      );
      setError(null);
    }
  }, [visible, initialValues]);

  const parsedAllergens = useMemo(
    () =>
      allergens
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    [allergens]
  );

  const handleAddCustomization = () => {
    setCustomizations((prev) => [...prev, defaultCustomization()]);
  };

  const updateCustomization = (id: string, patch: Partial<Customization>) => {
    setCustomizations((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeCustomization = (id: string) => {
    setCustomizations((prev) => prev.filter((c) => c.id !== id));
  };

  const updateOption = (
    customizationId: string,
    index: number,
    key: 'name' | 'price' | 'isDefault',
    value: string | number | boolean
  ) => {
    setCustomizations((prev) =>
      prev.map((c) => {
        if (c.id !== customizationId) return c;
        const options = [...c.options];
        options[index] = { ...options[index], [key]: value };
        return { ...c, options };
      })
    );
  };

  const addOption = (customizationId: string) => {
    setCustomizations((prev) =>
      prev.map((c) =>
        c.id === customizationId
          ? {
              ...c,
              options: [...c.options, { name: '', price: 0, isDefault: false }],
            }
          : c
      )
    );
  };

  const removeOption = (customizationId: string, index: number) => {
    setCustomizations((prev) =>
      prev.map((c) =>
        c.id === customizationId
          ? {
              ...c,
              options: c.options.filter((_, idx) => idx !== index),
            }
          : c
      )
    );
  };

  const handleImageSelect = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            setSelectedImageUri(result);
            setImageEditorVisible(true);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // For mobile, you would use react-native-image-picker or similar
      Alert.alert('Not implemented', 'Image picker for mobile will be implemented');
    }
  };

  const handleImageSave = (url: string) => {
    setImageUrl(url);
    setImageEditorVisible(false);
    setSelectedImageUri(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!category.trim()) {
      setError('Category is required');
      return;
    }
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      setError('Price must be a positive number');
      return;
    }

    const sanitizedCustomizations = customizations
      .filter((c) => c.name.trim())
      .map((c) => ({
        ...c,
        options: c.options
          .filter((o) => o.name.trim())
          .map((o) => ({
            name: o.name,
            price: Number(o.price) || 0,
            isDefault: Boolean(o.isDefault),
          })),
      }))
      .filter((c) => c.options.length > 0);

    await onSubmit({
      id: initialValues?.id,
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price: numericPrice,
      imageUrl: imageUrl?.trim() || null,
      isPopular,
      popularRank: popularRank ? Number(popularRank) : null,
      displayOrder: displayOrder ? Number(displayOrder) : null,
      allergens: parsedAllergens,
      customizations: sanitizedCustomizations,
    });
  };

  const renderCustomization = (customization: Customization) => {
    return (
      <View key={customization.id} style={styles.customizationCard}>
        <View style={styles.customizationHeader}>
          <Text variant="titleMedium">{customization.name || 'New Customization'}</Text>
          <IconButton icon="delete" onPress={() => removeCustomization(customization.id)} />
        </View>

        <TextInput
          label="Customization Name"
          value={customization.name}
          onChangeText={(value) => updateCustomization(customization.id, { name: value })}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Type"
          value={customization.type}
          onChangeText={(value) =>
            updateCustomization(customization.id, {
              type: (value as CustomizationType) || 'option',
            })
          }
          mode="outlined"
          placeholder="option | extra | removal"
          style={styles.input}
        />

        <View style={styles.switchRow}>
          <Text>Allow Multiple</Text>
          <Switch
            value={customization.allowMultiple}
            onValueChange={(val) => updateCustomization(customization.id, { allowMultiple: val })}
          />
        </View>
        <View style={styles.switchRow}>
          <Text>Required</Text>
          <Switch
            value={customization.required}
            onValueChange={(val) => updateCustomization(customization.id, { required: val })}
          />
        </View>

        <Text style={styles.optionLabel}>Options</Text>
        {customization.options.map((option, index) => (
          <View key={`${customization.id}-opt-${index}`} style={styles.optionRow}>
            <View style={styles.optionInputs}>
              <TextInput
                label="Name"
                value={option.name}
                onChangeText={(value) => updateOption(customization.id, index, 'name', value)}
                mode="outlined"
                style={styles.optionInput}
              />
              <TextInput
                label="Price"
                value={String(option.price ?? 0)}
                onChangeText={(value) =>
                  updateOption(customization.id, index, 'price', Number(value) || 0)
                }
                mode="outlined"
                keyboardType="numeric"
                style={styles.optionInput}
              />
            </View>
            <View style={styles.optionControls}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Default</Text>
                <Switch
                  value={Boolean(option.isDefault)}
                  onValueChange={(val) => updateOption(customization.id, index, 'isDefault', val)}
                />
              </View>
              <IconButton
                icon="delete"
                onPress={() => removeOption(customization.id, index)}
                disabled={customization.options.length === 1}
              />
            </View>
          </View>
        ))}

        <Button
          mode="text"
          onPress={() => addOption(customization.id)}
          style={styles.addOptionButton}
        >
          Add Option
        </Button>
        <Divider style={styles.divider} />
      </View>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <ScrollView style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            {initialValues ? 'Edit Menu Item' : 'Add Menu Item'}
          </Text>

          {error && (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          )}

          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            style={styles.input}
          />

          <TextInput
            label="Category"
            value={category}
            onChangeText={setCategory}
            mode="outlined"
            style={styles.input}
            placeholder="e.g. Pizza"
          />
          {categoryOptions.length > 0 ? (
            <View style={styles.categoryChipRow}>
              {categoryOptions.map((option) => (
                <Chip
                  key={option}
                  mode={category === option ? 'flat' : 'outlined'}
                  selected={category === option}
                  onPress={() => setCategory(option)}
                  style={styles.categoryOptionChip}
                >
                  {option}
                </Chip>
              ))}
            </View>
          ) : (
            <HelperText type="info" visible>
              No categories defined yet. Add categories from Branding settings.
            </HelperText>
          )}

          <TextInput
            label="Price"
            value={price}
            onChangeText={setPrice}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.imageSection}>
            <Text variant="bodyMedium" style={styles.imageLabel}>
              Ürün Fotoğrafı
            </Text>
            {imageUrl ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: imageUrl.startsWith('http') ? imageUrl : `${api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000'}${imageUrl}` }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <View style={styles.imageActions}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setImageUrl('');
                    }}
                    icon="delete"
                    compact
                  >
                    Kaldır
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000'}${imageUrl}`;
                      setSelectedImageUri(fullUrl);
                      setImageEditorVisible(true);
                    }}
                    icon="pencil"
                    compact
                  >
                    Düzenle
                  </Button>
                </View>
              </View>
            ) : (
              <Button
                mode="outlined"
                onPress={handleImageSelect}
                icon="image"
                loading={uploadingImage}
                disabled={uploadingImage}
                style={styles.uploadButton}
              >
                Fotoğraf Yükle
              </Button>
            )}
          </View>

          <View style={styles.switchRow}>
            <Text>Mark as Popular</Text>
            <Switch value={isPopular} onValueChange={setIsPopular} />
          </View>

          {isPopular && (
            <TextInput
              label="Popular Rank"
              value={popularRank}
              onChangeText={setPopularRank}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              placeholder="1 = show first"
            />
          )}

          <TextInput
            label="Display Order"
            value={displayOrder}
            onChangeText={setDisplayOrder}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            placeholder="1, 2, 3... (lower = shown first)"
          />
          <HelperText type="info" visible>
            Display Order: Müşterilerin ürünleri hangi sırayla göreceğini belirler. Düşük sayılar önce gösterilir (1, 2, 3...). Boş bırakılırsa alfabetik sıralama kullanılır.
          </HelperText>

          <TextInput
            label="Allergens (comma-separated)"
            value={allergens}
            onChangeText={setAllergens}
            mode="outlined"
            style={styles.input}
            placeholder="e.g. gluten, dairy"
          />
          <View style={styles.chipRow}>
            {parsedAllergens.map((tag) => (
              <Chip key={tag} style={styles.chip}>
                {tag}
              </Chip>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text variant="titleLarge">Customizations</Text>
            <Button mode="text" onPress={handleAddCustomization}>
              Add Customization
            </Button>
          </View>

          {customizations.length === 0 && (
            <Text style={styles.emptyText}>No customizations added yet.</Text>
          )}

          {customizations.map((customization) => renderCustomization(customization))}
        </ScrollView>

        <View style={styles.actions}>
          <Button onPress={onDismiss} style={styles.actionButton} disabled={loading}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.actionButton}
          >
            Save Item
          </Button>
        </View>
      </Modal>

      <ImageEditorModal
        visible={imageEditorVisible}
        imageUri={selectedImageUri}
        onDismiss={() => {
          setImageEditorVisible(false);
          setSelectedImageUri(null);
        }}
        onSave={handleImageSave}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  imageSection: {
    marginBottom: 16,
  },
  imageLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    marginBottom: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadButton: {
    marginTop: 8,
  },
  modal: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '90%',
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 12,
  },
  customizationCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  customizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  categoryChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryOptionChip: {
    borderRadius: 20,
  },
  optionRow: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  optionInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  optionInput: {
    flex: 1,
  },
  optionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  switchLabel: {
    marginRight: 8,
  },
  addOptionButton: {
    alignSelf: 'flex-start',
  },
  divider: {
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});


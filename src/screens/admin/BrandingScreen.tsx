import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Image } from 'react-native';
import {
  Text,
  Button,
  Card,
  TextInput,
  Portal,
  Dialog,
  HelperText,
  Chip,
  IconButton,
  Appbar,
  Checkbox,
  Divider,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { settingsService } from '../../services/settings.service';
import { Settings } from '../../types';
import { DEFAULT_COLORS, DEFAULT_MENU_CATEGORIES } from '../../config/constants';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';

export const BrandingScreen = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { updateTheme } = useTheme();
  const { showToast } = useToast();

  // Form state
  const [restaurantName, setRestaurantName] = useState('');
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLORS.primary);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_COLORS.secondary);
  const [accentColor, setAccentColor] = useState(DEFAULT_COLORS.accent);
  const [logoUrl, setLogoUrl] = useState('');
  const [resetDialogVisible, setResetDialogVisible] = useState(false);
  const [customerMenuUrl, setCustomerMenuUrl] = useState('');
  const [categories, setCategories] = useState<string[]>(DEFAULT_MENU_CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const [crossSellDialogVisible, setCrossSellDialogVisible] = useState(false);
  const [crossSellRules, setCrossSellRules] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      const interval = setInterval(() => {
        loadSettings();
      }, 15000); // 15 saniyede bir otomatik refresh
      return () => clearInterval(interval);
    }, [])
  );

  const loadSettings = async () => {
    try {
      const data = await settingsService.get();
      setSettings(data);
      setRestaurantName(data.restaurantName);
      setPrimaryColor(data.colors.primary);
      setSecondaryColor(data.colors.secondary);
      setAccentColor(data.colors.accent);
      setLogoUrl(data.logo || '');
      setCustomerMenuUrl(data.customerMenuBaseUrl || '');
      if (data.menuCategories && data.menuCategories.length > 0) {
        setCategories(data.menuCategories);
      } else {
        setCategories(DEFAULT_MENU_CATEGORIES);
      }
      if (data.crossSellRules) {
        setCrossSellRules(data.crossSellRules as Record<string, string[]>);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const validateHexColor = (color: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  };

  const handleSave = async () => {
    // Validate colors
    if (!validateHexColor(primaryColor)) {
      Alert.alert('Error', 'Primary color must be a valid hex color (e.g., #6200EE)');
      return;
    }
    if (!validateHexColor(secondaryColor)) {
      Alert.alert('Error', 'Secondary color must be a valid hex color');
      return;
    }
    if (!validateHexColor(accentColor)) {
      Alert.alert('Error', 'Accent color must be a valid hex color');
      return;
    }

    if (!restaurantName.trim()) {
      Alert.alert('Error', 'Restaurant name is required');
      return;
    }

    setSaving(true);
    try {
      const updated = await settingsService.update({
        restaurantName,
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
        },
        logo: logoUrl || null,
        customerMenuBaseUrl: customerMenuUrl || undefined,
        menuCategories: categories,
      });

      setSettings(updated);
      updateTheme({
        colors: updated.colors,
        logo: updated.logo,
        restaurantName: updated.restaurantName,
        menuCategories: updated.menuCategories,
      });
      Alert.alert('Success', 'Branding settings updated successfully');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const updated = await settingsService.update({
        restaurantName: 'Restaurant',
        colors: {
          primary: DEFAULT_COLORS.primary,
          secondary: DEFAULT_COLORS.secondary,
          accent: DEFAULT_COLORS.accent,
        },
        logo: undefined,
        customerMenuBaseUrl: undefined,
        menuCategories: DEFAULT_MENU_CATEGORIES,
      });

      setSettings(updated);
      setRestaurantName(updated.restaurantName);
      setPrimaryColor(updated.colors.primary);
      setSecondaryColor(updated.colors.secondary);
      setAccentColor(updated.colors.accent);
      setLogoUrl('');
      setCustomerMenuUrl('');
      setCategories(DEFAULT_MENU_CATEGORIES);
      setResetDialogVisible(false);
      updateTheme(updated);
      Alert.alert('Success', 'Settings reset to defaults');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      Alert.alert('Error', 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/svg+xml,image/webp';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
          // Validate file type
          if (!['image/png', 'image/svg+xml', 'image/webp'].includes(file.type)) {
            Alert.alert('Error', 'Only PNG, SVG, and WEBP formats are supported');
            return;
          }

          try {
            const url = await settingsService.uploadLogo(file);
            setLogoUrl(url);
            Alert.alert('Success', 'Logo uploaded successfully');
          } catch (error) {
            console.error('Failed to upload logo:', error);
            Alert.alert('Error', 'Failed to upload logo');
          }
        }
      };
      input.click();
    } else {
      Alert.alert('Info', 'Logo upload is only available on web');
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      Alert.alert('Info', 'Please enter a category name before adding.');
      return;
    }
    if (categories.includes(trimmed)) {
      Alert.alert('Info', 'This category already exists.');
      return;
    }
    setCategories((prev) => [...prev, trimmed]);
    setNewCategory('');
  };

  const handleRemoveCategory = (category: string) => {
    if (categories.length === 1) {
      Alert.alert('Info', 'At least one category must remain.');
      return;
    }
    setCategories((prev) => prev.filter((c) => c !== category));
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= categories.length) {
      return;
    }
    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(nextIndex, 0, moved);
    setCategories(updated);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Branding Settings" />
        <IconButton
          icon="refresh"
          iconColor="#6200EE"
          size={24}
          onPress={() => {
            loadSettings();
            showToast('Yenilendi', 'success');
          }}
        />
      </Appbar.Header>
      <ScrollView style={styles.scrollView}>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Restaurant Information
          </Text>

          <TextInput
            label="Restaurant Name"
            value={restaurantName}
            onChangeText={setRestaurantName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Customer Menu / QR Base URL"
            value={customerMenuUrl}
            onChangeText={setCustomerMenuUrl}
            mode="outlined"
            placeholder="https://your-brand.netlify.app"
            style={styles.input}
          />
          <HelperText type="info" visible>
            This URL is used for QR codes. Table IDs will be appended automatically.
          </HelperText>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Logo
          </Text>

          {logoUrl ? (
            <View style={styles.logoPreview}>
              <Text variant="bodyMedium" style={styles.logoLabel}>Current Logo:</Text>
              {logoUrl ? (
                <Image
                  source={{ 
                    uri: logoUrl.startsWith('http') 
                      ? logoUrl 
                      : `http://localhost:3000${logoUrl}` 
                  }}
                  style={styles.logoImage}
                  resizeMode="contain"
                  onError={(error) => {
                    console.error('Failed to load logo image:', logoUrl, error);
                  }}
                />
              ) : null}
              <Text variant="bodySmall" style={styles.logoUrl} numberOfLines={1}>
                {logoUrl}
              </Text>
              <Button 
                mode="outlined" 
                onPress={async () => {
                  setLogoUrl('');
                  // Immediately save null to backend
                  try {
                    const updated = await settingsService.update({
                      ...settings,
                      logo: null,
                    });
                    setSettings(updated);
                    updateTheme({
                      ...updated,
                      logo: null,
                    });
                    showToast('Logo removed successfully', 'success');
                  } catch (error) {
                    console.error('Failed to remove logo:', error);
                    showToast('Failed to remove logo', 'error');
                  }
                }} 
                style={styles.button}
              >
                Remove Logo
              </Button>
            </View>
          ) : (
            <Text variant="bodyMedium" style={styles.noLogo}>
              No logo uploaded
            </Text>
          )}

          <Button mode="contained" onPress={handleLogoUpload} style={styles.button}>
            Upload Logo (PNG/SVG/WEBP)
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Color Theme
          </Text>

          <TextInput
            label="Primary Color"
            value={primaryColor}
            onChangeText={setPrimaryColor}
            mode="outlined"
            placeholder="#6200EE"
            style={styles.input}
            left={
              <TextInput.Icon
                icon="circle"
                color={validateHexColor(primaryColor) ? primaryColor : '#000'}
              />
            }
          />

          <TextInput
            label="Secondary Color"
            value={secondaryColor}
            onChangeText={setSecondaryColor}
            mode="outlined"
            placeholder="#03DAC6"
            style={styles.input}
            left={
              <TextInput.Icon
                icon="circle"
                color={validateHexColor(secondaryColor) ? secondaryColor : '#000'}
              />
            }
          />

          <TextInput
            label="Accent Color"
            value={accentColor}
            onChangeText={setAccentColor}
            mode="outlined"
            placeholder="#FF6B6B"
            style={styles.input}
            left={
              <TextInput.Icon
                icon="circle"
                color={validateHexColor(accentColor) ? accentColor : '#000'}
              />
            }
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Preview
          </Text>

          <View style={styles.preview}>
            <View
              style={[
                styles.previewBox,
                { backgroundColor: validateHexColor(primaryColor) ? primaryColor : '#ccc' },
              ]}
            >
              <Text style={styles.previewText}>Primary</Text>
            </View>
            <View
              style={[
                styles.previewBox,
                { backgroundColor: validateHexColor(secondaryColor) ? secondaryColor : '#ccc' },
              ]}
            >
              <Text style={styles.previewText}>Secondary</Text>
            </View>
            <View
              style={[
                styles.previewBox,
                { backgroundColor: validateHexColor(accentColor) ? accentColor : '#ccc' },
              ]}
            >
              <Text style={styles.previewText}>Accent</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Menu Categories
            </Text>
            <Button
              mode="outlined"
              onPress={() => setCrossSellDialogVisible(true)}
              icon="link"
              style={styles.crossSellButton}
            >
              Cross-Sell Ayarları
            </Button>
          </View>
          <Text variant="bodyMedium" style={styles.helperText}>
            These categories are shown to guests before they browse dishes. You can reorder,
            remove, or add new entries at any time.
          </Text>
          <View style={styles.addCategoryRow}>
            <TextInput
              label="New Category"
              value={newCategory}
              onChangeText={setNewCategory}
              mode="outlined"
              style={styles.addCategoryInput}
            />
            <Button mode="contained" onPress={handleAddCategory} style={styles.addCategoryButton}>
              Add
            </Button>
          </View>
          <View style={styles.categoriesList}>
            {categories.map((category, index) => (
              <View key={`${category}-${index}`} style={styles.categoryRow}>
                <Chip mode="outlined" style={styles.categoryChip}>
                  {category}
                </Chip>
                <View style={styles.categoryActions}>
                  <IconButton
                    icon="arrow-up"
                    size={20}
                    disabled={index === 0}
                    onPress={() => moveCategory(index, 'up')}
                  />
                  <IconButton
                    icon="arrow-down"
                    size={20}
                    disabled={index === categories.length - 1}
                    onPress={() => moveCategory(index, 'down')}
                  />
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => handleRemoveCategory(category)}
                  />
                </View>
              </View>
            ))}
          </View>
          <Button mode="text" onPress={() => setCategories(DEFAULT_MENU_CATEGORIES)}>
            Reset to Default Categories
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={() => setResetDialogVisible(true)}
          style={styles.actionButton}
        >
          Reset to Defaults
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.actionButton}
        >
          Save Changes
        </Button>
      </View>

      <Portal>
        <Dialog 
          visible={resetDialogVisible} 
          onDismiss={() => setResetDialogVisible(false)}
        >
          <Dialog.Title>Reset Settings</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to reset all branding settings to defaults?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleReset}>Reset</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={crossSellDialogVisible}
          onDismiss={() => setCrossSellDialogVisible(false)}
          style={styles.crossSellDialog}
        >
          <Dialog.Title>Cross-Sell Ayarları</Dialog.Title>
          <Dialog.ScrollArea style={styles.crossSellContent}>
            <View style={{ padding: 8 }}>
              <Text variant="bodyMedium" style={styles.crossSellHelper}>
                Her kategori için, o kategoriden bir ürün sepete eklendiğinde hangi kategorilerin gösterileceğini seçin.
              </Text>
              {categories.map((category) => {
                const selectedCategories = crossSellRules[category] || [];
                return (
                  <View key={category} style={styles.crossSellCategorySection}>
                    <Text variant="titleMedium" style={styles.crossSellCategoryTitle}>
                      {category}
                    </Text>
                    <Text variant="bodySmall" style={styles.crossSellCategorySubtitle}>
                      Bu kategoriden ürün eklendiğinde gösterilecek kategoriler:
                    </Text>
                    <View style={styles.crossSellCheckboxes}>
                      {categories
                        .filter((cat) => cat !== category)
                        .map((targetCategory) => (
                          <Checkbox.Item
                            key={targetCategory}
                            label={targetCategory}
                            status={
                              selectedCategories.includes(targetCategory)
                                ? 'checked'
                                : 'unchecked'
                            }
                            onPress={() => {
                              const current = crossSellRules[category] || [];
                              const updated = current.includes(targetCategory)
                                ? current.filter((c) => c !== targetCategory)
                                : [...current, targetCategory];
                              setCrossSellRules({
                                ...crossSellRules,
                                [category]: updated,
                              });
                            }}
                            style={styles.crossSellCheckbox}
                          />
                        ))}
                    </View>
                    <Divider style={styles.crossSellDivider} />
                  </View>
                );
              })}
            </View>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setCrossSellDialogVisible(false)}>İptal</Button>
            <Button
              mode="contained"
              onPress={async () => {
                try {
                  await settingsService.update({ crossSellRules });
                  showToast('Cross-sell ayarları kaydedildi', 'success');
                  setCrossSellDialogVisible(false);
                } catch (error) {
                  console.error('Failed to save cross-sell rules:', error);
                  Alert.alert('Hata', 'Cross-sell ayarları kaydedilemedi');
                }
              }}
            >
              Kaydet
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: { backgroundColor: '#fff', elevation: 0 },
  scrollView: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 0,
    flex: 1,
  },
  input: {
    marginBottom: 12,
  },
  logoPreview: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  logoLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  logoImage: {
    width: 200,
    height: 100,
    marginVertical: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  logoUrl: {
    marginBottom: 8,
    color: '#666',
    fontSize: 12,
  },
  noLogo: {
    marginBottom: 12,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 8,
  },
  preview: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  previewBox: {
    flex: 1,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  helperText: {
    marginBottom: 12,
    color: '#6B6B6B',
  },
  addCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  addCategoryInput: {
    flex: 1,
  },
  addCategoryButton: {
    marginTop: 0,
  },
  categoriesList: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryChip: {
    flexShrink: 1,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
  },
});

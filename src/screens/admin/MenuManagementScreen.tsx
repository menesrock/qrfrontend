import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, Platform } from 'react-native';
import { Text, Button, Card, FAB, Chip, Appbar, IconButton, Portal, Dialog } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MenuItem } from '../../types';
import { customizationsService, menuItemsService } from '../../services';
import { MenuItemFormModal, MenuItemFormValues } from '../../components/MenuItemFormModal';
import { settingsService } from '../../services/settings.service';
import { DEFAULT_MENU_CATEGORIES } from '../../config/constants';
import { useToast } from '../../contexts/ToastContext';

export const MenuManagementScreen = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_MENU_CATEGORIES);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
      const interval = setInterval(() => {
        loadItems();
      }, 15000); // 15 saniyede bir otomatik refresh
      return () => clearInterval(interval);
    }, [])
  );

  const loadItems = async () => {
    try {
      setLoading(true);
      console.log('Loading menu items...');
      const data = await menuItemsService.getAll();
      console.log('Loaded menu items:', data.length, data);
      setItems(data);
    } catch (error: any) {
      console.error('Failed to load menu items:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Error', 'Unable to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await settingsService.get();
      if (data.menuCategories && data.menuCategories.length > 0) {
        setCategories(data.menuCategories);
      } else {
        setCategories(DEFAULT_MENU_CATEGORIES);
      }
    } catch (error) {
      console.error('Failed to load menu categories:', error);
    }
  };

  const handleDelete = (id: string) => {
    console.log('handleDelete called with id:', id);
    setItemToDelete(id);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    const id = itemToDelete;
    setDeleteDialogVisible(false);
    
    console.log('Delete confirmed, deleting item:', id);
    try {
      console.log('Calling menuItemsService.delete...');
      await menuItemsService.delete(id);
      console.log('Delete successful, updating UI...');
      // Remove from local state
      setItems((prev) => {
        const filtered = prev.filter((item) => item.id !== id);
        console.log('Items after filter:', filtered.length);
        return filtered;
      });
      // Reload items to ensure consistency
      await loadItems();
      setItemToDelete(null);
      showToast('Ürün silindi', 'success');
    } catch (error: any) {
      console.error('Failed to delete item:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || error.message || 'Ürün silinemedi';
      Alert.alert('Hata', errorMessage);
      showToast(errorMessage, 'error');
      setItemToDelete(null);
    }
  };

  const handleOpenForm = (item?: MenuItem) => {
    setSelectedItem(item || null);
    setFormVisible(true);
  };

  const handleSave = async (values: MenuItemFormValues) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        description: values.description,
        category: values.category,
        price: values.price,
        imageUrl: values.imageUrl,
        isPopular: values.isPopular,
        popularRank: values.popularRank,
        displayOrder: values.displayOrder,
        allergens: values.allergens,
      };

      let saved: MenuItem;
      if (values.id) {
        console.log('Updating menu item:', values.id, payload);
        saved = await menuItemsService.update(values.id, payload);
      } else {
        console.log('Creating menu item:', payload);
        saved = await menuItemsService.create(payload);
      }
      console.log('Menu item saved:', saved);

      // Save customizations if any
      if (values.customizations && values.customizations.length > 0) {
        try {
          await customizationsService.replace(
            saved.id,
            values.customizations.map((c) => ({
              ...c,
              menuItemId: saved.id,
            }))
          );
          console.log('Customizations saved');
        } catch (customError: any) {
          console.error('Failed to save customizations (non-critical):', customError);
          // Don't fail the whole operation if customizations fail
        }
      }

      // Always reload items after save
      await loadItems();
      setFormVisible(false);
      setSelectedItem(null);
      showToast(values.id ? 'Ürün güncellendi' : 'Ürün eklendi', 'success');
    } catch (error: any) {
      console.error('Failed to save menu item:', error);
      console.error('Error details:', error.response?.data);
      
      // Show detailed validation errors
      const errorData = error.response?.data;
      let errorMessage = errorData?.error || 'Ürün kaydedilemedi';
      
      if (errorData?.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
        const validationErrors = errorData.details.map((d: any) => `${d.path}: ${d.message}`).join(', ');
        errorMessage = `Doğrulama hatası: ${validationErrors}`;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: MenuItem }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge">{item.name}</Text>
            <Text variant="bodyMedium" style={styles.categoryText}>
              {item.category} • ${item.price.toFixed(2)}
            </Text>
            <Text variant="bodySmall" style={styles.metaText}>
              Display Order: {item.displayOrder ?? '-'}
            </Text>
          </View>
          {item.isPopular && <Chip mode="flat">Popular #{item.popularRank ?? '-'}</Chip>}
        </View>
        {item.allergens && item.allergens.length > 0 && (
          <View style={styles.chipRow}>
            {item.allergens.map((allergen) => (
              <Chip key={`${item.id}-${allergen}`} compact>
                {allergen}
              </Chip>
            ))}
          </View>
        )}
        {item.customizations && item.customizations.length > 0 && (
          <View style={styles.customizationRow}>
            {item.customizations.map((c) => (
              <Chip key={c.id} style={styles.customizationChip}>
                {c.name} • {c.type}
              </Chip>
            ))}
          </View>
        )}
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="text"
          onPress={() => handleOpenForm(item)}
        >
          Edit
        </Button>
        <Button 
          mode="text"
          onPress={(e) => {
            e?.stopPropagation?.();
            console.log('Delete button pressed for item:', item.id, item.name);
            handleDelete(item.id);
          }} 
          textColor="#d32f2f"
          buttonColor="transparent"
        >
          Delete
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Menu Management" />
        <IconButton
          icon="refresh"
          iconColor="#6200EE"
          size={24}
          onPress={() => {
            loadItems();
            showToast('Yenilendi', 'success');
          }}
        />
      </Appbar.Header>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={loadItems}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No menu items yet. Click "Add Item" to get started.</Text>
          ) : null
        }
      />

      <FAB style={styles.fab} icon="plus" label="Add Item" onPress={() => handleOpenForm()} />

      <MenuItemFormModal
        visible={formVisible}
        onDismiss={() => {
          if (!saving) {
            setFormVisible(false);
            setSelectedItem(null);
          }
        }}
        initialValues={selectedItem || undefined}
        onSubmit={handleSave}
        loading={saving}
        categoryOptions={categories}
      />

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => {
            setDeleteDialogVisible(false);
            setItemToDelete(null);
          }}
        >
          <Dialog.Title>Ürünü Sil</Dialog.Title>
          <Dialog.Content>
            <Text>Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setDeleteDialogVisible(false);
              setItemToDelete(null);
            }}>
              İptal
            </Button>
            <Button 
              onPress={confirmDelete}
              textColor="#d32f2f"
            >
              Sil
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: '#fff', elevation: 0 },
  title: { marginBottom: 16 },
  card: { marginBottom: 12 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  categoryText: {
    color: '#555',
  },
  metaText: {
    color: '#777',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  customizationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  customizationChip: {
    backgroundColor: '#eef2ff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 32,
  },
  listContent: { padding: 16 },
  cardActions: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});

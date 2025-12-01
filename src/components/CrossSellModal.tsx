import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Platform } from 'react-native';
import { Modal, Portal, Text, Button, Card, IconButton } from 'react-native-paper';
import { menuItemsService, settingsService } from '../services';
import { MenuItem } from '../types';
import { UI_COLORS } from '../config/constants';
import api from '../config/api';

interface CrossSellModalProps {
  visible: boolean;
  category: string;
  onDismiss: () => void;
  onAddToCart: (item: MenuItem) => void;
  onGoToCart?: () => void;
}

export const CrossSellModal: React.FC<CrossSellModalProps> = ({
  visible,
  category,
  onDismiss,
  onAddToCart,
  onGoToCart,
}) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [targetCategories, setTargetCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && category) {
      loadCrossSellData();
    }
  }, [visible, category]);

  const loadCrossSellData = async () => {
    try {
      setLoading(true);
      // Get cross-sell rules from settings
      const settings = await settingsService.get();
      const crossSellRules = settings.crossSellRules as Record<string, string[]> | null;
      
      let categories: string[] = [];
      if (crossSellRules && crossSellRules[category]) {
        categories = crossSellRules[category];
      } else {
        // Default fallback based on category
        const defaultRules: Record<string, string[]> = {
          'Kahvaltılıklar': ['Sıcak İçecekler'],
          'Başlangıçlar / Atıştırmalıklar': ['Soğuk İçecekler'],
          'Çorbalar': ['Ekstralar / Yan Ürünler'],
          'Salatalar': ['Soğuk İçecekler'],
          'Ana Yemekler': ['Tatlılar'],
          'Fast Food / Burgerler': ['Soğuk İçecekler'],
          'Pizzalar ve Hamur İşleri': ['Soğuk İçecekler'],
          'Makarnalar ve Risottolar': ['Salatalar'],
          'Deniz Ürünleri': ['Şaraplar'],
          'Sıcak İçecekler': ['Tatlılar'],
          'Soğuk İçecekler': ['Başlangıçlar / Atıştırmalıklar'],
          'Şaraplar': ['Başlangıçlar / Atıştırmalıklar'],
          'Kokteyller': ['Başlangıçlar / Atıştırmalıklar'],
          'Tatlılar': ['Sıcak İçecekler'],
          'Ekstralar / Yan Ürünler': ['Ana Yemekler'],
        };
        categories = defaultRules[category] || [];
      }
      
      setTargetCategories(categories);

      // Load items from target categories
      if (categories.length > 0) {
        const allItems = await menuItemsService.getAll();
        const filteredItems = allItems.filter(
          (item) => item.isActive && categories.includes(item.category)
        );
        setItems(filteredItems);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to load cross-sell data:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (item: MenuItem) => {
    // Add item with default quantity 1 and no customizations
    const cartItem = {
      ...item,
      quantity: 1,
      notes: undefined,
      customizations: [],
      extraCost: 0,
      lineTotal: item.price,
    };
    onAddToCart(cartItem as any);
    onDismiss();
  };

  const getImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const backendBaseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
    return `${backendBaseUrl}${imageUrl}`;
  };

  const renderItem = ({ item }: { item: MenuItem }) => {
    const imageUrl = getImageUrl(item.imageUrl);

    return (
      <Card style={styles.itemCard}>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.itemImage} resizeMode="cover" />
        )}
        <Card.Content style={styles.itemContent}>
          <Text variant="titleMedium" style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text variant="bodySmall" style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.itemFooter}>
            <Text variant="titleMedium" style={styles.itemPrice}>
              ₺{item.price.toFixed(2)}
            </Text>
            <Button
              mode="contained"
              onPress={() => handleQuickAdd(item)}
              style={styles.addButton}
              buttonColor="#000000"
              textColor="#FFFFFF"
              compact
            >
              Sepete Ekle
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (!visible || targetCategories.length === 0) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
        style={styles.modalWrapper}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Bu ürünü alanlar bunları da sipariş ediyor
          </Text>
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
            iconColor="#000000"
          />
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        ) : items.length === 0 ? (
          <Text style={styles.emptyText}>Bu kategoride ürün bulunamadı.</Text>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}

        {onGoToCart && (
          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={() => {
                onGoToCart();
                onDismiss();
              }}
              style={styles.goToCartButton}
              buttonColor="#000000"
              textColor="#FFFFFF"
              icon="cart"
            >
              Sepete Git
            </Button>
          </View>
        )}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    ...(Platform.OS === 'web' && {
      position: 'fixed' as any,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    }),
  },
  modal: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    margin: 20,
    borderRadius: 16,
    maxHeight: '85%',
    minHeight: 400,
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    width: Platform.OS === 'web' ? '90%' : '100%',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      position: 'relative' as any,
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontWeight: '300',
    fontFamily: Platform.OS === 'web' ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' : undefined,
  },
  listContent: {
    paddingVertical: 8,
  },
  itemCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 120,
    backgroundColor: UI_COLORS.surfaceMuted,
  },
  itemContent: {
    padding: 12,
  },
  itemName: {
    color: '#000000',
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    color: '#000000',
    opacity: 0.7,
    marginBottom: 8,
    minHeight: 32,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: {
    color: '#000000',
    fontWeight: 'bold',
  },
  addButton: {
    borderRadius: 8,
  },
  loadingText: {
    textAlign: 'center',
    padding: 32,
    color: '#000000',
  },
  emptyText: {
    textAlign: 'center',
    padding: 32,
    color: '#000000',
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  goToCartButton: {
    borderRadius: 12,
    paddingVertical: 8,
  },
});


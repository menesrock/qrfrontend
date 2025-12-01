import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, FlatList, StyleSheet, Alert, Image, TouchableOpacity, Animated, Platform } from 'react-native';
import { Text, Card, Searchbar, FAB, Chip, Button, ProgressBar, IconButton } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { menuItemsService, ordersService } from '../../services';
import { settingsService } from '../../services/settings.service';
import { callRequestsService } from '../../services/callRequests.service';
import { MenuItem, OrderItemCustomization, Order } from '../../types';
import { ItemDetailModal } from '../../components/ItemDetailModal';
import { ShoppingCart } from '../../components/ShoppingCart';
import { CrossSellModal } from '../../components/CrossSellModal';
import { DEFAULT_MENU_CATEGORIES, UI_COLORS } from '../../config/constants';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../config/api';
import { getSocket, initializeSocket, connectSocket } from '../../config/socket';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  customizations?: OrderItemCustomization[];
  extraCost: number;
  lineTotal: number;
};

export const CustomerMenuScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as { tableId?: string; customerName?: string; customerEmail?: string; tableSlug?: string; isWaiterMode?: boolean };
  const tableId = params?.tableId || '';
  const customerEmail = params?.customerEmail || '';
  const customerName = params?.customerName || customerEmail.split('@')[0] || '';
  const tableSlug = params?.tableSlug || tableId;
  const isWaiterMode = params?.isWaiterMode || false;

  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cartVisible, setCartVisible] = useState(false);
  const [crossSellVisible, setCrossSellVisible] = useState(false);
  const [crossSellCategory, setCrossSellCategory] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_MENU_CATEGORIES);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderProgress, setOrderProgress] = useState(0);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const lightAnimation = useRef(new Animated.Value(0)).current;
  const activeOrderRef = useRef<Order | null>(null);
  const { showToast } = useToast();
  const { logo } = useTheme();
  const isWeb = typeof window !== 'undefined';

  useEffect(() => {
    loadMenu();
    loadCategories();
    checkActiveOrder();
    
    // Initialize and connect socket for customer
    const socket = initializeSocket();
    connectSocket();
    
    // Check for active order in sessionStorage
    if (isWeb && tableId && customerEmail) {
      const savedOrderId = sessionStorage.getItem(`active_order_${tableId}_${customerEmail}`);
      if (savedOrderId) {
        loadOrderById(savedOrderId);
      }
    }
    
    // Setup socket listeners after a short delay to ensure connection
    const timer = setTimeout(() => {
      setupSocketListeners();
    }, 500);
    
    // Also set up a polling mechanism as fallback (every 3 seconds)
    const pollInterval = setInterval(() => {
      if (activeOrder?.id) {
        loadOrderById(activeOrder.id);
      }
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(pollInterval);
      const socket = getSocket();
      if (socket) {
        socket.off('order:updated');
        socket.off('table:updated');
        socket.off('order:confirmed');
      }
      lightAnimation.stopAnimation();
    };
  }, [tableId, customerEmail, activeOrder?.id]);
  
  // Light animation effect
  useEffect(() => {
    if (activeOrder) {
      // Start light animation loop
      lightAnimation.setValue(0);
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(lightAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.delay(500),
        ])
      );
      animation.start();
      
      return () => {
        animation.stop();
      };
    } else {
      lightAnimation.setValue(0);
    }
  }, [activeOrder]);
  
  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) {
      console.warn('Socket not available, retrying...');
      // Retry after a short delay
      setTimeout(() => {
        const retrySocket = getSocket();
        if (retrySocket) {
          setupSocketListeners();
        }
      }, 1000);
      return;
    }
    
    // Remove existing listeners to avoid duplicates
    socket.off('order:updated');
    socket.off('table:updated');
    
    socket.on('order:updated', (order: Order) => {
      console.log('Order updated event received:', order.id, order.status, 'customerEmail:', order.customerEmail, 'tableId:', order.tableId);
      // Check if this order belongs to current customer
      const isCustomerOrder = order.customerEmail === customerEmail && order.tableId === tableId;
      const isActiveOrder = activeOrder && order.id === activeOrder.id;
      
      if (isCustomerOrder || isActiveOrder) {
        console.log('Updating active order:', order.status);
        setActiveOrder((prev) => {
          // Only update if status changed
          if (!prev || prev.status !== order.status) {
            activeOrderRef.current = order;
            return order;
          }
          return prev;
        });
        updateOrderProgress(order.status);
      }
    });
    
    socket.on('table:updated', (table: any) => {
      if (table.id === tableId && table.status === 'available') {
        // Table is now available, clear active order
        setActiveOrder(null);
        activeOrderRef.current = null;
        setOrderProgress(0);
        progressAnimation.setValue(0);
        if (isWeb && tableId && customerEmail) {
          sessionStorage.removeItem(`active_order_${tableId}_${customerEmail}`);
        }
        showToast('Masa boşaltıldı. Yeni sipariş verebilirsiniz.', 'info');
      }
    });
    
    // Also listen for order:confirmed event
    socket.off('order:confirmed');
    socket.on('order:confirmed', (order: Order) => {
      console.log('Order confirmed event received:', order.id);
      const currentActiveOrder = activeOrderRef.current;
      if ((order.customerEmail === customerEmail && order.tableId === tableId) || 
          (currentActiveOrder && order.id === currentActiveOrder.id)) {
        console.log('Updating order to confirmed');
        setActiveOrder(order);
        activeOrderRef.current = order;
        updateOrderProgress(order.status);
      }
    });
  };
  
  const checkActiveOrder = async () => {
    if (!tableId || !customerEmail) return;
    
    try {
      const orders = await ordersService.getAll({ 
        tableId,
        status: 'pending,confirmed,preparing,ready'
      });
      
      // Find order for this customer email
      const customerOrder = orders.find(
        (o: Order) => o.customerEmail === customerEmail && 
        ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
      );
      
      if (customerOrder) {
        setActiveOrder(customerOrder);
        activeOrderRef.current = customerOrder;
        updateOrderProgress(customerOrder.status);
        if (isWeb) {
          sessionStorage.setItem(`active_order_${tableId}_${customerEmail}`, customerOrder.id);
        }
      }
    } catch (error) {
      console.error('Failed to check active order:', error);
    }
  };
  
  const loadOrderById = async (orderId: string) => {
    try {
      const order = await ordersService.getById(orderId);
      if (order && ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)) {
        setActiveOrder(order);
        updateOrderProgress(order.status);
      } else {
        // Order is completed, clear it
        setActiveOrder(null);
        setOrderProgress(0);
        if (isWeb) {
          sessionStorage.removeItem(`active_order_${tableId}_${customerEmail}`);
        }
      }
    } catch (error) {
      console.error('Failed to load order:', error);
    }
  };
  
  const updateOrderProgress = (status: string) => {
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
    const progress = statuses.indexOf(status) / (statuses.length - 1);
    const clampedProgress = Math.max(0, Math.min(1, progress));
    setOrderProgress(clampedProgress);
    
    // Animate progress bar
    Animated.timing(progressAnimation, {
      toValue: clampedProgress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };
  
  const handleOrderBubbleClick = () => {
    if (activeOrder) {
      (navigation as any).navigate('OrderTracking', { orderId: activeOrder.id });
    }
  };

  const loadMenu = async () => {
    try {
      const data = await menuItemsService.getAll();
      setItems(data.filter((i) => i.isActive));
    } catch (error) {
      console.error('Failed to load menu', error);
      Alert.alert('Error', 'Unable to load menu items');
    }
  };

  const loadCategories = async () => {
    try {
      const data = await settingsService.get();
      if (data.menuCategories && data.menuCategories.length > 0) {
        setAvailableCategories(data.menuCategories);
      } else {
        setAvailableCategories(DEFAULT_MENU_CATEGORIES);
      }
    } catch (error) {
      console.error('Failed to load categories', error);
      setAvailableCategories(DEFAULT_MENU_CATEGORIES);
    }
  };

  useEffect(() => {
    setSelectedCategories((prev) => prev.filter((cat) => availableCategories.includes(cat)));
  }, [availableCategories]);

  const handleAddToCart = (item: any) => {
    const cartItem: CartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
      notes: item.notes,
      customizations: item.customizations || [],
      extraCost: item.extraCost || 0,
      lineTotal: item.lineTotal ?? (item.price + (item.extraCost || 0)) * (item.quantity || 1),
    };
    setCart((prev) => [...prev, cartItem]);
    
    // Show cross-sell modal after adding to cart
    if (item.category) {
      setCrossSellCategory(item.category);
      setCrossSellVisible(true);
    }
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const order = await ordersService.create({
        tableId,
        tableName: tableSlug,
        customerName,
        customerEmail: customerEmail || undefined,
        items: cart.map((c) => ({
          menuItemId: c.id,
          menuItemName: c.name,
          quantity: c.quantity,
          basePrice: c.price,
          customizations: c.customizations || [],
          customerNotes: c.notes,
          itemTotal: c.lineTotal,
        })),
        totalAmount: cart.reduce((sum, c) => sum + c.lineTotal, 0),
        orderSource: isWaiterMode ? 'manual' : 'customer',
      });
      
      // Set active order
      setActiveOrder(order);
      activeOrderRef.current = order;
      updateOrderProgress(order.status);
      
      // Save to sessionStorage
      if (isWeb && tableId && customerEmail) {
        sessionStorage.setItem(`active_order_${tableId}_${customerEmail}`, order.id);
      }
      
      setCart([]);
      setCartVisible(false);
      showToast('Sipariş başarıyla oluşturuldu!', 'success');
      
      // Navigate back to waiter dashboard or orders screen only if waiter mode
      if (isWaiterMode && (navigation as any).canGoBack()) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to create order', error);
      showToast('Sipariş oluşturulamadı. Lütfen tekrar deneyin.', 'error');
    }
  };

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(lower) || item.description.toLowerCase().includes(lower);
      const matchCategory =
        selectedCategories.length === 0 ? false : selectedCategories.includes(item.category);
    return matchSearch && matchCategory;
  });
  }, [items, search, selectedCategories]);

  const allSelected =
    selectedCategories.length > 0 && selectedCategories.length === availableCategories.length;
  const shouldShowItems = selectedCategories.length > 0;

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(availableCategories);
    }
  };

  const handleCallWaiter = async (type: 'bill' | 'napkin' | 'cleaning') => {
    try {
      await callRequestsService.create({
        tableId,
        tableName: tableSlug,
        customerName,
        type,
      });
      const messages = {
        bill: 'Hesap isteği gönderildi. Garsonunuz yakında gelecek.',
        napkin: 'Peçete isteği gönderildi.',
        cleaning: 'Temizlik isteği gönderildi.',
      };
      showToast(messages[type], 'success');
    } catch (error) {
      console.error('Failed to call waiter:', error);
      showToast('İstek gönderilemedi. Lütfen tekrar deneyin.', 'error');
    }
  };

  // Get logo URL with proper base URL
  const getLogoUrl = () => {
    if (!logo) return null;
    if (logo.startsWith('http://') || logo.startsWith('https://')) {
      return logo;
    }
    // For relative paths, use backend base URL (remove /api from baseURL)
    const backendBaseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
    return `${backendBaseUrl}${logo}`;
  };
  const logoUrl = getLogoUrl();

  return (
    <View style={styles.container}>
      {/* Top Bar with Progress */}
      {activeOrder && (
        <View style={styles.topBar}>
          <View style={styles.topBarContent}>
            <Text variant="bodySmall" style={styles.topBarText}>
              Sipariş Durumu: {activeOrder.status === 'pending' ? 'Beklemede' : 
                              activeOrder.status === 'confirmed' ? 'Onaylandı' :
                              activeOrder.status === 'preparing' ? 'Hazırlanıyor' :
                              activeOrder.status === 'ready' ? 'Hazır' : 'Tamamlandı'}
            </Text>
            <View style={styles.progressContainer}>
              <ProgressBar progress={orderProgress} color="#FFFFFF" style={styles.progressBar} />
              <Animated.View
                style={[
                  styles.progressGlow,
                  {
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
              {/* Sliding light animation */}
              <Animated.View
                style={[
                  styles.progressLight,
                  {
                    left: lightAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-20%', '120%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.header}>
        {logoUrl && (
          <Image
            source={{ uri: logoUrl }}
            style={styles.logoImage}
            resizeMode="contain"
            onError={(error) => {
              console.error('Failed to load logo:', logoUrl, error);
            }}
          />
        )}
        <Text variant="headlineSmall" style={styles.headerTitle}>
          QR Menu
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Masa {tableSlug} • {customerName}
        </Text>
        {!isWaiterMode && (
          <View style={styles.waiterButtons}>
            <Button
              mode="contained"
              icon="receipt"
              onPress={() => handleCallWaiter('bill')}
              style={styles.waiterButton}
              buttonColor={UI_COLORS.surfaceDark}
              textColor="#FFFFFF"
            >
              Hesap
            </Button>
            <Button
              mode="contained"
              icon="hand-wave"
              onPress={() => handleCallWaiter('napkin')}
              style={styles.waiterButton}
              buttonColor={UI_COLORS.surfaceDark}
              textColor="#FFFFFF"
            >
              Peçete
            </Button>
            <Button
              mode="contained"
              icon="broom"
              onPress={() => handleCallWaiter('cleaning')}
              style={styles.waiterButton}
              buttonColor={UI_COLORS.surfaceDark}
              textColor="#FFFFFF"
            >
              Temizlik
            </Button>
          </View>
        )}
      </View>
      
      <Searchbar
        placeholder="Ürün veya açıklama ara..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
        inputStyle={{ color: UI_COLORS.textPrimary }}
      />

      <View style={styles.categoriesContainer}>
        <View style={styles.categoriesHeader}>
          <Text variant="titleMedium" style={styles.filterTitle}>
            Kategoriler
          </Text>
          <Button
            mode="text"
            onPress={() => setSelectedCategories([])}
            disabled={!selectedCategories.length}
          >
            Temizle
          </Button>
        </View>
        <View style={styles.categoryChips}>
          <Chip
            icon="select-all"
            selected={allSelected}
            onPress={handleSelectAll}
            mode={allSelected ? 'flat' : 'outlined'}
          >
            Tümünü Seç
          </Chip>
          {availableCategories.map((cat) => {
            const selected = selectedCategories.includes(cat);
            return (
              <Chip
                key={cat}
                selected={selected}
                mode={selected ? 'flat' : 'outlined'}
                onPress={() => toggleCategory(cat)}
              >
                {cat}
              </Chip>
            );
          })}
        </View>
      </View>

      <FlatList
        data={shouldShowItems ? filtered : []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const getImageUrl = (imageUrl?: string | null) => {
            if (!imageUrl) return null;
            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
              return imageUrl;
            }
            const backendBaseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
            return `${backendBaseUrl}${imageUrl}`;
          };

          const imageUrl = getImageUrl(item.imageUrl);

          return (
            <Card style={styles.card} onPress={() => setSelectedItem(item)}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.itemRow}>
                  {imageUrl && (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.itemTextContainer}>
                    <View style={styles.itemHeader}>
                      <Text variant="titleLarge" style={styles.itemTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.isPopular && <Chip compact style={styles.popularChip}>Öne Çıkan</Chip>}
                    </View>
                    <Text variant="bodyMedium" numberOfLines={2} style={styles.itemDescription}>
                      {item.description}
                    </Text>
                    <Text variant="titleMedium" style={styles.price}>
                      ₺{item.price.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {shouldShowItems
              ? 'Seçtiğiniz kategorilerde ürün bulunamadı.'
              : 'Menüyü görmek için önce kategorileri seçin.'}
          </Text>
        }
      />

      {/* Order Status Bubble */}
      {activeOrder && !isWaiterMode && (
        <TouchableOpacity 
          style={styles.orderBubble}
          onPress={handleOrderBubbleClick}
          activeOpacity={0.8}
        >
          <View style={styles.bubbleContent}>
            <IconButton 
              icon="food" 
              iconColor="#FFFFFF" 
              size={20}
              style={styles.bubbleIcon}
            />
            <Text style={styles.bubbleText}>Sipariş</Text>
            <View style={styles.bubbleBadge}>
              <Text style={styles.bubbleBadgeText}>!</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <FAB
        icon="cart"
        label={`Sepet (${cart.length})`}
        style={[styles.fab, Platform.OS === 'web' && styles.fabWeb]}
        onPress={() => setCartVisible(true)}
        color="#000000"
      />

      <ItemDetailModal
        visible={!!selectedItem}
        item={selectedItem}
        onDismiss={() => setSelectedItem(null)}
        onAddToCart={handleAddToCart}
      />

      <ShoppingCart
        visible={cartVisible}
        items={cart}
        onDismiss={() => setCartVisible(false)}
        onCheckout={handleCheckout}
        onRemove={handleRemoveFromCart}
      />

      <CrossSellModal
        visible={crossSellVisible}
        category={crossSellCategory}
        onDismiss={() => setCrossSellVisible(false)}
        onAddToCart={handleAddToCart}
        onGoToCart={() => setCartVisible(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI_COLORS.background },
  topBar: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  topBarContent: {
    maxWidth: '100%',
  },
  topBarText: {
    color: '#FFFFFF',
    marginBottom: 4,
    fontSize: 12,
  },
  progressContainer: {
    position: 'relative',
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333333',
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333333',
  },
  progressLight: {
    position: 'absolute',
    top: 0,
    height: 4,
    width: '30%',
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
    opacity: 0.54,
    shadowColor: '#F5F5F5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    opacity: 0.8,
    shadowColor: '#E0E0E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  orderBubble: {
    position: 'absolute',
    top: 80,
    right: 16,
    zIndex: 1000,
    backgroundColor: '#666666',
    borderRadius: 28,
    padding: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleIcon: {
    margin: 0,
    width: 24,
    height: 24,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  bubbleBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bubbleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
    paddingTop: 48,
    backgroundColor: UI_COLORS.surfaceDark,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#E0E0E0',
    marginTop: 4,
    textAlign: 'center',
  },
  logoImage: {
    width: 120,
    height: 80,
    marginBottom: 16,
    alignSelf: 'center',
  },
  waiterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  waiterButton: {
    flex: 1,
    minWidth: 100,
  },
  search: {
    margin: 16,
    backgroundColor: UI_COLORS.surface,
    borderRadius: 12,
  },
  categoriesContainer: {
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: UI_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    marginBottom: 12,
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterTitle: {
    color: UI_COLORS.textPrimary,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  listContent: {
    paddingBottom: 120,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: UI_COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  cardContent: {
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
  },
  itemImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: UI_COLORS.surfaceMuted,
  },
  itemTextContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    color: UI_COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  popularChip: {
    height: 24,
  },
  itemDescription: {
    color: UI_COLORS.textSecondary,
    marginBottom: 8,
    flex: 1,
  },
  price: {
    color: '#111111',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: '#000000',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabWeb: {
    position: 'fixed' as any,
    backdropFilter: 'blur(20px) saturate(180%)' as any,
    WebkitBackdropFilter: 'blur(20px) saturate(180%)' as any,
  } as any,
  empty: { textAlign: 'center', marginTop: 32, color: UI_COLORS.textSecondary, paddingHorizontal: 24 },
});

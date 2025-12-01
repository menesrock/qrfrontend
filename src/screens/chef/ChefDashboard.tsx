import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, Switch, Appbar, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ordersService, usersService } from '../../services';
import { Order } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getSocket } from '../../config/socket';
import { notificationService } from '../../services/notifications.service';

export const ChefDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isOnline, setIsOnline] = useState(Boolean(user?.isOnline));
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    notificationService.requestPermission();
  }, []);

  // Listen to socket events for notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    // Listen for confirmed orders (orders that waiter confirmed)
    const handleConfirmedOrder = (order: any) => {
      if (isOnline) {
        notificationService.showChefOrderNotification({
          tableName: order.tableName,
          customerName: order.customerName,
          items: order.items || [],
          queuePosition: order.queuePosition,
        });
        loadOrders(); // Refresh orders
      }
    };

    socket.on('order:confirmed', handleConfirmedOrder);

    return () => {
      socket.off('order:confirmed', handleConfirmedOrder);
    };
  }, [user, isOnline, loadOrders]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      console.log('ChefDashboard - Loading orders...');
      const data = await ordersService.getAll({ status: 'confirmed,preparing' });
      console.log('ChefDashboard - Loaded orders:', data.length, data);
      const filtered = data.filter(o => o.status === 'confirmed' || o.status === 'preparing');
      console.log('ChefDashboard - Filtered orders:', filtered.length);
      setOrders(filtered);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      console.error('Error details:', error.response?.data);
      showToast('Siparişler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
      const interval = setInterval(loadOrders, 15000); // 15 saniyede bir otomatik refresh
      return () => clearInterval(interval);
    }, [loadOrders])
  );

  const handleToggleOnline = async (value: boolean) => {
    setIsOnline(value);
    if (!user) return;
    try {
      await usersService.update(user.id, { isOnline: value });
      showToast(`Artık ${value ? 'çevrimiçi' : 'çevrimdışı'}sınız.`, 'success');
    } catch (error) {
      console.error('Failed to update online status:', error);
      setIsOnline(!value);
      showToast('Durum güncellenemedi', 'error');
    }
  };

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    try {
      await ordersService.updateStatus(orderId, status);
      await loadOrders();
      const messages: Record<string, string> = {
        preparing: 'Sipariş hazırlanmaya başlandı',
        ready: 'Sipariş hazır olarak işaretlendi',
      };
      showToast(messages[status] || 'Sipariş durumu güncellendi', 'success');
    } catch (error) {
      console.error('Failed to update order status:', error);
      showToast('Sipariş durumu güncellenemedi', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="Kitchen" />
        <IconButton
          icon="refresh"
          iconColor="#6200EE"
          size={24}
          onPress={() => {
            loadOrders();
            showToast('Yenilendi', 'success');
          }}
        />
      </Appbar.Header>
      <Card style={styles.header}>
        <Card.Content>
          <View style={styles.statusRow}>
            <Text variant="headlineMedium">Kitchen</Text>
            <View style={styles.switch}>
              <Text>{isOnline ? 'Online' : 'Offline'}</Text>
              <Switch value={isOnline} onValueChange={handleToggleOnline} />
            </View>
          </View>
          <Text variant="bodyLarge">{orders.length} orders in queue</Text>
        </Card.Content>
      </Card>

      <FlatList
        data={orders}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.orderHeader}>
                <Text variant="titleLarge">Masa {item.tableName}</Text>
                <Chip>#{item.queuePosition || '-'}</Chip>
              </View>
              <Text variant="bodyMedium">{item.customerName}</Text>
              {item.items.map((orderItem: any, idx: number) => (
                <View key={idx} style={styles.item}>
                  <Text>• {orderItem.menuItemName} x{orderItem.quantity}</Text>
                  {orderItem.customizations?.map((c: any, cIdx: number) => (
                    <Text key={`${orderItem.menuItemId}-${cIdx}`} style={styles.notes}>
                      {c.name}: {c.selectedOptions.map((opt: any) => opt.name).join(', ')}
                    </Text>
                  ))}
                  {orderItem.customerNotes && (
                    <Text style={styles.notes}>Not: {orderItem.customerNotes}</Text>
                  )}
                </View>
              ))}
            </Card.Content>
            <Card.Actions>
              {item.status === 'confirmed' && (
                <Button onPress={() => handleStatusChange(item.id, 'preparing')}>
                  Hazırlamaya Başla
                </Button>
              )}
              {item.status === 'preparing' && (
                <Button onPress={() => handleStatusChange(item.id, 'ready')}>
                  Hazır Olarak İşaretle
                </Button>
              )}
            </Card.Actions>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Sırada sipariş yok</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  appbar: { backgroundColor: '#fff', elevation: 0 },
  header: { margin: 16 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  switch: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { marginHorizontal: 16, marginBottom: 12 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  item: { marginTop: 8, paddingLeft: 8 },
  notes: { fontStyle: 'italic', color: '#666', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 32 },
});

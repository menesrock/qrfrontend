import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Appbar, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ordersService } from '../../services';
import { Order } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export const WaiterOrdersScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ordersService.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
      const interval = setInterval(loadOrders, 15000); // 15 saniyede bir otomatik refresh
      return () => clearInterval(interval);
    }, [loadOrders])
  );

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    try {
      setActionLoading(orderId);
      await ordersService.updateStatus(orderId, status);
      await loadOrders();
      
      const statusMessages: Record<string, string> = {
        confirmed: 'Sipariş onaylandı',
        preparing: 'Sipariş hazırlanıyor',
        ready: 'Sipariş hazır',
        completed: 'Sipariş tamamlandı',
      };
      showToast(statusMessages[status] || 'Sipariş durumu güncellendi', 'success');
    } catch (error) {
      console.error('Failed to update order status:', error);
      showToast('Sipariş durumu güncellenemedi', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const renderActions = (order: Order) => {
    if (order.status === 'pending') {
      return (
        <Button
          onPress={() => handleStatusChange(order.id, 'confirmed')}
          loading={actionLoading === order.id}
        >
          Confirm
        </Button>
      );
    }

    if (order.status === 'ready') {
      return (
        <Button
          onPress={() => handleStatusChange(order.id, 'completed')}
          loading={actionLoading === order.id}
        >
          Mark Delivered
        </Button>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Orders" />
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
      {loading && orders.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : (
      <FlatList
        data={orders}
        keyExtractor={i => i.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                  <Text variant="titleLarge">{item.tableName}</Text>
                <Chip>{item.status}</Chip>
              </View>
              <Text variant="bodyMedium">{item.customerName}</Text>
                <Text variant="bodySmall">
                  {item.items.length} items • ${Number(item.totalAmount).toFixed(2)}
                </Text>
                {item.items.map((orderItem, idx) => (
                  <View key={`${orderItem.menuItemId}-${idx}`} style={styles.lineItem}>
                    <Text variant="bodySmall">
                      • {orderItem.menuItemName} x{orderItem.quantity}
                    </Text>
                    {orderItem.customizations?.map((c, cIdx) => (
                      <Text key={`${orderItem.menuItemId}-${cIdx}`} style={styles.customizationText}>
                        {c.name}: {c.selectedOptions.map((opt) => opt.name).join(', ')}
                      </Text>
                    ))}
                    {orderItem.customerNotes && (
                      <Text style={styles.customizationText}>Note: {orderItem.customerNotes}</Text>
                    )}
                  </View>
                ))}
            </Card.Content>
              <Card.Actions>{renderActions(item)}</Card.Actions>
          </Card>
        )}
          ListEmptyComponent={<Text style={styles.empty}>No orders found</Text>}
      />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: '#fff', elevation: 0 },
  title: { marginBottom: 16 },
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  lineItem: { marginTop: 6 },
  customizationText: { color: '#555', marginLeft: 12 },
  empty: { textAlign: 'center', marginTop: 32 },
});

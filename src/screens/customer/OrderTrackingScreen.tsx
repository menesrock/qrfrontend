import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, ProgressBar, Button } from 'react-native-paper';
import { ordersService } from '../../services';
import { UI_COLORS } from '../../config/constants';

export const OrderTrackingScreen = ({ route }: any) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOrder = async () => {
    try {
      const data = await ordersService.getById(orderId);
      setOrder(data);
    } catch (error) {
      console.error(error);
    }
  };

  const getProgress = () => {
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
    return statuses.indexOf(order?.status || 'pending') / (statuses.length - 1);
  };

  if (!order) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium">Order #{order.id.slice(0, 8)}</Text>
          <Text variant="titleLarge" style={styles.status}>{order.status.toUpperCase()}</Text>
          
          <ProgressBar progress={getProgress()} style={styles.progress} />

          <View style={styles.items}>
            {order.items.map((item: any, i: number) => (
              <View key={i} style={styles.itemRow}>
                <Text>• {item.menuItemName} x{item.quantity}</Text>
                {item.customizations?.map((c: any, idx: number) => (
                  <Text key={`${item.menuItemId}-${idx}`} style={styles.customizationText}>
                    {c.name}: {c.selectedOptions.map((opt: any) => opt.name).join(', ')}
                  </Text>
                ))}
                {item.customerNotes && (
                  <Text style={styles.customizationText}>Note: {item.customerNotes}</Text>
                )}
              </View>
            ))}
          </View>

          <Text variant="titleMedium">Total: ₺{Number(order.totalAmount).toFixed(2)}</Text>
          
          {order.queuePosition && (
            <Text variant="bodyLarge" style={styles.queue}>
              Queue Position: #{order.queuePosition}
            </Text>
          )}
        </Card.Content>
      </Card>

      <Button mode="outlined" onPress={loadOrder} style={styles.button}>
        Refresh Status
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: UI_COLORS.background },
  card: {
    marginBottom: 16,
    backgroundColor: UI_COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  status: { color: UI_COLORS.textPrimary, marginVertical: 8, fontWeight: '600' },
  progress: { marginVertical: 16 },
  items: { marginVertical: 16 },
  itemRow: { marginBottom: 8 },
  customizationText: { color: UI_COLORS.textSecondary, marginLeft: 12 },
  queue: { marginTop: 12, fontWeight: 'bold', color: UI_COLORS.textSecondary },
  button: { marginTop: 8 },
});

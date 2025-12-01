import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, FlatList } from 'react-native';
import { Text, Card, Switch, Button, Appbar, IconButton, Chip, Portal, Dialog, Divider } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ordersService,
  tablesService,
  callRequestsService,
  usersService,
} from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getSocket } from '../../config/socket';
import { TaskNotificationPanel } from '../../components/TaskNotificationPanel';
import { UI_COLORS } from '../../config/constants';
import { Order, Table, CallRequest } from '../../types';

type TableWithDetails = Table & {
  orders: Order[];
  callRequests: CallRequest[];
  hasPendingOrder: boolean;
  hasCallRequest: boolean;
};

export const WaiterDashboard = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isOnline, setIsOnline] = useState(Boolean(user?.isOnline));
  const [tables, setTables] = useState<TableWithDetails[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableWithDetails | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allTables, allOrders, allCallRequests] = await Promise.all([
        tablesService.getAll(),
        ordersService.getAll(),
        callRequestsService.getAll({ status: 'pending' }),
      ]);

      // Get ready orders for kitchen card
      const ready = allOrders.filter(order => order.status === 'ready');
      setReadyOrders(ready);

      // Combine tables with their orders and call requests
      const tablesWithDetails: TableWithDetails[] = allTables.map(table => {
        const tableOrders = allOrders.filter(order => order.tableId === table.id);
        const tableCallRequests = allCallRequests.filter(call => call.tableId === table.id);
        const hasPendingOrder = tableOrders.some(order => 
          ['pending', 'confirmed', 'preparing'].includes(order.status)
        );
        const hasCallRequest = tableCallRequests.length > 0;

        return {
          ...table,
          orders: tableOrders,
          callRequests: tableCallRequests,
          hasPendingOrder,
          hasCallRequest,
        };
      });

      setTables(tablesWithDetails);
    } catch (error) {
      console.error('Failed to load waiter data:', error);
      showToast('Veriler yüklenemedi. Lütfen tekrar deneyin.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const interval = setInterval(loadData, 15000);
      return () => clearInterval(interval);
    }, [loadData])
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleOrderUpdate = () => loadData();
    const handleCallUpdate = () => loadData();

    socket.on('order:new', handleOrderUpdate);
    socket.on('order:updated', handleOrderUpdate);
    socket.on('order:confirmed', handleOrderUpdate);
    socket.on('call:new', handleCallUpdate);
    socket.on('call:completed', handleCallUpdate);
    socket.on('table:updated', handleOrderUpdate);

    return () => {
      socket.off('order:new', handleOrderUpdate);
      socket.off('order:updated', handleOrderUpdate);
      socket.off('order:confirmed', handleOrderUpdate);
      socket.off('call:new', handleCallUpdate);
      socket.off('call:completed', handleCallUpdate);
      socket.off('table:updated', handleOrderUpdate);
    };
  }, [user, loadData]);

  const handleToggleOnline = async (value: boolean) => {
    setIsOnline(value);
    if (!user) return;

    try {
      await usersService.update(user.id, { isOnline: value });
      showToast(`Artık ${value ? 'çevrimiçi' : 'çevrimdışı'}sınız.`, 'success');
    } catch (error) {
      console.error('Failed to update online status:', error);
      setIsOnline(!value);
      showToast('Durum güncellenemedi. Lütfen tekrar deneyin.', 'error');
    }
  };

  const handleTablePress = (table: TableWithDetails) => {
    setSelectedTable(table);
    setDialogVisible(true);
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await ordersService.updateStatus(orderId, 'confirmed');
      showToast('Sipariş onaylandı', 'success');
      loadData();
      setDialogVisible(false);
    } catch (error) {
      console.error('Failed to confirm order:', error);
      showToast('Sipariş onaylanamadı', 'error');
    }
  };

  const handleDeliverOrder = async (orderId: string) => {
    try {
      await ordersService.updateStatus(orderId, 'completed');
      showToast('Sipariş teslim edildi', 'success');
      loadData();
      setDialogVisible(false);
    } catch (error) {
      console.error('Failed to deliver order:', error);
      showToast('Sipariş teslim edilemedi', 'error');
    }
  };

  const handleCompleteCallRequest = async (callId: string) => {
    try {
      await callRequestsService.complete(callId);
      showToast('İstek tamamlandı', 'success');
      loadData();
      setDialogVisible(false);
    } catch (error) {
      console.error('Failed to complete call request:', error);
      showToast('İstek tamamlanamadı', 'error');
    }
  };

  const handleVacateTable = async (tableId: string) => {
    try {
      await tablesService.update(tableId, { status: 'available', currentOccupants: [] });
      showToast('Masa boşaltıldı', 'success');
      loadData();
      setDialogVisible(false);
    } catch (error) {
      console.error('Failed to vacate table:', error);
      showToast('Masa boşaltılamadı', 'error');
    }
  };

  const renderKitchenCard = () => (
    <Card style={styles.kitchenCard}>
      <Card.Content>
        <View style={styles.kitchenHeader}>
          <Text variant="headlineSmall" style={styles.kitchenTitle}>🍳 Mutfak</Text>
          {readyOrders.length > 0 && (
            <Chip style={styles.badge}>{readyOrders.length} Hazır</Chip>
          )}
        </View>
        {readyOrders.length === 0 ? (
          <Text variant="bodyMedium" style={styles.emptyText}>Hazır sipariş yok</Text>
        ) : (
          <View style={styles.readyOrdersList}>
            {readyOrders.map((order) => (
              <View key={order.id} style={styles.readyOrderItem}>
                <Text variant="bodyMedium" style={styles.readyOrderText}>
                  <Text style={styles.boldText}>Masa {order.tableName}:</Text> {order.items?.length || 0} ürün
                </Text>
                <Text variant="bodySmall" style={styles.customerName}>
                  {order.customerName}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderTableCard = ({ item: table }: { item: TableWithDetails }) => {
    const hasAction = table.hasPendingOrder || table.hasCallRequest;
    const isOccupied = table.status === 'occupied';
    const cardStyle = [
      styles.tableCard,
      isOccupied && styles.tableCardOccupied,
      hasAction && styles.tableCardActive,
    ].filter(Boolean);

  return (
      <Card style={cardStyle} onPress={() => handleTablePress(table)}>
        <Card.Content>
          <View style={styles.tableHeader}>
            <Text variant="titleLarge" style={styles.tableName}>
              {table.name}
            </Text>
            {hasAction && (
              <Chip style={styles.actionBadge} textStyle={styles.actionBadgeText}>
                {table.hasPendingOrder && table.hasCallRequest ? 'Sipariş + İstek' :
                 table.hasPendingOrder ? 'Sipariş' : 'İstek'}
              </Chip>
            )}
            </View>
          <View style={styles.tableInfo}>
            <Text variant="bodySmall" style={styles.tableStatus}>
              Durum: {isOccupied ? 'Dolu' : 'Boş'}
            </Text>
            {table.callRequests.length > 0 && (
              <Text variant="bodySmall" style={styles.callRequestText}>
                {table.callRequests.length} istek
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Garson Paneli" />
        <IconButton
          icon="refresh"
          iconColor="#6200EE"
          size={24}
          onPress={() => {
            loadData();
            showToast('Yenilendi', 'success');
          }}
        />
      </Appbar.Header>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        <Card style={styles.statusCard}>
          <Card.Content>
            <View style={styles.statusRow}>
              <Text variant="titleLarge">Durum</Text>
              <View style={styles.switch}>
                <Text>{isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</Text>
                <Switch value={isOnline} onValueChange={handleToggleOnline} />
              </View>
            </View>
          </Card.Content>
        </Card>

        {renderKitchenCard()}

        <Text variant="titleLarge" style={styles.sectionTitle}>Masalar</Text>
        <FlatList
          data={tables}
          renderItem={renderTableCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.tablesGrid}
        />

        <Button
          mode="contained"
          onPress={() => navigation.navigate('ManualOrder' as never)}
          style={styles.button}
          icon="plus"
        >
          Manuel Sipariş Oluştur
      </Button>
    </ScrollView>

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>{selectedTable?.name}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={styles.dialogContent}>
              {selectedTable?.orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).map((order) => (
                <View key={order.id} style={styles.orderSection}>
                  <Text variant="titleMedium" style={styles.orderTitle}>
                    Sipariş #{order.id.slice(0, 8)}
                  </Text>
                  <Text variant="bodySmall" style={styles.orderStatus}>
                    Durum: {order.status === 'pending' ? 'Beklemede' :
                            order.status === 'confirmed' ? 'Onaylandı' :
                            order.status === 'preparing' ? 'Hazırlanıyor' :
                            order.status === 'ready' ? 'Hazır' : 'Tamamlandı'}
                  </Text>
                  <Text variant="bodySmall" style={styles.orderCustomer}>
                    Müşteri: {order.customerName}
                  </Text>
                  <Text variant="bodySmall" style={styles.orderTotal}>
                    Toplam: ₺{Number(order.totalAmount).toFixed(2)}
                  </Text>
                  
                  <View style={styles.orderActions}>
                    {order.status === 'pending' && (
                      <Button
                        mode="contained"
                        onPress={() => handleConfirmOrder(order.id)}
                        style={styles.actionButton}
                        buttonColor="#4CAF50"
                      >
                        Siparişi Onayla
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button
                        mode="contained"
                        onPress={() => handleDeliverOrder(order.id)}
                        style={styles.actionButton}
                        buttonColor="#2196F3"
                      >
                        Teslim Edildi
                      </Button>
                    )}
                  </View>
                  <Divider style={styles.divider} />
                </View>
              ))}

              {selectedTable?.callRequests.map((call) => (
                <View key={call.id} style={styles.callSection}>
                  <Text variant="titleMedium" style={styles.callTitle}>
                    {call.type === 'bill' ? '💳 Hesap' :
                     call.type === 'napkin' ? '🧻 Peçete' :
                     call.type === 'cleaning' ? '🧹 Temizlik' : 'İstek'}
                  </Text>
                  <Text variant="bodySmall" style={styles.callCustomer}>
                    Müşteri: {call.customerName}
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => handleCompleteCallRequest(call.id)}
                    style={styles.actionButton}
                    buttonColor="#FF9800"
                  >
                    Görev Tamamlandı
                  </Button>
                  <Divider style={styles.divider} />
                </View>
              ))}

              {selectedTable?.status === 'occupied' && (
                <View style={styles.vacateSection}>
                  <Button
                    mode="outlined"
                    onPress={() => handleVacateTable(selectedTable.id)}
                    style={styles.vacateButton}
                    textColor="#F44336"
                  >
                    Masa Boşaltıldı
                  </Button>
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>

      <TaskNotificationPanel />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: UI_COLORS.background },
  header: { backgroundColor: '#fff', elevation: 0 },
  statusCard: { marginBottom: 16, backgroundColor: UI_COLORS.surface },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switch: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kitchenCard: {
    marginBottom: 16,
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  kitchenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kitchenTitle: {
    fontWeight: 'bold',
    color: '#E65100',
  },
  badge: {
    backgroundColor: '#4CAF50',
  },
  emptyText: {
    color: UI_COLORS.textSecondary,
    fontStyle: 'italic',
  },
  readyOrdersList: {
    gap: 8,
  },
  readyOrderItem: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  readyOrderText: {
    color: UI_COLORS.textPrimary,
  },
  boldText: {
    fontWeight: 'bold',
  },
  customerName: {
    color: UI_COLORS.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
    fontWeight: 'bold',
    color: UI_COLORS.textPrimary,
  },
  tablesGrid: {
    gap: 12,
  },
  tableCard: {
    flex: 1,
    margin: 6,
    backgroundColor: UI_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  tableCardOccupied: {
    backgroundColor: '#F5F5F5',
  },
  tableCardActive: {
    borderWidth: 3,
    borderColor: '#2E7D32',
    backgroundColor: '#F1F8E9',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableName: {
    fontWeight: 'bold',
    color: UI_COLORS.textPrimary,
  },
  actionBadge: {
    backgroundColor: '#2E7D32',
  },
  actionBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  tableInfo: {
    gap: 4,
  },
  tableStatus: {
    color: UI_COLORS.textSecondary,
  },
  callRequestText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  button: {
    marginTop: 16,
    marginBottom: 24,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogContent: {
    paddingHorizontal: 8,
  },
  orderSection: {
    marginBottom: 16,
  },
  orderTitle: {
    fontWeight: 'bold',
    color: UI_COLORS.textPrimary,
    marginBottom: 4,
  },
  orderStatus: {
    color: UI_COLORS.textSecondary,
    marginBottom: 4,
  },
  orderCustomer: {
    color: UI_COLORS.textSecondary,
    marginBottom: 4,
  },
  orderTotal: {
    color: UI_COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 12,
  },
  orderActions: {
    marginTop: 8,
  },
  actionButton: {
    marginTop: 8,
  },
  callSection: {
    marginBottom: 16,
  },
  callTitle: {
    fontWeight: 'bold',
    color: UI_COLORS.textPrimary,
    marginBottom: 4,
  },
  callCustomer: {
    color: UI_COLORS.textSecondary,
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  vacateSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.border,
  },
  vacateButton: {
    borderColor: '#F44336',
  },
});

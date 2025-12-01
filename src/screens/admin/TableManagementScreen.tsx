import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, Platform } from 'react-native';
import { Text, Button, Card, FAB, Dialog, Portal, TextInput, Chip, IconButton, Appbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { tablesService } from '../../services/tables.service';
import { Table } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export const TableManagementScreen = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tableName, setTableName] = useState('');
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadTables();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTables();
      const interval = setInterval(() => {
        loadTables();
      }, 15000); // 15 saniyede bir otomatik refresh
      return () => clearInterval(interval);
    }, [])
  );

  const loadTables = async () => {
    try {
      const data = await tablesService.getAll();
      setTables(data);
    } catch (error) {
      console.error('Failed to load tables:', error);
      Alert.alert('Error', 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTable(null);
    setTableName('');
    setDialogVisible(true);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setTableName(table.name);
    setDialogVisible(true);
  };

  const handleSave = async () => {
    if (!tableName.trim()) {
      Alert.alert('Error', 'Please enter a table name');
      return;
    }

    try {
      if (editingTable) {
        const updated = await tablesService.update(editingTable.id, { name: tableName });
        setTables(tables.map((t: Table) => t.id === updated.id ? updated : t));
      } else {
        const created = await tablesService.create({ name: tableName });
        setTables([...tables, created]);
      }
      setDialogVisible(false);
      setTableName('');
      setEditingTable(null);
    } catch (error: any) {
      console.error('Failed to save table:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save table');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this table?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await tablesService.delete(id);
              setTables(tables.filter((t: Table) => t.id !== id));
            } catch (error) {
              console.error('Failed to delete table:', error);
              Alert.alert('Error', 'Failed to delete table');
            }
          },
        },
      ]
    );
  };

  const handleDownloadQR = async (table: Table, format: 'png' | 'svg' | 'jpg') => {
    try {
      const blob = await tablesService.downloadQRCode(table.id, format);
      
      if (Platform.OS === 'web') {
        // Create download link for web
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `table-${table.name}-qr.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        Alert.alert('Success', 'QR code downloaded');
      }
    } catch (error) {
      console.error('Failed to download QR code:', error);
      Alert.alert('Error', 'Failed to download QR code');
    }
  };

  const getOccupancyDuration = (occupiedSince?: string) => {
    if (!occupiedSince) return null;
    
    const start = new Date(occupiedSince);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const renderTable = ({ item }: { item: Table }) => {
    const duration = getOccupancyDuration(item.occupiedSince);
    const occupantCount = item.currentOccupants?.length || 0;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleLarge">{item.name}</Text>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                item.status === 'occupied' ? styles.occupiedChip : styles.availableChip
              ]}
            >
              {item.status}
            </Chip>
          </View>

          {item.status === 'occupied' && (
            <View style={styles.occupancyInfo}>
              <Text variant="bodyMedium">
                Duration: {duration}
              </Text>
              <Text variant="bodyMedium">
                Occupants: {occupantCount}
              </Text>
              {item.currentOccupants && item.currentOccupants.length > 0 && (
                <Text variant="bodySmall" style={styles.occupantNames}>
                  {item.currentOccupants.map(o => o.name).join(', ')}
                </Text>
              )}
            </View>
          )}

          <View style={styles.qrSection}>
            <Text variant="bodyMedium" style={styles.qrLabel}>QR Code Downloads:</Text>
            <View style={styles.qrButtons}>
              <Button
                mode="outlined"
                compact
                onPress={() => handleDownloadQR(item, 'png')}
                style={styles.qrButton}
              >
                PNG
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => handleDownloadQR(item, 'svg')}
                style={styles.qrButton}
              >
                SVG
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => handleDownloadQR(item, 'jpg')}
                style={styles.qrButton}
              >
                JPG
              </Button>
            </View>
          </View>
        </Card.Content>
        <Card.Actions>
          <IconButton icon="pencil" onPress={() => handleEdit(item)} />
          <IconButton icon="delete" onPress={() => handleDelete(item.id)} />
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Table Management" />
        <IconButton
          icon="refresh"
          iconColor="#6200EE"
          size={24}
          onPress={() => {
            loadTables();
            showToast('Yenilendi', 'success');
          }}
        />
      </Appbar.Header>
      
      <View style={styles.stats}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleMedium">Total Tables</Text>
            <Text variant="headlineSmall">{tables.length}</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleMedium">Occupied</Text>
            <Text variant="headlineSmall">
              {tables.filter((t: Table) => t.status === 'occupied').length}
            </Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleMedium">Available</Text>
            <Text variant="headlineSmall">
              {tables.filter((t: Table) => t.status === 'available').length}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <FlatList
        data={tables}
        keyExtractor={item => item.id}
        renderItem={renderTable}
        refreshing={loading}
        onRefresh={loadTables}
        contentContainerStyle={styles.listContent}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleCreate}
        label="Add Table"
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editingTable ? 'Edit Table' : 'Create Table'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Table Name"
              value={tableName}
              onChangeText={setTableName}
              placeholder="e.g., M1, Teras-3"
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSave}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: { backgroundColor: '#fff', elevation: 0 },
  title: {
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    height: 28,
  },
  occupiedChip: {
    backgroundColor: '#ffebee',
  },
  availableChip: {
    backgroundColor: '#e8f5e9',
  },
  occupancyInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  occupantNames: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  qrSection: {
    marginTop: 12,
  },
  qrLabel: {
    marginBottom: 8,
  },
  listContent: { padding: 16 },
  qrButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  qrButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, List } from 'react-native-paper';
import { tablesService, menuItemsService, ordersService } from '../../services';

export const ManualOrderForm = ({ navigation }: any) => {
  const [tables, setTables] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [t, i] = await Promise.all([tablesService.getAll(), menuItemsService.getAll()]);
    setTables(t);
    setItems(i);
  };

  const handleContinue = async () => {
    if (!selectedTable || !customerName.trim()) {
      return;
    }
    
    const table = tables.find(t => t.id === selectedTable);
    if (!table) return;
    
    // Update table status to occupied when waiter selects table for manual order
    try {
      await tablesService.update(selectedTable, {
        status: 'occupied',
        occupiedSince: new Date().toISOString(),
        currentOccupants: [{
          name: customerName.trim(),
          joinedAt: new Date().toISOString(),
        }],
      });
    } catch (error) {
      console.error('Failed to update table status:', error);
      // Continue even if table update fails
    }
    
    // Navigate to CustomerMenuScreen with table and customer info
    (navigation as any).navigate('WaiterCustomerMenu', {
      tableId: selectedTable,
      customerName: customerName.trim(),
      tableSlug: table.name,
      isWaiterMode: true,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Manual Order</Text>
      
      <TextInput label="Customer Name" value={customerName} onChangeText={setCustomerName} mode="outlined" style={styles.input} />
      
      <Text variant="titleMedium">Select Table</Text>
      {tables.map(t => (
        <List.Item
          key={t.id}
          title={t.name}
          onPress={() => setSelectedTable(t.id)}
          left={() => <List.Icon icon={selectedTable === t.id ? 'check' : 'circle-outline'} />}
        />
      ))}

      <Button mode="contained" onPress={handleContinue} disabled={!selectedTable || !customerName.trim()} style={styles.button}>
        Continue to Menu
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { marginBottom: 16 },
  input: { marginBottom: 16 },
  button: { marginTop: 16 },
});

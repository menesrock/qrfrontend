import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Button, Chip, Appbar, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { tablesService } from '../../services';
import { useToast } from '../../contexts/ToastContext';

export const WaiterTablesScreen = () => {
  const [tables, setTables] = useState<any[]>([]);
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
      console.error(error);
    }
  };

  const handleVacant = async (id: string) => {
    try {
      await tablesService.update(id, { status: 'available', currentOccupants: [] });
      loadTables();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Tables" />
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
      <FlatList
        data={tables}
        keyExtractor={t => t.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleLarge">{item.name}</Text>
                <Chip>{item.status}</Chip>
              </View>
              {Array.isArray(item.currentOccupants) && item.currentOccupants.length > 0 && (
                <View style={styles.occupantsContainer}>
                  {item.currentOccupants.map((o: any, i: number) => (
                    <Text key={i} variant="bodySmall">• {o.name || o}</Text>
                  ))}
                </View>
              )}
            </Card.Content>
            {item.status === 'occupied' && (
              <Card.Actions>
                <Button onPress={() => handleVacant(item.id)}>Mark Vacant</Button>
              </Card.Actions>
            )}
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: '#fff', elevation: 0 },
  title: { marginBottom: 16 },
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  occupantsContainer: { marginTop: 8 },
});

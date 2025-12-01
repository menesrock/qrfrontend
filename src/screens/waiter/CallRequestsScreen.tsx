import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Button, Chip, Appbar, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { callRequestsService } from '../../services';
import { useToast } from '../../contexts/ToastContext';

export const CallRequestsScreen = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
      const interval = setInterval(() => {
        loadRequests();
      }, 15000); // 15 saniyede bir otomatik refresh
      return () => clearInterval(interval);
    }, [])
  );

  const loadRequests = async () => {
    try {
      const data = await callRequestsService.getAll({ status: 'pending' });
      setRequests(data);
    } catch (error) {
      console.error(error);
      showToast('İstekler yüklenemedi', 'error');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await callRequestsService.complete(id);
      loadRequests();
      showToast('İstek tamamlandı', 'success');
    } catch (error: any) {
      console.error(error);
      showToast('İstek tamamlanamadı', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Call Requests" />
        <IconButton
          icon="refresh"
          iconColor="#6200EE"
          size={24}
          onPress={() => {
            loadRequests();
            showToast('Yenilendi', 'success');
          }}
        />
      </Appbar.Header>
      <FlatList
        data={requests}
        keyExtractor={r => r.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleLarge">Table {item.tableName}</Text>
                <Chip>{item.type}</Chip>
              </View>
              <Text>{item.customerName}</Text>
              <Text variant="bodySmall">{new Date(item.createdAt).toLocaleTimeString()}</Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => handleComplete(item.id)}>Complete</Button>
            </Card.Actions>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No pending requests</Text>}
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
  empty: { textAlign: 'center', marginTop: 32 },
});

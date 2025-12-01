import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Button, Text, Snackbar } from 'react-native-paper';
import { callRequestsService } from '../../services';

export const WaiterCallPanel = ({ tableId, tableName, customerName }: any) => {
  const [snackbar, setSnackbar] = useState('');

  const handleCall = async (type: string) => {
    try {
      await callRequestsService.create({ tableId, tableName, customerName, type });
      setSnackbar(`${type} request sent!`);
    } catch (error) {
      setSnackbar('Failed to send request');
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>Need Assistance?</Text>
          <Button mode="contained" onPress={() => handleCall('bill')} style={styles.button}>
            Request Bill
          </Button>
          <Button mode="contained" onPress={() => handleCall('napkin')} style={styles.button}>
            Request Napkin
          </Button>
          <Button mode="contained" onPress={() => handleCall('cleaning')} style={styles.button}>
            Request Cleaning
          </Button>
        </Card.Content>
      </Card>
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000}>
        {snackbar}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: {},
  title: { marginBottom: 16, textAlign: 'center' },
  button: { marginVertical: 8 },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AppTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>QR Restaurant System</Text>
      <Text style={styles.subtext}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});

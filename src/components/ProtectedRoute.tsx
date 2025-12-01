import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Access Denied</Text>
        <Text style={styles.subtext}>You must be logged in to access this page</Text>
      </View>
    );
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Access Denied</Text>
        <Text style={styles.subtext}>You don't have permission to access this page</Text>
        <Button mode="contained" onPress={signOut} style={styles.button}>
          Sign Out
        </Button>
      </View>
    );
  }

  // Check permission-based access
  if (requiredPermission) {
    const hasPermission =
      user.role === 'admin' || user.permissions?.includes(requiredPermission);

    if (!hasPermission) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Access Denied</Text>
          <Text style={styles.subtext}>You don't have the required permission</Text>
          <Button mode="contained" onPress={signOut} style={styles.button}>
            Sign Out
          </Button>
        </View>
      );
    }
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
  },
});

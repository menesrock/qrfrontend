import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import {
  Text,
  Button,
  Card,
  FAB,
  Dialog,
  Portal,
  TextInput,
  Chip,
  IconButton,
  RadioButton,
  Checkbox,
  Appbar,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { usersService } from '../../services/users.service';
import { User } from '../../types';
import { useToast } from '../../contexts/ToastContext';

const SYSTEM_ROLES = ['admin', 'waiter', 'chef'];

const AVAILABLE_PERMISSIONS = [
  'menu:read',
  'menu:write',
  'orders:read',
  'orders:write',
  'tables:read',
  'tables:write',
  'users:read',
  'users:write',
  'settings:read',
  'settings:write',
  'feedback:read',
  'calls:read',
  'calls:write',
];

export const UserManagementScreen = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('waiter');
  const [customRole, setCustomRole] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isCustomRole, setIsCustomRole] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
      const interval = setInterval(() => {
        loadUsers();
      }, 15000); // 15 saniyede bir otomatik refresh
      return () => clearInterval(interval);
    }, [])
  );

  const loadUsers = async () => {
    try {
      const data = await usersService.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setEmail('');
    setPassword('');
    setRole('waiter');
    setCustomRole('');
    setSelectedPermissions([]);
    setIsCustomRole(false);
    setDialogVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEmail(user.email);
    setPassword('');
    
    const isSystemRole = SYSTEM_ROLES.includes(user.role);
    setIsCustomRole(!isSystemRole);
    
    if (isSystemRole) {
      setRole(user.role);
      setCustomRole('');
    } else {
      setRole('custom');
      setCustomRole(user.role);
    }
    
    setSelectedPermissions(user.permissions || []);
    setDialogVisible(true);
  };

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }

    if (!editingUser && !password.trim()) {
      Alert.alert('Error', 'Password is required for new users');
      return false;
    }

    if (password && password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    if (isCustomRole && !customRole.trim()) {
      Alert.alert('Error', 'Custom role name is required');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const finalRole = isCustomRole ? customRole : role;
      const userData: any = {
        email,
        role: finalRole,
        permissions: isCustomRole ? selectedPermissions : [],
      };

      if (password) {
        userData.password = password;
      }

      if (editingUser) {
        const updated = await usersService.update(editingUser.id, userData);
        setUsers(users.map((u: User) => (u.id === updated.id ? updated : u)));
      } else {
        if (!password) {
          Alert.alert('Error', 'Password is required for new users');
          return;
        }
        userData.password = password;
        const created = await usersService.create(userData);
        setUsers([...users, created]);
      }

      setDialogVisible(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save user');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await usersService.delete(id);
            setUsers(users.filter((u: User) => u.id !== id));
          } catch (error) {
            console.error('Failed to delete user:', error);
            Alert.alert('Error', 'Failed to delete user');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setRole('waiter');
    setCustomRole('');
    setSelectedPermissions([]);
    setIsCustomRole(false);
    setEditingUser(null);
  };

  const togglePermission = (permission: string) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permission));
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
    }
  };

  const getRoleColor = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return '#f44336';
      case 'waiter':
        return '#2196f3';
      case 'chef':
        return '#ff9800';
      default:
        return '#9c27b0';
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Text variant="titleLarge">{item.email}</Text>
            <Chip
              mode="flat"
              style={[styles.roleChip, { backgroundColor: getRoleColor(item.role) + '20' }]}
              textStyle={{ color: getRoleColor(item.role) }}
            >
              {item.role}
            </Chip>
          </View>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: item.isOnline ? '#4caf50' : '#9e9e9e' },
              ]}
            />
            <Text variant="bodySmall">{item.isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        {item.permissions && item.permissions.length > 0 && (
          <View style={styles.permissionsSection}>
            <Text variant="bodySmall" style={styles.permissionsLabel}>
              Permissions:
            </Text>
            <View style={styles.permissionsList}>
              {item.permissions.map((perm) => (
                <Chip key={perm} compact style={styles.permissionChip}>
                  {perm}
                </Chip>
              ))}
            </View>
          </View>
        )}
      </Card.Content>
      <Card.Actions>
        <IconButton icon="pencil" onPress={() => handleEdit(item)} />
        <IconButton icon="delete" onPress={() => handleDelete(item.id)} />
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="User Management" />
        <IconButton
          icon="refresh"
          iconColor="#6200EE"
          size={24}
          onPress={() => {
            loadUsers();
            showToast('Yenilendi', 'success');
          }}
        />
      </Appbar.Header>

      <View style={styles.stats}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleMedium">Total Users</Text>
            <Text variant="headlineSmall">{users.length}</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleMedium">Online</Text>
            <Text variant="headlineSmall">
              {users.filter((u: User) => u.isOnline).length}
            </Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleMedium">Admins</Text>
            <Text variant="headlineSmall">
              {users.filter((u: User) => u.role === 'admin').length}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        refreshing={loading}
        onRefresh={loadUsers}
      />

      <FAB style={styles.fab} icon="plus" onPress={handleCreate} label="Add User" />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editingUser ? 'Edit User' : 'Create User'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={styles.dialogContent}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <TextInput
                label={editingUser ? 'New Password (leave empty to keep current)' : 'Password'}
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />

              <Text variant="titleSmall" style={styles.sectionTitle}>
                Role
              </Text>

              <RadioButton.Group
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setIsCustomRole(true);
                  } else {
                    setIsCustomRole(false);
                    setRole(value);
                  }
                }}
                value={isCustomRole ? 'custom' : role}
              >
                {SYSTEM_ROLES.map((r) => (
                  <View key={r} style={styles.radioItem}>
                    <RadioButton value={r} />
                    <Text>{r}</Text>
                  </View>
                ))}
                <View style={styles.radioItem}>
                  <RadioButton value="custom" />
                  <Text>Custom Role</Text>
                </View>
              </RadioButton.Group>

              {isCustomRole && (
                <>
                  <TextInput
                    label="Custom Role Name"
                    value={customRole}
                    onChangeText={setCustomRole}
                    mode="outlined"
                    style={styles.input}
                  />

                  <Text variant="titleSmall" style={styles.sectionTitle}>
                    Permissions
                  </Text>

                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <View key={perm} style={styles.checkboxItem}>
                      <Checkbox
                        status={selectedPermissions.includes(perm) ? 'checked' : 'unchecked'}
                        onPress={() => togglePermission(perm)}
                      />
                      <Text>{perm}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
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
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  roleChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  permissionsSection: {
    marginTop: 12,
  },
  permissionsLabel: {
    marginBottom: 4,
    fontWeight: '600',
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  permissionChip: {
    height: 24,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  dialogContent: {
    paddingHorizontal: 24,
    maxHeight: 500,
  },
  input: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
});

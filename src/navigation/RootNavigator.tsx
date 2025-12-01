import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  LoginScreen,
  MenuManagementScreen,
  TableManagementScreen,
  UserManagementScreen,
  BrandingScreen,
  FeedbackScreen,
  CustomerManagementScreen,
  WaiterDashboard,
  WaiterOrdersScreen,
  WaiterTablesScreen,
  CallRequestsScreen,
  ManualOrderForm,
  ChefDashboard,
  CustomerMenuScreen,
  TableLandingScreen,
  OrderTrackingScreen,
} from '../screens';

const Stack = createStackNavigator<RootStackParamList>();
const AdminTabs = createBottomTabNavigator();
const WaiterStack = createStackNavigator();
const ChefStack = createStackNavigator();

const adminTabIcons: Record<string, string> = {
  MenuManagement: 'silverware-fork-knife',
  TableManagement: 'table-furniture',
  UserManagement: 'account-group',
  Branding: 'palette',
  Feedback: 'chart-bar',
  CustomerManagement: 'account-multiple',
};

const AdminNavigator = () => (
  <AdminTabs.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => (
        <MaterialCommunityIcons
          name={adminTabIcons[route.name] || 'view-grid'}
          color={color}
          size={size}
        />
      ),
    })}
  >
    <AdminTabs.Screen
      name="MenuManagement"
      component={MenuManagementScreen}
      options={{ title: 'Menu' }}
    />
    <AdminTabs.Screen
      name="TableManagement"
      component={TableManagementScreen}
      options={{ title: 'Tables' }}
    />
    <AdminTabs.Screen
      name="UserManagement"
      component={UserManagementScreen}
      options={{ title: 'Users' }}
    />
    <AdminTabs.Screen
      name="Branding"
      component={BrandingScreen}
      options={{ title: 'Branding' }}
    />
    <AdminTabs.Screen
      name="Feedback"
      component={FeedbackScreen}
      options={{ title: 'Feedback' }}
    />
    <AdminTabs.Screen
      name="CustomerManagement"
      component={CustomerManagementScreen}
      options={{ title: 'Müşteriler' }}
    />
  </AdminTabs.Navigator>
);

const WaiterNavigator = () => (
  <WaiterStack.Navigator>
    <WaiterStack.Screen
      name="WaiterDashboard"
      component={WaiterDashboard}
      options={{ headerShown: false }}
    />
    <WaiterStack.Screen
      name="WaiterOrders"
      component={WaiterOrdersScreen}
      options={{ title: 'Orders' }}
    />
    <WaiterStack.Screen
      name="WaiterTables"
      component={WaiterTablesScreen}
      options={{ title: 'Tables' }}
    />
    <WaiterStack.Screen
      name="CallRequests"
      component={CallRequestsScreen}
      options={{ title: 'Call Requests' }}
    />
    <WaiterStack.Screen
      name="ManualOrder"
      component={ManualOrderForm}
      options={{ title: 'Manual Order' }}
    />
    <WaiterStack.Screen
      name="WaiterCustomerMenu"
      component={CustomerMenuScreen}
      options={{ title: 'Customer Menu' }}
    />
  </WaiterStack.Navigator>
);

const ChefNavigator = () => (
  <ChefStack.Navigator screenOptions={{ headerShown: false }}>
    <ChefStack.Screen name="ChefDashboard" component={ChefDashboard} />
  </ChefStack.Navigator>
);

const RootNavigator = () => {
  const { user, loading } = useAuth();
  const navigatorKey = user ? `auth-${user.role}` : 'guest';
  const initialRoute: keyof RootStackParamList = user
    ? user.role === 'admin'
      ? 'AdminPanel'
      : user.role === 'waiter'
        ? 'WaiterPanel'
        : 'ChefPanel'
    : 'Login';

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={[styles.text, { marginTop: 16 }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={navigatorKey}
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          {user.role === 'admin' && (
            <Stack.Screen name="AdminPanel" component={AdminNavigator} />
          )}
          {user.role === 'waiter' && (
            <Stack.Screen name="WaiterPanel" component={WaiterNavigator} />
          )}
          {user.role === 'chef' && (
            <Stack.Screen name="ChefPanel" component={ChefNavigator} />
          )}
        </>
      )}
      <Stack.Screen
        name="TableLanding"
        component={TableLandingScreen}
        options={{ headerShown: true, title: 'Table Check-in' }}
      />
      <Stack.Screen
        name="CustomerMenu"
        component={CustomerMenuScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ headerShown: true, title: 'Order Tracking' }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});

export default RootNavigator;

// Navigation type definitions
export type RootStackParamList = {
  Login: undefined;
  AdminPanel: undefined;
  WaiterPanel: undefined;
  ChefPanel: undefined;
  TableLanding: { tableId?: string; tableSlug?: string };
  CustomerMenu: { tableId: string; customerName: string };
  OrderTracking: { orderId: string };
};

export type AdminStackParamList = {
  MenuManagement: undefined;
  TableManagement: undefined;
  UserManagement: undefined;
  Branding: undefined;
  Feedback: undefined;
  CustomerManagement: undefined;
};

export type WaiterStackParamList = {
  Orders: undefined;
  Tables: undefined;
  CallRequests: undefined;
  ManualOrder: undefined;
};

export type ChefStackParamList = {
  OrderQueue: undefined;
  KitchenStats: undefined;
};

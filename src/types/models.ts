// Type definitions for QR Restaurant System

// User and Authentication Types
export type UserRole = 'admin' | 'waiter' | 'chef' | string;

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isOnline: boolean;
  createdAt: string;
  permissions?: string[];
}

// Menu Types
export interface MenuItem {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  description: string;
  descriptionTranslations: Record<string, string>;
  price: number;
  category: string;
  imageUrl?: string | null;
  isPopular: boolean;
  popularRank?: number;
  displayOrder?: number | null;
  isActive: boolean;
  nutritionalInfo?: NutritionalInfo;
  allergens?: string[];
  createdAt: string;
  updatedAt: string;
  customizations?: Customization[];
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Customization Types
export type CustomizationType = 'option' | 'extra' | 'removal';

export interface CustomizationOption {
  name: string;
  price: number;
  isDefault: boolean;
}

export interface Customization {
  id: string;
  menuItemId: string;
  type: CustomizationType;
  name: string;
  options: CustomizationOption[];
  allowMultiple: boolean;
  required: boolean;
}

// Table Types
export type TableStatus = 'available' | 'occupied';

export interface TableOccupant {
  name: string;
  joinedAt: string;
}

export interface Table {
  id: string;
  name: string;
  qrCodeUrl: string;
  status: TableStatus;
  occupiedSince?: string;
  currentOccupants?: TableOccupant[];
  createdAt: string;
}

// Order Types
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed';
export type OrderSource = 'customer' | 'manual';

export interface OrderItemCustomizationOption {
  name: string;
  price?: number;
}

export interface OrderItemCustomization {
  customizationId: string;
  name?: string;
  type?: CustomizationType;
  selectedOptions: OrderItemCustomizationOption[];
}

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  basePrice: number;
  customizations: OrderItemCustomization[];
  customerNotes?: string;
  itemTotal: number;
}

export interface Order {
  id: string;
  tableId: string;
  tableName: string;
  customerName: string;
  customerEmail?: string | null;
  customerId?: string | null;
  items: OrderItem[];
  status: OrderStatus;
  queuePosition?: number;
  totalAmount: number;
  orderSource: OrderSource;
  claimedBy?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  confirmedAt?: string;
  readyAt?: string;
  completedAt?: string;
}

// Call Request Types
export type CallRequestType = 'bill' | 'napkin' | 'cleaning';
export type CallRequestStatus = 'pending' | 'completed';

export interface CallRequest {
  id: string;
  tableId: string;
  tableName: string;
  customerName: string;
  type: CallRequestType;
  status: CallRequestStatus;
  claimedBy?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
}

// Feedback Types
export interface FeedbackRatings {
  service: number;
  hygiene: number;
  product: number;
  overall: number;
}

export interface Feedback {
  id: string;
  tableId: string;
  orderId: string;
  ratings: FeedbackRatings;
  comment?: string;
  mentionedProducts?: string[];
  createdAt: string;
}

// Settings Types
export interface BrandingColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Settings {
  crossSellRules?: Record<string, string[]> | null;
  id: string;
  logo: string | null;
  colors: BrandingColors;
  restaurantName: string;
  customerMenuBaseUrl?: string | null;
  menuCategories?: string[];
  updatedAt: string;
}

// Role Types
export interface Role {
  id: string;
  name: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
}

// Language Types
export type Language = 'tr' | 'en';

// Application constants

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  MENU_ITEMS: 'menuItems',
  CUSTOMIZATIONS: 'customizations',
  TABLES: 'tables',
  ORDERS: 'orders',
  CALL_REQUESTS: 'callRequests',
  FEEDBACK: 'feedback',
  SETTINGS: 'settings',
  ROLES: 'roles',
} as const;

// Default branding colors (monochrome palette)
export const DEFAULT_COLORS = {
  primary: '#121212',
  secondary: '#2F2F2F',
  accent: '#8C8C8C',
};

export const UI_COLORS = {
  background: '#F4F4F4',
  surface: '#FFFFFF',
  surfaceMuted: '#E5E5E5',
  surfaceDark: '#1A1A1A',
  textPrimary: '#111111',
  textSecondary: '#5C5C5C',
  border: '#D4D4D4',
};

export const DEFAULT_MENU_CATEGORIES = [
  'Kahvaltılıklar',
  'Başlangıçlar / Atıştırmalıklar',
  'Çorbalar',
  'Salatalar',
  'Ana Yemekler',
  'Fast Food / Burgerler',
  'Pizzalar ve Hamur İşleri',
  'Makarnalar ve Risottolar',
  'Deniz Ürünleri',
  'Sıcak İçecekler',
  'Soğuk İçecekler',
  'Şaraplar',
  'Kokteyller',
  'Tatlılar',
  'Ekstralar / Yan Ürünler',
];

// Validation constants
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NOTE_LENGTH: 500,
  LONG_OCCUPANCY_HOURS: 2,
} as const;

// Supported languages
export const LANGUAGES = {
  TR: 'tr',
  EN: 'en',
} as const;

// Image formats
export const IMAGE_FORMATS = {
  MENU_ITEM: ['image/png', 'image/jpeg', 'image/webp'],
  LOGO: ['image/png', 'image/svg+xml'],
  QR_CODE: ['png', 'svg', 'jpg'],
} as const;

// App domain
export const APP_DOMAIN = 'localhost:19006';

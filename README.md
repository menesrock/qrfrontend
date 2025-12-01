# 🍽️ QR Restaurant System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Tests](https://img.shields.io/badge/tests-26%20passing-brightgreen.svg)
![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-green.svg)
![Frontend](https://img.shields.io/badge/frontend-React%20Native%20Web-blue.svg)
![Database](https://img.shields.io/badge/database-PostgreSQL-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Modern, QR kod tabanlı restoran sipariş yönetim sistemi**

[Özellikler](#-özellikler) • [Kurulum](#-kurulum) • [Kullanım](#-kullanım) • [API](#-api-dokümantasyonu) • [Test](#-test)

</div>

---

## 📋 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Özellikler](#-özellikler)
- [Teknoloji Stack](#-teknoloji-stack)
- [Kurulum](#-kurulum)
- [Kullanım](#-kullanım)
- [Proje Yapısı](#-proje-yapısı)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Test](#-test)
- [Katkıda Bulunma](#-katkıda-bulunma)

## 🎯 Genel Bakış

QR Restaurant System, restoranlar için modern ve kullanıcı dostu bir dijital sipariş yönetim platformudur. Müşteriler QR kod okutarak menüyü görüntüleyebilir, sipariş verebilir ve garson çağırabilir. Sistem aynı zamanda admin, garson ve şef panelleri ile tam bir restoran yönetim çözümü sunar.

### 🎥 Demo

```
🔗 Backend API: http://localhost:3000
🔗 Frontend Web: http://localhost:8081
```

### 👥 Kullanıcı Rolleri

- **Admin**: Tam sistem kontrolü (menü, masa, kullanıcı, marka yönetimi)
- **Garson**: Sipariş ve masa yönetimi, çağrı yanıtlama
- **Şef**: Mutfak siparişlerini görüntüleme ve durum güncelleme
- **Müşteri**: QR kod ile menü görüntüleme ve sipariş verme

## ✨ Özellikler

### 👨‍💼 Admin Dashboard
- ✅ **Menü Yönetimi**: CRUD işlemleri, görsel yükleme, kategori yönetimi
- ✅ **Masa Yönetimi**: QR kod oluşturma, masa durumu takibi
- ✅ **Kullanıcı Yönetimi**: Rol bazlı erişim kontrolü
- ✅ **Marka Özelleştirme**: Logo, renk şeması özelleştirme
- ✅ **Geri Bildirim Raporları**: Müşteri değerlendirmeleri ve CSV export

### 📱 Müşteri Arayüzü
- ✅ **QR Kod Erişimi**: Masa QR kodu ile hızlı giriş
- ✅ **Dijital Menü**: Kategori filtreleme, arama, popüler ürünler
- ✅ **Sipariş Sepeti**: Özelleştirme seçenekleri, not ekleme
- ✅ **Sipariş Takibi**: Gerçek zamanlı durum güncellemeleri
- ✅ **Garson Çağırma**: Hesap, peçete, temizlik talepleri
- ✅ **Geri Bildirim**: Hizmet, hijyen, ürün değerlendirme

### 👨‍🍳 Garson Paneli
- ✅ **Sipariş Yönetimi**: Onaylama, hazırlık, teslim durumları
- ✅ **Masa Takibi**: Aktif masalar, müşteri bilgileri
- ✅ **Çağrı Yönetimi**: Müşteri taleplerini yanıtlama
- ✅ **Manuel Sipariş**: Telefon/yüz yüze siparişler

### 🧑‍🍳 Şef Paneli
- ✅ **Sipariş Kuyruğu**: Bekleyen siparişler listesi
- ✅ **Durum Güncelleme**: Hazırlanıyor, hazır durumları
- ✅ **Sipariş Detayları**: Ürün, miktar, özelleştirmeler

## 🛠️ Teknoloji Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io
- **File Upload**: Multer + Sharp
- **Validation**: Zod
- **Testing**: Jest + fast-check (Property-Based Testing)

### Frontend
- **Framework**: React Native Web
- **UI Library**: React Native Paper (Material Design)
- **Navigation**: React Navigation
- **State Management**: Context API
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **QR Code**: react-native-qrcode-svg
- **i18n**: i18next

### DevOps
- **Version Control**: Git
- **Package Manager**: npm
- **Development**: ts-node-dev, Expo
- **Testing**: Jest, Supertest, fast-check

## 📦 Kurulum

### Gereksinimler

- Node.js 18+ 
- PostgreSQL 12+
- npm veya yarn

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/yourusername/qr-restaurant-system.git
cd qr-restaurant-system
```

### 2. Backend Kurulumu

```bash
cd backend

# Bağımlılıkları yükleyin
npm install

# .env dosyasını oluşturun
cp .env.example .env

# .env dosyasını düzenleyin ve PostgreSQL bilgilerinizi girin
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/qr_restaurant?schema=public"

# Prisma client oluşturun
npx prisma generate

# Veritabanı migration'ını çalıştırın
npx prisma migrate dev --name init

# Seed data ekleyin (örnek kullanıcılar ve menü)
npm run prisma:seed
```

### 3. Frontend Kurulumu

```bash
# Ana dizine dönün
cd ..

# Bağımlılıkları yükleyin
npm install

# .env dosyasını oluşturun
cp .env.example .env
```

### 4. Uygulamayı Başlatın

**Backend'i başlatın:**
```bash
cd backend
npm run dev
```

Backend şu adreste çalışacak: `http://localhost:3000`

**Frontend'i başlatın (yeni terminal):**
```bash
npm start
```

Frontend şu adreste çalışacak: `http://localhost:8081`

## 🚀 Kullanım

### Varsayılan Giriş Bilgileri

Seed script çalıştırıldıktan sonra aşağıdaki kullanıcılarla giriş yapabilirsiniz:

| Rol | Email | Şifre |
|-----|-------|-------|
| Admin | admin@restaurant.com | admin123 |
| Garson | waiter@restaurant.com | waiter123 |
| Şef | chef@restaurant.com | chef123 |

### Hızlı Başlangıç

1. **Admin olarak giriş yapın** ve menü öğeleri ekleyin
2. **Masa QR kodları oluşturun** (Admin > Masa Yönetimi)
3. **QR kodu tarayın** veya müşteri arayüzüne gidin
4. **Sipariş verin** ve gerçek zamanlı takip edin
5. **Garson panelinden** siparişleri onaylayın
6. **Şef panelinden** siparişleri hazırlayın

## 📁 Proje Yapısı

```
qr-restaurant-system/
├── backend/                    # Backend API
│   ├── prisma/                # Prisma schema ve migrations
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Seed data
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   ├── __tests__/         # Property-based tests
│   │   └── server.ts          # Express server
│   ├── uploads/               # Uploaded files
│   └── package.json
│
├── src/                       # Frontend source
│   ├── components/            # Reusable components
│   ├── contexts/              # React contexts
│   ├── navigation/            # Navigation setup
│   ├── screens/               # Screen components
│   │   ├── admin/            # Admin screens
│   │   ├── customer/         # Customer screens
│   │   ├── waiter/           # Waiter screens
│   │   └── chef/             # Chef screens
│   ├── services/              # API services
│   ├── types/                 # TypeScript types
│   └── utils/                 # Utility functions
│
├── .kiro/                     # Kiro specs
│   └── specs/
│       └── qr-restaurant-system/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
│
├── App.tsx                    # Root component
├── package.json
└── README.md
```

## 🔌 API Dokümantasyonu

### Base URL
```
http://localhost:3000/api
```

### Authentication
Tüm korumalı endpoint'ler için JWT token gereklidir:
```
Authorization: Bearer <token>
```

### Ana Endpoint'ler

#### Authentication
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/refresh` - Token yenileme
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

#### Menu Items
- `GET /api/menu-items` - Tüm menü öğeleri
- `GET /api/menu-items/:id` - Tek menü öğesi
- `POST /api/menu-items` - Yeni menü öğesi (Admin)
- `PUT /api/menu-items/:id` - Menü öğesi güncelleme (Admin)
- `DELETE /api/menu-items/:id` - Menü öğesi silme (Admin)

#### Orders
- `GET /api/orders` - Tüm siparişler
- `GET /api/orders/:id` - Tek sipariş
- `POST /api/orders` - Yeni sipariş
- `PUT /api/orders/:id` - Sipariş güncelleme
- `PUT /api/orders/:id/status` - Sipariş durumu güncelleme

#### Tables
- `GET /api/tables` - Tüm masalar
- `GET /api/tables/:id` - Tek masa
- `POST /api/tables` - Yeni masa (Admin)
- `PUT /api/tables/:id` - Masa güncelleme (Admin)
- `DELETE /api/tables/:id` - Masa silme (Admin)

#### Call Requests
- `GET /api/call-requests` - Tüm çağrılar
- `POST /api/call-requests` - Yeni çağrı
- `PUT /api/call-requests/:id/complete` - Çağrıyı tamamla

#### Users
- `GET /api/users` - Tüm kullanıcılar (Admin)
- `POST /api/users` - Yeni kullanıcı (Admin)
- `PUT /api/users/:id` - Kullanıcı güncelleme (Admin)
- `DELETE /api/users/:id` - Kullanıcı silme (Admin)

#### Settings
- `GET /api/settings` - Sistem ayarları
- `PUT /api/settings` - Ayarları güncelle (Admin)

#### Customizations
- `GET /api/customizations` - Özelleştirmeler
- `POST /api/customizations` - Yeni özelleştirme (Admin)

#### Upload
- `POST /api/upload` - Dosya yükleme

Detaylı API dokümantasyonu için `backend/README.md` dosyasına bakın.

## 🧪 Test

### Backend Testleri

Proje 26 property-based test içerir (fast-check kullanarak):

```bash
cd backend

# Tüm testleri çalıştır
npm test

# Watch mode
npm run test:watch

# Coverage raporu
npm run test:coverage
```

### Test Kategorileri

- ✅ **Authentication Tests**: Login, register, token validation
- ✅ **CRUD Tests**: Menu items, tables, orders
- ✅ **User Management Tests**: User creation, role validation
- ✅ **QR Code Tests**: QR generation, validation
- ✅ **Branding Tests**: Color validation, settings
- ✅ **Feedback Tests**: Rating validation, feedback creation

### Property-Based Testing

Projede property-based testing yaklaşımı kullanılmıştır. Bu yaklaşım:
- Rastgele test verileri üretir (100+ iterasyon)
- Edge case'leri otomatik bulur
- Daha güvenilir test coverage sağlar

## 🚢 Deployment

### Backend Deployment

1. **Environment Variables**: Production .env dosyasını ayarlayın
2. **Build**: `npm run build`
3. **Database**: Production PostgreSQL'i ayarlayın
4. **Migration**: `npx prisma migrate deploy`
5. **Start**: `npm start`

### Frontend Deployment

1. **Build**: `expo build:web`
2. **Deploy**: Build klasörünü web sunucusuna yükleyin

### Önerilen Platformlar

- **Backend**: Heroku, Railway, DigitalOcean, AWS
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Database**: Heroku Postgres, Supabase, AWS RDS

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen şu adımları izleyin:

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Commit Mesaj Formatı

```
feat: Yeni özellik
fix: Bug düzeltmesi
docs: Dokümantasyon değişikliği
style: Kod formatı değişikliği
refactor: Kod refactoring
test: Test ekleme/düzeltme
chore: Build/config değişiklikleri
```

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👨‍💻 Geliştirici

Muhammed Enes Kaya

## 🙏 Teşekkürler

- React Native ve Expo ekiplerine
- Prisma ekibine
- Tüm açık kaynak katkıda bulunanlara

---

<div align="center">

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın! ⭐**

Made with ❤️ by Muhammed Enes Kaya

</div>

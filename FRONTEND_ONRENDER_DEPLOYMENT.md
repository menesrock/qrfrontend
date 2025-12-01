# Frontend OnRender Deployment Rehberi

Bu rehber, React Native Web (Expo) frontend uygulamanızı OnRender'da deploy etmek için adım adım talimatlar içerir.

## 📋 Ön Hazırlık

### 1. Backend URL'inizi Not Edin
Backend'iniz şu URL'de çalışıyor:
```
https://qr-restaurant-backend-q9g2.onrender.com
```

### 2. GitHub Repository Hazır
Frontend dosyalarınız şu repository'de:
```
https://github.com/menesrock/qrfrontend
```

---

## 🚀 Adım Adım Deployment

### ADIM 1: OnRender Dashboard'a Giriş Yapın

1. Tarayıcınızda [https://dashboard.render.com](https://dashboard.render.com) adresine gidin
2. GitHub hesabınızla giriş yapın (eğer yapmadıysanız)

---

### ADIM 2: Yeni Web Service Oluşturun

1. OnRender dashboard'da sağ üst köşedeki **"New +"** butonuna tıklayın
2. Açılan menüden **"Web Service"** seçeneğini seçin

---

### ADIM 3: GitHub Repository'yi Bağlayın

1. **"Connect account"** veya **"Connect GitHub"** butonuna tıklayın
2. GitHub hesabınızı bağlayın (eğer bağlı değilse)
3. Repository listesinden **"menesrock/qrfrontend"** repository'sini seçin
4. **"Connect"** butonuna tıklayın

---

### ADIM 4: Web Service Ayarlarını Yapın

Aşağıdaki ayarları sırayla doldurun:

#### 4.1. Name (İsim)
```
qr-restaurant-frontend
```
veya istediğiniz bir isim

#### 4.2. Region (Bölge)
- **Oregon (US West)** seçin (backend ile aynı region olmalı)

#### 4.3. Branch (Dal)
```
main
```

#### 4.4. Root Directory (Kök Klasör)
**Boş bırakın** (tüm dosyalar root'ta)

#### 4.5. Environment (Ortam)
```
Node
```
Dropdown'dan "Node" seçin

#### 4.6. Build Command (Build Komutu)
```
npm install && npm run build
```

#### 4.7. Start Command (Başlatma Komutu)
```
npx serve -s web-build -l 10000
```

**Not:** Eğer `serve` paketi yoksa, package.json'a ekleyeceğiz.

---

### ADIM 5: Environment Variables (Ortam Değişkenleri) Ekleyin

**"Environment"** sekmesine gidin ve şu değişkenleri ekleyin:

#### 5.1. REACT_APP_API_URL
```
https://qr-restaurant-backend-q9g2.onrender.com/api
```
**Açıklama:** Backend API URL'iniz

#### 5.2. REACT_APP_SOCKET_URL
```
https://qr-restaurant-backend-q9g2.onrender.com
```
**Açıklama:** WebSocket bağlantısı için backend URL'i

#### 5.3. NODE_ENV
```
production
```

#### 5.4. PORT
```
10000
```
**Not:** OnRender otomatik set eder, ama yine de ekleyin

---

### ADIM 6: Instance Type Seçin

- **Free** plan'ı seçin (ücretsiz)
- **"Create Web Service"** butonuna tıklayın

---

### ADIM 7: Deploy İşlemini İzleyin

1. OnRender otomatik olarak deploy işlemini başlatır
2. **"Logs"** sekmesinden build ve deploy loglarını izleyebilirsiniz
3. İşlem 5-10 dakika sürebilir

---

## ⚠️ ÖNEMLİ: Package.json Güncellemesi

Deploy etmeden önce `package.json` dosyasına `serve` paketini eklemeliyiz:

### GitHub'da package.json'ı Güncelleyin

1. GitHub'da `qrfrontend` repository'sine gidin
2. `package.json` dosyasını açın
3. `scripts` bölümüne şunu ekleyin:

```json
"scripts": {
  "start": "expo start --web",
  "web": "expo start --web",
  "build": "expo export:web",
  "serve": "npx serve -s web-build -l 10000"
}
```

4. `dependencies` bölümüne ekleyin (eğer yoksa):

```json
"dependencies": {
  ...
  "serve": "^14.2.0"
}
```

---

## 🔧 API URL'ini Güncelleme

Frontend'in backend'e bağlanabilmesi için `src/config/api.ts` dosyasını güncelleyin:

### GitHub'da api.ts'yi Güncelleyin

1. GitHub'da `src/config/api.ts` dosyasını açın
2. Şu satırı:

```typescript
const API_URL = 'http://localhost:3000/api';
```

Şununla değiştirin:

```typescript
const API_URL = process.env.REACT_APP_API_URL || 'https://qr-restaurant-backend-q9g2.onrender.com/api';
```

3. Commit ve push yapın

---

## 📝 Alternatif: render.yaml ile Otomatik Deploy

Eğer render.yaml dosyası kullanmak isterseniz, repository'ye şu dosyayı ekleyin:

### render.yaml Dosyası Oluşturun

GitHub repository'nize `render.yaml` dosyası ekleyin:

```yaml
version: "1"

projects:
  - name: QR Restaurant Frontend
    environments:
      - name: Production
        services:
          - type: web
            name: qr-restaurant-frontend
            env: node
            plan: free
            region: oregon
            buildCommand: npm install && npm run build
            startCommand: npx serve -s web-build -l 10000
            envVars:
              - key: NODE_ENV
                value: production
              - key: REACT_APP_API_URL
                value: https://qr-restaurant-backend-q9g2.onrender.com/api
              - key: REACT_APP_SOCKET_URL
                value: https://qr-restaurant-backend-q9g2.onrender.com
              - key: PORT
                value: 10000
            autoDeployTrigger: commit
```

Sonra OnRender'da:
1. **"New +"** → **"Blueprint"** seçin
2. Repository'yi bağlayın
3. Otomatik olarak deploy edilir

---

## ✅ Başarı Kontrolü

Deploy başarılı olduğunda:

1. **"Events"** sekmesinde "Deploy successful" mesajını görmelisiniz
2. Web service'inizin URL'ini alın (örn: `https://qr-restaurant-frontend-xxx.onrender.com`)
3. Tarayıcıda açın ve test edin

---

## 🐛 Sorun Giderme

### Build Hatası

**Sorun:** `expo export:web` komutu bulunamıyor

**Çözüm:** 
- `package.json`'da `build` script'ini kontrol edin
- `expo-cli` veya `@expo/cli` yüklü olduğundan emin olun

### API Bağlantı Hatası

**Sorun:** Frontend backend'e bağlanamıyor

**Çözüm:**
1. Environment variable'ları kontrol edin
2. Backend URL'inin doğru olduğundan emin olun
3. CORS ayarlarını kontrol edin (backend'de)

### Port Hatası

**Sorun:** "App is not listening on port 10000"

**Çözüm:**
- Start command'da `-l 10000` parametresini kontrol edin
- `serve` paketinin yüklü olduğundan emin olun

---

## 📞 Yardım

Sorun yaşarsanız:
1. OnRender Logs sekmesini kontrol edin
2. Build ve Runtime loglarını inceleyin
3. GitHub repository'deki dosyaları kontrol edin

---

## 🎉 Başarılı Deploy Sonrası

Deploy başarılı olduktan sonra:

1. Frontend URL'inizi backend'in `CORS_ORIGIN` environment variable'ına ekleyin
2. Backend'de CORS ayarlarını güncelleyin
3. Her iki servisi de test edin

**Backend CORS_ORIGIN güncelleme:**
OnRender backend service'inizde:
- Environment Variables → `CORS_ORIGIN`
- Değer: `https://qr-restaurant-frontend-xxx.onrender.com`

---

**İyi çalışmalar! 🚀**


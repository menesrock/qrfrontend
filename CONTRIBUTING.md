# Katkıda Bulunma Rehberi

QR Restaurant System projesine katkıda bulunmak istediğiniz için teşekkür ederiz! 🎉

## 📋 İçindekiler

- [Davranış Kuralları](#davranış-kuralları)
- [Nasıl Katkıda Bulunabilirim?](#nasıl-katkıda-bulunabilirim)
- [Geliştirme Süreci](#geliştirme-süreci)
- [Commit Mesaj Kuralları](#commit-mesaj-kuralları)
- [Pull Request Süreci](#pull-request-süreci)
- [Kod Standartları](#kod-standartları)

## 📜 Davranış Kuralları

Bu proje ve topluluğu herkes için açık ve misafirperver bir ortam sağlamayı taahhüt eder. Lütfen:

- Saygılı ve yapıcı olun
- Farklı bakış açılarına açık olun
- Yapıcı eleştiri kabul edin
- Topluluk için en iyisine odaklanın

## 🤝 Nasıl Katkıda Bulunabilirim?

### Bug Bildirimi

Bug bulduysanız:

1. Önce [Issues](https://github.com/yourusername/qr-restaurant-system/issues) sayfasında benzer bir issue olup olmadığını kontrol edin
2. Yoksa yeni bir issue açın ve şunları ekleyin:
   - Açıklayıcı bir başlık
   - Bug'ı yeniden oluşturma adımları
   - Beklenen davranış
   - Gerçek davranış
   - Ekran görüntüleri (varsa)
   - Sistem bilgileri (OS, Node version, vb.)

### Özellik Önerisi

Yeni bir özellik önermek için:

1. [Issues](https://github.com/yourusername/qr-restaurant-system/issues) sayfasında benzer bir öneri olup olmadığını kontrol edin
2. Yeni bir issue açın ve şunları ekleyin:
   - Özelliğin açıklaması
   - Neden gerekli olduğu
   - Nasıl çalışması gerektiği
   - Örnek kullanım senaryoları

### Kod Katkısı

1. Projeyi fork edin
2. Feature branch oluşturun
3. Değişikliklerinizi yapın
4. Test ekleyin/güncelleyin
5. Pull request açın

## 🔧 Geliştirme Süreci

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/yourusername/qr-restaurant-system.git
cd qr-restaurant-system
```

### 2. Branch Oluşturun

```bash
git checkout -b feature/amazing-feature
# veya
git checkout -b fix/bug-fix
```

Branch isimlendirme:
- `feature/` - Yeni özellikler için
- `fix/` - Bug düzeltmeleri için
- `docs/` - Dokümantasyon için
- `refactor/` - Kod refactoring için
- `test/` - Test ekleme/düzeltme için

### 3. Geliştirme Yapın

```bash
# Backend geliştirme
cd backend
npm run dev

# Frontend geliştirme (yeni terminal)
npm start
```

### 4. Test Edin

```bash
# Backend testleri
cd backend
npm test

# Frontend testleri
npm test
```

### 5. Commit Edin

```bash
git add .
git commit -m "feat: Add amazing feature"
```

### 6. Push Edin

```bash
git push origin feature/amazing-feature
```

### 7. Pull Request Açın

GitHub'da pull request açın ve:
- Değişikliklerinizi açıklayın
- İlgili issue'ları referans verin
- Ekran görüntüleri ekleyin (UI değişiklikleri için)

## 📝 Commit Mesaj Kuralları

Conventional Commits standardını kullanıyoruz:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: Yeni özellik
- `fix`: Bug düzeltmesi
- `docs`: Dokümantasyon değişikliği
- `style`: Kod formatı (kod davranışını etkilemeyen)
- `refactor`: Kod refactoring
- `test`: Test ekleme/düzeltme
- `chore`: Build/config değişiklikleri
- `perf`: Performance iyileştirmesi

### Örnekler

```bash
feat(menu): Add category filter functionality
fix(auth): Fix token expiration issue
docs(readme): Update installation instructions
style(components): Format code with prettier
refactor(api): Simplify order creation logic
test(orders): Add property-based tests for order validation
chore(deps): Update dependencies
perf(database): Optimize menu item queries
```

## 🔍 Pull Request Süreci

### PR Checklist

Pull request açmadan önce:

- [ ] Kod çalışıyor ve test edildi
- [ ] Yeni testler eklendi (gerekiyorsa)
- [ ] Tüm testler geçiyor
- [ ] Dokümantasyon güncellendi (gerekiyorsa)
- [ ] Commit mesajları kurallara uygun
- [ ] Kod standartlarına uygun
- [ ] Conflict yok

### PR Açıklaması

PR açıklamanızda şunları ekleyin:

```markdown
## Değişiklikler
- Değişiklik 1
- Değişiklik 2

## İlgili Issue
Closes #123

## Test Edildi
- [ ] Backend testleri
- [ ] Frontend testleri
- [ ] Manuel test

## Ekran Görüntüleri
(UI değişiklikleri için)
```

### Review Süreci

1. En az bir maintainer review yapacak
2. Gerekli değişiklikler talep edilebilir
3. Tüm yorumlar çözüldükten sonra merge edilecek

## 💻 Kod Standartları

### TypeScript

- Strict mode kullanın
- Type safety'e dikkat edin
- `any` kullanmaktan kaçının
- Interface'leri tercih edin

```typescript
// ✅ İyi
interface User {
  id: string;
  email: string;
  role: 'admin' | 'waiter' | 'chef';
}

// ❌ Kötü
const user: any = { ... };
```

### React/React Native

- Functional components kullanın
- Hooks kullanın
- Props için interface tanımlayın
- Component'leri küçük tutun

```typescript
// ✅ İyi
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ title, onPress, disabled }) => {
  return <TouchableOpacity onPress={onPress} disabled={disabled}>...</TouchableOpacity>;
};

// ❌ Kötü
const Button = (props: any) => { ... };
```

### Backend

- RESTful API standartlarına uyun
- Error handling yapın
- Validation kullanın
- Async/await kullanın

```typescript
// ✅ İyi
export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const validated = menuItemSchema.parse(req.body);
    const item = await prisma.menuItem.create({ data: validated });
    res.status(201).json(item);
  } catch (error) {
    handleError(error, res);
  }
};

// ❌ Kötü
export const createMenuItem = (req, res) => {
  prisma.menuItem.create({ data: req.body }).then(item => res.json(item));
};
```

### Testing

- Property-based testing kullanın
- Edge case'leri test edin
- Test isimleri açıklayıcı olsun

```typescript
// ✅ İyi
describe('Order Creation', () => {
  it('should create order with valid data', async () => {
    await fc.assert(
      fc.asyncProperty(orderArbitrary, async (order) => {
        const result = await createOrder(order);
        expect(result).toBeDefined();
        expect(result.totalAmount).toBeGreaterThan(0);
      })
    );
  });
});
```

### Dosya Yapısı

```
src/
├── components/       # Reusable components
├── screens/         # Screen components
├── services/        # API services
├── types/           # TypeScript types
├── utils/           # Utility functions
└── __tests__/       # Tests
```

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
  - `MenuScreen.tsx`, `apiService.ts`
- **Components**: PascalCase
  - `MenuCard`, `OrderList`
- **Functions**: camelCase
  - `createOrder`, `validateUser`
- **Constants**: UPPER_SNAKE_CASE
  - `API_URL`, `MAX_FILE_SIZE`
- **Types/Interfaces**: PascalCase
  - `User`, `MenuItem`, `OrderStatus`

## 🎨 UI/UX Kuralları

- Material Design prensiplerini takip edin
- Responsive design yapın
- Accessibility'e dikkat edin
- Tutarlı spacing kullanın
- Color scheme'e uyun

## 📚 Dokümantasyon

- Kod yorumları ekleyin (gerektiğinde)
- README'yi güncel tutun
- API değişikliklerini dokümante edin
- Örnek kullanımlar ekleyin

## ❓ Sorular

Sorularınız için:

- [Issues](https://github.com/yourusername/qr-restaurant-system/issues) sayfasında soru açın
- Maintainer'lara ulaşın

## 🙏 Teşekkürler

Katkılarınız için teşekkür ederiz! Her katkı, projeyi daha iyi hale getirir. 🚀

---

Happy Coding! 💻✨

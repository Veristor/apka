# ⚡ Enspirion Professional Dashboard

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/enspirion/energy-dashboard)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-enabled-purple.svg)](manifest.json)
[![PSE API](https://img.shields.io/badge/PSE%20API-v2-orange.svg)](https://api.raporty.pse.pl/)

> **Professional energy management dashboard for PV portfolio monitoring and redispatch risk analysis**

Enspirion Dashboard to zaawansowany system monitorowania portfela fotowoltaicznego z integracją PSE API, dedykowany dla firm energetycznych działających w Polsce.

## 📊 **Główne funkcje**

### 🎯 **Core Features**
- **Real-time Portfolio Monitoring** - Monitoring generacji PV w czasie rzeczywistym
- **Redispatch Risk Analysis** - Analiza ryzyka wezwania do redysponowania
- **PSE API Integration** - Pełna integracja z PSE API v2 (wszystkie endpointy)
- **Professional Charts** - 4 kluczowe wykresy biznesowe w stylu PSE
- **Mobile-First PWA** - Aplikacja Progressive Web App dla urządzeń mobilnych

### 📈 **Business Intelligence**
- **Portfolio Performance** - Kalkulacja wydajności względem rynku krajowego
- **Financial Metrics** - Szacowanie przychodów i strat
- **Risk Forecasting** - Predykcja ryzyka na kolejne 7 dni
- **Market Analysis** - Analiza pozycji rynkowej i konkurencyjnej

### 🛡️ **Corporate Ready**
- **VPN Compatible** - Zoptymalizowane dla środowisk korporacyjnych
- **Firewall Safe** - Brak zewnętrznych CDN, wszystko self-contained
- **Security First** - Bezpieczne nagłówki, walidacja danych
- **Offline Capable** - Działanie offline z cache'owanymi danymi

## 🚀 **Quick Start**

### **Opcja A: GitHub Pages (Zalecane)**

1. **Fork tego repozytorium**
```bash
# Kliknij "Fork" na GitHub lub użyj CLI
gh repo fork enspirion/energy-dashboard --clone
```

2. **Aktywuj GitHub Pages**
```bash
# W ustawieniach repo: Settings > Pages > Source: GitHub Actions
```

3. **Deploy automatyczny**
```bash
git push origin main
# GitHub Actions automatycznie zbuduje i wdroży aplikację
```

4. **Dostęp do aplikacji**
```
https://[twoj-username].github.io/energy-dashboard/
```

### **Opcja B: Local Development**

1. **Clone repository**
```bash
git clone https://github.com/enspirion/energy-dashboard.git
cd energy-dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open browser**
```
http://localhost:3000
```

## 📋 **System Requirements**

### **Minimum Requirements**
- **Node.js**: 18.0.0+
- **NPM**: 8.0.0+
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Network**: Dostęp do PSE API (apimpdv2-bmgdhhajexe8aade.a01.azurefd.net)

### **Recommended Environment**
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 20.04+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Network**: Stabilne połączenie internetowe (może działać przez VPN)

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENSPIRION DASHBOARD                          │
├─────────────────────────────────────────────────────────────────┤
│  📊 KPIs        │  📈 Forecasts    │  🎯 Risk        │  ⚡ Portfolio │
├─────────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Portfolio Calc │  Risk Analyzer   │  Data Processor │  UI Manager │
├─────────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  PSE API Service │  Cache Manager  │  Service Worker │  LocalStorage │
├─────────────────────────────────────────────────────────────────┤
│                   EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│                    PSE API v2 (1.4.35)                         │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 **Business Charts**

### **1. 📈 Prognoza vs Zapotrzebowanie KSE**
- **Cel**: Porównanie prognozy generacji PV z rzeczywistym zapotrzebowaniem
- **Dane**: PSE API endpoints `/gen-jw`, `/kse-load`, `/price-fcst`
- **Update**: Co 5 minut
- **Business Value**: Identyfikacja godzin nadprodukcji/deficytu

### **2. 🎯 Heatmapa Ryzyka Wezwania (7 dni × 24h)**
- **Cel**: Wizualizacja ryzyka redysponowania w czasie
- **Algorytm**: 4-czynnikowy model ryzyka (historia, ograniczenia, generacja, obciążenie)
- **Update**: Co 15 minut
- **Business Value**: Predykcja i minimalizacja ryzyka finansowego

### **3. ⚡ Generacja PV (%) + Portfolio Performance**
- **Cel**: Monitoring udziału PV w KSE + wydajność portfolio firmy
- **Kalkulacja**: `Portfolio Generation = KSE PV % × Portfolio Capacity × Efficiency`
- **Update**: Co 1 minutę
- **Business Value**: Benchmarking względem średniej krajowej

### **4. ⚠️ Historia Nierynkowego Redysponowania**
- **Cel**: Analiza trendów i kosztów redysponowania
- **Timeline**: Ostatnie 30/90 dni lub rok
- **Metryki**: Liczba zdarzeń, utracona energia, straty finansowe
- **Business Value**: Optymalizacja strategii handlowej

## ⚙️ **Configuration**

### **Portfolio Settings**
```javascript
// Dostępne przez UI lub localStorage
{
  "defaultCapacity": 25.5,        // MW - wielkość portfolio
  "efficiency": 0.85,             // 85% - sprawność techniczna
  "availabilityFactor": 0.95,     // 95% - dostępność
  "degradationRate": 0.005        // 0.5% - degradacja roczna
}
```

### **Business Settings**
```javascript
{
  "averageEnergyPrice": 300,      // PLN/MWh
  "curtailmentPenalty": 50,       // PLN/MWh - kara za redysponowanie
  "maintenanceCost": 2,           // PLN/MWh - koszt utrzymania
  "operatingCost": 5              // PLN/MWh - koszt operacyjny
}
```

### **API Configuration**
```javascript
{
  "baseUrl": "https://apimpdv2-bmgdhhajexe8aade.a01.azurefd.net/api/",
  "timeout": 10000,               // 10s (dłużej dla VPN)
  "retries": 3,                   // Automatyczne ponowienia
  "rateLimit": {
    "maxRequests": 100,           // Maksymalnie requestów
    "windowMs": 60000             // w oknie czasowym (1 min)
  }
}
```

## 🔧 **Development**

### **Project Structure**
```
enspirion-dashboard/
├── 📁 assets/
│   ├── css/
│   │   ├── main.css              # Main stylesheet
│   │   ├── charts.css            # Chart-specific styles
│   │   └── mobile.css            # Mobile responsive
│   └── js/
│       ├── config.js             # Configuration
│       ├── pse-api.js            # PSE API service
│       ├── portfolio-calculator.js # Portfolio logic
│       ├── risk-calculator.js    # Risk analysis
│       └── app.js                # Main application
├── 📁 tests/
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
├── index.html                    # Main HTML
├── manifest.json                 # PWA manifest
├── sw.js                        # Service worker
├── package.json                  # Dependencies
└── README.md                     # This file
```

### **Available Scripts**

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier

# Performance
npm run lighthouse       # Lighthouse audit
npm run bundle-analyze   # Bundle size analysis

# Security
npm run security-audit   # Security audit
npm run security-fix     # Fix vulnerabilities

# Deployment
npm run deploy           # Deploy to GitHub Pages
npm run deploy:github    # Deploy to GitHub Pages (production)
```

### **Environment Variables**
```bash
# .env.local (create this file)
VITE_PSE_API_BASE_URL=https://apimpdv2-bmgdhhajexe8aade.a01.azurefd.net/api/
VITE_APP_VERSION=2.0.0
VITE_ENABLE_DEBUG=false
VITE_PORTFOLIO_DEFAULT_CAPACITY=25.5
VITE_CACHE_TTL=300000
```

## 📱 **Mobile & PWA Features**

### **Progressive Web App**
- ✅ **Installable** - Można zainstalować na telefonie/tablecie
- ✅ **Offline Capable** - Działanie bez internetu z cache'owanymi danymi
- ✅ **Push Notifications** - Alerty o krytycznych zdarzeniach (wyłączone w corporate)
- ✅ **Background Sync** - Synchronizacja danych w tle
- ✅ **Responsive Design** - Adaptuje się do każdego ekranu

### **Mobile Optimization**
- **Touch-First UI** - Większe przyciski, gestury
- **Reduced Data Usage** - Mniej danych na mobile
- **Battery Optimization** - Energooszczędne algorytmy
- **Network Awareness** - Adaptacja do jakości połączenia

## 🛡️ **Security & Compliance**

### **Corporate Security**
- **Content Security Policy** - Ochrona przed XSS
- **No External Dependencies** - Wszystko self-contained
- **Data Validation** - Walidacja wszystkich danych wejściowych
- **Secure Headers** - Bezpieczne nagłówki HTTP
- **VPN Compatible** - Działanie przez corporate VPN

### **Data Protection**
- **GDPR Compliant** - Zgodność z GDPR
- **No Tracking** - Brak analytics/tracking
- **Local Storage Only** - Dane przechowywane lokalnie
- **API Security** - Bezpieczna komunikacja z PSE API

## 🚀 **Deployment Options**

### **1. GitHub Pages (Recommended)**
```bash
# Automatic deployment with GitHub Actions
git push origin main
# App available at: https://[username].github.io/energy-dashboard/
```

### **2. Netlify**
```bash
# Connect GitHub repo to Netlify
# Auto-deploy on push to main
# Custom domain support
```

### **3. Vercel**
```bash
# Import GitHub repo to Vercel
# Automatic deployments
# Edge optimization
```

### **4. Self-Hosted**
```bash
npm run build
# Copy dist/ folder to your web server
# Ensure HTTPS and proper headers
```

## 📈 **Performance Targets**

### **Core Web Vitals**
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### **Bundle Sizes**
- **Initial Load**: < 500KB (gzipped)
- **Charts Module**: < 200KB
- **PSE API Module**: < 100KB
- **Total Assets**: < 2MB

### **Runtime Performance**
- **Memory Usage**: < 50MB
- **CPU Usage**: < 10% average
- **API Response Time**: < 3s (via VPN)
- **Cache Hit Rate**: > 80%

## 🔄 **API Integration Details**

### **PSE API v2 Endpoints Used**
```javascript
const endpoints = {
  // Core data
  '/gen-jw',              // Generacja jednostek wytwórczych
  '/kse-load',            // Obciążenie KSE
  '/ogr-oper',            // Ograniczenia operacyjne
  '/ogr-d1',              // Ograniczenia dobowe D+1
  '/price-fcst',          // Prognozy cen
  
  // Historical data
  '/his-gen-pal',         // Historyczna generacja paliw
  '/his-bil-mocy',        // Historyczne bilanse mocy
  
  // Additional data
  '/poze-redoze',         // Pozwolenia OZE
  '/crb-rozl',            // Rozliczenia CRB
  '/rce-pln'              // Plany RCE
};
```

### **Data Flow**
```
PSE API → API Service → Cache → Data Processor → Business Logic → UI Update
    ↓         ↓           ↓           ↓              ↓             ↓
Real-time → Network → localStorage → Transform → Calculate → Display
```

## 🧪 **Testing**

### **Test Coverage**
- **Unit Tests**: > 80% coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Main business scenarios
- **Performance Tests**: Lighthouse CI

### **Test Commands**
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npm test -- portfolio-calculator.test.js

# Run tests in CI environment
npm run test:ci
```

## 🤝 **Contributing**

### **Development Workflow**
1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

### **Commit Convention**
```bash
feat: add new feature
fix: bug fix
docs: documentation update
style: formatting changes
refactor: code refactoring
perf: performance improvement
test: add tests
build: build system changes
ci: CI configuration
chore: maintenance tasks
```

### **Code Standards**
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **Lint-staged**: Pre-commit validation

## 📞 **Support & Contact**

### **Documentation**
- 📖 **[API Documentation](docs/API_INTEGRATION.md)** - Szczegóły integracji PSE API
- 🏗️ **[Architecture Guide](docs/ARCHITECTURE.md)** - Architektura systemu
- 📱 **[Mobile Guide](docs/MOBILE_GUIDE.md)** - Optymalizacja mobilna
- 🚀 **[Deployment Guide](docs/DEPLOYMENT.md)** - Instrukcje wdrożenia

### **Support Channels**
- 🐛 **Issues**: [GitHub Issues](https://github.com/enspirion/energy-dashboard/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/enspirion/energy-dashboard/discussions)
- 📧 **Email**: contact@enspirion.com
- 🌐 **Website**: [enspirion.com](https://enspirion.com)

### **Professional Services**
- **Custom Implementation** - Dostosowanie do specyficznych wymagań
- **Training & Support** - Szkolenia dla zespołów
- **Consulting** - Doradztwo w zakresie energy management
- **Integration Services** - Integracja z systemami firmowymi

## 📜 **License**

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 **Related Projects**

- **[PSE API Documentation](https://api.raporty.pse.pl/)** - Oficjalna dokumentacja PSE API
- **[Chart.js](https://www.chartjs.org/)** - Biblioteka wykresów
- **[Vite](https://vitejs.dev/)** - Build tool
- **[PWA Documentation](https://web.dev/progressive-web-apps/)** - Progressive Web Apps

---

<div align="center">

**Enspirion Professional Dashboard v2.0.0**

*Professional energy management for the renewable future*

Made with ⚡ by [Enspirion](https://enspirion.com)

</div>
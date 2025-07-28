# 🚀 Enspirion Dashboard - Complete Setup Guide

## 📋 **Co masz do zrobienia - Step by Step**

### **Krok 1: Przygotowanie GitHub Repository**

1. **Stwórz nowe repozytorium GitHub**
```bash
# Opcja A: Przez GitHub Web UI
# 1. Idź na github.com
# 2. Kliknij "New repository"
# 3. Nazwa: "enspirion-dashboard" 
# 4. Publiczne (dla GitHub Pages)
# 5. Dodaj README.md
# 6. Kliknij "Create repository"

# Opcja B: Przez GitHub CLI (jeśli masz)
gh repo create enspirion-dashboard --public --add-readme
```

2. **Clone repozytorium lokalnie**
```bash
git clone https://github.com/[TWOJA-NAZWA]/enspirion-dashboard.git
cd enspirion-dashboard
```

### **Krok 2: Dodanie plików projektu**

**Skopiuj wszystkie pliki z artifacts do swojego repo:**

```
enspirion-dashboard/
├── index.html                 # ← Skopiuj z artifact 1
├── manifest.json              # ← Skopiuj z artifact 2
├── sw.js                      # ← Skopiuj z artifact 3
├── package.json               # ← Skopiuj z artifact 4
├── README.md                  # ← Skopiuj z artifact 5
├── .github/
│   └── workflows/
│       └── deploy.yml         # ← Skopiuj z artifact 6
└── assets/
    ├── css/
    │   └── main.css           # ← Skopiuj z artifact CSS
    └── js/
        ├── config.js          # ← Skopiuj z artifact config
        ├── pse-api.js         # ← Skopiuj z artifact PSE API
        ├── portfolio-calculator.js # ← Skopiuj z artifact Portfolio
        ├── risk-calculator.js # ← Skopiuj z artifact Risk
        └── app.js             # ← Skopiuj z artifact App
```

### **Krok 3: Instalacja zależności**

```bash
# W folderze projektu
npm install

# Sprawdź czy wszystko działa lokalnie
npm run dev
```

**Otwórz browser na http://localhost:3000 - powinieneś zobaczyć dashboard!**

### **Krok 4: Konfiguracja GitHub Pages**

1. **Push kodu do GitHub**
```bash
git add .
git commit -m "feat: initial Enspirion Dashboard setup"
git push origin main
```

2. **Aktywuj GitHub Pages**
   - Idź do Settings swojego repo
   - Scroll w dół do "Pages"
   - Source: "GitHub Actions"
   - Zapisz

3. **GitHub Actions automatycznie wdroży aplikację**
   - Po push'u sprawdź zakładkę "Actions"
   - Poczekaj aż workflow się ukończy (2-3 minuty)
   - Aplikacja będzie dostępna na: `https://[TWOJA-NAZWA].github.io/enspirion-dashboard/`

### **Krok 5: Konfiguracja Portfolio (Opcjonalne)**

**W aplikacji możesz skonfigurować swoje portfolio:**

1. Otwórz aplikację w browser
2. W prawym górnym rogu zmień wartość "Portfolio: 25.5 MW"
3. Kliknij ikonę 💾 aby zapisać
4. Aplikacja będzie używać Twoich wartości do kalkulacji

### **Krok 6: Testowanie integracji PSE API**

**Sprawdź czy API działa:**

1. Otwórz Developer Tools (F12)
2. Zakładka Console
3. Sprawdź czy nie ma błędów API
4. Powinieneś zobaczyć logi: "✅ PSE API connection successful"

---

## 🔧 **Dostosowywanie - Customization**

### **Zmiana kolorów firmowych**

**W pliku `assets/css/main.css` znajdź:**
```css
:root {
  --enspirion-primary: #722F37;    /* ← Zmień na swój kolor */
  --enspirion-secondary: #A0182B;  /* ← Zmień na swój kolor */
  --enspirion-accent: #C41E3A;     /* ← Zmień na swój kolor */
}
```

### **Zmiana nazwy firmy**

**W pliku `index.html` znajdź:**
```html
<h1>⚡ Enspirion Professional Dashboard</h1>
<!-- Zmień na swoją nazwę -->
<h1>⚡ [TWOJA FIRMA] Energy Dashboard</h1>
```

### **Domyślne ustawienia portfolio**

**W pliku `assets/js/config.js` znajdź:**
```javascript
portfolio: {
  defaultCapacity: 25.5,        // ← Twoja moc w MW
  efficiency: 0.85,             // ← Twoja sprawność
  availabilityFactor: 0.95,     // ← Twoja dostępność
}
```

---

## 📱 **Mobile/PWA Setup**

### **Instalacja na telefonie:**

1. **Android (Chrome):**
   - Otwórz dashboard w Chrome
   - Menu → "Add to Home screen"
   - Aplikacja będzie działać jak natywna

2. **iPhone (Safari):**
   - Otwórz dashboard w Safari
   - Share button → "Add to Home Screen"
   - Aplikacja będzie dostępna z ekranu głównego

3. **Desktop (Chrome/Edge):**
   - Otwórz dashboard
   - Adres bar → ikona instalacji
   - "Install Enspirion Dashboard"

---

## 🛠️ **Development Setup (dla programistów)**

### **Dodatkowe narzędzia:**

```bash
# ESLint dla jakości kodu
npm run lint

# Prettier dla formatowania
npm run format

# Testy jednostkowe
npm run test

# Analiza wydajności
npm run lighthouse

# Analiza bezpieczeństwa
npm run security-audit
```

### **Development workflow:**

```bash
# 1. Stwórz feature branch
git checkout -b feature/nowa-funkcja

# 2. Wprowadź zmiany
# edytuj pliki...

# 3. Testuj lokalnie
npm run dev

# 4. Sprawdź jakość kodu
npm run validate

# 5. Commit i push
git add .
git commit -m "feat: dodana nowa funkcja"
git push origin feature/nowa-funkcja

# 6. Stwórz Pull Request na GitHub
```

---

## 🚨 **Troubleshooting**

### **Problem: GitHub Pages nie działa**

**Rozwiązanie:**
1. Sprawdź czy Actions są aktywne: Settings → Actions → "Allow all actions"
2. Sprawdź czy Pages są aktywne: Settings → Pages → Source: "GitHub Actions"
3. Sprawdź logi w Actions tab

### **Problem: PSE API nie działa przez VPN**

**Rozwiązanie:**
1. Sprawdź czy masz dostęp do: https://apimpdv2-bmgdhhajexe8aade.a01.azurefd.net/api/
2. W config.js zwiększ timeout: `timeout: 15000` (15 sekund)
3. W config.js zwiększ retries: `retries: 5`

### **Problem: Aplikacja wolno się ładuje**

**Rozwiązanie:**
1. Sprawdź network w Dev Tools
2. Wyczyść cache browser: Ctrl+Shift+R
3. Sprawdź czy Service Worker działa: Application tab → Service Workers

### **Problem: Dane się nie odświeżają**

**Rozwiązanie:**
1. Sprawdź połączenie internetowe
2. Kliknij "🔄 Odśwież wszystko"
3. Sprawdź console czy nie ma błędów API
4. Wyczyść localStorage: Application → Storage → Clear storage

---

## 📊 **Monitoring & Analytics**

### **Sprawdzanie wydajności:**

```bash
# Analiza bundle size
npm run bundle-analyze

# Lighthouse audit
npm run lighthouse

# Test wszystkich funkcji
npm run test
```

### **Logi produkcyjne:**

**W browser console sprawdź:**
- ✅ "PSE API connection successful"
- ✅ "Portfolio Calculator loaded successfully"  
- ✅ "Risk Calculator loaded successfully"
- ✅ "Enspirion App initialized successfully"

---

## 🔐 **Security Best Practices**

### **Regularne aktualizacje:**

```bash
# Sprawdź outdated packages
npm outdated

# Aktualizuj dependencies
npm update

# Security audit
npm run security-audit

# Fix vulnerabilities
npm run security-fix
```

### **Monitoring bezpieczeństwa:**
- GitHub automatycznie skanuje kod (Dependabot)
- Weekly dependency updates przez Actions
- CodeQL security scanning

---

## 📞 **Support**

### **Jeśli masz problemy:**

1. **Sprawdź dokumentację:** README.md
2. **Przejrzyj troubleshooting** powyżej
3. **Sprawdź GitHub Issues:** czy ktoś miał podobny problem
4. **Stwórz nowy Issue** z opisem problemu

### **Zgłoszenie problemu:**

**Dołącz do Issue:**
- Opis problemu
- Kroki do reprodukcji
- Screenshot (jeśli applicable)
- Browser i wersja
- Console errors (F12 → Console)

---

## 🎯 **Next Steps**

### **Po uruchomieniu podstawowej wersji:**

1. **Testuj z real data** przez kilka dni
2. **Dostosuj portfolio settings** do rzeczywistych wartości
3. **Monitoruj performance** w Production
4. **Zbieraj feedback** od użytkowników
5. **Planuj kolejne features**

### **Możliwe rozszerzenia:**

- **Multi-portfolio support** - obsługa wielu farm
- **Weather integration** - dane pogodowe
- **Advanced analytics** - ML predictions
- **Export/reporting** - PDF/Excel reports
- **User management** - multi-user access
- **Real-time alerts** - push notifications
- **Mobile app** - native mobile version

---

## ✅ **Checklist - Final Verification**

**Po zakończeniu setup sprawdź:**

- [ ] ✅ Repository created on GitHub
- [ ] ✅ All files copied to project  
- [ ] ✅ npm install completed successfully
- [ ] ✅ npm run dev works locally
- [ ] ✅ Code pushed to GitHub main branch
- [ ] ✅ GitHub Pages activated (Settings → Pages)
- [ ] ✅ GitHub Actions workflow completed successfully
- [ ] ✅ Dashboard accessible at github.io URL
- [ ] ✅ PSE API connection working (check console)
- [ ] ✅ Charts loading with real data
- [ ] ✅ Portfolio configuration saved
- [ ] ✅ Mobile/PWA installable
- [ ] ✅ Performance acceptable (Lighthouse > 80)

**Jeśli wszystko ✅ - gratulacje! Masz działający professional dashboard! 🎉**

---

<div align="center">

**🚀 Powodzenia z Enspirion Dashboard! ⚡**

*Professional energy management dla przyszłości OZE*

</div>
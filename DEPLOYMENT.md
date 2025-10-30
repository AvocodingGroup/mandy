# 🚀 Deployment Checklist

## Pred spustením aplikácie

### 1. ✅ Inštalácia závislostí
```bash
npm install
```

### 2. ✅ Firebase konfigurácia
1. Vytvorte Firebase projekt na https://console.firebase.google.com/
2. Povoľte **Authentication** → **Anonymous sign-in**
3. Vytvorte **Firestore Database** (production mode)
4. Skopírujte Firebase konfiguráciu z Project Settings

### 3. ✅ Nastavenie .env.local
```bash
cp .env.local.example .env.local
```

Vyplňte všetky hodnoty v `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 4. ✅ Nasadenie Firestore Rules
```bash
# Ak máte Firebase CLI nainštalované
firebase login
firebase init  # Vyberte Firestore
firebase deploy --only firestore:rules

# ALEBO skopírujte obsah firestore.rules do Firebase Console
# Firestore Database > Rules > Edit rules > Publish
```

### 5. ✅ Inicializácia dát (prvé spustenie)

Po prvom prihlásení:

1. **Prejdite do Nastavení**
2. **Pridajte ingrediencie**:
   - žemľa
   - mäso
   - rajčina
   - uhorka
   - šalát
   - syr
   - ... (podľa potreby)

3. **Vytvorte recept**:
   - Názov: "Klasický burger"
   - Vyberte ingrediencie
   - Kliknite "Vytvoriť recept"

4. **Aktivujte recept**:
   - Kliknite "Aktivovať" vedľa receptu

### 6. ✅ Spustenie dev servera
```bash
npm run dev
```

Otvorte http://localhost:3000

## Produkčné nasadenie

### Vercel (odporúčané)
```bash
npm install -g vercel
vercel login
vercel
```

Nezabudnite pridať environment variables vo Vercel dashboard.

### Build a start
```bash
npm run build
npm start
```

## Firestore indexy

Ak sa vyskytnú chyby týkajúce sa indexov, Firebase vás automaticky presmeruje na vytvorenie potrebných indexov.

## Bezpečnosť

⚠️ **DÔLEŽITÉ**:
- Nikdy necommitujte `.env.local` do gitu
- Firestore rules sú nastavené tak, že vyžadujú autentifikáciu
- Všetci autentifikovaní užívatelia môžu spravovať objednávky (podľa špecifikácie)

## Testovanie funkcií

### ✅ Login
- [x] Prihlásenie s nickname
- [x] Validácia unikátnosti
- [x] Validácia min. 3 znaky

### ✅ Objednávky
- [x] Zobrazenie zoznamu
- [x] Real-time updates
- [x] Filtre (status, platba)
- [x] Farebné označenie
- [x] Časovač
- [x] Súčty

### ✅ Detail objednávky
- [x] Zmena priority
- [x] Označovanie itemov
- [x] Zmena stavu (zaplatená/odovzdaná)
- [x] Komentáre
- [x] Riešenie komentárov

### ✅ Vytvorenie objednávky
- [x] Úprava burgra
- [x] Pridanie itemov
- [x] Priorita
- [x] Komentár

### ✅ Nastavenia
- [x] Správa ingrediencií
- [x] Správa receptov
- [x] Aktivácia receptu
- [x] Zmena nickname

## Známe problémy

1. **TypeScript warningy** - Niektoré menšie TypeScript warningy sú prítomné, ale nespôsobujú problémy s funkčnosťou.

2. **EditBurgerDialog** - Ak nie je aktívny recept, zobrazí sa varovanie. Riešenie: vytvorte a aktivujte recept v nastaveniach.

## Support

Pre problémy alebo otázky, kontaktujte vývojára.

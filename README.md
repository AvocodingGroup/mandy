# 🍔 Aplikácia pre manažovanie objednávok

Moderná webová aplikácia pre správu objednávok s jedlom, vytvorená pomocou Next.js, React, TypeScript, Tailwind CSS a Firebase Firestore.

## ✨ Funkcie

### 🔐 Autentifikácia
- Anonymné prihlásenie cez Firebase Auth
- Unikátne nickname pre každého užívateľa
- Validácia unikátnosti nickname

### 📋 Správa objednávok
- **Zoznam objednávok** s real-time updates
- **Filtre**:
  - Status (čakajúce/odovzdané/všetky)
  - Platba (nezaplatené/zaplatené/všetky)
- **Farebné označenie**:
  - 🟢 Zelená: dokončené (odovzdané + zaplatené)
  - 🟠 Oranžová: odovzdané
  - 🔵 Modrá: zaplatené
  - ⚪ Sivá: čakajúce
  - Percentuálne farbenie pre čiastočne dokončené objednávky
- **Časovač** od vytvorenia objednávky
- **Priorita** objednávok (1, 2, 3...)
- **Súčty** burgrov a hranoliek podľa aktívnych filtrov

### 🍔 Vytvorenie objednávky
- Pridávanie burgrov s customizáciou
- Pridávanie hranoliek
- Nastavenie priority
- Pridanie komentára k objednávke

### 🎨 Customizácia burgra
- 3-stavové tlačidlá pre ingrediencie:
  - 🔴 0x - odobraná ingrediencia
  - ⚪ 1x - normálne
  - 🟢 2x - zdvojená ingrediencia
- Používa aktívny recept z nastavení

### 💬 Komentáre
- Pridanie komentára k objednávke
- Označenie komentára ako vyriešený
- Vymazanie komentára
- Real-time synchronizácia

### ⚙️ Nastavenia
- **Správa ingrediencií**: pridanie/vymazanie
- **Správa receptov**: 
  - Vytvorenie receptu
  - Úprava receptu
  - Aktivácia receptu (používa sa pri vytváraní burgrov)
  - Vymazanie receptu
- **Zmena nickname**

## 🚀 Inštalácia

### Predpoklady
- Node.js 18+ nainštalovaný
- Firebase projekt vytvorený
- Git nainštalovaný

### Krok 1: Klonovanie projektu
```bash
git clone <repository-url>
cd mandy
```

### Krok 2: Inštalácia závislostí
```bash
npm install
```

### Krok 3: Konfigurácia Firebase

1. Vytvorte Firebase projekt na [Firebase Console](https://console.firebase.google.com/)
2. Povoľte **Authentication** > **Anonymous sign-in**
3. Vytvorte **Firestore Database**
4. Skopírujte Firebase konfiguráciu:
   - V Project Settings > General > Your apps
   - Kliknite na Web app ikonu
   - Skopírujte konfiguračné hodnoty

### Krok 4: Nastavenie premenných prostredia

Vytvorte `.env.local` súbor v root adresári:

```bash
cp .env.local.example .env.local
```

Upravte `.env.local` a vyplňte svoje Firebase hodnoty:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Krok 5: Nasadenie Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

Alebo skopírujte obsah `firestore.rules` do Firebase Console.

### Krok 6: Spustenie aplikácie

```bash
npm run dev
```

Otvorte [http://localhost:3000](http://localhost:3000) vo vašom prehliadači.

## 📁 Štruktúra projektu

```
mandy/
├── src/
│   ├── app/
│   │   ├── lib/
│   │   │   └── firebase.ts          # Firebase konfigurácia
│   │   ├── login/
│   │   │   └── page.tsx             # Vstupná obrazovka
│   │   ├── orders/
│   │   │   ├── page.tsx             # Zoznam objednávok
│   │   │   └── create/
│   │   │       └── page.tsx         # Vytvorenie objednávky
│   │   ├── settings/
│   │   │   └── page.tsx             # Nastavenia
│   │   ├── layout.js                # Root layout
│   │   ├── page.js                  # Presmerovanie
│   │   └── globals.css
│   ├── components/
│   │   ├── Navigation.tsx           # Hamburger menu
│   │   ├── OrderCard.tsx            # Karta objednávky
│   │   ├── OrderDetailDialog.tsx    # Detail objednávky
│   │   └── EditBurgerDialog.tsx     # Úprava burgra
│   ├── context/
│   │   └── AuthContext.tsx          # Autentifikačný context
│   ├── lib/
│   │   └── firestore.ts             # Firebase helper funkcie
│   └── types/
│       └── index.ts                 # TypeScript typy
├── public/
├── firebase.json
├── firestore.rules                  # Firestore Security Rules
├── firestore.indexes.json
├── .env.local.example
├── package.json
└── README.md
```

## 🗄️ Databázová štruktúra (Firestore)

### Kolekcia: `users`
```typescript
{
  userId: string,
  nickname: string,
  createdAt: Timestamp
}
```

### Kolekcia: `orders`
```typescript
{
  orderId: string,
  orderNumber: number,
  priority: number,
  createdAt: Timestamp,
  createdBy: string,
  status: 'waiting' | 'completed',
  items: [
    {
      itemId: string,
      type: 'burger' | 'fries',
      customizations: {
        removed: string[],
        doubled: string[]
      },
      isPaid: boolean,
      isDelivered: boolean
    }
  ]
}
```

### Sub-kolekcia: `orders/{orderId}/comments`
```typescript
{
  commentId: string,
  text: string,
  authorId: string,
  authorNickname: string,
  isResolved: boolean,
  createdAt: Timestamp
}
```

### Kolekcia: `settings`
```typescript
// settings/ingredients
{
  ingredients: string[]
}

// settings/activeRecipe
{
  recipeName: string,
  ingredients: string[]
}

// settings/recipes
{
  recipes: [
    {
      id: string,
      name: string,
      ingredients: string[],
      isActive: boolean
    }
  ]
}
```

## 🔒 Firestore Security Rules

Security rules sú nakonfigurované v `firestore.rules`:

- ✅ Autentifikovaní užívatelia môžu čítať všetky objednávky
- ✅ Autentifikovaní užívatelia môžu vytvárať/upravovať objednávky
- ✅ Autentifikovaní užívatelia môžu pridávať/upravovať komentáre
- ✅ Autentifikovaní užívatelia môžu spravovať nastavenia
- ✅ Nickname musí byť aspoň 3 znaky dlhý

## 🛠️ Technológie

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **Real-time**: Firestore onSnapshot
- **Routing**: Next.js App Router

## 📝 Použitie

### 1. Prihlásenie
- Zadajte unikátny nickname (aspoň 3 znaky)
- Aplikácia vytvorí anonymný Firebase účet

### 2. Nastavenia (prvé spustenie)
- Prejdite do **Nastavenia**
- Pridajte ingrediencie (napr. žemľa, mäso, rajčina, uhorka, šalát, syr)
- Vytvorte recept (napr. "Klasický burger")
- Vyberte ingrediencie pre recept
- Aktivujte recept

### 3. Vytvorenie objednávky
- Kliknite na **+** tlačidlo
- Upravte burger (vyberte ingrediencie)
- Pridajte burger alebo burger + hranolky
- Nastavte prioritu
- Pridajte komentár (voliteľné)
- Kliknite **Vytvoriť obj**

### 4. Správa objednávok
- Kliknite na objednávku pre detail
- Označte itemy checkboxom
- Kliknite **Zaplatená** alebo **Odovzdaná**
- Pridajte komentár k objednávke

### 5. Filtre
- Kliknite na filtre pre prepínanie stavov
- Filtre pracujú súčasne
- Súčty sa aktualizujú automaticky

## 📄 Licencia

MIT

## 👨‍💻 Autor

Vytvorené pomocou GitHub Copilot

---

**Enjoy! 🍔🍟**

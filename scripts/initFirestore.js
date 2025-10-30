// Script pre inicializáciu Firestore s počiatočnými dátami
// Spustite: node scripts/initFirestore.js

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD5CCaDIAwCgqnaZTpeSXJqwV0STqXcGdI",
  authDomain: "mandy-food-order-manager.firebaseapp.com",
  projectId: "mandy-food-order-manager",
  storageBucket: "mandy-food-order-manager.firebasestorage.app",
  messagingSenderId: "677963812435",
  appId: "1:677963812435:web:d4e58dae6946282cf340a6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeSettings() {
  console.log('Inicializácia Firestore nastavení...');

  try {
    // Základné ingrediencie
    const defaultIngredients = [
      'žemľa',
      'mäso',
      'rajčina',
      'uhorka',
      'šalát',
      'syr',
      'cibuľa',
      'kečup',
      'horčica'
    ];

    await setDoc(doc(db, 'settings', 'ingredients'), {
      ingredients: defaultIngredients
    });
    console.log('✅ Ingrediencie vytvorené');

    // Základný recept
    const defaultRecipe = {
      id: Date.now().toString(),
      name: 'Klasický burger',
      ingredients: defaultIngredients,
      isActive: true
    };

    await setDoc(doc(db, 'settings', 'recipes'), {
      recipes: [defaultRecipe]
    });
    console.log('✅ Recept vytvorený');

    // Aktívny recept
    await setDoc(doc(db, 'settings', 'activeRecipe'), {
      recipeName: defaultRecipe.name,
      ingredients: defaultRecipe.ingredients
    });
    console.log('✅ Aktívny recept nastavený');

    console.log('\n🎉 Firestore inicializácia dokončená!');
    console.log('Teraz môžete použiť aplikáciu.');
    
  } catch (error) {
    console.error('❌ Chyba pri inicializácii:', error);
  }
}

initializeSettings();

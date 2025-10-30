// Firebase helper funkcie pre autentifikáciu a Firestore operácie

import {
  signInAnonymously,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  serverTimestamp,
  increment,
  addDoc,
} from 'firebase/firestore';
import { auth, db } from '@/app/lib/firebase';
import type {
  User,
  Order,
  OrderItem,
  Comment,
  Recipe,
  IngredientsSettings,
  ActiveRecipeSettings,
  RecipesSettings,
  PriceSettings,
} from '@/types';

// ==================== AUTHENTICATION ====================

/**
 * Overí či nickname je unikátny v databáze
 */
export async function isNicknameUnique(nickname: string): Promise<boolean> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('nickname', '==', nickname));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

/**
 * Vytvorí nového užívateľa s anonymným prihlásením
 */
export async function createUser(nickname: string): Promise<User> {
  // Anonymné prihlásenie NAJPRV (aby sme mali permissions)
  const userCredential = await signInAnonymously(auth);
  const userId = userCredential.user.uid;

  // Teraz validuj unikátnosť nickname (už sme autentifikovaní)
  const isUnique = await isNicknameUnique(nickname);
  if (!isUnique) {
    // Ak nie je unikátny, odhlásiť sa a hodiť chybu
    await signOut(auth);
    throw new Error('Tento nickname už existuje. Zvoľte iný.');
  }

  // Ulož užívateľa do Firestore
  const user: User = {
    userId,
    nickname,
    createdAt: Timestamp.now(),
  };

  await setDoc(doc(db, 'users', userId), user);
  return user;
}

/**
 * Získa údaje užívateľa podľa userId
 */
export async function getUser(userId: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return null;
  return userDoc.data() as User;
}

/**
 * Zmení nickname užívateľa
 */
export async function updateNickname(
  userId: string,
  newNickname: string
): Promise<void> {
  const isUnique = await isNicknameUnique(newNickname);
  if (!isUnique) {
    throw new Error('Tento nickname už existuje. Zvoľte iný.');
  }

  await updateDoc(doc(db, 'users', userId), { nickname: newNickname });
}

/**
 * Odhlásiť užívateľa
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// ==================== ORDERS ====================

/**
 * Získa a inkrementuje číslo objednávky z countera v Firestore
 * Counter je uložený v /settings/orderCounter
 */
export async function getNextOrderNumber(): Promise<number> {
  const counterRef = doc(db, 'settings', 'orderCounter');

  try {
    const counterDoc = await getDoc(counterRef);

    if (!counterDoc.exists()) {
      // Ak counter neexistuje, vytvor ho s hodnotou 1
      await setDoc(counterRef, { currentNumber: 1 });
      return 1;
    }

    const currentNumber = counterDoc.data().currentNumber || 0;
    const nextNumber = currentNumber + 1;

    // Inkrementuj counter
    await updateDoc(counterRef, { currentNumber: nextNumber });

    return nextNumber;
  } catch (error) {
    console.error('Error getting next order number:', error);
    throw error;
  }
}

/**
 * Nastaví číslo countera objednávok (pre manuálnu úpravu)
 */
export async function setOrderCounter(number: number): Promise<void> {
  const counterRef = doc(db, 'settings', 'orderCounter');
  await setDoc(counterRef, { currentNumber: number }, { merge: true });
}

/**
 * Získa aktuálne číslo countera objednávok
 */
export async function getOrderCounter(): Promise<number> {
  const counterRef = doc(db, 'settings', 'orderCounter');
  const counterDoc = await getDoc(counterRef);

  if (!counterDoc.exists()) {
    return 0;
  }

  return counterDoc.data().currentNumber || 0;
}

/**
 * Vytvorí novú objednávku
 */
export async function createOrder(
  userId: string,
  items: OrderItem[],
  priority: number = 1,
  initialComment?: string,
  userNickname?: string
): Promise<string> {
  const nextNumber = await getNextOrderNumber();
  const ordersRef = collection(db, 'orders');

  const newOrder: Omit<Order, 'orderId'> = {
    orderNumber: nextNumber,
    priority,
    createdAt: Timestamp.now(),
    createdBy: userId,
    status: 'waiting',
    items,
  };

  const docRef = await addDoc(ordersRef, newOrder);
  await updateDoc(docRef, { orderId: docRef.id });

  // Pridaj počiatočný komentár ak je zadaný
  if (initialComment && initialComment.trim() && userNickname) {
    await addComment(docRef.id, initialComment.trim(), userId, userNickname);
  }

  return docRef.id;
}

/**
 * Získa všetky objednávky s real-time updates
 */
export function subscribeToOrders(
  callback: (orders: Order[]) => void
): () => void {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    orderBy('priority', 'desc'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push({ ...doc.data(), orderId: doc.id } as Order);
    });
    callback(orders);
  });
}

/**
 * Získa jednu objednávku podľa ID
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  const orderDoc = await getDoc(doc(db, 'orders', orderId));
  if (!orderDoc.exists()) return null;
  return orderDoc.data() as Order;
}

/**
 * Aktualizuje prioritu objednávky
 */
export async function updateOrderPriority(
  orderId: string,
  priority: number
): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { priority });
}

/**
 * Aktualizuje stav itemov v objednávke
 */
export async function updateOrderItems(
  orderId: string,
  items: OrderItem[]
): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { items });

  // Automaticky aktualizuj status ak sú všetky itemy zaplatené a odovzdané
  const allCompleted = items.every(item => item.isPaid && item.isDelivered);
  if (allCompleted) {
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'completed',
      completedAt: Timestamp.now()
    });
  }
}

/**
 * Vymaže objednávku
 */
export async function deleteOrder(orderId: string): Promise<void> {
  // Vymaž všetky komentáre
  const commentsRef = collection(db, 'orders', orderId, 'comments');
  const commentsSnapshot = await getDocs(commentsRef);
  
  const batch = writeBatch(db);
  commentsSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  // Vymaž objednávku
  batch.delete(doc(db, 'orders', orderId));
  await batch.commit();
}

// ==================== COMMENTS ====================

/**
 * Pridá komentár k objednávke
 */
export async function addComment(
  orderId: string,
  text: string,
  authorId: string,
  authorNickname: string
): Promise<string> {
  const commentsRef = collection(db, 'orders', orderId, 'comments');
  
  const newComment: Omit<Comment, 'commentId'> = {
    text,
    authorId,
    authorNickname,
    isResolved: false,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(commentsRef, newComment);
  await updateDoc(docRef, { commentId: docRef.id });
  
  return docRef.id;
}

/**
 * Získa komentáre k objednávke s real-time updates
 */
export function subscribeToComments(
  orderId: string,
  callback: (comments: Comment[]) => void
): () => void {
  const commentsRef = collection(db, 'orders', orderId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const comments: Comment[] = [];
    snapshot.forEach((doc) => {
      comments.push({ ...doc.data(), commentId: doc.id } as Comment);
    });
    callback(comments);
  });
}

/**
 * Označí komentár ako vyriešený
 */
export async function resolveComment(
  orderId: string,
  commentId: string
): Promise<void> {
  const commentRef = doc(db, 'orders', orderId, 'comments', commentId);
  await updateDoc(commentRef, { isResolved: true });
}

/**
 * Vymaže komentár
 */
export async function deleteComment(
  orderId: string,
  commentId: string
): Promise<void> {
  await deleteDoc(doc(db, 'orders', orderId, 'comments', commentId));
}

// ==================== SETTINGS ====================

/**
 * Získa zoznam všetkých ingrediencií
 */
export async function getIngredients(): Promise<string[]> {
  const settingsDoc = await getDoc(doc(db, 'settings', 'ingredients'));
  if (!settingsDoc.exists()) return [];
  const data = settingsDoc.data() as IngredientsSettings;
  return data.ingredients || [];
}

/**
 * Pridá novú ingredienciu
 */
export async function addIngredient(ingredient: string): Promise<void> {
  const settingsRef = doc(db, 'settings', 'ingredients');
  const settingsDoc = await getDoc(settingsRef);
  
  if (settingsDoc.exists()) {
    const data = settingsDoc.data() as IngredientsSettings;
    const ingredients = data.ingredients || [];
    
    if (!ingredients.includes(ingredient)) {
      ingredients.push(ingredient);
      await updateDoc(settingsRef, { ingredients });
    }
  } else {
    await setDoc(settingsRef, { ingredients: [ingredient] });
  }
}

/**
 * Vymaže ingredienciu
 */
export async function deleteIngredient(ingredient: string): Promise<void> {
  const settingsRef = doc(db, 'settings', 'ingredients');
  const settingsDoc = await getDoc(settingsRef);
  
  if (settingsDoc.exists()) {
    const data = settingsDoc.data() as IngredientsSettings;
    const ingredients = data.ingredients || [];
    const filtered = ingredients.filter((i) => i !== ingredient);
    await updateDoc(settingsRef, { ingredients: filtered });
  }
}

/**
 * Získa aktívny recept
 */
export async function getActiveRecipe(): Promise<ActiveRecipeSettings | null> {
  const settingsDoc = await getDoc(doc(db, 'settings', 'activeRecipe'));
  if (!settingsDoc.exists()) return null;
  return settingsDoc.data() as ActiveRecipeSettings;
}

/**
 * Získa všetky recepty
 */
export async function getRecipes(): Promise<Recipe[]> {
  const settingsDoc = await getDoc(doc(db, 'settings', 'recipes'));
  if (!settingsDoc.exists()) return [];
  const data = settingsDoc.data() as RecipesSettings;
  return data.recipes || [];
}

/**
 * Vytvorí nový recept
 */
export async function createRecipe(
  name: string,
  ingredients: string[]
): Promise<void> {
  const settingsRef = doc(db, 'settings', 'recipes');
  const settingsDoc = await getDoc(settingsRef);
  
  const newRecipe: Recipe = {
    id: Date.now().toString(),
    name,
    ingredients,
    isActive: false,
  };

  if (settingsDoc.exists()) {
    const data = settingsDoc.data() as RecipesSettings;
    const recipes = data.recipes || [];
    recipes.push(newRecipe);
    await updateDoc(settingsRef, { recipes });
  } else {
    await setDoc(settingsRef, { recipes: [newRecipe] });
  }
}

/**
 * Aktualizuje recept
 */
export async function updateRecipe(
  recipeId: string,
  name: string,
  ingredients: string[]
): Promise<void> {
  const settingsRef = doc(db, 'settings', 'recipes');
  const settingsDoc = await getDoc(settingsRef);
  
  if (settingsDoc.exists()) {
    const data = settingsDoc.data() as RecipesSettings;
    const recipes = data.recipes || [];
    const updated = recipes.map((r) =>
      r.id === recipeId ? { ...r, name, ingredients } : r
    );
    await updateDoc(settingsRef, { recipes: updated });
  }
}

/**
 * Vymaže recept
 */
export async function deleteRecipe(recipeId: string): Promise<void> {
  const settingsRef = doc(db, 'settings', 'recipes');
  const settingsDoc = await getDoc(settingsRef);
  
  if (settingsDoc.exists()) {
    const data = settingsDoc.data() as RecipesSettings;
    const recipes = data.recipes || [];
    const filtered = recipes.filter((r) => r.id !== recipeId);
    await updateDoc(settingsRef, { recipes: filtered });
  }
}

/**
 * Nastaví aktívny recept
 */
export async function setActiveRecipe(recipeId: string): Promise<void> {
  const recipesRef = doc(db, 'settings', 'recipes');
  const recipesDoc = await getDoc(recipesRef);
  
  if (!recipesDoc.exists()) return;
  
  const data = recipesDoc.data() as RecipesSettings;
  const recipes = data.recipes || [];
  
  // Nájdi recept a aktualizuj isActive
  const updated = recipes.map((r) => ({
    ...r,
    isActive: r.id === recipeId,
  }));
  
  await updateDoc(recipesRef, { recipes: updated });
  
  // Aktualizuj activeRecipe
  const activeRecipe = updated.find((r) => r.id === recipeId);
  if (activeRecipe) {
    const activeRecipeRef = doc(db, 'settings', 'activeRecipe');
    await setDoc(activeRecipeRef, {
      recipeName: activeRecipe.name,
      ingredients: activeRecipe.ingredients,
    });
  }
}

// ==================== PRICES ====================

/**
 * Získa nastavenie cien
 */
export async function getPrices(): Promise<PriceSettings> {
  const pricesRef = doc(db, 'settings', 'prices');
  const pricesDoc = await getDoc(pricesRef);

  if (!pricesDoc.exists()) {
    // Predvolené ceny
    return { burgerPrice: 5, friesPrice: 2 };
  }

  return pricesDoc.data() as PriceSettings;
}

/**
 * Aktualizuje nastavenie cien
 */
export async function updatePrices(prices: PriceSettings): Promise<void> {
  const pricesRef = doc(db, 'settings', 'prices');
  await setDoc(pricesRef, prices);
}

/**
 * Subscribe k nastaveniam s real-time updates
 */
export function subscribeToSettings(
  callback: (ingredients: string[], activeRecipe: ActiveRecipeSettings | null, recipes: Recipe[]) => void
): () => void {
  const unsubscribeIngredients = onSnapshot(
    doc(db, 'settings', 'ingredients'),
    (doc) => {
      const ingredients = doc.exists() ? (doc.data() as IngredientsSettings).ingredients : [];
      checkAndCallback();
    }
  );

  const unsubscribeActiveRecipe = onSnapshot(
    doc(db, 'settings', 'activeRecipe'),
    (doc) => {
      const activeRecipe = doc.exists() ? (doc.data() as ActiveRecipeSettings) : null;
      checkAndCallback();
    }
  );

  const unsubscribeRecipes = onSnapshot(
    doc(db, 'settings', 'recipes'),
    (doc) => {
      const recipes = doc.exists() ? (doc.data() as RecipesSettings).recipes : [];
      checkAndCallback();
    }
  );

  async function checkAndCallback() {
    const ingredients = await getIngredients();
    const activeRecipe = await getActiveRecipe();
    const recipes = await getRecipes();
    callback(ingredients, activeRecipe, recipes);
  }

  return () => {
    unsubscribeIngredients();
    unsubscribeActiveRecipe();
    unsubscribeRecipes();
  };
}

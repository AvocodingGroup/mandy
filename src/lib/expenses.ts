// Firestore funkcie pre správu nákladov (expenses)

import { db } from '@/app/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import type { ExpenseAction, ExpenseItem } from '@/types';

// EXPENSE ACTIONS

// Vytvorenie novej akcie (napr. "Halloween 2025")
export async function createExpenseAction(name: string, userId: string): Promise<string> {
  const actionData = {
    name,
    createdAt: Timestamp.now(),
    createdBy: userId,
    totalAmount: 0,
    itemCount: 0,
  };

  const docRef = await addDoc(collection(db, 'expenseActions'), actionData);
  return docRef.id;
}

// Načítanie všetkých akcií
export async function getExpenseActions(): Promise<ExpenseAction[]> {
  const q = query(collection(db, 'expenseActions'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    actionId: doc.id,
    ...doc.data(),
  } as ExpenseAction));
}

// Real-time sledovanie akcií
export function subscribeToExpenseActions(callback: (actions: ExpenseAction[]) => void) {
  const q = query(collection(db, 'expenseActions'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const actions = snapshot.docs.map((doc) => ({
      actionId: doc.id,
      ...doc.data(),
    } as ExpenseAction));
    callback(actions);
  });
}

// Vymazanie akcie (vrátane všetkých položiek)
export async function deleteExpenseAction(actionId: string): Promise<void> {
  // Najprv vymaž všetky položky
  const itemsQuery = query(collection(db, 'expenseItems'), where('actionId', '==', actionId));
  const itemsSnapshot = await getDocs(itemsQuery);

  const batch = writeBatch(db);

  // Vymaž položky
  itemsSnapshot.docs.forEach((itemDoc) => {
    batch.delete(doc(db, 'expenseItems', itemDoc.id));
  });

  // Vymaž akciu
  batch.delete(doc(db, 'expenseActions', actionId));

  await batch.commit();
}

// Premenuj akciu
export async function renameExpenseAction(actionId: string, newName: string): Promise<void> {
  await updateDoc(doc(db, 'expenseActions', actionId), {
    name: newName,
  });
}

// EXPENSE ITEMS

// Pridanie položky do akcie
export async function addExpenseItem(
  actionId: string,
  description: string,
  amount: number,
  userId: string,
  photoId?: string
): Promise<string> {
  const itemData = {
    actionId,
    description,
    amount,
    photoId: photoId || null,
    createdAt: Timestamp.now(),
    createdBy: userId,
  };

  const docRef = await addDoc(collection(db, 'expenseItems'), itemData);

  // Aktualizuj totály v akcii
  await updateDoc(doc(db, 'expenseActions', actionId), {
    totalAmount: increment(amount),
    itemCount: increment(1),
  });

  return docRef.id;
}

// Načítanie položiek z akcie
export async function getExpenseItems(actionId: string): Promise<ExpenseItem[]> {
  const q = query(
    collection(db, 'expenseItems'),
    where('actionId', '==', actionId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    itemId: doc.id,
    ...doc.data(),
  } as ExpenseItem));
}

// Real-time sledovanie položiek v akcii
export function subscribeToExpenseItems(actionId: string, callback: (items: ExpenseItem[]) => void) {
  const q = query(
    collection(db, 'expenseItems'),
    where('actionId', '==', actionId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      itemId: doc.id,
      ...doc.data(),
    } as ExpenseItem));
    callback(items);
  });
}

// Aktualizácia položky
export async function updateExpenseItem(
  itemId: string,
  actionId: string,
  oldAmount: number,
  newData: { description?: string; amount?: number; photoId?: string }
): Promise<void> {
  const updates: any = {};

  if (newData.description !== undefined) {
    updates.description = newData.description;
  }
  if (newData.amount !== undefined) {
    updates.amount = newData.amount;
  }
  if (newData.photoId !== undefined) {
    updates.photoId = newData.photoId || null;
  }

  await updateDoc(doc(db, 'expenseItems', itemId), updates);

  // Ak sa zmenila suma, aktualizuj totalAmount v akcii
  if (newData.amount !== undefined && newData.amount !== oldAmount) {
    const diff = newData.amount - oldAmount;
    await updateDoc(doc(db, 'expenseActions', actionId), {
      totalAmount: increment(diff),
    });
  }
}

// Vymazanie položky
export async function deleteExpenseItem(itemId: string, actionId: string, amount: number): Promise<void> {
  await deleteDoc(doc(db, 'expenseItems', itemId));

  // Aktualizuj totály v akcii
  await updateDoc(doc(db, 'expenseActions', actionId), {
    totalAmount: increment(-amount),
    itemCount: increment(-1),
  });
}

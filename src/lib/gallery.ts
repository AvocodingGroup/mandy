// Firestore funkcie pre albumy a fotky

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
import type { Album, Photo } from '@/types';
import { uploadPhoto as uploadPhotoToStorage, deletePhoto as deletePhotoFromStorage } from './storage';

// ALBUMY

// Vytvorenie nového albumu
export async function createAlbum(name: string, userId: string): Promise<string> {
  const albumData = {
    name,
    createdAt: Timestamp.now(),
    createdBy: userId,
    photoCount: 0,
  };

  const docRef = await addDoc(collection(db, 'albums'), albumData);
  return docRef.id;
}

// Načítanie všetkých albumov
export async function getAlbums(): Promise<Album[]> {
  const q = query(collection(db, 'albums'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    albumId: doc.id,
    ...doc.data(),
  } as Album));
}

// Real-time sledovanie albumov
export function subscribeToAlbums(callback: (albums: Album[]) => void) {
  const q = query(collection(db, 'albums'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const albums = snapshot.docs.map((doc) => ({
      albumId: doc.id,
      ...doc.data(),
    } as Album));
    callback(albums);
  });
}

// Vymazanie albumu (vrátane všetkých fotiek)
export async function deleteAlbum(albumId: string): Promise<void> {
  // Najprv vymaž všetky fotky v albume
  const photosQuery = query(collection(db, 'photos'), where('albumId', '==', albumId));
  const photosSnapshot = await getDocs(photosQuery);

  const batch = writeBatch(db);

  // Vymaž fotky zo Storage aj Firestore
  for (const photoDoc of photosSnapshot.docs) {
    const photo = photoDoc.data() as Photo;
    await deletePhotoFromStorage(albumId, photo.fileName);
    batch.delete(doc(db, 'photos', photoDoc.id));
  }

  // Vymaž album
  batch.delete(doc(db, 'albums', albumId));

  await batch.commit();
}

// Premenuj album
export async function renameAlbum(albumId: string, newName: string): Promise<void> {
  await updateDoc(doc(db, 'albums', albumId), {
    name: newName,
  });
}

// FOTKY

// Nahranie fotky do albumu
export async function addPhotoToAlbum(
  file: File,
  albumId: string,
  userId: string
): Promise<string> {
  // Nahraj fotku do Storage
  const { url, thumbnailUrl, fileName } = await uploadPhotoToStorage(file, albumId, userId);

  // Ulož metadáta do Firestore
  const photoData = {
    albumId,
    url,
    thumbnailUrl,
    fileName,
    uploadedAt: Timestamp.now(),
    uploadedBy: userId,
  };

  const docRef = await addDoc(collection(db, 'photos'), photoData);

  // Aktualizuj počet fotiek v albume
  await updateDoc(doc(db, 'albums', albumId), {
    photoCount: increment(1),
  });

  return docRef.id;
}

// Načítanie fotiek z albumu
export async function getPhotosFromAlbum(albumId: string): Promise<Photo[]> {
  const q = query(
    collection(db, 'photos'),
    where('albumId', '==', albumId),
    orderBy('uploadedAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    photoId: doc.id,
    ...doc.data(),
  } as Photo));
}

// Real-time sledovanie fotiek v albume
export function subscribeToPhotos(albumId: string, callback: (photos: Photo[]) => void) {
  const q = query(
    collection(db, 'photos'),
    where('albumId', '==', albumId),
    orderBy('uploadedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const photos = snapshot.docs.map((doc) => ({
      photoId: doc.id,
      ...doc.data(),
    } as Photo));
    callback(photos);
  });
}

// Vymazanie fotky
export async function deletePhoto(photoId: string, albumId: string, fileName: string): Promise<void> {
  // Vymaž zo Storage
  await deletePhotoFromStorage(albumId, fileName);

  // Vymaž z Firestore
  await deleteDoc(doc(db, 'photos', photoId));

  // Aktualizuj počet fotiek v albume
  await updateDoc(doc(db, 'albums', albumId), {
    photoCount: increment(-1),
  });
}

// Získaj jednu fotku podľa ID (pre linking v expenses)
export async function getPhotoById(photoId: string): Promise<Photo | null> {
  const photosQuery = query(collection(db, 'photos'), where('__name__', '==', photoId));
  const snapshot = await getDocs(photosQuery);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    photoId: doc.id,
    ...doc.data(),
  } as Photo;
}

// Získaj všetky fotky (pre výber v expenses)
export async function getAllPhotos(): Promise<Photo[]> {
  const q = query(collection(db, 'photos'), orderBy('uploadedAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    photoId: doc.id,
    ...doc.data(),
  } as Photo));
}

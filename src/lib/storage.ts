// Firebase Storage funkcie pre nahrávanie a správu fotiek

import { storage } from '@/app/lib/firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

// Kompresia obrázka pomocou Canvas API
async function compressImage(file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Zachovaj pomer strán
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// Nahranie fotky do Storage
export async function uploadPhoto(
  file: File,
  albumId: string,
  userId: string
): Promise<{ url: string; thumbnailUrl: string; fileName: string }> {
  try {
    // Vygeneruj unikátny názov súboru
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;

    // Cesta k súboru v Storage
    const photoPath = `albums/${albumId}/${fileName}`;
    const thumbnailPath = `albums/${albumId}/thumbnails/${fileName}`;

    // Kompresia plnej verzie (max 1920x1920, kvalita 0.9)
    const compressedFile = await compressImage(file, 1920, 1920, 0.9);

    // Kompresia thumbnails (max 400x400, kvalita 0.7)
    const thumbnailFile = await compressImage(file, 400, 400, 0.7);

    // Nahranie plnej verzie
    const photoRef = ref(storage, photoPath);
    await uploadBytes(photoRef, compressedFile);
    const url = await getDownloadURL(photoRef);

    // Nahranie thumbnails
    const thumbnailRef = ref(storage, thumbnailPath);
    await uploadBytes(thumbnailRef, thumbnailFile);
    const thumbnailUrl = await getDownloadURL(thumbnailRef);

    return { url, thumbnailUrl, fileName };
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
}

// Vymazanie fotky zo Storage
export async function deletePhoto(albumId: string, fileName: string): Promise<void> {
  try {
    const photoPath = `albums/${albumId}/${fileName}`;
    const thumbnailPath = `albums/${albumId}/thumbnails/${fileName}`;

    // Vymaž plnú verziu
    const photoRef = ref(storage, photoPath);
    await deleteObject(photoRef);

    // Vymaž thumbnail
    const thumbnailRef = ref(storage, thumbnailPath);
    await deleteObject(thumbnailRef);
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
}

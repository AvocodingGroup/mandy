// Detail albumu - zobrazenie a správa fotiek

'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import {
  subscribeToPhotos,
  addPhotoToAlbum,
  deletePhoto,
  getAlbums,
} from '@/lib/gallery';
import type { Album, Photo } from '@/types';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';

interface PageProps {
  params: Promise<{ albumId: string }>;
}

export default function AlbumDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const albumId = resolvedParams.albumId;

  const { user, loading } = useAuth();
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [album, setAlbum] = useState<Album | null>(null);
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Načítaj informácie o albume
  useEffect(() => {
    if (!user) return;

    const loadAlbum = async () => {
      const albums = await getAlbums();
      const foundAlbum = albums.find((a) => a.albumId === albumId);
      if (foundAlbum) {
        setAlbum(foundAlbum);
      }
    };

    loadAlbum();
  }, [user, albumId]);

  // Real-time sledovanie fotiek
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToPhotos(albumId, (updatedPhotos) => {
      setPhotos(updatedPhotos);
    });

    return () => unsubscribe();
  }, [user, albumId]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);

    try {
      // Nahraj všetky vybrané fotky
      for (let i = 0; i < files.length; i++) {
        await addPhotoToAlbum(files[i], albumId, user.userId);
      }
    } catch (error) {
      console.error('Chyba pri nahrávaní fotiek:', error);
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;

    try {
      await deletePhoto(selectedPhoto.photoId, selectedPhoto.albumId, selectedPhoto.fileName);
      setSelectedPhoto(null);
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error('Chyba pri mazaní fotky:', error);
    }
  };

  const openDelete = (photo: Photo) => {
    setSelectedPhoto(photo);
    setOpenDeleteDialog(true);
  };

  if (!mounted || loading || !user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        {mounted && (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Načítavam...
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navigation />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => router.push('/gallery')}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                {album?.name || 'Album'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {photos.length} {photos.length === 1 ? 'fotka' : photos.length < 5 ? 'fotky' : 'fotiek'}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            component="label"
            startIcon={<AddPhotoAlternateIcon />}
            disabled={uploading}
          >
            {uploading ? 'Nahrávam...' : 'Pridať fotky'}
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleFileSelect}
            />
          </Button>
        </Box>

        {photos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AddPhotoAlternateIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Zatiaľ nemáte žiadne fotky v tomto albume
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Pridajte prvé fotky
            </Typography>
            <Button
              variant="contained"
              component="label"
              startIcon={<AddPhotoAlternateIcon />}
              disabled={uploading}
            >
              {uploading ? 'Nahrávam...' : 'Pridať fotky'}
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleFileSelect}
              />
            </Button>
          </Box>
        ) : (
          <ImageList cols={3} gap={16}>
            {photos.map((photo) => (
              <ImageListItem key={photo.photoId}>
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.fileName}
                  loading="lazy"
                  style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }}
                />
                <ImageListItemBar
                  title={photo.fileName}
                  subtitle={photo.uploadedAt.toDate().toLocaleDateString('sk-SK')}
                  actionIcon={
                    <IconButton
                      sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                      onClick={() => openDelete(photo)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                />
              </ImageListItem>
            ))}
          </ImageList>
        )}
      </Container>

      {/* Dialog pre vymazanie fotky */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Vymazať fotku</DialogTitle>
        <DialogContent>
          <Typography>
            Naozaj chcete vymazať fotku &quot;{selectedPhoto?.fileName}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Zrušiť</Button>
          <Button onClick={handleDeletePhoto} variant="contained" color="error">
            Vymazať
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Galéria - správa albumov a fotiek

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { subscribeToAlbums, createAlbum, deleteAlbum, renameAlbum } from '@/lib/gallery';
import type { Album } from '@/types';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Fab,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function GalleryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [mounted, setMounted] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openRenameDialog, setOpenRenameDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToAlbums((updatedAlbums) => {
      setAlbums(updatedAlbums);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim() || !user) return;

    try {
      await createAlbum(newAlbumName.trim(), user.userId);
      setNewAlbumName('');
      setOpenCreateDialog(false);
    } catch (error) {
      console.error('Chyba pri vytváraní albumu:', error);
    }
  };

  const handleRenameAlbum = async () => {
    if (!renameValue.trim() || !selectedAlbum) return;

    try {
      await renameAlbum(selectedAlbum.albumId, renameValue.trim());
      setRenameValue('');
      setSelectedAlbum(null);
      setOpenRenameDialog(false);
    } catch (error) {
      console.error('Chyba pri premenovávaní albumu:', error);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!selectedAlbum) return;

    try {
      await deleteAlbum(selectedAlbum.albumId);
      setSelectedAlbum(null);
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error('Chyba pri mazaní albumu:', error);
    }
  };

  const openRename = (album: Album) => {
    setSelectedAlbum(album);
    setRenameValue(album.name);
    setOpenRenameDialog(true);
  };

  const openDelete = (album: Album) => {
    setSelectedAlbum(album);
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
          <Typography variant="h4" component="h1" fontWeight="bold">
            Galéria
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Nový album
          </Button>
        </Box>

        {albums.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PhotoLibraryIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Zatiaľ nemáte žiadne albumy
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Vytvorte si prvý album a pridajte do neho fotky
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
            >
              Vytvoriť album
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {albums.map((album) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={album.albumId}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhotoLibraryIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2" fontWeight="bold">
                        {album.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {album.photoCount} {album.photoCount === 1 ? 'fotka' : album.photoCount < 5 ? 'fotky' : 'fotiek'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {album.createdAt.toDate().toLocaleDateString('sk-SK')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => router.push(`/gallery/${album.albumId}`)}
                    >
                      Otvoriť
                    </Button>
                    <IconButton size="small" onClick={() => openRename(album)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => openDelete(album)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Dialog pre vytvorenie albumu */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Nový album</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Názov albumu"
            fullWidth
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateAlbum();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Zrušiť</Button>
          <Button onClick={handleCreateAlbum} variant="contained" disabled={!newAlbumName.trim()}>
            Vytvoriť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pre premenovanie albumu */}
      <Dialog open={openRenameDialog} onClose={() => setOpenRenameDialog(false)}>
        <DialogTitle>Premenovať album</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nový názov"
            fullWidth
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleRenameAlbum();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRenameDialog(false)}>Zrušiť</Button>
          <Button onClick={handleRenameAlbum} variant="contained" disabled={!renameValue.trim()}>
            Uložiť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pre vymazanie albumu */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Vymazať album</DialogTitle>
        <DialogContent>
          <Typography>
            Naozaj chcete vymazať album &quot;{selectedAlbum?.name}&quot;? Vymaže sa aj všetkých{' '}
            {selectedAlbum?.photoCount} fotiek.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Zrušiť</Button>
          <Button onClick={handleDeleteAlbum} variant="contained" color="error">
            Vymazať
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

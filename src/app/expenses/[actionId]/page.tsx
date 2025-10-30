// Detail akcie - zobrazenie a správa výdavkov

'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import {
  subscribeToExpenseItems,
  addExpenseItem,
  deleteExpenseItem,
  updateExpenseItem,
  getExpenseActions,
} from '@/lib/expenses';
import { getAllPhotos } from '@/lib/gallery';
import type { ExpenseAction, ExpenseItem, Photo } from '@/types';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PhotoIcon from '@mui/icons-material/Photo';
import EuroIcon from '@mui/icons-material/Euro';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ actionId: string }>;
}

export default function ExpenseActionDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const actionId = resolvedParams.actionId;

  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [action, setAction] = useState<ExpenseAction | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [mounted, setMounted] = useState(false);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPhotoId, setNewPhotoId] = useState('');

  const [selectedItem, setSelectedItem] = useState<ExpenseItem | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editPhotoId, setEditPhotoId] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Načítaj informácie o akcii
  useEffect(() => {
    if (!user) return;

    const loadAction = async () => {
      const actions = await getExpenseActions();
      const foundAction = actions.find((a) => a.actionId === actionId);
      if (foundAction) {
        setAction(foundAction);
      }
    };

    loadAction();
  }, [user, actionId]);

  // Načítaj všetky fotky pre výber
  useEffect(() => {
    if (!user) return;

    const loadPhotos = async () => {
      const allPhotos = await getAllPhotos();
      setPhotos(allPhotos);
    };

    loadPhotos();
  }, [user]);

  // Real-time sledovanie položiek
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToExpenseItems(actionId, (updatedItems) => {
      setItems(updatedItems);
    });

    return () => unsubscribe();
  }, [user, actionId]);

  const handleAddItem = async () => {
    if (!newDescription.trim() || !newAmount || !user) return;

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      await addExpenseItem(actionId, newDescription.trim(), amount, user.userId, newPhotoId || undefined);
      setNewDescription('');
      setNewAmount('');
      setNewPhotoId('');
      setOpenAddDialog(false);
    } catch (error) {
      console.error('Chyba pri pridávaní položky:', error);
    }
  };

  const handleEditItem = async () => {
    if (!selectedItem || !editDescription.trim() || !editAmount) return;

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      await updateExpenseItem(selectedItem.itemId, actionId, selectedItem.amount, {
        description: editDescription.trim(),
        amount,
        photoId: editPhotoId || undefined,
      });
      setSelectedItem(null);
      setEditDescription('');
      setEditAmount('');
      setEditPhotoId('');
      setOpenEditDialog(false);
    } catch (error) {
      console.error('Chyba pri úprave položky:', error);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      await deleteExpenseItem(selectedItem.itemId, actionId, selectedItem.amount);
      setSelectedItem(null);
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error('Chyba pri mazaní položky:', error);
    }
  };

  const openEdit = (item: ExpenseItem) => {
    setSelectedItem(item);
    setEditDescription(item.description);
    setEditAmount(item.amount.toString());
    setEditPhotoId(item.photoId || '');
    setOpenEditDialog(true);
  };

  const openDelete = (item: ExpenseItem) => {
    setSelectedItem(item);
    setOpenDeleteDialog(true);
  };

  const getPhotoById = (photoId: string | undefined) => {
    if (!photoId) return null;
    return photos.find((p) => p.photoId === photoId);
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
            <IconButton onClick={() => router.push('/expenses')}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                {action?.name || 'Akcia'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <EuroIcon sx={{ color: 'warning.main' }} />
                <Typography variant="h6" color="warning.main" fontWeight="bold">
                  {items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({items.length}{' '}
                  {items.length === 1 ? 'položka' : items.length < 5 ? 'položky' : 'položiek'})
                </Typography>
              </Box>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Pridať výdavok
          </Button>
        </Box>

        {items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <EuroIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Zatiaľ nemáte žiadne výdavky v tejto akcii
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Pridajte prvý výdavok
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
            >
              Pridať výdavok
            </Button>
          </Box>
        ) : (
          <List>
            {items.map((item) => {
              const photo = getPhotoById(item.photoId);
              return (
                <Paper key={item.itemId} sx={{ mb: 2 }}>
                  <ListItem sx={{ pr: 12 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      {photo && (
                        <Image
                          src={photo.thumbnailUrl}
                          alt={photo.fileName}
                          width={60}
                          height={60}
                          style={{ objectFit: 'cover', borderRadius: 4 }}
                        />
                      )}
                      <ListItemText
                        primary={item.description}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {item.createdAt.toDate().toLocaleDateString('sk-SK')}
                            </Typography>
                            {photo && (
                              <Chip
                                icon={<PhotoIcon />}
                                label={photo.fileName}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EuroIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                        <Typography variant="h6" fontWeight="bold" color="warning.main">
                          {item.amount.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => openEdit(item)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" color="error" onClick={() => openDelete(item)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Paper>
              );
            })}
          </List>
        )}
      </Container>

      {/* Dialog pre pridanie položky */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pridať výdavok</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Popis (napr. Kaufland)"
            fullWidth
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Suma"
            type="number"
            fullWidth
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EuroIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Fotka (voliteľné)</InputLabel>
            <Select
              value={newPhotoId}
              onChange={(e) => setNewPhotoId(e.target.value)}
              label="Fotka (voliteľné)"
            >
              <MenuItem value="">
                <em>Žiadna fotka</em>
              </MenuItem>
              {photos.map((photo) => (
                <MenuItem key={photo.photoId} value={photo.photoId}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Image
                      src={photo.thumbnailUrl}
                      alt={photo.fileName}
                      width={40}
                      height={40}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                    />
                    <Typography>{photo.fileName}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Zrušiť</Button>
          <Button
            onClick={handleAddItem}
            variant="contained"
            disabled={!newDescription.trim() || !newAmount}
          >
            Pridať
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pre úpravu položky */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upraviť výdavok</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Popis"
            fullWidth
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Suma"
            type="number"
            fullWidth
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EuroIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Fotka (voliteľné)</InputLabel>
            <Select
              value={editPhotoId}
              onChange={(e) => setEditPhotoId(e.target.value)}
              label="Fotka (voliteľné)"
            >
              <MenuItem value="">
                <em>Žiadna fotka</em>
              </MenuItem>
              {photos.map((photo) => (
                <MenuItem key={photo.photoId} value={photo.photoId}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Image
                      src={photo.thumbnailUrl}
                      alt={photo.fileName}
                      width={40}
                      height={40}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                    />
                    <Typography>{photo.fileName}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Zrušiť</Button>
          <Button
            onClick={handleEditItem}
            variant="contained"
            disabled={!editDescription.trim() || !editAmount}
          >
            Uložiť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pre vymazanie položky */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Vymazať výdavok</DialogTitle>
        <DialogContent>
          <Typography>
            Naozaj chcete vymazať výdavok &quot;{selectedItem?.description}&quot; (
            {selectedItem?.amount.toFixed(2)} €)?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Zrušiť</Button>
          <Button onClick={handleDeleteItem} variant="contained" color="error">
            Vymazať
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

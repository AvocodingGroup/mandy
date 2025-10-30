// Náklady - správa akcií a výdavkov

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import {
  subscribeToExpenseActions,
  createExpenseAction,
  deleteExpenseAction,
  renameExpenseAction,
} from '@/lib/expenses';
import type { ExpenseAction } from '@/types';
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
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EuroIcon from '@mui/icons-material/Euro';

export default function ExpensesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [actions, setActions] = useState<ExpenseAction[]>([]);
  const [mounted, setMounted] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openRenameDialog, setOpenRenameDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [newActionName, setNewActionName] = useState('');
  const [selectedAction, setSelectedAction] = useState<ExpenseAction | null>(null);
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

    const unsubscribe = subscribeToExpenseActions((updatedActions) => {
      setActions(updatedActions);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateAction = async () => {
    if (!newActionName.trim() || !user) return;

    try {
      await createExpenseAction(newActionName.trim(), user.userId);
      setNewActionName('');
      setOpenCreateDialog(false);
    } catch (error) {
      console.error('Chyba pri vytváraní akcie:', error);
    }
  };

  const handleRenameAction = async () => {
    if (!renameValue.trim() || !selectedAction) return;

    try {
      await renameExpenseAction(selectedAction.actionId, renameValue.trim());
      setRenameValue('');
      setSelectedAction(null);
      setOpenRenameDialog(false);
    } catch (error) {
      console.error('Chyba pri premenovávaní akcie:', error);
    }
  };

  const handleDeleteAction = async () => {
    if (!selectedAction) return;

    try {
      await deleteExpenseAction(selectedAction.actionId);
      setSelectedAction(null);
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error('Chyba pri mazaní akcie:', error);
    }
  };

  const openRename = (action: ExpenseAction) => {
    setSelectedAction(action);
    setRenameValue(action.name);
    setOpenRenameDialog(true);
  };

  const openDelete = (action: ExpenseAction) => {
    setSelectedAction(action);
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
            Náklady
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Nová akcia
          </Button>
        </Box>

        {actions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ReceiptLongIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Zatiaľ nemáte žiadne akcie
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Vytvorte si prvú akciu a pridajte do nej výdavky
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
            >
              Vytvoriť akciu
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {actions.map((action) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={action.actionId}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ReceiptLongIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2" fontWeight="bold">
                        {action.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EuroIcon sx={{ fontSize: 20, mr: 0.5, color: 'success.main' }} />
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        {action.totalAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {action.itemCount}{' '}
                      {action.itemCount === 1
                        ? 'položka'
                        : action.itemCount < 5
                        ? 'položky'
                        : 'položiek'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {action.createdAt.toDate().toLocaleDateString('sk-SK')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => router.push(`/expenses/${action.actionId}`)}
                    >
                      Otvoriť
                    </Button>
                    <IconButton size="small" onClick={() => openRename(action)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => openDelete(action)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Dialog pre vytvorenie akcie */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Nová akcia</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Názov akcie (napr. Halloween 2025)"
            fullWidth
            value={newActionName}
            onChange={(e) => setNewActionName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateAction();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Zrušiť</Button>
          <Button onClick={handleCreateAction} variant="contained" disabled={!newActionName.trim()}>
            Vytvoriť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pre premenovanie akcie */}
      <Dialog open={openRenameDialog} onClose={() => setOpenRenameDialog(false)}>
        <DialogTitle>Premenovať akciu</DialogTitle>
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
                handleRenameAction();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRenameDialog(false)}>Zrušiť</Button>
          <Button onClick={handleRenameAction} variant="contained" disabled={!renameValue.trim()}>
            Uložiť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pre vymazanie akcie */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Vymazať akciu</DialogTitle>
        <DialogContent>
          <Typography>
            Naozaj chcete vymazať akciu &quot;{selectedAction?.name}&quot;? Vymaže sa aj všetkých{' '}
            {selectedAction?.itemCount} položiek.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Zrušiť</Button>
          <Button onClick={handleDeleteAction} variant="contained" color="error">
            Vymazať
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

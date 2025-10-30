// Obrazovka pre vytvorenie novej objednávky

'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import EditBurgerDialog from '@/components/EditBurgerDialog';
import { createOrder, getOrderCounter } from '@/lib/firestore';
import type { OrderItem, ItemCustomizations } from '@/types';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';

export default function CreateOrderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [priority, setPriority] = useState(1);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [nextOrderNumber, setNextOrderNumber] = useState(0);
  const [showBurgerDialog, setShowBurgerDialog] = useState(false);
  const [burgerCustomizations, setBurgerCustomizations] = useState<ItemCustomizations>({
    removed: [],
    doubled: [],
  });
  const [includeFries, setIncludeFries] = useState(false);
  const [comment, setComment] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  // Presmerovanie ak nie je prihlásený
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Načítaj číslo budúcej objednávky
  useEffect(() => {
    const fetchOrderNumber = async () => {
      const currentCounter = await getOrderCounter();
      setNextOrderNumber(currentCounter + 1);
    };
    fetchOrderNumber();
  }, []);

  const handlePriorityChange = (delta: number) => {
    setPriority(Math.max(1, priority + delta));
  };

  const handleBurgerCustomized = (customizations: ItemCustomizations) => {
    setBurgerCustomizations(customizations);
    setShowBurgerDialog(false);
  };

  const addBurger = () => {
    const burgerItem: OrderItem = {
      itemId: `item-${Date.now()}-${Math.random()}`,
      type: 'burger',
      customizations: burgerCustomizations,
      isPaid: false,
      isDelivered: false,
    };

    const newItems = [burgerItem];

    if (includeFries) {
      const friesItem: OrderItem = {
        itemId: `item-${Date.now()}-${Math.random()}-fries`,
        type: 'fries',
        customizations: { removed: [], doubled: [] },
        isPaid: false,
        isDelivered: false,
      };
      newItems.push(friesItem);
    }

    setItems([...items, ...newItems]);
    
    // Reset
    setBurgerCustomizations({ removed: [], doubled: [] });
    setIncludeFries(false);
  };

  const addFriesOnly = () => {
    const friesItem: OrderItem = {
      itemId: `item-${Date.now()}-${Math.random()}`,
      type: 'fries',
      customizations: { removed: [], doubled: [] },
      isPaid: false,
      isDelivered: false,
    };

    setItems([...items, friesItem]);
  };

  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const deleteSelectedItems = () => {
    setItems(items.filter((item) => !selectedItems.has(item.itemId)));
    setSelectedItems(new Set());
  };

  const getItemChips = (item: OrderItem): ReactElement[] | null => {
    if (item.type === 'fries') return null;

    const { removed, doubled } = item.customizations;
    const chips: ReactElement[] = [];

    removed.forEach((ing) => {
      chips.push(
        <Chip
          key={`removed-${ing}`}
          label={`0x ${ing}`}
          size="small"
          sx={{
            bgcolor: 'error.main',
            color: 'white',
            fontWeight: 600,
          }}
        />
      );
    });

    doubled.forEach((ing) => {
      chips.push(
        <Chip
          key={`doubled-${ing}`}
          label={`2x ${ing}`}
          size="small"
          sx={{
            bgcolor: 'success.main',
            color: 'white',
            fontWeight: 600,
          }}
        />
      );
    });

    return chips.length > 0 ? chips : null;
  };

  const handleCreateOrder = async () => {
    if (items.length === 0) {
      setValidationMessage('Pridajte aspoň jednu položku');
      return;
    }

    if (!user) return;

    setCreating(true);

    try {
      await createOrder(user.userId, items, priority, comment, user.nickname);
      router.push('/orders');
    } catch (error) {
      console.error('Chyba pri vytváraní objednávky:', error);
      setErrorMessage('Chyba pri vytváraní objednávky');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    if (items.length > 0) {
      setShowCancelDialog(true);
    } else {
      router.push('/orders');
    }
  };

  const confirmCancel = () => {
    router.push('/orders');
  };

  if (loading || !user) {
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
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Načítavam...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navigation />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Hlavička */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Vytvoriť objednávku #{nextOrderNumber}
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          {/* Priorita */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="body1" fontWeight="bold">
                Priorita:
              </Typography>
              <IconButton
                onClick={() => handlePriorityChange(-1)}
                size="small"
                color="primary"
              >
                <RemoveIcon />
              </IconButton>
              <Typography variant="h5" fontWeight="bold">
                {priority}
              </Typography>
              <IconButton
                onClick={() => handlePriorityChange(1)}
                size="small"
                color="primary"
              >
                <AddIcon />
              </IconButton>
            </Stack>
          </Box>

          {/* Pridávanie itemov */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Pridať položky:
            </Typography>
            
            <Stack spacing={2}>
              <Button
                onClick={() => setShowBurgerDialog(true)}
                variant="text"
                color="primary"
              >
                upraviť burger
              </Button>

              {(burgerCustomizations.removed.length > 0 || burgerCustomizations.doubled.length > 0) && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {burgerCustomizations.removed.map((ing) => (
                    <Chip key={ing} label={`0x ${ing}`} size="small" color="error" />
                  ))}
                  {burgerCustomizations.doubled.map((ing) => (
                    <Chip key={ing} label={`2x ${ing}`} size="small" color="success" />
                  ))}
                </Box>
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeFries}
                    onChange={(e) => setIncludeFries(e.target.checked)}
                  />
                }
                label="Hranolky"
              />

              <Button
                onClick={addBurger}
                variant="contained"
                color="success"
                fullWidth
              >
                Pridať
              </Button>

              <Button
                onClick={addFriesOnly}
                variant="contained"
                color="warning"
                fullWidth
              >
                Pridať hranolky
              </Button>
            </Stack>
          </Box>

          {/* Súhrn objednávky */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Súhrn objednávky:
            </Typography>
            
            {items.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Žiadne položky
              </Typography>
            ) : (
              <>
                <List>
                  {items.map((item) => {
                    const chips = getItemChips(item);
                    return (
                      <ListItem
                        key={item.itemId}
                        sx={{
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                          borderRadius: 1,
                          mb: 1,
                        }}
                        secondaryAction={
                          <Checkbox
                            checked={selectedItems.has(item.itemId)}
                            onChange={() => toggleSelectItem(item.itemId)}
                          />
                        }
                      >
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="body1" sx={{ mb: chips ? 1 : 0 }}>
                                {item.type === 'fries' ? 'Hranolky' : 'Burger'}
                              </Typography>
                              {chips && (
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {chips}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>

                <Button
                  onClick={deleteSelectedItems}
                  disabled={selectedItems.size === 0}
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                >
                  Vymazať
                </Button>
              </>
            )}
          </Box>

          {/* Komentár */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Pridať komentár:
            </Typography>
            <TextField
              fullWidth
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Napíšte komentár..."
              variant="outlined"
              sx={{
                '& .MuiInputBase-input': {
                  color: (theme) => theme.palette.text.primary,
                },
                '& .MuiInputBase-input::placeholder': {
                  color: (theme) => theme.palette.text.secondary,
                  opacity: 1,
                },
              }}
            />
          </Box>

          {/* Tlačidlá */}
          <Stack direction="row" spacing={2}>
            <Button
              onClick={handleCancel}
              variant="contained"
              color="inherit"
              fullWidth
              size="large"
            >
              Zrušiť
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={creating || items.length === 0}
              variant="contained"
              color="primary"
              fullWidth
              size="large"
            >
              {creating ? 'Vytváram...' : 'Vytvoriť obj'}
            </Button>
          </Stack>
        </Paper>
      </Container>

      {/* Dialog pre úpravu burgra */}
      {showBurgerDialog && (
        <EditBurgerDialog
          initialCustomizations={burgerCustomizations}
          onConfirm={handleBurgerCustomized}
          onCancel={() => setShowBurgerDialog(false)}
        />
      )}

      {/* Dialog pre potvrdenie zrušenia objednávky */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Zrušiť objednávku?</DialogTitle>
        <DialogContent>
          <Typography>
            Naozaj chcete zrušiť túto objednávku? Všetky pridané položky budú stratené.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)} color="inherit">
            Pokračovať v úprave
          </Button>
          <Button onClick={confirmCancel} variant="contained" color="error">
            Zrušiť objednávku
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pre chybové hlásenia */}
      <Snackbar
        open={errorMessage !== ''}
        autoHideDuration={6000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorMessage('')} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Snackbar pre validačné hlásenia */}
      <Snackbar
        open={validationMessage !== ''}
        autoHideDuration={4000}
        onClose={() => setValidationMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setValidationMessage('')} severity="warning" sx={{ width: '100%' }}>
          {validationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

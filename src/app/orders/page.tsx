// Hlavná obrazovka - zoznam objednávok s filtrami

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { subscribeToOrders, deleteOrder } from '@/lib/firestore';
import type { Order, FilterState, OrderStats } from '@/types';
import OrderCard from '@/components/OrderCard';
import OrderDetailDialog from '@/components/OrderDetailDialog';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import SetMealIcon from '@mui/icons-material/SetMeal';

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<FilterState>('inactive');
  const [paymentFilter, setPaymentFilter] = useState<FilterState>('inactive');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Presmerovanie ak nie je prihlásený
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Real-time updates objednávok
  useEffect(() => {
    const unsubscribe = subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
    });

    return () => unsubscribe();
  }, []);

  // Cyklická zmena filtrov (3 stavy)
  const cycleStatusFilter = () => {
    if (statusFilter === 'inactive') setStatusFilter('active'); // čakajúce
    else if (statusFilter === 'active') setStatusFilter('opposite'); // odovzdané
    else setStatusFilter('inactive'); // všetky
  };

  const cyclePaymentFilter = () => {
    if (paymentFilter === 'inactive') setPaymentFilter('active'); // nezaplatené
    else if (paymentFilter === 'active') setPaymentFilter('opposite'); // zaplatené
    else setPaymentFilter('inactive'); // všetky
  };

  // Filtrované objednávky
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter (čakajúce/odovzdané)
      if (statusFilter !== 'inactive') {
        const allDelivered = order.items.every((item) => item.isDelivered);

        // 'active' = čakajúce (NIE všetky odovzdané)
        if (statusFilter === 'active' && allDelivered) return false;
        // 'opposite' = odovzdané (všetky odovzdané)
        if (statusFilter === 'opposite' && !allDelivered) return false;
      }

      // Payment filter (nezaplatené/zaplatené)
      if (paymentFilter !== 'inactive') {
        const allPaid = order.items.every((item) => item.isPaid);

        // 'active' = nezaplatené (NIE všetky zaplatené)
        if (paymentFilter === 'active' && allPaid) return false;
        // 'opposite' = zaplatené (všetky zaplatené)
        if (paymentFilter === 'opposite' && !allPaid) return false;
      }

      return true;
    });
  }, [orders, statusFilter, paymentFilter]);

  // Súčty burgrov a hranoliek (zostávajúce na odovzdanie)
  const stats: OrderStats = useMemo(() => {
    let totalBurgers = 0;
    let totalFries = 0;

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        // Počítaj len položky, ktoré ešte nie sú odovzdané
        if (!item.isDelivered) {
          if (item.type === 'burger') totalBurgers++;
          if (item.type === 'fries') totalFries++;
        }
      });
    });

    return { totalBurgers, totalFries };
  }, [filteredOrders]);

  // Názvy filtrov
  const getStatusFilterLabel = () => {
    if (statusFilter === 'active') return 'Status: Čakajúce';
    if (statusFilter === 'opposite') return 'Status: Odovzdané';
    return 'Status: Všetky';
  };

  const getPaymentFilterLabel = () => {
    if (paymentFilter === 'active') return 'Platba: Nezaplatené';
    if (paymentFilter === 'opposite') return 'Platba: Zaplatené';
    return 'Platba: Všetky';
  };

  const getStatusButtonColor = (): 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | undefined => {
    if (statusFilter === 'active') return 'inherit';
    if (statusFilter === 'opposite') return 'secondary';
    return undefined;
  };

  const getPaymentButtonColor = (): 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | undefined => {
    if (paymentFilter === 'active') return 'error';
    if (paymentFilter === 'opposite') return 'primary';
    return undefined;
  };

  const handleDeleteOrder = (orderId: string) => {
    const order = orders.find(o => o.orderId === orderId);
    if (order) {
      setOrderToDelete(order);
    }
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      await deleteOrder(orderToDelete.orderId);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Chyba pri mazaní objednávky:', error);
      setErrorMessage('Chyba pri mazaní objednávky');
      setOrderToDelete(null);
    }
  };

  // Show loading only after mounted to prevent hydration mismatch
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

      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Hlavička */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Objednávky
          </Typography>
        </Box>

        {/* Filtre */}
        <Paper sx={{ p: 1.5, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            <Button
              onClick={cycleStatusFilter}
              variant={statusFilter !== 'inactive' ? 'contained' : 'outlined'}
              color={getStatusButtonColor()}
              size="small"
            >
              {getStatusFilterLabel()}
            </Button>

            <Button
              onClick={cyclePaymentFilter}
              variant={paymentFilter !== 'inactive' ? 'contained' : 'outlined'}
              color={getPaymentButtonColor()}
              size="small"
            >
              {getPaymentFilterLabel()}
            </Button>
          </Box>

          {/* Súčty */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<LunchDiningIcon />}
              label={`Zostáva burgrov: ${stats.totalBurgers}`}
              color="primary"
              size="small"
            />
            <Chip
              icon={<SetMealIcon />}
              label={`Zostáva hranoliek: ${stats.totalFries}`}
              color="secondary"
              size="small"
            />
          </Box>
        </Paper>

        {/* Zoznam objednávok */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {filteredOrders.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Žiadne objednávky
              </Typography>
            </Paper>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                onClick={() => setSelectedOrder(order)}
                onDelete={handleDeleteOrder}
              />
            ))
          )}
        </Box>

        {/* Plus tlačidlo */}
        <Fab
          color="primary"
          aria-label="Vytvoriť objednávku"
          onClick={() => router.push('/orders/create')}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
          }}
        >
          <AddIcon />
        </Fab>
      </Container>

      {/* Detail objednávky */}
      {selectedOrder && (
        <OrderDetailDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Dialog pre potvrdenie vymazania objednávky */}
      <Dialog open={orderToDelete !== null} onClose={() => setOrderToDelete(null)}>
        <DialogTitle>Vymazať objednávku?</DialogTitle>
        <DialogContent>
          <Typography>
            Naozaj chcete vymazať objednávku #{orderToDelete?.orderNumber}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderToDelete(null)} color="inherit">
            Zrušiť
          </Button>
          <Button onClick={confirmDeleteOrder} variant="contained" color="error">
            Vymazať
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
    </Box>
  );
}

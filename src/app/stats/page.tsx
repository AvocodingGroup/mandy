// Obrazovka štatistík - celkové prehľady objednávok a financií

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { subscribeToOrders, getPrices } from '@/lib/firestore';
import type { Order, PriceSettings } from '@/types';
import { calculateOrderTotal } from '@/types';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Divider,
  Stack,
} from '@mui/material';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import SetMealIcon from '@mui/icons-material/SetMeal';
import EuroIcon from '@mui/icons-material/Euro';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

export default function StatsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [prices, setPrices] = useState<PriceSettings>({ burgerPrice: 5, friesPrice: 2 });

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

  // Načítaj ceny
  useEffect(() => {
    const fetchPrices = async () => {
      const fetchedPrices = await getPrices();
      setPrices(fetchedPrices);
    };
    fetchPrices();
  }, []);

  // Vypočítaj štatistiky
  const stats = useMemo(() => {
    let totalBurgers = 0;
    let totalFries = 0;
    let deliveredBurgers = 0;
    let deliveredFries = 0;
    let paidBurgers = 0;
    let paidFries = 0;
    let totalRevenue = 0;
    let paidRevenue = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.type === 'burger') {
          totalBurgers++;
          if (item.isDelivered) deliveredBurgers++;
          if (item.isPaid) {
            paidBurgers++;
            paidRevenue += prices.burgerPrice;
          }
          totalRevenue += prices.burgerPrice;
        } else if (item.type === 'fries') {
          totalFries++;
          if (item.isDelivered) deliveredFries++;
          if (item.isPaid) {
            paidFries++;
            paidRevenue += prices.friesPrice;
          }
          totalRevenue += prices.friesPrice;
        }
      });
    });

    const remainingBurgers = totalBurgers - deliveredBurgers;
    const remainingFries = totalFries - deliveredFries;
    const unpaidRevenue = totalRevenue - paidRevenue;

    return {
      totalBurgers,
      totalFries,
      deliveredBurgers,
      deliveredFries,
      paidBurgers,
      paidFries,
      remainingBurgers,
      remainingFries,
      totalRevenue,
      paidRevenue,
      unpaidRevenue,
    };
  }, [orders, prices]);

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

      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Hlavička */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Štatistiky
          </Typography>
        </Box>

        {/* Celkové počty */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Celkové počty
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <LunchDiningIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Celkový počet burgrov
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.totalBurgers}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <SetMealIcon color="secondary" fontSize="large" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Celkový počet hranolkov
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.totalFries}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Stav odovzdania */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Stav odovzdania
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <LunchDiningIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Burgre
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Odovzdané:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      {stats.deliveredBurgers}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Zostáva odovzdať:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="warning.main">
                      {stats.remainingBurgers}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <SetMealIcon color="secondary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Hranolky
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Odovzdané:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      {stats.deliveredFries}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Zostáva odovzdať:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="warning.main">
                      {stats.remainingFries}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Finančný prehľad */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Finančný prehľad
          </Typography>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <EuroIcon color="primary" />
                <Typography variant="body1">
                  Celkový obrat (všetky objednávky):
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {stats.totalRevenue.toFixed(2)} €
              </Typography>
            </Stack>

            <Divider />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckCircleIcon color="success" />
                <Typography variant="body1">
                  Už zaplatené:
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {stats.paidRevenue.toFixed(2)} €
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocalShippingIcon color="warning" />
                <Typography variant="body1">
                  Zostáva zaplatiť:
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {stats.unpaidRevenue.toFixed(2)} €
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Detailný prehľad platieb */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Zaplatené položky
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Zaplatené burgre:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {stats.paidBurgers} / {stats.totalBurgers}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Suma za burgre:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    {(stats.paidBurgers * prices.burgerPrice).toFixed(2)} €
                  </Typography>
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Zaplatené hranolky:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {stats.paidFries} / {stats.totalFries}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Suma za hranolky:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    {(stats.paidFries * prices.friesPrice).toFixed(2)} €
                  </Typography>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}

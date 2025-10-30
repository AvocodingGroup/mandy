// Login obrazovka - vstupná obrazovka s validáciou nickname

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  Container 
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';

export default function LoginPage() {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  // Ak je užívateľ už prihlásený, presmeruj
  useEffect(() => {
    if (user) {
      router.push('/orders');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) {
      setError('Prosím zadajte nickname');
      return;
    }

    if (nickname.length < 3) {
      setError('Nickname musí mať aspoň 3 znaky');
      return;
    }

    setLoading(true);

    try {
      await login(nickname.trim());
      router.push('/orders');
    } catch (err: any) {
      setError(err.message || 'Chyba pri prihlásení');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h1" gutterBottom>
                🍔 Objednávky
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Zadajte svoj nickname pre vstup
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Nickname"
                variant="outlined"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={loading}
                autoFocus
                placeholder="Zadajte nickname"
                helperText="Nickname musí byť unikátny (min. 3 znaky)"
              />

              {error && (
                <Alert severity="error">{error}</Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<LoginIcon />}
                sx={{ mt: 1 }}
              >
                {loading ? 'Prihlasovanie...' : 'Prihlásiť sa'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

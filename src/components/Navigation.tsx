// Navigačný komponent s hamburger menu

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useThemeMode } from '@/context/ThemeContext';
import {
  AppBar,
  Toolbar,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Switch,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useThemeMode();

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { name: 'Hlavná obrazovka', path: '/orders', icon: <ListAltIcon /> },
    { name: 'Štatistiky', path: '/stats', icon: <RestaurantIcon /> },
    { name: 'Galéria', path: '/gallery', icon: <PhotoLibraryIcon /> },
    { name: 'Náklady', path: '/expenses', icon: <ReceiptLongIcon /> },
    { name: 'Nastavenia', path: '/settings', icon: <SettingsIcon /> },
  ];

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push('/login');
  };

  return (
    <>
      {/* AppBar with Toolbar */}
      <AppBar position="fixed" elevation={2}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleMenu}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.contrastText' }}>
            Mandy
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user.nickname}
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      {/* Spacer for fixed AppBar */}
      <Toolbar />

      {/* Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={toggleMenu}
        PaperProps={{
          sx: { width: 280 },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div">
              Menu
            </Typography>
            <IconButton onClick={toggleMenu}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          {/* User info */}
          {user && (
            <Box sx={{
              p: 2,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'
            }}>
              <Typography variant="body2" color="text.secondary">
                Prihlásený
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="text.primary">
                {user.nickname}
              </Typography>
            </Box>
          )}

          <Divider />

          {/* Menu items */}
          <List sx={{ flexGrow: 1 }}>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={Link}
                  href={item.path}
                  onClick={toggleMenu}
                  selected={pathname === item.path}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider />

          {/* Dark mode toggle */}
          <List>
            <ListItem>
              <ListItemIcon>
                {darkMode ? <DarkModeIcon /> : <LightModeIcon />}
              </ListItemIcon>
              <ListItemText primary="Tmavý režim" />
              <Switch checked={darkMode} onChange={toggleDarkMode} />
            </ListItem>
          </List>

          <Divider />

          {/* Logout button */}
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <LogoutIcon color="error" />
                </ListItemIcon>
                <ListItemText primary="Odhlásiť sa" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}

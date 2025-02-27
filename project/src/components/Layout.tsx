import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Button,
  useTheme,
  Avatar,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Users,
  BookOpen,
  Calendar,
  Clock,
  LogOut,
  School,
  Settings,
  CreditCard,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { signOut, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [instituteName, setInstituteName] = useState('Anini LMS');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsRef = doc(db, 'settings', 'general');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.instituteName) {
          setInstituteName(data.instituteName);
        }
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <School />, path: '/' },
    { text: 'Students', icon: <Users />, path: '/students', admin: true },
    { text: 'Batches', icon: <BookOpen />, path: '/batches', admin: true },
    { text: 'Attendance', icon: <Calendar />, path: '/attendance', admin: true },
    { text: 'Study Tracking', icon: <Clock />, path: '/tracking', admin: true },
    { text: 'Payments', icon: <CreditCard />, path: '/payments', admin: true },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {logoUrl ? (
            <Avatar 
              src={logoUrl} 
              alt="Institute Logo"
              sx={{ width: 40, height: 40 }}
            />
          ) : (
            <School size={32} color="#721cdb" />
          )}
          <Typography variant="h6" noWrap component="div" color="primary">
            {instituteName}
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => {
          if (item.admin && !isAdmin) return null;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                onClick={() => isMobile && handleDrawerToggle()}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.light + '20',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.light + '30',
                    },
                  },
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {user?.email?.[0].toUpperCase()}
            </Avatar>
            {!isMobile && (
              <Button
                onClick={handleSignOut}
                startIcon={<LogOut />}
                color="inherit"
              >
                Sign Out
              </Button>
            )}
            {isMobile && (
              <IconButton onClick={handleSignOut} color="inherit" size="small">
                <LogOut />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'grey.50',
          overflow: 'auto',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

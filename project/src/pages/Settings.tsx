import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Upload, X } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

export function Settings() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [settings, setSettings ] = useState({
    instituteName: 'Anini Learning Center',
    email: '',
    phone: '',
    address: '',
    currentSession: '2024-25',
    logoUrl: '',
    emailNotifications: true,
    paymentReminders: true,
    attendanceReports: true,
    darkMode: false,
    automaticBackups: true,
  });

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settingsRef = doc(db, 'settings', 'general');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        setSettings(prev => ({
          ...prev,
          ...settingsDoc.data()
        }));
      } else {
        // Initialize settings document if it doesn't exist
        await setDoc(settingsRef, settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      enqueueSnackbar('Failed to load settings', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleSwitchChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      [name]: e.target.checked
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Please upload an image file', { variant: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      enqueueSnackbar('Image size should be less than 5MB', { variant: 'error' });
      return;
    }

    try {
      setUploadingLogo(true);

      // Delete old logo if exists
      if (settings.logoUrl) {
        const oldLogoRef = ref(storage, `logos/${settings.logoUrl.split('/').pop()}`);
        try {
          await deleteObject(oldLogoRef);
        } catch (error) {
          console.error('Error deleting old logo:', error);
        }
      }

      // Upload new logo
      const logoRef = ref(storage, `logos/${Date.now()}_${file.name}`);
      await uploadBytes(logoRef, file);
      const logoUrl = await getDownloadURL(logoRef);

      // Update settings with new logo URL
      setSettings(prev => ({
        ...prev,
        logoUrl
      }));

      // Save to Firestore immediately
      const settingsRef = doc(db, 'settings', 'general');
      await updateDoc(settingsRef, { logoUrl });

      enqueueSnackbar('Logo uploaded successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      enqueueSnackbar('Failed to upload logo', { variant: 'error' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!settings.logoUrl) return;

    try {
      setSaving(true);
      const logoRef = ref(storage, `logos/${settings.logoUrl.split('/').pop()}`);
      await deleteObject(logoRef);

      setSettings(prev => ({
        ...prev,
        logoUrl: ''
      }));

      // Update Firestore
      const settingsRef = doc(db, 'settings', 'general');
      await updateDoc(settingsRef, { logoUrl: '' });

      enqueueSnackbar('Logo removed successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error removing logo:', error);
      enqueueSnackbar('Failed to remove logo', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const settingsRef = doc(db, 'settings', 'general');
      await updateDoc(settingsRef, settings);
      enqueueSnackbar('Settings saved successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error saving settings:', error);
      enqueueSnackbar('Failed to save settings', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant={isMobile ? "h5" : "h4"} component="h1" sx={{ mb: 3 }}>
        Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Settings
            </Typography>
            <Box sx={{ mt: 2, mb: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 3 
              }}>
                {settings.logoUrl ? (
                  <Box sx={{ position: 'relative' }}>
                    <Avatar 
                      src={settings.logoUrl} 
                      alt="Institute Logo"
                      sx={{ width: 100, height: 100 }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleRemoveLogo}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                        '&:hover': { bgcolor: 'error.light' }
                      }}
                    >
                      <X size={16} />
                    </IconButton>
                  </Box>
                ) : (
                  <Avatar sx={{ width: 100, height: 100 }} />
                )}
                <Box>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={uploadingLogo ? <CircularProgress size={16} /> : <Upload />}
                    disabled={uploadingLogo || saving}
                  >
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Recommended size: 200x200px. Max size: 5MB
                  </Typography>
                </Box>
              </Box>
              <TextField
                fullWidth
                label="Institute Name"
                name="instituteName"
                value={settings.instituteName}
                onChange={handleChange}
                sx={{ mb: 2 }}
                size={isMobile ? "small" : "medium"}
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                sx={{ mb: 2 }}
                size={isMobile ? "small" : "medium"}
              />
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                sx={{ mb: 2 }}
                size={isMobile ? "small" : "medium"}
              />
              <TextField
                fullWidth
                label="Address"
                name="address"
                multiline
                rows={3}
                value={settings.address}
                onChange={handleChange}
                sx={{ mb: 2 }}
                size={isMobile ? "small" : "medium"}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Current Session</InputLabel>
                <Select
                  name="currentSession"
                  value={settings.currentSession}
                  label="Current Session"
                  onChange={handleChange}
                  size={isMobile ? "small" : "medium"}
                >
                  <MenuItem value="2023-24">2023-24</MenuItem>
                  <MenuItem value="2024-25">2024-25</MenuItem>
                  <MenuItem value="2025-26">2025-26</MenuItem>
                </Select>
              </FormControl>
              <Button 
                variant="contained"
                fullWidth={isMobile}
                onClick={handleSave}
                disabled={saving}
                startIcon={saving && <CircularProgress size={16} color="inherit" />}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={settings.emailNotifications}
                    onChange={handleSwitchChange('emailNotifications')}
                  />
                }
                label="Email Notifications"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                Receive email notifications for important updates
              </Typography>
              <FormControlLabel
                control={
                  <Switch 
                    checked={settings.paymentReminders}
                    onChange={handleSwitchChange('paymentReminders')}
                  />
                }
                label="Payment Reminders"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                Send automatic payment reminders to students
              </Typography>
              <FormControlLabel
                control={
                  <Switch 
                    checked={settings.attendanceReports}
                    onChange={handleSwitchChange('attendanceReports')}
                  />
                }
                label="Attendance Reports"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                Receive daily attendance reports
              </Typography>
            </Box>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              System Settings
            </Typography>
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={settings.darkMode}
                    onChange={handleSwitchChange('darkMode')}
                  />
                }
                label="Dark Mode"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                Enable dark mode for the interface
              </Typography>
              <FormControlLabel
                control={
                  <Switch 
                    checked={settings.automaticBackups}
                    onChange={handleSwitchChange('automaticBackups')}
                  />
                }
                label="Automatic Backups"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                Enable daily automatic backups
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { 
  Box, 
  Button, 
  Card, 
  Typography, 
  useTheme, 
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { Plus } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { FeeCycleType } from '../types/database';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { 
    field: 'firstName',
    headerName: 'First Name',
    width: 130,
    flex: 1,
  },
  { 
    field: 'lastName',
    headerName: 'Last Name',
    width: 130,
    flex: 1,
  },
  { 
    field: 'email',
    headerName: 'Email',
    width: 200,
    flex: 1.5,
  },
  { 
    field: 'phone',
    headerName: 'Phone',
    width: 130,
    flex: 1,
  },
  { 
    field: 'batch',
    headerName: 'Batch',
    width: 130,
    flex: 1,
  },
  {
    field: 'enrollmentDate',
    headerName: 'Enrollment Date',
    width: 130,
    flex: 1,
  },
  {
    field: 'feeCycle',
    headerName: 'Fee Cycle',
    width: 130,
    flex: 1,
  },
];

export function Students() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    batch: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    feeCycle: '' as FeeCycleType,
    feeAmount: '',
  });

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      enqueueSnackbar('Failed to fetch students', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      batch: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      feeCycle: '' as FeeCycleType,
      feeAmount: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const studentData = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to Firebase
      const docRef = await addDoc(collection(db, 'students'), studentData);
      
      // Update local state with new student
      setStudents(prev => [{
        id: docRef.id,
        ...studentData
      }, ...prev]);

      enqueueSnackbar('Student added successfully', { variant: 'success' });
      handleClose();
    } catch (error) {
      console.error('Error adding student:', error);
      enqueueSnackbar('Failed to add student', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center',
        gap: 2,
        mb: 3 
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} component="h1">
          Students
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus />}
          fullWidth={isMobile}
          onClick={handleOpen}
        >
          Add Student
        </Button>
      </Box>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Student</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="phone"
                  label="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Batch</InputLabel>
                  <Select
                    name="batch"
                    value={formData.batch}
                    label="Batch"
                    onChange={handleChange}
                  >
                    <MenuItem value="Batch A">Batch A</MenuItem>
                    <MenuItem value="Batch B">Batch B</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="enrollmentDate"
                  label="Enrollment Date"
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Fee Cycle</InputLabel>
                  <Select
                    name="feeCycle"
                    value={formData.feeCycle}
                    label="Fee Cycle"
                    onChange={handleChange}
                  >
                    <MenuItem value="biweekly">Biweekly (13 days)</MenuItem>
                    <MenuItem value="triweekly">Triweekly (16 days)</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                  <FormHelperText>
                    Select the fee payment cycle for this student
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="feeAmount"
                  label="Fee Amount"
                  type="number"
                  value={formData.feeAmount}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: '₹',
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="address"
                  label="Address"
                  multiline
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="emergencyContactName"
                  label="Emergency Contact Name"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="emergencyContactPhone"
                  label="Emergency Contact Phone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Add Student</Button>
        </DialogActions>
      </Dialog>

      <Card>
        <DataGrid
          rows={students}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection
          disableRowSelectionOnClick
          autoHeight
          loading={loading}
          components={{
            Toolbar: GridToolbar,
          }}
          sx={{
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal',
              padding: 1,
            },
            '& .MuiDataGrid-columnHeader': {
              padding: 1,
            },
          }}
        />
      </Card>
    </Box>
  );
}

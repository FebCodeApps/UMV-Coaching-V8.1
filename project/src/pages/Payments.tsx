import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  Grid,
  useTheme,
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Plus } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { collection, addDoc, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FeeCycleType, PaymentMethod, PaymentStatus } from '../types/database';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { 
    field: 'studentName',
    headerName: 'Student Name',
    width: 180,
    flex: 1.5,
  },
  { 
    field: 'amount',
    headerName: 'Amount',
    width: 130,
    flex: 1,
    valueFormatter: (params) => `₹${params.value}`,
  },
  { 
    field: 'status',
    headerName: 'Status',
    width: 130,
    flex: 1,
  },
  { 
    field: 'dueDate',
    headerName: 'Due Date',
    width: 130,
    flex: 1,
    valueGetter: (params) => {
      const date = params.row.dueDate?.toDate();
      return date ? date.toLocaleDateString() : '';
    },
  },
  { 
    field: 'paymentDate',
    headerName: 'Payment Date',
    width: 130,
    flex: 1,
    valueGetter: (params) => {
      const date = params.row.paymentDate?.toDate();
      return date ? date.toLocaleDateString() : '-';
    },
  },
  { 
    field: 'method',
    headerName: 'Payment Method',
    width: 150,
    flex: 1,
  },
  {
    field: 'cycle',
    headerName: 'Fee Cycle',
    width: 150,
    flex: 1,
  },
];

const calculateNextDueDate = (cycleType: FeeCycleType, startDate: string) => {
  const date = new Date(startDate);
  switch (cycleType) {
    case 'biweekly':
      date.setDate(date.getDate() + 13); // 13 days
      break;
    case 'triweekly':
      date.setDate(date.getDate() + 16); // 16 days
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date;
};

export function Payments() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    pendingCount: 0,
    nextDueDate: '',
    nextDueCount: 0
  });
  
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    paymentMethod: '' as PaymentMethod,
    feeCycle: '' as FeeCycleType,
    startDate: new Date().toISOString().split('T')[0],
    status: 'paid' as PaymentStatus,
  });

  useEffect(() => {
    fetchPayments();
    fetchStudents();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const paymentsRef = collection(db, 'payments');
      const q = query(paymentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const paymentsData = [];
      let totalRevenue = 0;
      let pendingAmount = 0;
      let pendingCount = 0;
      let nextDueDate = null;
      let nextDueCount = 0;
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        // Fetch student name
        let studentName = 'Unknown Student';
        if (data.studentId) {
          try {
            const studentDoc = await getDocs(
              query(collection(db, 'students'), where('id', '==', data.studentId))
            );
            if (!studentDoc.empty) {
              const student = studentDoc.docs[0].data();
              studentName = `${student.firstName} ${student.lastName}`;
            }
          } catch (error) {
            console.error('Error fetching student:', error);
          }
        }
        
        const payment = {
          id: doc.id,
          ...data,
          studentName
        };
        
        paymentsData.push(payment);
        
        // Calculate stats
        const amount = Number(data.amount) || 0;
        
        if (data.status === 'paid') {
          totalRevenue += amount;
        } else if (data.status === 'pending') {
          pendingAmount += amount;
          pendingCount++;
        }
        
        // Find next due date
        if (data.dueDate && data.status === 'pending') {
          const dueDate = data.dueDate.toDate();
          if (!nextDueDate || dueDate < nextDueDate) {
            nextDueDate = dueDate;
            nextDueCount = 1;
          } else if (dueDate.getTime() === nextDueDate.getTime()) {
            nextDueCount++;
          }
        }
      }
      
      setPayments(paymentsData);
      setStats({
        totalRevenue,
        pendingAmount,
        pendingCount,
        nextDueDate: nextDueDate ? nextDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-',
        nextDueCount
      });
      
    } catch (error) {
      console.error('Error fetching payments:', error);
      enqueueSnackbar('Failed to fetch payments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const studentsRef = collection(db, 'students');
      const querySnapshot = await getDocs(studentsRef);
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        displayName: `${doc.data().firstName} ${doc.data().lastName}`
      }));
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({
      studentId: '',
      amount: '',
      paymentMethod: '' as PaymentMethod,
      feeCycle: '' as FeeCycleType,
      startDate: new Date().toISOString().split('T')[0],
      status: 'paid' as PaymentStatus,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.studentId || !formData.amount || !formData.paymentMethod || !formData.feeCycle) {
      enqueueSnackbar('Please fill all required fields', { variant: 'error' });
      return;
    }

    try {
      const dueDate = calculateNextDueDate(formData.feeCycle, formData.startDate);
      
      const paymentData = {
        ...formData,
        amount: Number(formData.amount),
        dueDate: Timestamp.fromDate(dueDate),
        paymentDate: formData.status === 'paid' ? Timestamp.now() : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Add to Firebase
      await addDoc(collection(db, 'payments'), paymentData);
      
      // Refresh payments
      await fetchPayments();
      
      enqueueSnackbar('Payment recorded successfully', { variant: 'success' });
      handleClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      enqueueSnackbar('Failed to record payment', { variant: 'error' });
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
          Payments
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus />}
          fullWidth={isMobile}
          onClick={handleOpen}
        >
          Record Payment
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Total Revenue</Typography>
            <Typography variant={isMobile ? "h5" : "h4"} color="primary">₹{stats.totalRevenue.toLocaleString()}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              This month
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Pending Payments</Typography>
            <Typography variant={isMobile ? "h5" : "h4"} color="error">₹{stats.pendingAmount.toLocaleString()}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              From {stats.pendingCount} students
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Next Due Date</Typography>
            <Typography variant={isMobile ? "h5" : "h4"} color="warning.main">{stats.nextDueDate}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {stats.nextDueCount} payments due
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Student</InputLabel>
                  <Select
                    name="studentId"
                    value={formData.studentId}
                    label="Student"
                    onChange={handleChange}
                  >
                    {students.map(student => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="amount"
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: '₹',
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    label="Payment Method"
                    onChange={handleChange}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="upi">UPI</MenuItem>
                    <MenuItem value="net_banking">Net Banking</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleChange}
                  >
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
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
                    Next due date will be calculated automatically
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="startDate"
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Record Payment</Button>
        </DialogActions>
      </Dialog>

      <Card>
        <DataGrid
          rows={payments}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
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

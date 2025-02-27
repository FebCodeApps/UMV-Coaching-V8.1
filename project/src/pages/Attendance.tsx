import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  useTheme,
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Plus } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { collection, addDoc, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { 
    field: 'studentName',
    headerName: 'Student Name',
    width: 180,
    flex: 1.5,
  },
  { 
    field: 'status',
    headerName: 'Status',
    width: 130,
    flex: 1,
    valueGetter: (params) => params.row.status ? 'Present' : 'Absent',
  },
  { 
    field: 'date',
    headerName: 'Date',
    width: 130,
    flex: 1,
    valueGetter: (params) => {
      const date = params.row.date?.toDate();
      return date ? date.toLocaleDateString() : '';
    },
  },
  { 
    field: 'batch',
    headerName: 'Batch',
    width: 130,
    flex: 1,
  },
  { 
    field: 'classTaken',
    headerName: 'Class Taken',
    width: 130,
    flex: 1,
    valueGetter: (params) => params.row.classTaken ? 'Yes' : 'No',
  },
  { 
    field: 'notes',
    headerName: 'Notes',
    width: 200,
    flex: 1.5,
  },
];

export function Attendance() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [selectedBatch, setSelectedBatch] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [studentAttendance, setStudentAttendance] = useState<Record<number, { present: boolean; notes: string }>>({});
  const [classTaken, setClassTaken] = useState(true);
  const [classNotes, setClassNotes] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterBatch, setFilterBatch] = useState('');
  const [filterDate, setFilterDate] = useState('today');

  useEffect(() => {
    fetchAttendanceRecords();
    fetchBatches();
  }, [filterBatch, filterDate]);

  const fetchBatches = async () => {
    try {
      const batchesRef = collection(db, 'batches');
      const querySnapshot = await getDocs(batchesRef);
      const batchesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBatches(batchesData);
    } catch (error) {
      console.error('Error fetching batches:', error);
      enqueueSnackbar('Failed to fetch batches', { variant: 'error' });
    }
  };

  const fetchStudentsByBatch = async (batchId: string) => {
    try {
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('batchId', '==', batchId));
      const querySnapshot = await getDocs(q);
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);

      // Initialize attendance state for all students
      const initialAttendance: Record<number, { present: boolean; notes: string }> = {};
      studentsData.forEach(student => {
        initialAttendance[student.id] = { present: true, notes: '' };
      });
      setStudentAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
      enqueueSnackbar('Failed to fetch students', { variant: 'error' });
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const attendanceRef = collection(db, 'attendance');
      let q = query(attendanceRef, orderBy('date', 'desc'));

      if (filterBatch) {
        q = query(q, where('batchId', '==', filterBatch));
      }

      if (filterDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let startDate;

        switch (filterDate) {
          case 'today':
            startDate = today;
            break;
          case 'yesterday':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 1);
            break;
          case 'this-week':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 7);
            break;
          default:
            startDate = today;
        }

        q = query(q, where('date', '>=', Timestamp.fromDate(startDate)));
      }

      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      enqueueSnackbar('Failed to fetch attendance records', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSelectedBatch('');
    setAttendanceDate('');
    setStudentAttendance({});
    setClassTaken(true);
    setClassNotes('');
  };

  const handleBatchChange = async (event: React.ChangeEvent<{ value: unknown }>) => {
    const batchId = event.target.value as string;
    setSelectedBatch(batchId);
    await fetchStudentsByBatch(batchId);
  };

  const handleAttendanceChange = (studentId: number, present: boolean) => {
    if (!classTaken) return;
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], present },
    }));
  };

  const handleNotesChange = (studentId: number, notes: string) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes },
    }));
  };

  const handleSubmit = async () => {
    if (!selectedBatch || !attendanceDate) {
      enqueueSnackbar('Please select batch and date', { variant: 'error' });
      return;
    }

    try {
      const attendanceData = {
        batchId: selectedBatch,
        date: Timestamp.fromDate(new Date(attendanceDate)),
        classTaken,
        classNotes,
        attendance: Object.entries(studentAttendance).map(([studentId, data]) => ({
          studentId,
          present: data.present,
          notes: data.notes
        })),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Add to Firebase
      await addDoc(collection(db, 'attendance'), attendanceData);
      
      // Refresh attendance records
      await fetchAttendanceRecords();
      
      enqueueSnackbar('Attendance recorded successfully', { variant: 'success' });
      handleClose();
    } catch (error) {
      console.error('Error recording attendance:', error);
      enqueueSnackbar('Failed to record attendance', { variant: 'error' });
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
          Attendance
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus />}
          fullWidth={isMobile}
          onClick={handleOpen}
        >
          Record Batch Attendance
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Batch</InputLabel>
            <Select 
              label="Batch" 
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
            >
              <MenuItem value="">All Batches</MenuItem>
              {batches.map(batch => (
                <MenuItem key={batch.id} value={batch.id}>
                  {batch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Date</InputLabel>
            <Select 
              label="Date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="this-week">This Week</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Record Batch Attendance</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Batch</InputLabel>
                  <Select
                    value={selectedBatch}
                    label="Batch"
                    onChange={handleBatchChange}
                  >
                    {batches.map(batch => (
                      <MenuItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Date"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={classTaken}
                      onChange={(e) => setClassTaken(e.target.checked)}
                    />
                  }
                  label="Was class taken?"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Class Notes"
                  multiline
                  rows={2}
                  value={classNotes}
                  onChange={(e) => setClassNotes(e.target.value)}
                  placeholder={classTaken ? "Add notes about the class" : "Reason why class wasn't taken"}
                />
              </Grid>
            </Grid>

            {selectedBatch && classTaken && students.length > 0 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student Name</TableCell>
                      <TableCell align="center">Present</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={studentAttendance[student.id]?.present ?? true}
                            onChange={(e) => handleAttendanceChange(student.id, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Add notes"
                            value={studentAttendance[student.id]?.notes ?? ''}
                            onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Save Attendance</Button>
        </DialogActions>
      </Dialog>

      <Card>
        <DataGrid
          rows={attendanceRecords}
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

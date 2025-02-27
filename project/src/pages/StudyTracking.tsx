import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  Grid, 
  LinearProgress,
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
    field: 'subject',
    headerName: 'Subject',
    width: 130,
    flex: 1,
  },
  { 
    field: 'topic',
    headerName: 'Topic',
    width: 180,
    flex: 1.5,
  },
  { 
    field: 'progress',
    headerName: 'Progress',
    width: 130,
    flex: 1,
    renderCell: (params) => (
      <Box sx={{ width: '100%' }}>
        <LinearProgress 
          variant="determinate" 
          value={params.value} 
          sx={{ height: 10, borderRadius: 5 }} 
        />
        <Typography variant="caption">{params.value}%</Typography>
      </Box>
    ),
  },
  { 
    field: 'lastStudied',
    headerName: 'Last Studied',
    width: 130,
    flex: 1,
    valueGetter: (params) => {
      const date = params.row.lastStudied?.toDate();
      return date ? date.toLocaleDateString() : '';
    },
  },
];

export function StudyTracking() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [trackingRecords, setTrackingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  
  const [formData, setFormData] = useState({
    studentId: '',
    subject: '',
    topic: '',
    progress: 0,
    studyHours: 0,
    notes: '',
  });

  useEffect(() => {
    fetchTrackingData();
    fetchStudents();
    fetchBatches();
  }, []);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const trackingRef = collection(db, 'studyTracking');
      const q = query(trackingRef, orderBy('lastStudied', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const records = [];
      let progressSum = 0;
      let totalStudyHours = 0;
      const activeStudentIds = new Set();
      
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
        
        const record = {
          id: doc.id,
          ...data,
          studentName
        };
        
        records.push(record);
        progressSum += data.progress || 0;
        totalStudyHours += data.studyHours || 0;
        
        if (data.lastStudied) {
          const lastStudied = data.lastStudied.toDate();
          const now = new Date();
          const diffDays = Math.floor((now - lastStudied) / (1000 * 60 * 60 * 24));
          
          if (diffDays < 7) {
            activeStudentIds.add(data.studentId);
          }
        }
      }
      
      setTrackingRecords(records);
      setOverallProgress(records.length > 0 ? Math.round(progressSum / records.length) : 0);
      setActiveStudents(activeStudentIds.size);
      setTotalHours(totalStudyHours);
      
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      enqueueSnackbar('Failed to fetch study tracking data', { variant: 'error' });
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

  const fetchBatches = async () => {
    try {
      const batchesRef = collection(db, 'batches');
      const querySnapshot = await getDocs(batchesRef);
      const batchesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBatches(batchesData);
      
      // Extract unique subjects from all batches
      const allSubjects = new Set<string>();
      batchesData.forEach(batch => {
        if (batch.subjects && Array.isArray(batch.subjects)) {
          batch.subjects.forEach(subject => allSubjects.add(subject));
        }
      });
      
      setSubjects(Array.from(allSubjects));
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({
      studentId: '',
      subject: '',
      topic: '',
      progress: 0,
      studyHours: 0,
      notes: '',
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
    if (!formData.studentId || !formData.subject || !formData.topic) {
      enqueueSnackbar('Please fill all required fields', { variant: 'error' });
      return;
    }

    try {
      const trackingData = {
        ...formData,
        progress: Number(formData.progress),
        studyHours: Number(formData.studyHours),
        lastStudied: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Add to Firebase
      await addDoc(collection(db, 'studyTracking'), trackingData);
      
      // Refresh data
      await fetchTrackingData();
      
      enqueueSnackbar('Study progress recorded successfully', { variant: 'success' });
      handleClose();
    } catch (error) {
      console.error('Error recording study progress:', error);
      enqueueSnackbar('Failed to record study progress', { variant: 'error' });
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
          Study Tracking
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus />}
          fullWidth={isMobile}
          onClick={handleOpen}
        >
          Record Progress
        </Button>
      </Box>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Overall Progress</Typography>
            <LinearProgress 
              variant="determinate" 
              value={overallProgress} 
              sx={{ 
                height: isMobile ? 8 : 10, 
                borderRadius: 5 
              }} 
            />
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              {overallProgress}% Complete
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Active Students</Typography>
            <Typography variant={isMobile ? "h5" : "h4"} color="primary">{activeStudents}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Currently studying
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Total Study Hours</Typography>
            <Typography variant={isMobile ? "h5" : "h4"} color="primary">{totalHours}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              This month
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
        <DialogTitle>Record Study Progress</DialogTitle>
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
                <FormControl fullWidth required>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    name="subject"
                    value={formData.subject}
                    label="Subject"
                    onChange={handleChange}
                  >
                    {subjects.map(subject => (
                      <MenuItem key={subject} value={subject}>
                        {subject}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="topic"
                  label="Topic"
                  value={formData.topic}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="progress"
                  label="Progress (%)"
                  type="number"
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                  value={formData.progress}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="studyHours"
                  label="Study Hours"
                  type="number"
                  InputProps={{ inputProps: { min: 0, step: 0.5 } }}
                  value={formData.studyHours}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="notes"
                  label="Notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Save Progress</Button>
        </DialogActions>
      </Dialog>

      <Card>
        <DataGrid
          rows={trackingRecords}
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

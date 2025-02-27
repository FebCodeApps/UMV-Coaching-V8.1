import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { 
  Box, 
  Button, 
  Card, 
  Typography,
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
  useTheme,
  useMediaQuery,
  Chip,
  Autocomplete,
  Divider,
  IconButton,
  Stack
} from '@mui/material';
import { Plus, Clock, Trash2 } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Name', width: 130 },
  { field: 'board', headerName: 'Board', width: 130 },
  { field: 'classLevel', headerName: 'Class', width: 100 },
  { field: 'startDate', headerName: 'Start Date', width: 130 },
  { field: 'endDate', headerName: 'End Date', width: 130 },
  { field: 'students', headerName: 'Students', width: 100 },
  { 
    field: 'subjects',
    headerName: 'Subjects',
    width: 300,
    flex: 1,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {params.value?.map((subject: string) => (
          <Chip key={subject} label={subject} size="small" />
        ))}
      </Box>
    ),
  },
  {
    field: 'schedule',
    headerName: 'Schedule',
    width: 200,
    flex: 1,
    renderCell: (params) => (
      <Box>
        {params.value?.length > 0 ? (
          params.value.map((schedule: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ fontSize: '0.75rem' }}>
              {schedule.day} {schedule.startTime}-{schedule.endTime}
            </Typography>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">No schedule</Typography>
        )}
      </Box>
    ),
  }
];

// Available subjects based on board and class
const subjectOptions = {
  CBSE: {
    '9': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
    '10': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
    '11': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'],
    '12': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science']
  },
  ASSEB: {
    '9': ['Mathematics', 'General Science', 'Social Studies', 'English', 'Assamese'],
    '10': ['Mathematics', 'General Science', 'Social Studies', 'English', 'Assamese'],
    '11': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'],
    '12': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science']
  }
};

const weekdays = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export function Batches() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    board: '',
    classLevel: '',
    startDate: '',
    endDate: '',
    subjects: [] as string[],
    schedule: [] as { day: string; startTime: string; endTime: string }[]
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const batchesRef = collection(db, 'batches');
      const q = query(batchesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const batchesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBatches(batchesData);
    } catch (error) {
      console.error('Error fetching batches:', error);
      enqueueSnackbar('Failed to fetch batches', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({
      name: '',
      board: '',
      classLevel: '',
      startDate: '',
      endDate: '',
      subjects: [],
      schedule: []
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const addScheduleItem = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        { day: 'Monday', startTime: '09:00', endTime: '10:00' }
      ]
    }));
  };

  const removeScheduleItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  const handleScheduleChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.board || !formData.classLevel || !formData.startDate || formData.subjects.length === 0) {
      enqueueSnackbar('Please fill all required fields', { variant: 'error' });
      return;
    }

    try {
      const batchData = {
        ...formData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        students: 0 // Initial student count
      };

      // Add to Firebase
      const docRef = await addDoc(collection(db, 'batches'), batchData);
      
      // Update local state
      setBatches(prev => [{
        id: docRef.id,
        ...batchData
      }, ...prev]);

      enqueueSnackbar('Batch created successfully', { variant: 'success' });
      handleClose();
    } catch (error) {
      console.error('Error creating batch:', error);
      enqueueSnackbar('Failed to create batch', { variant: 'error' });
    }
  };

  const availableSubjects = formData.board && formData.classLevel 
    ? subjectOptions[formData.board as keyof typeof subjectOptions]?.[formData.classLevel as keyof typeof subjectOptions['CBSE']] || []
    : [];

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
          Batches
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus />}
          fullWidth={isMobile}
          onClick={handleOpen}
        >
          Create Batch
        </Button>
      </Box>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Batch</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="name"
                  label="Batch Name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Board</InputLabel>
                  <Select
                    name="board"
                    value={formData.board}
                    label="Board"
                    onChange={handleChange}
                  >
                    <MenuItem value="CBSE">CBSE</MenuItem>
                    <MenuItem value="ASSEB">ASSEB</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Class</InputLabel>
                  <Select
                    name="classLevel"
                    value={formData.classLevel}
                    label="Class"
                    onChange={handleChange}
                  >
                    <MenuItem value="9">Class 9</MenuItem>
                    <MenuItem value="10">Class 10</MenuItem>
                    <MenuItem value="11">Class 11</MenuItem>
                    <MenuItem value="12">Class 12</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={availableSubjects}
                  value={formData.subjects}
                  onChange={(_, newValue) => {
                    setFormData(prev => ({ ...prev, subjects: newValue }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Subjects"
                      required
                    />
                  )}
                  disabled={!formData.board || !formData.classLevel}
                />
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="endDate"
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Class Schedule</Typography>
                  <Button 
                    startIcon={<Clock />} 
                    onClick={addScheduleItem}
                    variant="outlined"
                    size="small"
                  >
                    Add Class Time
                  </Button>
                </Box>
                
                {formData.schedule.map((scheduleItem, index) => (
                  <Stack 
                    key={index} 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={2} 
                    sx={{ mb: 2 }}
                    alignItems="center"
                  >
                    <FormControl sx={{ minWidth: 120, flex: 1 }}>
                      <InputLabel>Day</InputLabel>
                      <Select
                        value={scheduleItem.day}
                        label="Day"
                        onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                      >
                        {weekdays.map(day => (
                          <MenuItem key={day} value={day}>{day}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <TextField
                      label="Start Time"
                      type="time"
                      value={scheduleItem.startTime}
                      onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      sx={{ flex: 1 }}
                    />
                    
                    <TextField
                      label="End Time"
                      type="time"
                      value={scheduleItem.endTime}
                      onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      sx={{ flex: 1 }}
                    />
                    
                    <IconButton 
                      color="error" 
                      onClick={() => removeScheduleItem(index)}
                      sx={{ mt: { xs: 1, sm: 0 } }}
                    >
                      <Trash2 size={20} />
                    </IconButton>
                  </Stack>
                ))}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Create Batch</Button>
        </DialogActions>
      </Dialog>

      <Card>
        <DataGrid
          rows={batches}
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
        />
      </Card>
    </Box>
  );
}

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/userRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/system', require('./routes/systemRoutes'));
app.use('/api/studentresults', require('./routes/studentResultRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/classresults', require('./routes/classResultRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));

// Test Route
app.get('/', (req, res) => {
  res.json({ message: 'Backend chal raha hai! ✅' });
});

// Server Start
app.listen(PORT, () => {
  console.log(`Server port ${PORT} pe chal raha hai`);
});
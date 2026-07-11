const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  rollNo:      { type: String, required: true },
  status:      { type: String, enum: ['P', 'A', 'L'], required: true },
  class:       { type: String, required: true },
  subject:     { type: String, default: '' },
  date:        { type: String, required: true },
  mode:        { type: String, enum: ['QR Scan', 'Manual'], default: 'Manual' },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  rollNo:      { type: String, required: true },
  status:      { type: String, enum: ['P', 'A', 'L'], required: true },
  class:       { type: String, required: true },
  date:        { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
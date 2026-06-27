const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Late', 'Absent'], required: true },
  subject: { type: String, required: true },
  class: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
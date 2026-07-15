const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  class: { type: String, required: true },
  normalizedClass: { type: String, default: '' },
  day: { type: String, required: true },
  time: { type: String, required: true },
  subject: { type: String, required: true },
  teacher: { type: String },
  room: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacher: { type: String },
  class: { type: String, required: true },
  chapters: { type: Number, default: 0 },
  chapDone: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
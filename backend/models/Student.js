const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  roll: { type: String, required: true },
  dept: { type: String, required: true },
  section: { type: String, default: '' },
  phone: { type: String },
  fatherName: { type: String, default: '' },
  password: { type: String },
  attend: { type: Number, default: 100 },
  marks: { type: Number, default: 0 },
  grade: { type: String, default: 'N/A' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });
studentSchema.index({ roll: 1, dept: 1 }, { unique: true });
module.exports = mongoose.model('Student', studentSchema);
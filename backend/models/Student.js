const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roll: { type: String, required: true, unique: true },
  dept: { type: String, required: true },
  phone: { type: String },
  password: { type: String },
  googleId: { type: String },
  photo: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
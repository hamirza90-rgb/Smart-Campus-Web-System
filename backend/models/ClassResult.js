const mongoose = require('mongoose');

const classResultSchema = new mongoose.Schema({
  cls: { type: String, required: true },
  avgMarks: { type: Number, default: 0 },
  passRate: { type: Number, default: 0 },
  topStudent: { type: String },
  distinctions: { type: Number, default: 0 },
  appeared: { type: Number, default: 0 },
  status: { type: String, enum: ['Published', 'Draft', 'Under Review'], default: 'Published' },
}, { timestamps: true });

module.exports = mongoose.model('ClassResult', classResultSchema);
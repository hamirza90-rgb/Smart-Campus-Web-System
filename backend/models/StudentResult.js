const mongoose = require('mongoose');

const studentResultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  examName: { type: String, default: 'Monthly Test' },
  subject: { type: String, required: true },
  marks: { type: Number, required: true },
  total: { type: Number, required: true, default: 100 },
}, { timestamps: true });

module.exports = mongoose.model('StudentResult', studentResultSchema);
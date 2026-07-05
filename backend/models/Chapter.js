const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Chapter', chapterSchema);
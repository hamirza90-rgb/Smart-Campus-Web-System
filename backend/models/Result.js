const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class: { type: String, required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  subjects: [{
    name: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    obtainedMarks: { type: Number, required: true },
    grade: { type: String }
  }],
  totalMarks: { type: Number },
  obtainedMarks: { type: Number },
  percentage: { type: Number },
  grade: { type: String },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
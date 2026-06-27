const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  class: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  dueDate: { type: Date, required: true },
  totalMarks: { type: Number, required: true },
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    submittedAt: { type: Date },
    fileUrl: { type: String },
    marks: { type: Number },
    feedback: { type: String },
    status: { type: String, enum: ['Submitted', 'Graded', 'Late'], default: 'Submitted' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
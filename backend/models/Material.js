const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  name: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number },
  uploadedOn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Material', materialSchema);
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  msg: { type: String, required: true },
  audience: { type: String, required: true },
  scheduled: { type: Boolean, default: false },
  schedDate: { type: String },
  createdBy: { type: String, default: 'admin' },
  createdById: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
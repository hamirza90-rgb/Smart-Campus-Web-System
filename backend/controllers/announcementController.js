const Announcement = require('../models/Announcement');

// Get all announcements
exports.getAllAnnouncements = async (req, res) => {
  try {
    const anns = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(anns);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add announcement
exports.addAnnouncement = async (req, res) => {
  try {
    const { title, msg, audience, scheduled, schedDate } = req.body;
    const ann = await Announcement.create({ title, msg, audience, scheduled, schedDate });
    res.status(201).json({ message: 'Announcement added', ann });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });
    res.status(200).json({ message: 'Announcement updated', ann });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndDelete(req.params.id);
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });
    res.status(200).json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
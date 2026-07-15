const Announcement = require('../models/Announcement');

// Get all announcements
exports.getAllAnnouncements = async (req, res) => {
  try {
    const anns = await Announcement.find().sort({ createdAt: -1 });

    // Admin ko sab dikhna chahiye (scheduled + live) — isliye query param se check karo
    const isAdminView = req.query.includeFuture === 'true';

    if (isAdminView) {
      return res.status(200).json(anns);
    }

    // Students/Teachers ke liye — sirf wahi announcements jo scheduled nahi hain
    // YA jinki schedDate aaj ki tareekh tak pohanch chuki hai
    const todayStr = new Date().toISOString().split('T')[0]; // "2026-07-15"

    const visibleAnns = anns.filter(a => {
      if (!a.scheduled || !a.schedDate) return true; // scheduled nahi to hamesha dikhega
      return a.schedDate <= todayStr; // scheduled date aaj ya pehle hai to dikhega
    });

    res.status(200).json(visibleAnns);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add announcement
exports.addAnnouncement = async (req, res) => {
  try {
    const { title, msg, audience, scheduled, schedDate, createdBy, createdById } = req.body;
    const ann = await Announcement.create({ title, msg, audience, scheduled, schedDate, createdBy: createdBy||'admin', createdById: createdById||'' });
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
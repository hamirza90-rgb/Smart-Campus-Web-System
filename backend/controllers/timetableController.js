const Timetable = require('../models/Timetable');

// Get all timetable entries (grouped by class)
exports.getAllTimetables = async (req, res) => {
  try {
    const entries = await Timetable.find();
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get timetable for specific class
exports.getClassTimetable = async (req, res) => {
  try {
    const entries = await Timetable.find({ class: req.params.className });
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add/Update timetable slot
exports.addOrUpdateSlot = async (req, res) => {
  try {
    const { class: className, day, time, subject, teacher, room } = req.body;
    let entry = await Timetable.findOne({ class: className, day, time });
    if (entry) {
      entry.subject = subject;
      entry.teacher = teacher;
      entry.room = room;
      await entry.save();
      res.status(200).json({ message: 'Timetable slot updated', entry });
    } else {
      entry = await Timetable.create({ class: className, day, time, subject, teacher, room });
      res.status(201).json({ message: 'Timetable slot added', entry });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Clear a slot
exports.clearSlot = async (req, res) => {
  try {
    await Timetable.findOneAndDelete({ class: req.params.className, day: req.params.day, time: req.params.time });
    res.status(200).json({ message: 'Slot cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
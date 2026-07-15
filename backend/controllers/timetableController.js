const Timetable = require('../models/Timetable');

// Class name normalize karo — sab same format mein
const normalizeClass = (cls) => {
  return (cls||'').toLowerCase().replace(/[-\s]+/g,' ').trim();
};

// Get all timetable entries
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
    const normalized = normalizeClass(req.params.className);
    const entries = await Timetable.find({
      normalizedClass: normalized
    });
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add/Update timetable slot
exports.addOrUpdateSlot = async (req, res) => {
  try {
    const { class: className, day, time, subject, teacher, room } = req.body;
    const normalized = normalizeClass(className);

    // Check if teacher is already assigned in another class
    if (teacher && teacher.trim()) {
      const teacherConflict = await Timetable.findOne({
        teacher: { $regex: new RegExp(`^${teacher.trim()}$`, "i") },
        day,
        time,
        normalizedClass: { $ne: normalized }
      });

      if (teacherConflict) {
        return res.status(409).json({
          message: `${teacher} is already assigned to ${teacherConflict.class} on ${day} ${time}.`
        });
      }
    }
    // Check if room is already occupied at this day+time by another class
    if (room && room.trim()) {
      const roomConflict = await Timetable.findOne({
        room: { $regex: new RegExp(`^${room.trim()}$`, "i") },
        day,
        time,
        normalizedClass: { $ne: normalized }
      });

      if (roomConflict) {
        return res.status(409).json({
          message: `${room} is already occupied by ${roomConflict.class} (${roomConflict.subject}) on ${day} ${time}.`
        });
      }
    }

    // Check if slot already exists for this class
    let entry = await Timetable.findOne({
      normalizedClass: normalized,
      day,
      time
    });

    if (entry) {
      entry.subject = subject;
      entry.teacher = teacher;
      entry.room = room;
      await entry.save();

      return res.status(200).json({
        message: "Timetable slot updated",
        entry
      });
    }

    entry = await Timetable.create({
      class: className,
      normalizedClass: normalized,
      day,
      time,
      subject,
      teacher,
      room
    });

    return res.status(201).json({
      message: "Timetable slot added",
      entry
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error
    });
  }
};

// Clear a slot
exports.clearSlot = async (req, res) => {
  try {
    const normalized = normalizeClass(req.params.className);
    await Timetable.findOneAndDelete({ 
      normalizedClass: normalized, 
      day: req.params.day, 
      time: req.params.time 
    });
    res.status(200).json({ message: 'Slot cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
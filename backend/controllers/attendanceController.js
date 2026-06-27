const Attendance = require('../models/Attendance');

exports.markAttendance = async (req, res) => {
  try {
    const { student, teacher, date, status, subject, class: className } = req.body;
    const attendance = await Attendance.create({ student, teacher, date, status, subject, class: className });
    res.status(201).json({ message: 'Attendance marked', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.params.studentId })
      .populate('teacher', 'name')
      .sort({ date: -1 });
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getClassAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ class: req.params.className })
      .populate('student', 'name roll')
      .sort({ date: -1 });
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
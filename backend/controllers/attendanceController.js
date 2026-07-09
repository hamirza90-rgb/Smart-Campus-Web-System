const Attendance = require('../models/Attendance');

exports.markAttendance = async (req, res) => {
  try {
    const { class: className, date, records } = req.body;
    const attendanceDocs = records.map(r => ({
      studentName: r.studentName,
      rollNo: r.rollNo,
      status: r.status,
      class: className,
      date: date,
      mode: r.mode || 'Manual'
    }));
    await Attendance.insertMany(attendanceDocs);
    res.status(201).json({ message: 'Attendance saved successfully', count: attendanceDocs.length });
  } catch (error) {
    console.log('Attendance Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
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
      .sort({ date: -1 });
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
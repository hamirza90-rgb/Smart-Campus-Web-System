const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.dept) {
      filter.dept = { $regex: new RegExp(req.query.dept, 'i') };
    }
    const students = await Student.find(filter);
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add new student
exports.addStudent = async (req, res) => {
  try {
    const { name, email, roll, dept, section, phone, attend, marks, grade, password, fatherName } = req.body;
    const existing = await Student.findOne({ roll, dept });
    if (existing) return res.status(400).json({ message: 'Student with this roll already exists' });
    const student = await Student.create({
      name,
      email: email || `${roll.toLowerCase()}@pgc.edu.pk`,
      roll,
      dept,
      section,
      phone,
      password: password || `${name.split(' ')[0]}@PGC2026`,
      attend: attend || 100,
      marks: marks || 0,
      grade: grade || 'N/A',
      fatherName: fatherName || ''
    });
    res.status(201).json({ message: 'Student added successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { name, email, roll, dept, section, phone, password, status, marks, attend, grade, fatherName } = req.body;
    const updateData = { name, email, roll, dept, section, phone, status, marks, attend, grade, fatherName };
    if (password && password.trim() !== '') updateData.password = password;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const updatedStudent = await Student.findById(req.params.id);
res.status(200).json({ message: 'Student updated', student: updatedStudent });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json({ message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email: email.toLowerCase() }).select('+password');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (student.password !== password) return res.status(401).json({ message: 'Incorrect password' });

    const token = jwt.sign(
      { id: student._id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      id: student._id,
      name: student.name,
      email: student.email,
      roll: student.roll,
      dept: student.dept,
      section: student.section
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
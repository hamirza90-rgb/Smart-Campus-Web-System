const Student = require('../models/Student');

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add new student
exports.addStudent = async (req, res) => {
  try {
    const { name, email, roll, dept, phone, attend, marks, grade } = req.body;
    const existing = await Student.findOne({ roll });
    if (existing) return res.status(400).json({ message: 'Student with this roll already exists' });
    const student = await Student.create({
      name,
      email: email || `${roll.toLowerCase()}@pgc.edu.pk`,
      roll,
      dept,
      phone,
      attend: attend || 100,
      marks: marks || 0,
      grade: grade || 'N/A'
    });
    res.status(201).json({ message: 'Student added successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json({ message: 'Student updated', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json({ message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
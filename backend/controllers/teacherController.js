const Teacher = require('../models/Teacher');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.status(200).json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.addTeacher = async (req, res) => {
  try {
    const { name, email, password, dept, phone } = req.body;
    const existing = await Teacher.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Teacher already exists' });
    const teacher = await Teacher.create({ name, email, password, dept, phone });
    res.status(201).json({ message: 'Teacher added successfully', teacher });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const { name, email, dept, phone, status } = req.body;
    const updateData = { name, email, dept, phone, status };
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.status(200).json({ message: 'Teacher updated', teacher });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.status(200).json({ message: 'Teacher deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    if (teacher.password !== password) return res.status(400).json({ message: 'Invalid password' });
    const token = jwt.sign(
      { id: teacher._id, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.status(200).json({ 
      message: 'Login successful',
      token,
      id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      dept: teacher.dept
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
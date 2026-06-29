const ClassResult = require('../models/ClassResult');

// Get all class results
exports.getAllClassResults = async (req, res) => {
  try {
    const results = await ClassResult.find().sort({ createdAt: -1 });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add class result
exports.addClassResult = async (req, res) => {
  try {
    const { cls, avgMarks, passRate, topStudent, distinctions, appeared, status } = req.body;
    const result = await ClassResult.create({ cls, avgMarks, passRate, topStudent, distinctions, appeared, status });
    res.status(201).json({ message: 'Class result added', result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update class result
exports.updateClassResult = async (req, res) => {
  try {
    const result = await ClassResult.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!result) return res.status(404).json({ message: 'Class result not found' });
    res.status(200).json({ message: 'Class result updated', result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete class result
exports.deleteClassResult = async (req, res) => {
  try {
    const result = await ClassResult.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Class result not found' });
    res.status(200).json({ message: 'Class result deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
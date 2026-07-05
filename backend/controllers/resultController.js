const Result = require('../models/Result');

exports.addResult = async (req, res) => {
  try {
    const { student, class: className, month, year, subjects } = req.body;
    const totalMarks = subjects.reduce((sum, s) => sum + s.totalMarks, 0);
    const obtainedMarks = subjects.reduce((sum, s) => sum + s.obtainedMarks, 0);
    const percentage = ((obtainedMarks / totalMarks) * 100).toFixed(2);
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';
    const result = await Result.create({ student, class: className, month, year, subjects, totalMarks, obtainedMarks, percentage, grade });
    res.status(201).json({ message: 'Result added', result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.params.studentId })
      .sort({ year: -1 });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getClassResults = async (req, res) => {
  try {
    const results = await Result.find({ class: req.params.className })
      .populate('student', 'name roll');
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
exports.getPassRate = async (req, res) => {
  try {
    const results = await Result.find({}, 'percentage');
    if (results.length === 0) {
      return res.status(200).json({ passRate: null, totalResults: 0 });
    }
    const passed = results.filter(r => r.percentage >= 40).length;
    const passRate = Math.round((passed / results.length) * 100);
    res.status(200).json({ passRate, totalResults: results.length, passed });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
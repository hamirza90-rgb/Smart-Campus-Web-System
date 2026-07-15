const Result = require('../models/Result');
const StudentResult = require('../models/StudentResult');


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
    const results = await StudentResult.find({ isPublished: true }, 'student marks total');
    if (results.length === 0) {
      return res.status(200).json({ passRate: null, totalResults: 0 });
    }

    // ── Group records by student, then compute each student's average % ──
    const studentMap = {};
    results.forEach(r => {
      const sid = String(r.student);
      if (!studentMap[sid]) studentMap[sid] = [];
      const pct = r.total > 0 ? (r.marks / r.total) * 100 : 0;
      studentMap[sid].push(pct);
    });

    const studentAverages = Object.values(studentMap).map(pcts =>
      pcts.reduce((a, b) => a + b, 0) / pcts.length
    );

    const passedStudents = studentAverages.filter(avg => avg >= 40).length;
    const passRate = Math.round((passedStudents / studentAverages.length) * 100);

    res.status(200).json({
      passRate,
      totalResults: results.length,
      totalStudents: studentAverages.length,
      passed: passedStudents
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
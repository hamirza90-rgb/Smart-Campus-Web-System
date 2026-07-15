const StudentResult = require('../models/StudentResult');

// Get all results for a specific student
exports.getStudentResults = async (req, res) => {
  try {
    const results = await StudentResult.find({ student: req.params.studentId });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add a new result (used by Admin/Teacher)
exports.addStudentResult = async (req, res) => {
  try {
    const { student, examName, subject, marks, total, class: cls, examType } = req.body;

    // ── Normalize text so "Monthly Test" and "monthly test " are treated as the same exam ──
    const normalizedExamName = (examName||examType||'').trim().toLowerCase();
    const normalizedSubject = (subject||'').trim().toLowerCase();

    const result = await StudentResult.findOneAndUpdate(
      { 
        student: student, 
        normalizedExamName,
        normalizedSubject
      },
      { 
        student, 
        examName: (examName||examType||'').trim(), 
        subject: (subject||'').trim(), 
        normalizedExamName,
        normalizedSubject,
        marks, 
        total,
        class: cls,
        examType: (examType||examName||'').trim()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    res.status(201).json({ message: 'Result saved', result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
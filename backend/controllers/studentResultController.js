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
    
    const result = await StudentResult.findOneAndUpdate(
      { 
        student: student, 
        examName: examName||examType, 
        subject: subject 
      },
      { 
        student, 
        examName: examName||examType, 
        subject, 
        marks, 
        total,
        class: cls,
        examType: examType||examName
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    res.status(201).json({ message: 'Result saved', result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
const Assignment = require('../models/Assignment');

exports.createAssignment = async (req, res) => {
  try {
    const { title, description, subject, class: className, teacher, dueDate, totalMarks } = req.body;
    const assignment = await Assignment.create({ title, description, subject, class: className, teacher, dueDate, totalMarks });
    res.status(201).json({ message: 'Assignment created', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ class: req.params.className })
      .populate('teacher', 'name');
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const { studentId, fileUrl } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    assignment.submissions.push({ student: studentId, fileUrl, submittedAt: new Date() });
    await assignment.save();
    res.status(200).json({ message: 'Assignment submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.gradeAssignment = async (req, res) => {
  try {
    const { submissionId, marks, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const submission = assignment.submissions.id(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    submission.marks = marks;
    submission.feedback = feedback;
    submission.status = 'Graded';
    await assignment.save();
    res.status(200).json({ message: 'Assignment graded' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
const Assignment = require('../models/Assignment');

// TEACHER: create — teacher ALWAYS from JWT, never from client body
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, subject, class: className, dueDate, totalMarks } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized — teacher not identified' });
    }

    const assignmentData = {
      title, description, subject, class: className,
      teacher: req.user.id,   // secure — from token, not client
      dueDate, totalMarks
    };

    if (req.file) {
      assignmentData.attachmentPath = req.file.filename;
      assignmentData.attachmentName = req.file.originalname;
    }

    const assignment = await Assignment.create(assignmentData);

    res.status(201).json({ message: 'Assignment created', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// TEACHER: get ONLY their own assignments (used by Teacher Dashboard)
exports.getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.user.id, status: { $ne: 'Removed' } })
      .populate('teacher', 'name')
      .populate('submissions.student', 'name roll')
      .sort({ createdAt: -1 });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// STUDENT: get assignments for their class
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ class: req.params.className, status: { $ne: 'Removed' } })
      .populate('teacher', 'name');
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ADMIN ONLY: get every assignment across all teachers
exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('teacher', 'name')
      .populate('submissions.student', 'name roll')
      .sort({ createdAt: -1 });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// TEACHER: update status — only if they own the assignment
// TEACHER: full update (title, subject, class, dueDate, marks) — only if they own the assignment
exports.updateAssignment = async (req, res) => {
  try {
    const { title, description, subject, class: className, dueDate, totalMarks, status } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (String(assignment.teacher) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to update this assignment' });
    }

    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (subject !== undefined) assignment.subject = subject;
    if (className !== undefined) assignment.class = className;
    if (dueDate !== undefined) assignment.dueDate = dueDate;
    if (totalMarks !== undefined) assignment.totalMarks = totalMarks;
    if (status !== undefined) assignment.status = status;

    await assignment.save();
    res.status(200).json({ message: 'Assignment updated', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
// ADMIN ONLY: approve/remove any teacher's assignment — no ownership check
exports.adminUpdateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    assignment.status = status;
    await assignment.save();
    res.status(200).json({ message: 'Assignment status updated by admin', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// STUDENT: submit — studentId from JWT, not client body
exports.submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const studentId = req.user?.id || req.body.studentId; // fallback while student JWT is added

    let fileUrl = req.body.fileUrl || '';
    let filePath = null;
    let fileName = null;

    if (req.file) {
      filePath = req.file.filename;
      fileName = req.file.originalname;
      fileUrl = '';
    }

    assignment.submissions.push({
      student: studentId,
      fileUrl,
      filePath,
      fileName,
      submittedAt: new Date()
    });
    await assignment.save();
    res.status(200).json({ message: 'Assignment submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// TEACHER: grade — only if they own the assignment
exports.gradeAssignment = async (req, res) => {
  try {
    const { submissionId, marks, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (String(assignment.teacher) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to grade this assignment' });
    }

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

// TEACHER: delete — only if they own the assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (String(assignment.teacher) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to delete this assignment' });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
// ADMIN ONLY: approve/remove any teacher's assignment — no ownership check
exports.adminUpdateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    assignment.status = status;
    await assignment.save();
    res.status(200).json({ message: 'Assignment status updated by admin', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
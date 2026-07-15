const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');

// Multer storage — same uploads folder used by materials
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });
const {
  createAssignment,
  getMyAssignments,
  getAssignments,
  getAllAssignments,
  updateAssignment,
  updateAssignmentStatus,
  adminUpdateAssignmentStatus,
  submitAssignment,
  gradeAssignment,
  deleteAssignment
} = require('../controllers/assignmentController');

// TEACHER: only their own assignments (Teacher Dashboard uses this) — must come before /:id routes
router.get('/my', protect(['teacher']), getMyAssignments);

// STUDENT: assignments for their class
router.get('/class/:className', getAssignments);

// TEACHER: create — teacher identified from JWT
router.post('/', protect(['teacher']), upload.single('file'), createAssignment);

// ADMIN: get every assignment
router.get('/', getAllAssignments);

// TEACHER: update status — only if they own it
// TEACHER: full update (title, subject, class, dueDate, marks) — only if they own it
router.put('/:id', protect(['teacher']), updateAssignment);

// TEACHER: update status — only if they own it
router.put('/admin/:id/status', protect(['admin']), adminUpdateAssignmentStatus);


// STUDENT: submit assignment (file upload OR pasted text)
router.post('/:id/submit', upload.single('file'), submitAssignment);

// TEACHER: grade — only if they own it
router.put('/:id/grade', protect(['teacher']), gradeAssignment);

// TEACHER: delete — only if they own it
router.delete('/:id', protect(['teacher']), deleteAssignment);

module.exports = router;
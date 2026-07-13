const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMyCourses,
  getAllCourses,
  addCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');

// Teacher: only their own courses (Teacher Dashboard uses this)
router.get('/my', protect(['teacher']), getMyCourses);

// General/student/admin: all courses, optionally ?class=XYZ
router.get('/', getAllCourses);

// Teacher: create/update/delete — only their own
router.post('/', protect(['teacher']), addCourse);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);
module.exports = router;
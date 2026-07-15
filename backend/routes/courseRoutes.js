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

router.get('/my', protect(['teacher']), getMyCourses);
router.get('/', getAllCourses);

router.post('/', protect(['teacher','admin']), addCourse);
router.put('/:id', protect(['teacher','admin']), updateCourse);
router.delete('/:id', protect(['teacher','admin']), deleteCourse);
module.exports = router;
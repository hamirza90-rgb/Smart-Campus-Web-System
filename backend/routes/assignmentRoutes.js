const express = require('express');
const router = express.Router();
const { createAssignment, getAssignments, getAllAssignments, updateAssignmentStatus, submitAssignment, gradeAssignment } = require('../controllers/assignmentController');

router.post('/', createAssignment);
router.get('/', getAllAssignments);
router.put('/:id/status', updateAssignmentStatus);
router.get('/class/:className', getAssignments);
router.post('/:id/submit', submitAssignment);
router.put('/:id/grade', gradeAssignment);

module.exports = router;
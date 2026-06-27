const express = require('express');
const router = express.Router();
const { createAssignment, getAssignments, submitAssignment, gradeAssignment } = require('../controllers/assignmentController');

router.post('/', createAssignment);
router.get('/class/:className', getAssignments);
router.post('/:id/submit', submitAssignment);
router.put('/:id/grade', gradeAssignment);

module.exports = router;
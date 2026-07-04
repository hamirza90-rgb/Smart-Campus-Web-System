const express = require('express');
const router = express.Router();
const { getStudentResults, addStudentResult } = require('../controllers/studentResultController');

router.get('/:studentId', getStudentResults);
router.post('/', addStudentResult);

module.exports = router;
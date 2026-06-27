const express = require('express');
const router = express.Router();
const { addResult, getStudentResults, getClassResults } = require('../controllers/resultController');

router.post('/', addResult);
router.get('/student/:studentId', getStudentResults);
router.get('/class/:className', getClassResults);

module.exports = router;
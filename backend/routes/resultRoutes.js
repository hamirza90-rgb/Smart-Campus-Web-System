const express = require('express');
const router = express.Router();
const { addResult, getStudentResults, getClassResults, getPassRate } = require('../controllers/resultController');
router.post('/', addResult);
router.get('/stats/passrate', getPassRate);
router.get('/student/:studentId', getStudentResults);
router.get('/class/:className', getClassResults);
module.exports = router;
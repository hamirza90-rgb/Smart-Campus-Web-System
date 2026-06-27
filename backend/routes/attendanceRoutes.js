const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance, getClassAttendance } = require('../controllers/attendanceController');

router.post('/', markAttendance);
router.get('/student/:studentId', getAttendance);
router.get('/class/:className', getClassAttendance);

module.exports = router;
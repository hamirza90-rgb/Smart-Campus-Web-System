const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance, getClassAttendance, getAllAttendance } = require('../controllers/attendanceController');
router.post('/', markAttendance);
router.get('/student/:studentId', getAttendance);
router.get('/class/:className', getClassAttendance);
router.get('/all', getAllAttendance);
module.exports = router;
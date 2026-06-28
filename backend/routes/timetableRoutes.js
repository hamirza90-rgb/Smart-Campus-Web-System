const express = require('express');
const router = express.Router();
const { getAllTimetables, getClassTimetable, addOrUpdateSlot, clearSlot } = require('../controllers/timetableController');

router.get('/', getAllTimetables);
router.get('/:className', getClassTimetable);
router.post('/', addOrUpdateSlot);
router.delete('/:className/:day/:time', clearSlot);

module.exports = router;
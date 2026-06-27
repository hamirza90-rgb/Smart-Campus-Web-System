const express = require('express');
const router = express.Router();
const { getAllTeachers, addTeacher, updateTeacher, deleteTeacher, teacherLogin } = require('../controllers/teacherController');

router.get('/', getAllTeachers);
router.post('/', addTeacher);
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);
router.post('/login', teacherLogin);

module.exports = router;
const express = require('express');
const router = express.Router();
const { getAllStudents, addStudent, updateStudent, deleteStudent, loginStudent } = require('../controllers/studentController');

router.get('/', getAllStudents);
router.post('/', addStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.post('/login', loginStudent);
module.exports = router;
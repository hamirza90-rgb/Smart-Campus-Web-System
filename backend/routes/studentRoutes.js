const express = require('express');
const router = express.Router();
const { getAllStudents, getStudent, addStudent, updateStudent, deleteStudent, studentLogin } = require('../controllers/studentController');

router.get('/', getAllStudents);
router.get('/:id', getStudent);
router.post('/', addStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.post('/login', studentLogin);

module.exports = router;
const express = require('express');
const router = express.Router();
const { getAllClassResults, addClassResult, updateClassResult, deleteClassResult } = require('../controllers/classResultController');

router.get('/', getAllClassResults);
router.post('/', addClassResult);
router.put('/:id', updateClassResult);
router.delete('/:id', deleteClassResult);

module.exports = router;
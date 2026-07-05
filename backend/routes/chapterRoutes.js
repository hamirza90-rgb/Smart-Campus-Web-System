const express = require('express');
const router = express.Router();
const Chapter = require('../models/Chapter');

// GET all chapters for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const chapters = await Chapter.find({ course: req.params.courseId }).sort({ createdAt: 1 });
    res.json(chapters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new chapter
router.post('/', async (req, res) => {
  try {
    const chapter = new Chapter(req.body);
    await chapter.save();
    res.status(201).json(chapter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update chapter (status/title/notes)
router.put('/:id', async (req, res) => {
  try {
    const updated = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE chapter
router.delete('/:id', async (req, res) => {
  try {
    await Chapter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Chapter deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
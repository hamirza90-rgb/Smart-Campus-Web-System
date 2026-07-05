const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Material = require('../models/Material');

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// POST — upload new material
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const material = new Material({
      course: req.body.course,
      name: req.body.name || req.file.originalname,
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size
    });
    await material.save();
    res.status(201).json(material);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET — list materials for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const materials = await Material.find({ course: req.params.courseId }).sort({ uploadedOn: -1 });
    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE — remove material
router.delete('/:id', async (req, res) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    res.json({ message: 'Material deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
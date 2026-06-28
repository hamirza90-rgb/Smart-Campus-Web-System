const express = require('express');
const router = express.Router();
const { getAllAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');

router.get('/', getAllAnnouncements);
router.post('/', addAnnouncement);
router.put('/:id', updateAnnouncement);
router.delete('/:id', deleteAnnouncement);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  downloadCalendarIcs
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// Download ICS does not require Bearer token header if opened from calendar link
router.get('/calendar/:interviewId.ics', downloadCalendarIcs);

router.use(protect);
router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

module.exports = router;

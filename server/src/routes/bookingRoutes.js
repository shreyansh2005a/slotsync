const express = require('express');
const router = express.Router();
const {
  getAvailableBookingSlots,
  reserveSlot,
  cancelBooking,
  getMyBookings,
  getAllBookings
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.route('/')
  .get(authorize('coordinator', 'interviewer'), getAllBookings)
  .post(authorize('candidate', 'coordinator'), reserveSlot);

router.get('/my', getMyBookings);
router.get('/available-slots', authorize('candidate', 'coordinator'), getAvailableBookingSlots);
router.post('/reserve', authorize('candidate', 'coordinator'), reserveSlot);
router.post('/cancel/:interviewId', authorize('candidate', 'coordinator'), cancelBooking);
router.patch('/:interviewId', authorize('candidate', 'coordinator'), cancelBooking);

module.exports = router;

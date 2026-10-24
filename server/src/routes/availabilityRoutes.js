const express = require('express');
const router = express.Router();
const {
  getAllAvailability,
  getUserAvailability,
  setUserAvailability,
  updateAvailability,
  addUnavailableOverride,
  getInterviewerSkills,
  updateInterviewerSkills,
  getRooms,
  createRoom
} = require('../controllers/availabilityController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.route('/')
  .get(getAllAvailability)
  .post(setUserAvailability);

router.route('/:id')
  .patch(updateAvailability);

router.route('/user/:userId')
  .get(getUserAvailability)
  .post(setUserAvailability);

router.post('/override', addUnavailableOverride);

router.route('/skills/:interviewerId')
  .get(getInterviewerSkills)
  .post(updateInterviewerSkills);

router.route('/rooms')
  .get(getRooms)
  .post(authorize('coordinator'), createRoom);

module.exports = router;

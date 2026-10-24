const express = require('express');
const router = express.Router();
const {
  generateSchedule,
  publishSchedule,
  runSimulation,
  handleDisruption,
  getScheduleVersions,
  getInterviews
} = require('../controllers/schedulingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/interviews', getInterviews);
router.post('/generate', authorize('coordinator'), generateSchedule);
router.post('/publish/:jobId', authorize('coordinator'), publishSchedule);
router.post('/simulate', authorize('coordinator'), runSimulation);
router.post('/reschedule-disruption', authorize('coordinator'), handleDisruption);
router.get('/versions/:driveId', authorize('coordinator'), getScheduleVersions);

module.exports = router;

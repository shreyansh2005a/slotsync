const express = require('express');
const router = express.Router();
const {
  getDrives,
  getDriveById,
  createDrive,
  updateDrive,
  createRound,
  getDriveCandidates,
  enrollCandidate,
  advanceCandidateRound,
  getDriveSchedule,
  generateDriveSchedule,
  publishDriveSchedule,
  getDriveEligibleSlots
} = require('../controllers/driveController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.route('/')
  .get(getDrives)
  .post(authorize('coordinator'), createDrive);

router.route('/:id')
  .get(getDriveById)
  .put(authorize('coordinator'), updateDrive)
  .patch(authorize('coordinator'), updateDrive);

router.route('/:id/rounds')
  .post(authorize('coordinator'), createRound);

router.route('/:id/candidates')
  .get(authorize('coordinator'), getDriveCandidates)
  .post(authorize('coordinator'), enrollCandidate);

router.route('/:driveId/candidates/:candidateId/advance')
  .post(authorize('coordinator'), advanceCandidateRound);

// REST Drive-Specific Scheduling & Booking Endpoints
router.route('/:id/schedule')
  .get(getDriveSchedule);

router.route('/:id/generate-schedule')
  .post(authorize('coordinator'), generateDriveSchedule);

router.route('/:id/publish')
  .post(authorize('coordinator'), publishDriveSchedule);

router.route('/:id/eligible-slots')
  .get(authorize('candidate', 'coordinator'), getDriveEligibleSlots);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getInterviewers,
  createInterviewer,
  updateInterviewer
} = require('../controllers/interviewerController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.route('/')
  .get(getInterviewers)
  .post(authorize('coordinator'), createInterviewer);

router.route('/:id')
  .patch(authorize('coordinator'), updateInterviewer);

module.exports = router;

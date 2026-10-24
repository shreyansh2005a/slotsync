const express = require('express');
const router = express.Router();
const {
  getCandidates,
  createCandidate,
  updateCandidate
} = require('../controllers/candidateController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.route('/')
  .get(authorize('coordinator', 'interviewer'), getCandidates)
  .post(authorize('coordinator'), createCandidate);

router.route('/:id')
  .patch(authorize('coordinator'), updateCandidate);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  submitEvaluation,
  getInterviewEvaluations,
  revealBlindedFeedback,
  getCandidateRankingMatrix
} = require('../controllers/evaluationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.post('/submit', authorize('interviewer', 'coordinator'), submitEvaluation);
router.get('/interview/:interviewId', authorize('interviewer', 'coordinator'), getInterviewEvaluations);
router.patch('/reveal/:interviewId', authorize('coordinator'), revealBlindedFeedback);
router.get('/ranking-matrix/:driveId', authorize('coordinator'), getCandidateRankingMatrix);

module.exports = router;

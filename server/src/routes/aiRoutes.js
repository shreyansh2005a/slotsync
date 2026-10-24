const express = require('express');
const router = express.Router();
const {
  handleAssistantQuery,
  handleExplainConflict,
  handleSummarizeEvaluations,
  handleRecruitmentInsights
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.post('/assistant', authorize('coordinator'), handleAssistantQuery);
router.post('/explain-conflict', authorize('coordinator'), handleExplainConflict);
router.post('/summarize-evaluations/:candidateId', authorize('coordinator', 'interviewer'), handleSummarizeEvaluations);
router.get('/recruitment-insights/:driveId', authorize('coordinator'), handleRecruitmentInsights);

module.exports = router;

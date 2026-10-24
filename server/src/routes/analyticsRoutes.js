const express = require('express');
const router = express.Router();
const { getDashboardMetrics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/dashboard/:driveId', authorize('coordinator'), getDashboardMetrics);

module.exports = router;

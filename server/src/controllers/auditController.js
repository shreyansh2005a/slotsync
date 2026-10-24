const AuditLog = require('../models/AuditLog');

// @desc    Get system audit logs
// @route   GET /api/audit
const getAuditLogs = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.entityType) filter.entityType = req.query.entityType;
    if (req.query.action) filter.action = req.query.action;

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs
};

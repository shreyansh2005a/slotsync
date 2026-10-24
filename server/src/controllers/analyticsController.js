const Interview = require('../models/Interview');
const RecruitmentDrive = require('../models/RecruitmentDrive');
const CandidateEligibility = require('../models/CandidateEligibility');
const User = require('../models/User');
const InterviewRoom = require('../models/InterviewRoom');
const { calculateWorkloadFairness, generateConflictHeatmap } = require('../scheduling/metrics');

// @desc    Get comprehensive dashboard & operational metrics
// @route   GET /api/analytics/dashboard/:driveId
const getDashboardMetrics = async (req, res, next) => {
  try {
    const { driveId } = req.params;
    const drive = await RecruitmentDrive.findById(driveId);
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Drive not found' });
    }

    const interviews = await Interview.find({ driveId });
    const eligibilities = await CandidateEligibility.find({ driveId });
    const interviewers = await User.find({ role: 'interviewer', isActive: true });
    const rooms = await InterviewRoom.find({ isActive: true });

    // Workload fairness
    const fairness = calculateWorkloadFairness(interviews, interviewers);

    // Conflict heatmap
    const heatmap = generateConflictHeatmap(interviews, drive);

    // Operational summary
    const totalCandidates = eligibilities.length;
    const completedCount = interviews.filter(i => i.status === 'completed').length;
    const scheduledCount = interviews.filter(i => i.status === 'scheduled').length;
    const cancelledCount = interviews.filter(i => i.status === 'cancelled').length;

    // Room utilization
    const roomUtilization = rooms.map(room => {
      const count = interviews.filter(i => i.roomId && i.roomId.toString() === room._id.toString() && i.status !== 'cancelled').length;
      return {
        roomId: room._id,
        name: room.name,
        isVirtual: room.isVirtual,
        capacity: room.capacity,
        bookedInterviews: count
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalCandidates,
          scheduledCount,
          completedCount,
          cancelledCount,
          totalInterviews: interviews.length,
          completionRate: interviews.length > 0 ? Math.round((completedCount / interviews.length) * 100) : 0
        },
        workloadFairness: fairness,
        roomUtilization,
        heatmap
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics
};

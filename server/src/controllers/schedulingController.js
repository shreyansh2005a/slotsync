const RecruitmentDrive = require('../models/RecruitmentDrive');
const InterviewRound = require('../models/InterviewRound');
const CandidateEligibility = require('../models/CandidateEligibility');
const AvailabilityWindow = require('../models/AvailabilityWindow');
const InterviewRoom = require('../models/InterviewRoom');
const Interview = require('../models/Interview');
const InterviewerSkill = require('../models/InterviewerSkill');
const User = require('../models/User');
const SchedulingJob = require('../models/SchedulingJob');
const ScheduleVersion = require('../models/ScheduleVersion');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

const SchedulingEngine = require('../scheduling/engine');
const ReschedulingEngine = require('../scheduling/reschedulingEngine');
const ScheduleSimulator = require('../scheduling/simulator');
const { validateSchedule } = require('../scheduling/validator');
const { broadcastDriveUpdate, broadcastToRole, emitToUser } = require('../services/socketService');

// Helper to gather all scheduling context
async function gatherSchedulingContext(driveId, roundId) {
  const drive = await RecruitmentDrive.findById(driveId);
  const round = await InterviewRound.findById(roundId);

  // Eligible candidates for this drive & round
  const eligibilities = await CandidateEligibility.find({
    driveId,
    currentRoundId: roundId,
    status: { $in: ['eligible', 'in_progress'] }
  }).populate('candidateId', 'name email department');

  const candidates = eligibilities
    .map(e => e.candidateId)
    .filter(Boolean);

  const candidateEligibilityMap = {};
  eligibilities.forEach(e => {
    if (e.candidateId) {
      candidateEligibilityMap[e.candidateId._id.toString()] = e;
    }
  });

  // Interviewers with skills
  const interviewerUsers = await User.find({ role: 'interviewer', isActive: true });
  const interviewerSkills = await InterviewerSkill.find();
  const skillsMap = {};
  interviewerSkills.forEach(s => {
    skillsMap[s.interviewerId.toString()] = s.skills;
  });

  const interviewersWithSkills = interviewerUsers.map(u => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    skills: skillsMap[u._id.toString()] || []
  }));

  // Availability windows
  const windows = await AvailabilityWindow.find();
  const availabilityMap = {};
  windows.forEach(w => {
    const uId = w.userId.toString();
    if (!availabilityMap[uId]) availabilityMap[uId] = [];
    availabilityMap[uId].push(w);
  });

  // Rooms
  const rooms = await InterviewRoom.find({ isActive: true });

  // Existing confirmed interviews
  const existingInterviews = await Interview.find({
    driveId,
    status: { $in: ['scheduled', 'proposed'] }
  });

  return {
    drive,
    round,
    candidates,
    candidateEligibilityMap,
    interviewers: interviewersWithSkills,
    availabilityMap,
    rooms,
    existingInterviews
  };
}

// @desc    Generate schedule proposal using constraint satisfaction engine
// @route   POST /api/scheduling/generate
const generateSchedule = async (req, res, next) => {
  try {
    const { driveId, roundId, options } = req.body;

    const ctx = await gatherSchedulingContext(driveId, roundId);
    if (!ctx.drive || !ctx.round) {
      return res.status(404).json({ success: false, message: 'Drive or Round not found' });
    }

    const engine = new SchedulingEngine({
      drive: ctx.drive,
      round: ctx.round,
      candidates: ctx.candidates,
      candidateEligibilityMap: ctx.candidateEligibilityMap,
      interviewers: ctx.interviewers,
      availabilityMap: ctx.availabilityMap,
      rooms: ctx.rooms,
      existingInterviews: ctx.existingInterviews,
      options: options || {}
    });

    const result = engine.solve();

    // Persist as a SchedulingJob for coordinator review
    const job = await SchedulingJob.create({
      driveId,
      roundId,
      parameters: options || {},
      status: result.valid ? 'completed' : 'failed',
      proposedInterviews: result.proposedInterviews,
      unscheduledCandidates: result.unscheduledCandidates,
      conflicts: result.conflicts,
      metrics: result.metrics,
      createdBy: req.user._id
    });

    res.json({
      success: true,
      jobId: job._id,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish proposed schedule into confirmed appointments
// @route   POST /api/scheduling/publish/:jobId
const publishSchedule = async (req, res, next) => {
  try {
    const job = await SchedulingJob.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Scheduling proposal not found' });
    }

    const ctx = await gatherSchedulingContext(job.driveId, job.roundId);

    // Final independent validation before commit
    const validation = validateSchedule(job.proposedInterviews, {
      drive: ctx.drive,
      round: ctx.round,
      existingInterviews: ctx.existingInterviews
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Independent Schedule Validator rejected proposal due to hard constraint violations.',
        violations: validation.violations
      });
    }

    // Persist proposed interviews into Interview collection
    const createdInterviews = [];
    for (const item of job.proposedInterviews) {
      const interview = await Interview.create({
        driveId: job.driveId,
        roundId: job.roundId,
        candidateId: item.candidateId,
        interviewers: item.interviewers,
        roomId: item.roomId,
        startTime: item.startTime,
        endTime: item.endTime,
        status: 'scheduled',
        meetingLink: item.roomId ? 'https://meet.slotsync.io/room-' + item.roomId.toString().slice(-4) : 'https://meet.slotsync.io/virtual'
      });

      createdInterviews.push(interview);

      // Create in-app notifications
      await Notification.create({
        recipientId: item.candidateId,
        title: 'Interview Scheduled',
        message: `Your ${item.roundName || 'interview'} has been confirmed for ${new Date(item.startTime).toLocaleString()}.`,
        type: 'booking',
        metadata: { interviewId: interview._id }
      });

      for (const intId of item.interviewers) {
        await Notification.create({
          recipientId: intId,
          title: 'New Panel Assignment',
          message: `You have been assigned to interview candidate ${item.candidateName} on ${new Date(item.startTime).toLocaleString()}.`,
          type: 'booking',
          metadata: { interviewId: interview._id }
        });
      }
    }

    // Update version snapshot
    const lastVersion = await ScheduleVersion.findOne({ driveId: job.driveId }).sort({ versionNumber: -1 });
    const nextVerNum = lastVersion ? lastVersion.versionNumber + 1 : 1;

    await ScheduleVersion.create({
      driveId: job.driveId,
      versionNumber: nextVerNum,
      snapshot: createdInterviews.map(i => ({
        interviewId: i._id,
        candidateId: i.candidateId,
        roundId: i.roundId,
        interviewers: i.interviewers,
        roomId: i.roomId,
        startTime: i.startTime,
        endTime: i.endTime,
        status: i.status
      })),
      changeSummary: `Published batch of ${createdInterviews.length} interviews for round ${job.roundId}`,
      publishedBy: req.user._id
    });

    // Mark job as published
    job.published = true;
    job.publishedAt = new Date();
    await job.save();

    // Real-time broadcast
    broadcastDriveUpdate(job.driveId.toString(), 'schedule_published', {
      driveId: job.driveId,
      version: nextVerNum,
      interviewsCount: createdInterviews.length
    });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'SCHEDULE_PUBLISHED',
      entityType: 'Schedule',
      entityId: job.driveId.toString(),
      details: { count: createdInterviews.length, version: nextVerNum }
    });

    res.json({
      success: true,
      message: `Schedule successfully published. ${createdInterviews.length} interviews confirmed.`,
      versionNumber: nextVerNum,
      interviews: createdInterviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run What-If Simulation
// @route   POST /api/scheduling/simulate
const runSimulation = async (req, res, next) => {
  try {
    const { driveId, roundId, scenario } = req.body;
    const ctx = await gatherSchedulingContext(driveId, roundId);

    const simulator = new ScheduleSimulator({
      drive: ctx.drive,
      round: ctx.round,
      candidates: ctx.candidates,
      interviewers: ctx.interviewers,
      availabilityMap: ctx.availabilityMap,
      rooms: ctx.rooms,
      currentInterviews: ctx.existingInterviews
    });

    const result = simulator.simulate(scenario);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Automated Rescheduling Proposal (Interviewer dropout / room disruption)
// @route   POST /api/scheduling/reschedule-disruption
const handleDisruption = async (req, res, next) => {
  try {
    const { driveId, roundId, trigger } = req.body;
    const ctx = await gatherSchedulingContext(driveId, roundId);

    const rescheduling = new ReschedulingEngine({
      drive: ctx.drive,
      round: ctx.round,
      existingInterviews: ctx.existingInterviews,
      candidates: ctx.candidates,
      interviewers: ctx.interviewers,
      availabilityMap: ctx.availabilityMap,
      rooms: ctx.rooms,
      trigger
    });

    const proposal = rescheduling.resolveDisruption();

    res.json({
      success: true,
      data: proposal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get schedule version history
// @route   GET /api/scheduling/versions/:driveId
const getScheduleVersions = async (req, res, next) => {
  try {
    const versions = await ScheduleVersion.find({ driveId: req.params.driveId })
      .sort({ versionNumber: -1 })
      .populate('publishedBy', 'name email');

    res.json({
      success: true,
      count: versions.length,
      data: versions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all confirmed interviews (with filters by drive, user, role)
// @route   GET /api/scheduling/interviews
const getInterviews = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.driveId) filter.driveId = req.query.driveId;
    if (req.query.roundId) filter.roundId = req.query.roundId;

    // RBAC interview filtering:
    // Interviewers only see interviews where they are assigned (or coordinator sees all)
    if (req.user.role === 'interviewer') {
      filter.interviewers = req.user._id;
    } else if (req.user.role === 'candidate') {
      filter.candidateId = req.user._id;
    }

    const interviews = await Interview.find(filter)
      .populate('candidateId', 'name email department phone avatar')
      .populate('interviewers', 'name email department avatar')
      .populate('roomId', 'name location isVirtual meetingLink')
      .populate('roundId', 'name type durationMinutes')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      count: interviews.length,
      data: interviews
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateSchedule,
  publishSchedule,
  runSimulation,
  handleDisruption,
  getScheduleVersions,
  getInterviews
};

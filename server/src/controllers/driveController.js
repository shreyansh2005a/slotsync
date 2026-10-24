const RecruitmentDrive = require('../models/RecruitmentDrive');
const InterviewRound = require('../models/InterviewRound');
const CandidateEligibility = require('../models/CandidateEligibility');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { broadcastDriveUpdate, emitToUser } = require('../services/socketService');

// @desc    Get all recruitment drives
// @route   GET /api/drives
const getDrives = async (req, res, next) => {
  try {
    const drives = await RecruitmentDrive.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: drives.length,
      data: drives
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single drive with rounds
// @route   GET /api/drives/:id
const getDriveById = async (req, res, next) => {
  try {
    const drive = await RecruitmentDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Recruitment drive not found' });
    }

    const rounds = await InterviewRound.find({ driveId: drive._id }).sort({ roundOrder: 1 });
    const candidatesCount = await CandidateEligibility.countDocuments({ driveId: drive._id });

    res.json({
      success: true,
      data: {
        ...drive.toObject(),
        rounds,
        candidatesCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new recruitment drive
// @route   POST /api/drives
const createDrive = async (req, res, next) => {
  try {
    const { title, description, companyName, startDate, endDate, timezone, workingHours, allowedDays, slotIntervalMinutes } = req.body;

    const drive = await RecruitmentDrive.create({
      title,
      description,
      companyName,
      startDate,
      endDate,
      timezone: timezone || 'UTC',
      workingHours: workingHours || { start: '09:00', end: '18:00' },
      allowedDays: allowedDays || [1, 2, 3, 4, 5],
      slotIntervalMinutes: slotIntervalMinutes || 15,
      createdBy: req.user._id
    });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DRIVE_CREATED',
      entityType: 'RecruitmentDrive',
      entityId: drive._id.toString(),
      details: { title: drive.title }
    });

    res.status(201).json({
      success: true,
      data: drive
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update recruitment drive
// @route   PUT /api/drives/:id
const updateDrive = async (req, res, next) => {
  try {
    let drive = await RecruitmentDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Drive not found' });
    }

    drive = await RecruitmentDrive.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: drive
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create interview round for drive
// @route   POST /api/drives/:id/rounds
const createRound = async (req, res, next) => {
  try {
    const drive = await RecruitmentDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Drive not found' });
    }

    const { roundOrder, name, type, durationMinutes, panelSize, requiredSkills, roomRequired, prerequisites, passThresholdScore } = req.body;

    const round = await InterviewRound.create({
      driveId: drive._id,
      roundOrder,
      name,
      type: type || 'technical',
      durationMinutes: durationMinutes || 45,
      panelSize: panelSize || 1,
      requiredSkills: requiredSkills || [],
      roomRequired: roomRequired !== false,
      prerequisites: prerequisites || [],
      passThresholdScore: passThresholdScore || 70
    });

    res.status(201).json({
      success: true,
      data: round
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get candidates enrolled in drive with multi-stage progression status
// @route   GET /api/drives/:id/candidates
const getDriveCandidates = async (req, res, next) => {
  try {
    const list = await CandidateEligibility.find({ driveId: req.params.id })
      .populate('candidateId', 'name email department phone avatar')
      .populate('currentRoundId')
      .populate('completedRounds.roundId');

    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll candidate in drive
// @route   POST /api/drives/:id/candidates
const enrollCandidate = async (req, res, next) => {
  try {
    const { candidateId, assignedTrack } = req.body;
    const drive = await RecruitmentDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Drive not found' });
    }

    // Default currentRoundId to first round of drive
    const firstRound = await InterviewRound.findOne({ driveId: drive._id }).sort({ roundOrder: 1 });

    const eligibility = await CandidateEligibility.findOneAndUpdate(
      { candidateId, driveId: drive._id },
      {
        candidateId,
        driveId: drive._id,
        currentRoundId: firstRound ? firstRound._id : null,
        assignedTrack: assignedTrack || 'Software Engineering',
        status: 'eligible'
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      data: eligibility
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Advance candidate to next pipeline round
// @route   POST /api/drives/:id/candidates/:candidateId/advance
const advanceCandidateRound = async (req, res, next) => {
  try {
    const { driveId, candidateId } = req.params;
    const { score, decision, evaluatorNotes } = req.body;

    const eligibility = await CandidateEligibility.findOne({ driveId, candidateId });
    if (!eligibility) {
      return res.status(404).json({ success: false, message: 'Candidate eligibility not found for drive' });
    }

    const currentRound = await InterviewRound.findById(eligibility.currentRoundId);

    // Record round completion
    if (currentRound) {
      eligibility.completedRounds.push({
        roundId: currentRound._id,
        score: score || 85,
        decision: decision || 'pass',
        evaluatorNotes: evaluatorNotes || 'Advancing to next pipeline stage',
        completedAt: new Date()
      });
    }

    if (decision === 'fail') {
      eligibility.status = 'rejected';
      await eligibility.save();
      return res.json({ success: true, message: 'Candidate marked as rejected', data: eligibility });
    }

    // Find next round
    const nextRound = await InterviewRound.findOne({
      driveId,
      roundOrder: { $gt: currentRound ? currentRound.roundOrder : 0 }
    }).sort({ roundOrder: 1 });

    if (nextRound) {
      eligibility.currentRoundId = nextRound._id;
      eligibility.status = 'eligible';
    } else {
      // Completed all rounds
      eligibility.status = 'passed';
    }

    await eligibility.save();

    emitToUser(candidateId, 'round_advanced', {
      driveId,
      nextRoundName: nextRound ? nextRound.name : 'Pipeline Completed',
      status: eligibility.status
    });

    res.json({
      success: true,
      message: nextRound ? `Candidate advanced to ${nextRound.name}` : 'Candidate has passed all stages of hiring drive!',
      data: eligibility
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get schedule for drive
// @route   GET /api/drives/:id/schedule
const getDriveSchedule = async (req, res, next) => {
  try {
    const Interview = require('../models/Interview');
    const interviews = await Interview.find({ driveId: req.params.id })
      .populate('candidateId', 'name email department phone')
      .populate('interviewers', 'name email department')
      .populate('roundId', 'name roundOrder type durationMinutes')
      .populate('roomId', 'name location isVirtual')
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

// @desc    Generate schedule directly from drive route
// @route   POST /api/drives/:id/generate-schedule
const generateDriveSchedule = async (req, res, next) => {
  try {
    const { generateSchedule } = require('./schedulingController');
    req.body.driveId = req.params.id;
    if (!req.body.roundId) {
      const firstRound = await InterviewRound.findOne({ driveId: req.params.id }).sort({ roundOrder: 1 });
      if (firstRound) req.body.roundId = firstRound._id.toString();
    }
    return generateSchedule(req, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Publish schedule directly from drive route
// @route   POST /api/drives/:id/publish
const publishDriveSchedule = async (req, res, next) => {
  try {
    const SchedulingJob = require('../models/SchedulingJob');
    const { publishSchedule } = require('./schedulingController');

    let jobId = req.body.jobId;
    if (!jobId) {
      const latestJob = await SchedulingJob.findOne({ driveId: req.params.id, status: 'completed' })
        .sort({ createdAt: -1 });
      if (latestJob) jobId = latestJob._id.toString();
    }

    if (!jobId) {
      return res.status(404).json({ success: false, message: 'No proposed schedule job found to publish for this drive.' });
    }

    req.params.jobId = jobId;
    return publishSchedule(req, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Get eligible slots directly from drive route
// @route   GET /api/drives/:id/eligible-slots
const getDriveEligibleSlots = async (req, res, next) => {
  try {
    const { getAvailableBookingSlots } = require('./bookingController');
    req.query.driveId = req.params.id;
    return getAvailableBookingSlots(req, res, next);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};

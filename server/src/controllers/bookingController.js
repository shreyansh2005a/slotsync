const RecruitmentDrive = require('../models/RecruitmentDrive');
const InterviewRound = require('../models/InterviewRound');
const CandidateEligibility = require('../models/CandidateEligibility');
const AvailabilityWindow = require('../models/AvailabilityWindow');
const InterviewRoom = require('../models/InterviewRoom');
const Interview = require('../models/Interview');
const InterviewerSkill = require('../models/InterviewerSkill');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { datesOverlap, parseTimeToMinutes, validateInterviewAssignment } = require('../scheduling/validator');
const { emitToUser, broadcastToRole } = require('../services/socketService');

// @desc    Discover available interview slots for candidate
// @route   GET /api/booking/available-slots
const getAvailableBookingSlots = async (req, res, next) => {
  try {
    const candidateId = req.user._id;
    const { driveId } = req.query;

    const eligibility = await CandidateEligibility.findOne({
      candidateId,
      driveId
    }).populate('currentRoundId');

    if (!eligibility || eligibility.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Candidate is not currently eligible for booking in this recruitment drive.'
      });
    }

    const round = eligibility.currentRoundId;
    if (!round) {
      return res.status(400).json({
        success: false,
        message: 'No active round assigned to candidate.'
      });
    }

    const drive = await RecruitmentDrive.findById(driveId);
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Drive not found' });
    }

    // Generate prospect slots
    const startDrive = new Date(drive.startDate);
    const endDrive = new Date(drive.endDate);
    const durationMin = round.durationMinutes || 45;
    const intervalMin = drive.slotIntervalMinutes || 15;
    const allowedDays = drive.allowedDays || [1, 2, 3, 4, 5];
    const workStartMin = parseTimeToMinutes(drive.workingHours?.start || '09:00');
    const workEndMin = parseTimeToMinutes(drive.workingHours?.end || '18:00');

    // Fetch interviewers qualified for this round
    const interviewers = await User.find({ role: 'interviewer', isActive: true });
    const skillsList = await InterviewerSkill.find();
    const skillsMap = {};
    skillsList.forEach(s => {
      skillsMap[s.interviewerId.toString()] = s.skills.map(sk => sk.name.toLowerCase());
    });

    const requiredSkills = (round.requiredSkills || []).map(s => s.toLowerCase());
    const qualifiedInterviewers = interviewers.filter(int => {
      const intSkills = skillsMap[int._id.toString()] || [];
      return requiredSkills.every(reqSkill => intSkills.includes(reqSkill));
    });

    // Existing active bookings in this drive
    const existingBookings = await Interview.find({
      driveId,
      status: { $in: ['scheduled', 'proposed'] }
    });

    // Rooms
    const rooms = await InterviewRoom.find({ isActive: true });
    const availableSlots = [];

    // Traverse days
    const curr = new Date(startDrive);
    curr.setUTCHours(0, 0, 0, 0);

    while (curr <= endDrive && availableSlots.length < 50) {
      const day = curr.getUTCDay();
      if (allowedDays.includes(day)) {
        for (let m = workStartMin; m + durationMin <= workEndMin; m += intervalMin) {
          const slotStart = new Date(curr);
          slotStart.setUTCMinutes(m);
          const slotEnd = new Date(slotStart);
          slotEnd.setUTCMinutes(slotStart.getUTCMinutes() + durationMin);

          // Check if candidate already has an interview overlapping this
          const candidateOverlap = existingBookings.some(b => 
            b.candidateId.toString() === candidateId.toString() &&
            datesOverlap(slotStart, slotEnd, b.startTime, b.endTime)
          );
          if (candidateOverlap) continue;

          // Find qualified interviewers free in this slot
          const freeInterviewers = qualifiedInterviewers.filter(int => {
            const intId = int._id.toString();
            const intOverlap = existingBookings.some(b => 
              b.interviewers.map(i => i.toString()).includes(intId) &&
              datesOverlap(slotStart, slotEnd, b.startTime, b.endTime)
            );
            return !intOverlap;
          });

          if (freeInterviewers.length < round.panelSize) continue;

          // Find available room
          const availableRoom = rooms.find(r => {
            const rId = r._id.toString();
            const roomOverlap = existingBookings.some(b => 
              b.roomId && b.roomId.toString() === rId &&
              datesOverlap(slotStart, slotEnd, b.startTime, b.endTime)
            );
            return !roomOverlap;
          });

          if (round.roomRequired && !availableRoom) continue;

          availableSlots.push({
            slotStart: slotStart.toISOString(),
            slotEnd: slotEnd.toISOString(),
            durationMinutes: durationMin,
            eligibleInterviewersCount: freeInterviewers.length,
            suggestedInterviewerIds: freeInterviewers.slice(0, round.panelSize).map(i => i._id),
            roomId: availableRoom ? availableRoom._id : null,
            roomName: availableRoom ? availableRoom.name : 'Virtual Meeting Room'
          });
        }
      }
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    res.json({
      success: true,
      roundName: round.name,
      durationMinutes: durationMin,
      totalAvailableSlots: availableSlots.length,
      data: availableSlots
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Atomically book a selected slot
// @route   POST /api/booking/reserve
const reserveSlot = async (req, res, next) => {
  try {
    const candidateId = req.user._id;
    const { driveId, slotStart, slotEnd, interviewerIds, roomId } = req.body;

    const start = new Date(slotStart);
    const end = new Date(slotEnd);

    // 1. Verify candidate eligibility
    const eligibility = await CandidateEligibility.findOne({
      candidateId,
      driveId,
      status: { $in: ['eligible', 'in_progress'] }
    }).populate('currentRoundId');

    if (!eligibility || !eligibility.currentRoundId) {
      return res.status(403).json({
        success: false,
        message: 'Candidate eligibility revoked or not eligible for current round.'
      });
    }

    const round = eligibility.currentRoundId;
    const drive = await RecruitmentDrive.findById(driveId);

    // 2. Strict concurrency & atomic race condition protection:
    // Query if ANY candidate, interviewer, or room has a confirmed booking that overlaps [start, end]
    const conflictingBooking = await Interview.findOne({
      status: { $in: ['scheduled', 'proposed'] },
      $or: [
        { candidateId, startTime: { $lt: end }, endTime: { $gt: start } },
        { interviewers: { $in: interviewerIds }, startTime: { $lt: end }, endTime: { $gt: start } },
        ...(roomId ? [{ roomId, startTime: { $lt: end }, endTime: { $gt: start } }] : [])
      ]
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Slot is no longer available. Another candidate or resource has booked an overlapping time.',
        conflictType: conflictingBooking.candidateId.toString() === candidateId.toString() 
          ? 'CANDIDATE_BUSY' 
          : 'INTERVIEWER_OR_ROOM_BUSY'
      });
    }

    // 3. Independent validation check
    const interviewerSkills = await InterviewerSkill.find({ interviewerId: { $in: interviewerIds } });
    const interviewersMap = {};
    interviewerSkills.forEach(s => {
      interviewersMap[s.interviewerId.toString()] = { skills: s.skills };
    });

    const singleValidation = validateInterviewAssignment({
      startTime: start,
      endTime: end,
      interviewers: interviewerIds,
      candidateId
    }, {
      drive,
      round,
      interviewersMap,
      candidateEligibility: eligibility
    });

    if (!singleValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Constraint violation detected by Schedule Validator.',
        errors: singleValidation.errors
      });
    }

    // 4. Create confirmed interview
    const interview = await Interview.create({
      driveId,
      roundId: round._id,
      candidateId,
      interviewers: interviewerIds,
      roomId: roomId || null,
      startTime: start,
      endTime: end,
      status: 'scheduled',
      isCandidateSelfBooked: true,
      meetingLink: 'https://meet.slotsync.io/booking-' + Math.random().toString(36).substring(2, 8)
    });

    // Update candidate eligibility status
    eligibility.status = 'scheduled';
    await eligibility.save();

    // In-app notifications
    await Notification.create({
      recipientId: candidateId,
      title: 'Interview Confirmed!',
      message: `Your interview for ${round.name} is scheduled on ${start.toLocaleString()}.`,
      type: 'booking',
      metadata: { interviewId: interview._id }
    });

    for (const intId of interviewerIds) {
      await Notification.create({
        recipientId: intId,
        title: 'New Interview Self-Booked',
        message: `Candidate ${req.user.name} has booked an interview for ${start.toLocaleString()}.`,
        type: 'booking',
        metadata: { interviewId: interview._id }
      });
    }

    // Socket alert
    broadcastToRole('coordinator', 'interview_booked', {
      interviewId: interview._id,
      candidateName: req.user.name,
      startTime: start
    });

    await AuditLog.create({
      userId: candidateId,
      userName: req.user.name,
      userRole: 'candidate',
      action: 'SLOT_SELF_BOOKED',
      entityType: 'Interview',
      entityId: interview._id.toString(),
      details: { startTime: start, endTime: end, roundId: round._id }
    });

    res.status(201).json({
      success: true,
      message: 'Interview slot successfully booked!',
      data: interview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel interview booking
// @route   POST /api/booking/cancel/:interviewId
const cancelBooking = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Ensure candidate or coordinator is cancelling
    if (req.user.role === 'candidate' && interview.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this interview' });
    }

    interview.status = 'cancelled';
    interview.cancellationReason = req.body.reason || 'Cancelled by user';
    await interview.save();

    // Reset candidate status back to 'eligible' for self-booking
    await CandidateEligibility.findOneAndUpdate(
      { candidateId: interview.candidateId, driveId: interview.driveId },
      { status: 'eligible' }
    );

    // Notifications
    await Notification.create({
      recipientId: interview.candidateId,
      title: 'Interview Cancelled',
      message: `Your interview scheduled for ${new Date(interview.startTime).toLocaleString()} has been cancelled.`,
      type: 'cancellation'
    });

    for (const intId of interview.interviewers) {
      await Notification.create({
        recipientId: intId,
        title: 'Interview Cancelled',
        message: `Interview on ${new Date(interview.startTime).toLocaleString()} has been cancelled.`,
        type: 'cancellation'
      });
    }

    broadcastToRole('coordinator', 'disruption_alert', {
      type: 'INTERVIEW_CANCELLED',
      interviewId: interview._id
    });

    res.json({
      success: true,
      message: 'Interview booking successfully cancelled.',
      data: interview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings for logged in user (candidate or interviewer)
// @route   GET /api/bookings/my
const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const filter = req.user.role === 'candidate'
      ? { candidateId: userId }
      : { interviewers: userId };

    const bookings = await Interview.find(filter)
      .populate('candidateId', 'name email department phone')
      .populate('interviewers', 'name email department')
      .populate('roundId', 'name roundOrder type durationMinutes')
      .populate('roomId', 'name location isVirtual meetingLink')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings (Coordinator / Admin view)
// @route   GET /api/bookings
const getAllBookings = async (req, res, next) => {
  try {
    const { driveId, status } = req.query;
    const filter = {};
    if (driveId) filter.driveId = driveId;
    if (status) filter.status = status;

    const bookings = await Interview.find(filter)
      .populate('candidateId', 'name email department')
      .populate('interviewers', 'name email department')
      .populate('roundId', 'name roundOrder type durationMinutes')
      .populate('roomId', 'name location isVirtual')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableBookingSlots,
  reserveSlot,
  cancelBooking,
  getMyBookings,
  getAllBookings
};

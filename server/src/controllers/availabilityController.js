const AvailabilityWindow = require('../models/AvailabilityWindow');
const InterviewRoom = require('../models/InterviewRoom');
const InterviewerSkill = require('../models/InterviewerSkill');
const User = require('../models/User');

// @desc    Get all availability windows or filtered by user
// @route   GET /api/availability
const getAllAvailability = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const query = {};
    if (userId) query.userId = userId;
    else if (req.user.role === 'interviewer') query.userId = req.user._id;

    const windows = await AvailabilityWindow.find(query).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({
      success: true,
      count: windows.length,
      data: windows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's availability windows
// @route   GET /api/availability/user/:userId
const getUserAvailability = async (req, res, next) => {
  try {
    const windows = await AvailabilityWindow.find({ userId: req.params.userId }).sort({ dayOfWeek: 1 });
    res.json({
      success: true,
      data: windows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set or update user's availability windows
// @route   POST /api/availability/user/:userId or POST /api/availability
const setUserAvailability = async (req, res, next) => {
  try {
    const { windows, dayOfWeek, startTime, endTime, isRecurring } = req.body;
    const userId = req.params.userId || req.body.userId || req.user._id;

    if (windows && Array.isArray(windows)) {
      // Batch rewrite
      await AvailabilityWindow.deleteMany({ userId, isRecurring: true });
      const created = await AvailabilityWindow.insertMany(
        windows.map(w => ({
          userId,
          role: req.user.role === 'coordinator' ? 'interviewer' : req.user.role,
          isRecurring: w.isRecurring !== false,
          dayOfWeek: w.dayOfWeek,
          startTime: w.startTime,
          endTime: w.endTime,
          isUnavailableOverride: false
        }))
      );
      return res.json({
        success: true,
        data: created
      });
    }

    // Single window creation
    const window = await AvailabilityWindow.create({
      userId,
      role: 'interviewer',
      dayOfWeek: dayOfWeek !== undefined ? Number(dayOfWeek) : 1,
      startTime: startTime || '09:00',
      endTime: endTime || '18:00',
      isRecurring: isRecurring !== false,
      isUnavailableOverride: false
    });

    res.status(201).json({
      success: true,
      data: window
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update single availability window
// @route   PATCH /api/availability/:id
const updateAvailability = async (req, res, next) => {
  try {
    const window = await AvailabilityWindow.findById(req.params.id);
    if (!window) {
      return res.status(404).json({ success: false, message: 'Availability window not found.' });
    }

    const { dayOfWeek, startTime, endTime, isUnavailableOverride, notes } = req.body;
    if (dayOfWeek !== undefined) window.dayOfWeek = Number(dayOfWeek);
    if (startTime) window.startTime = startTime;
    if (endTime) window.endTime = endTime;
    if (isUnavailableOverride !== undefined) window.isUnavailableOverride = isUnavailableOverride;
    if (notes !== undefined) window.notes = notes;

    await window.save();

    res.json({
      success: true,
      message: 'Availability window updated.',
      data: window
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add date-specific out-of-office override
// @route   POST /api/availability/override
const addUnavailableOverride = async (req, res, next) => {
  try {
    const { specificDate, notes, userId } = req.body;
    const targetUserId = userId || req.user._id;

    const override = await AvailabilityWindow.create({
      userId: targetUserId,
      role: 'interviewer',
      isRecurring: false,
      specificDate: new Date(specificDate),
      startTime: '00:00',
      endTime: '23:59',
      isUnavailableOverride: true,
      notes: notes || 'Out of Office'
    });

    res.status(201).json({
      success: true,
      data: override
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get interviewer skills & profile
// @route   GET /api/availability/skills/:interviewerId
const getInterviewerSkills = async (req, res, next) => {
  try {
    let profile = await InterviewerSkill.findOne({ interviewerId: req.params.interviewerId });
    if (!profile) {
      profile = await InterviewerSkill.create({
        interviewerId: req.params.interviewerId,
        skills: [{ name: 'System Design', proficiency: 'expert', verified: true }, { name: 'Node.js', proficiency: 'intermediate', verified: true }],
        eligibleRoundTypes: ['coding', 'technical', 'hr']
      });
    }
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update interviewer skills
// @route   POST /api/availability/skills/:interviewerId
const updateInterviewerSkills = async (req, res, next) => {
  try {
    const { skills, eligibleRoundTypes, maxInterviewsPerDay } = req.body;
    const profile = await InterviewerSkill.findOneAndUpdate(
      { interviewerId: req.params.interviewerId },
      {
        skills,
        eligibleRoundTypes,
        maxInterviewsPerDay: maxInterviewsPerDay || 4
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all rooms (retained for backward compatibility)
// @route   GET /api/availability/rooms
const getRooms = async (req, res, next) => {
  try {
    const rooms = await InterviewRoom.find({ isActive: true });
    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new room (retained for backward compatibility)
// @route   POST /api/availability/rooms
const createRoom = async (req, res, next) => {
  try {
    const { name, capacity, isVirtual, location, meetingLink, equipment } = req.body;
    const room = await InterviewRoom.create({
      name,
      capacity: capacity || 4,
      isVirtual: !!isVirtual,
      location: location || 'Main Campus',
      meetingLink: meetingLink || '',
      equipment: equipment || []
    });

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAvailability,
  getUserAvailability,
  setUserAvailability,
  updateAvailability,
  addUnavailableOverride,
  getInterviewerSkills,
  updateInterviewerSkills,
  getRooms,
  createRoom
};

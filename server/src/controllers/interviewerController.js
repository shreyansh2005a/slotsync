const User = require('../models/User');
const InterviewerSkill = require('../models/InterviewerSkill');
const AvailabilityWindow = require('../models/AvailabilityWindow');
const AuditLog = require('../models/AuditLog');

// @desc    Get all interviewers with skills and daily limits
// @route   GET /api/interviewers
const getInterviewers = async (req, res, next) => {
  try {
    const { search } = req.query;

    const query = { role: 'interviewer' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const interviewers = await User.find(query).sort({ createdAt: -1 });
    const interviewerIds = interviewers.map(i => i._id);

    const skills = await InterviewerSkill.find({ interviewerId: { $in: interviewerIds } });
    const skillMap = {};
    skills.forEach(s => {
      skillMap[s.interviewerId.toString()] = s;
    });

    const enriched = interviewers.map(i => {
      const iObj = i.toObject();
      const sk = skillMap[i._id.toString()];
      iObj.skills = sk ? sk.skills.map(s => s.name) : ['General Technical'];
      iObj.skillObjects = sk ? sk.skills : [];
      iObj.maxInterviewsPerDay = sk ? sk.maxInterviewsPerDay : 4;
      iObj.maxInterviewsPerWeek = sk ? sk.maxInterviewsPerWeek : 15;
      return iObj;
    });

    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new interviewer
// @route   POST /api/interviewers
const createInterviewer = async (req, res, next) => {
  try {
    const { name, email, password, department, phone, skills, maxInterviewsPerDay } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required to register an interviewer.'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An interviewer with this email address already exists.'
      });
    }

    const interviewer = await User.create({
      name,
      email,
      password: password || 'Password123!',
      role: 'interviewer',
      department: department || 'Engineering Evaluation',
      phone: phone || '',
      timezone: 'UTC'
    });

    // Format skills
    let skillList = [];
    if (Array.isArray(skills)) {
      skillList = skills.map(s => typeof s === 'string' ? { name: s, proficiency: 'expert' } : s);
    } else if (typeof skills === 'string') {
      skillList = skills.split(',').map(s => ({ name: s.trim(), proficiency: 'expert' })).filter(s => s.name);
    }

    if (skillList.length === 0) {
      skillList = [{ name: 'System Design', proficiency: 'expert' }, { name: 'Technical', proficiency: 'expert' }];
    }

    const skillRecord = await InterviewerSkill.create({
      interviewerId: interviewer._id,
      skills: skillList,
      maxInterviewsPerDay: Number(maxInterviewsPerDay) || 4,
      eligibleRoundTypes: ['coding', 'technical', 'hr', 'behavioral']
    });

    // Create default recurring availability windows (Mon-Fri 09:00 - 18:00)
    const defaultWindows = [1, 2, 3, 4, 5].map(day => ({
      userId: interviewer._id,
      role: 'interviewer',
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '18:00',
      isRecurring: true
    }));
    await AvailabilityWindow.insertMany(defaultWindows);

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'INTERVIEWER_CREATED',
      entityType: 'User',
      entityId: interviewer._id.toString(),
      details: { interviewerName: interviewer.name, email: interviewer.email, skills: skillList }
    });

    res.status(201).json({
      success: true,
      message: 'Interviewer created with default availability windows.',
      data: {
        _id: interviewer._id,
        name: interviewer.name,
        email: interviewer.email,
        department: interviewer.department,
        skills: skillList.map(s => s.name),
        maxInterviewsPerDay: skillRecord.maxInterviewsPerDay
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update interviewer skills and capacity
// @route   PATCH /api/interviewers/:id
const updateInterviewer = async (req, res, next) => {
  try {
    const { name, department, phone, skills, maxInterviewsPerDay, isActive } = req.body;

    const interviewer = await User.findById(req.params.id);
    if (!interviewer || interviewer.role !== 'interviewer') {
      return res.status(404).json({
        success: false,
        message: 'Interviewer not found.'
      });
    }

    if (name) interviewer.name = name;
    if (department) interviewer.department = department;
    if (phone !== undefined) interviewer.phone = phone;
    if (isActive !== undefined) interviewer.isActive = isActive;
    await interviewer.save();

    let skillRecord = await InterviewerSkill.findOne({ interviewerId: interviewer._id });
    if (!skillRecord) {
      skillRecord = new InterviewerSkill({ interviewerId: interviewer._id });
    }

    if (skills) {
      let skillList = [];
      if (Array.isArray(skills)) {
        skillList = skills.map(s => typeof s === 'string' ? { name: s, proficiency: 'expert' } : s);
      } else if (typeof skills === 'string') {
        skillList = skills.split(',').map(s => ({ name: s.trim(), proficiency: 'expert' })).filter(s => s.name);
      }
      skillRecord.skills = skillList;
    }

    if (maxInterviewsPerDay !== undefined) {
      skillRecord.maxInterviewsPerDay = Number(maxInterviewsPerDay);
    }

    await skillRecord.save();

    res.json({
      success: true,
      message: 'Interviewer profile updated successfully.',
      data: {
        _id: interviewer._id,
        name: interviewer.name,
        email: interviewer.email,
        skills: skillRecord.skills.map(s => s.name),
        maxInterviewsPerDay: skillRecord.maxInterviewsPerDay
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInterviewers,
  createInterviewer,
  updateInterviewer
};

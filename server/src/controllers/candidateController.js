const User = require('../models/User');
const CandidateEligibility = require('../models/CandidateEligibility');
const RecruitmentDrive = require('../models/RecruitmentDrive');
const InterviewRound = require('../models/InterviewRound');
const AuditLog = require('../models/AuditLog');

// @desc    Get all candidates with eligibility / drive status
// @route   GET /api/candidates
const getCandidates = async (req, res, next) => {
  try {
    const { driveId, search } = req.query;

    const query = { role: 'candidate' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const candidates = await User.find(query).sort({ createdAt: -1 });

    // Fetch eligibility records to enrich candidate data
    const eligibilityQuery = {};
    if (driveId) eligibilityQuery.driveId = driveId;

    const eligibilities = await CandidateEligibility.find(eligibilityQuery)
      .populate('driveId', 'title status')
      .populate('currentRoundId', 'name roundOrder type');

    const eligibilityMap = {};
    eligibilities.forEach(el => {
      const cId = el.candidateId.toString();
      if (!eligibilityMap[cId]) eligibilityMap[cId] = [];
      eligibilityMap[cId].push(el);
    });

    const enriched = candidates.map(c => {
      const cObj = c.toObject();
      const elList = eligibilityMap[c._id.toString()] || [];
      cObj.enrollments = elList;
      cObj.latestStatus = elList.length > 0 ? elList[0].status : 'unassigned';
      cObj.currentRound = elList.length > 0 ? elList[0].currentRoundId : null;
      return cObj;
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

// @desc    Create a new candidate
// @route   POST /api/candidates
const createCandidate = async (req, res, next) => {
  try {
    const { name, email, password, department, phone, assignedTrack, driveId } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required to register a candidate.'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A candidate with this email address already exists.'
      });
    }

    const candidate = await User.create({
      name,
      email,
      password: password || 'Password123!',
      role: 'candidate',
      department: department || 'Computer Science & Engineering',
      phone: phone || '',
      timezone: 'UTC'
    });

    // Optionally enroll in a recruitment drive if provided
    let eligibility = null;
    if (driveId) {
      const drive = await RecruitmentDrive.findById(driveId);
      if (drive) {
        const firstRound = await InterviewRound.findOne({ driveId }).sort({ roundOrder: 1 });
        eligibility = await CandidateEligibility.create({
          candidateId: candidate._id,
          driveId,
          currentRoundId: firstRound ? firstRound._id : null,
          status: 'eligible',
          assignedTrack: assignedTrack || 'Software Engineering'
        });
      }
    }

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CANDIDATE_CREATED',
      entityType: 'User',
      entityId: candidate._id.toString(),
      details: { candidateName: candidate.name, email: candidate.email, driveId }
    });

    res.status(201).json({
      success: true,
      message: 'Candidate created successfully.',
      data: {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        role: candidate.role,
        department: candidate.department,
        eligibility
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update candidate details
// @route   PATCH /api/candidates/:id
const updateCandidate = async (req, res, next) => {
  try {
    const { name, department, phone, isActive, status, driveId } = req.body;

    const candidate = await User.findById(req.params.id);
    if (!candidate || candidate.role !== 'candidate') {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found.'
      });
    }

    if (name) candidate.name = name;
    if (department) candidate.department = department;
    if (phone !== undefined) candidate.phone = phone;
    if (isActive !== undefined) candidate.isActive = isActive;
    await candidate.save();

    // If status updated for a specific drive
    if (status && driveId) {
      await CandidateEligibility.findOneAndUpdate(
        { candidateId: candidate._id, driveId },
        { status },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'Candidate updated successfully.',
      data: candidate
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCandidates,
  createCandidate,
  updateCandidate
};

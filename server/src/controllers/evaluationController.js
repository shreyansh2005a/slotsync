const InterviewEvaluation = require('../models/InterviewEvaluation');
const Interview = require('../models/Interview');
const CandidateEligibility = require('../models/CandidateEligibility');
const AuditLog = require('../models/AuditLog');
const { broadcastToRole } = require('../services/socketService');

// @desc    Submit interview evaluation
// @route   POST /api/evaluations/submit
const submitEvaluation = async (req, res, next) => {
  try {
    const {
      interviewId,
      candidateId,
      roundId,
      rubricScores,
      writtenFeedback,
      keyStrengths,
      areasForImprovement,
      overallRating,
      recommendation
    } = req.body;

    const interviewerId = req.user._id;

    // Check if interviewer is part of this interview panel
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    const isAuthorizedInterviewer = interview.interviewers
      .map(id => id.toString())
      .includes(interviewerId.toString()) || req.user.role === 'coordinator';

    if (!isAuthorizedInterviewer) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to evaluate this interview.'
      });
    }

    const evaluation = await InterviewEvaluation.findOneAndUpdate(
      { interviewId, interviewerId },
      {
        interviewId,
        candidateId,
        interviewerId,
        roundId,
        rubricScores,
        writtenFeedback,
        keyStrengths: keyStrengths || [],
        areasForImprovement: areasForImprovement || [],
        overallRating,
        recommendation,
        isBlinded: true, // Blinded mode default enabled
        submissionStatus: 'submitted',
        submittedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Update interview status to completed if appropriate
    interview.status = 'completed';
    await interview.save();

    broadcastToRole('coordinator', 'evaluation_submitted', {
      interviewId,
      interviewerId,
      candidateId
    });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'EVALUATION_SUBMITTED',
      entityType: 'InterviewEvaluation',
      entityId: evaluation._id.toString(),
      details: { recommendation, overallRating }
    });

    res.status(201).json({
      success: true,
      message: 'Evaluation submitted successfully.',
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get evaluations for an interview (enforces Blinded Feedback mode for interviewers)
// @route   GET /api/evaluations/interview/:interviewId
const getInterviewEvaluations = async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    const currentUserId = req.user._id.toString();
    const currentUserRole = req.user.role;

    const evaluations = await InterviewEvaluation.find({ interviewId })
      .populate('interviewerId', 'name email department avatar')
      .populate('candidateId', 'name email')
      .populate('roundId', 'name type');

    // Blinded Feedback enforcement:
    // If user is interviewer, they can ONLY see their own evaluation unless isBlinded === false
    const sanitized = evaluations.map(ev => {
      const isOwner = ev.interviewerId._id.toString() === currentUserId;
      if (currentUserRole === 'coordinator' || isOwner || !ev.isBlinded) {
        return ev;
      }
      // Blinded view: mask feedback and ratings from peer interviewer
      return {
        _id: ev._id,
        interviewId: ev.interviewId,
        interviewerId: { name: 'Peer Evaluator (Blinded)', department: 'Confidential' },
        submissionStatus: ev.submissionStatus,
        isBlinded: true,
        message: 'Feedback is masked until revealed by coordinator or all scores submitted.'
      };
    });

    res.json({
      success: true,
      count: sanitized.length,
      data: sanitized
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle blinded mode (Coordinator reveal)
// @route   PATCH /api/evaluations/reveal/:interviewId
const revealBlindedFeedback = async (req, res, next) => {
  try {
    await InterviewEvaluation.updateMany(
      { interviewId: req.params.interviewId },
      { isBlinded: false, revealedAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Blinded feedback unmasked and revealed for all authorized evaluators.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Aggregated Candidate Comparison & Ranking Matrix
// @route   GET /api/evaluations/ranking-matrix/:driveId
const getCandidateRankingMatrix = async (req, res, next) => {
  try {
    const { driveId } = req.params;
    const { weightTech = 0.35, weightProblem = 0.35, weightComm = 0.15, weightRole = 0.15 } = req.query;

    const wT = parseFloat(weightTech);
    const wP = parseFloat(weightProblem);
    const wC = parseFloat(weightComm);
    const wR = parseFloat(weightRole);
    const sumW = wT + wP + wC + wR || 1.0;

    // Fetch all candidates enrolled in drive
    const eligibilities = await CandidateEligibility.find({ driveId })
      .populate('candidateId', 'name email department phone avatar')
      .populate('currentRoundId', 'name roundOrder');

    // Fetch all evaluations for this drive
    const interviews = await Interview.find({ driveId });
    const interviewIds = interviews.map(i => i._id);

    const evaluations = await InterviewEvaluation.find({ interviewId: { $in: interviewIds } })
      .populate('interviewerId', 'name')
      .populate('roundId', 'name roundOrder');

    // Group evaluations by candidate
    const candidateEvalMap = {};
    evaluations.forEach(ev => {
      const cId = ev.candidateId.toString();
      if (!candidateEvalMap[cId]) candidateEvalMap[cId] = [];
      candidateEvalMap[cId].push(ev);
    });

    const rankingMatrix = eligibilities.map(eligibility => {
      const candidate = eligibility.candidateId;
      if (!candidate) return null;

      const candEvals = candidateEvalMap[candidate._id.toString()] || [];
      const evalCount = candEvals.length;

      let avgTechnical = 0;
      let avgProblemSolving = 0;
      let avgCommunication = 0;
      let avgRoleSpecific = 0;
      let avgOverall = 0;

      if (evalCount > 0) {
        candEvals.forEach(e => {
          avgTechnical += (e.rubricScores?.technical || 0);
          avgProblemSolving += (e.rubricScores?.problemSolving || 0);
          avgCommunication += (e.rubricScores?.communication || 0);
          avgRoleSpecific += (e.rubricScores?.roleSpecific || 0);
          avgOverall += (e.overallRating || 0);
        });

        avgTechnical = parseFloat((avgTechnical / evalCount).toFixed(2));
        avgProblemSolving = parseFloat((avgProblemSolving / evalCount).toFixed(2));
        avgCommunication = parseFloat((avgCommunication / evalCount).toFixed(2));
        avgRoleSpecific = parseFloat((avgRoleSpecific / evalCount).toFixed(2));
        avgOverall = parseFloat((avgOverall / evalCount).toFixed(2));
      }

      // Weighted composite score (scaled 0 - 100)
      const rawComposite = (
        avgTechnical * wT +
        avgProblemSolving * wP +
        avgCommunication * wC +
        avgRoleSpecific * wR
      ) / sumW;

      const compositeScore = evalCount > 0 ? parseFloat(((rawComposite / 5.0) * 100).toFixed(1)) : 0;

      // Recommendation counts
      const recommendations = candEvals.map(e => e.recommendation);
      const hireVotes = recommendations.filter(r => r === 'hire' || r === 'strong_hire').length;

      return {
        candidateId: candidate._id,
        candidateName: candidate.name,
        email: candidate.email,
        department: candidate.department,
        currentRound: eligibility.currentRoundId?.name || 'Round 1',
        status: eligibility.status,
        completedRoundsCount: eligibility.completedRounds?.length || 0,
        evaluationsCount: evalCount,
        rubricAverages: {
          technical: avgTechnical,
          problemSolving: avgProblemSolving,
          communication: avgCommunication,
          roleSpecific: avgRoleSpecific,
          overallRating: avgOverall
        },
        compositeScore,
        hireVotes,
        evaluations: candEvals.map(e => ({
          roundName: e.roundId?.name,
          interviewerName: e.interviewerId?.name,
          overallRating: e.overallRating,
          recommendation: e.recommendation
        }))
      };
    }).filter(Boolean);

    // Sort by compositeScore descending, then by hireVotes (Tie-breaking)
    rankingMatrix.sort((a, b) => {
      if (b.compositeScore !== a.compositeScore) {
        return b.compositeScore - a.compositeScore;
      }
      return b.hireVotes - a.hireVotes;
    });

    // Assign ranking positions
    rankingMatrix.forEach((item, index) => {
      item.rank = index + 1;
    });

    res.json({
      success: true,
      weightsUsed: { wT, wP, wC, wR },
      count: rankingMatrix.length,
      data: rankingMatrix
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitEvaluation,
  getInterviewEvaluations,
  revealBlindedFeedback,
  getCandidateRankingMatrix
};

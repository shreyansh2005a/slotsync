const {
  processAssistantRequest,
  explainConflicts,
  summarizeEvaluations,
  generateRecruitmentInsights
} = require('../ai/aiService');
const InterviewEvaluation = require('../models/InterviewEvaluation');
const Interview = require('../models/Interview');
const RecruitmentDrive = require('../models/RecruitmentDrive');
const User = require('../models/User');
const { calculateWorkloadFairness } = require('../scheduling/metrics');

// @desc    Natural Language Scheduling Assistant
// @route   POST /api/ai/assistant
const handleAssistantQuery = async (req, res, next) => {
  try {
    const { prompt, driveId } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Please provide a prompt instruction' });
    }

    const drive = driveId ? await RecruitmentDrive.findById(driveId) : null;
    const result = await processAssistantRequest(prompt, { driveTitle: drive?.title });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Conflict Explainer
// @route   POST /api/ai/explain-conflict
const handleExplainConflict = async (req, res, next) => {
  try {
    const { validatorOutput, context } = req.body;
    const explanation = await explainConflicts(validatorOutput || {}, context || {});

    res.json({
      success: true,
      data: explanation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Interview Feedback Summarizer
// @route   POST /api/ai/summarize-evaluations/:candidateId
const handleSummarizeEvaluations = async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const candidate = await User.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // RBAC: Interviewers can only summarize if allowed or coordinator
    const evaluations = await InterviewEvaluation.find({ candidateId });
    if (evaluations.length === 0) {
      return res.status(400).json({ success: false, message: 'No submitted evaluations found for candidate.' });
    }

    const summary = await summarizeEvaluations(evaluations, candidate.name);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Recruitment Operations Insights
// @route   GET /api/ai/recruitment-insights/:driveId
const handleRecruitmentInsights = async (req, res, next) => {
  try {
    const { driveId } = req.params;
    const drive = await RecruitmentDrive.findById(driveId);
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Drive not found' });
    }

    const interviews = await Interview.find({ driveId });
    const interviewers = await User.find({ role: 'interviewer' });
    const fairness = calculateWorkloadFairness(interviews, interviewers);

    const scheduledCount = interviews.filter(i => i.status === 'scheduled' || i.status === 'completed').length;
    const totalCount = interviews.length;
    const successRate = totalCount > 0 ? Math.round((scheduledCount / totalCount) * 100) : 100;

    const metricsData = {
      driveTitle: drive.title,
      totalInterviews: totalCount,
      schedulingSuccessRate: successRate,
      workloadFairness: fairness
    };

    const insights = await generateRecruitmentInsights(metricsData);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleAssistantQuery,
  handleExplainConflict,
  handleSummarizeEvaluations,
  handleRecruitmentInsights
};

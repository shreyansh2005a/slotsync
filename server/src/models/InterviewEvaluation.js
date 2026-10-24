const mongoose = require('mongoose');

const interviewEvaluationSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true,
    index: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  interviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewRound',
    required: true,
    index: true
  },
  rubricScores: {
    technical: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    problemSolving: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    roleSpecific: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  },
  writtenFeedback: {
    type: String,
    required: true,
    trim: true
  },
  keyStrengths: [{
    type: String,
    trim: true
  }],
  areasForImprovement: [{
    type: String,
    trim: true
  }],
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  recommendation: {
    type: String,
    enum: ['strong_hire', 'hire', 'lean_hire', 'lean_no', 'no_hire'],
    required: true
  },
  isBlinded: {
    type: Boolean,
    default: true
  },
  revealedAt: {
    type: Date
  },
  submissionStatus: {
    type: String,
    enum: ['draft', 'submitted'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

interviewEvaluationSchema.index({ interviewId: 1, interviewerId: 1 }, { unique: true });

module.exports = mongoose.model('InterviewEvaluation', interviewEvaluationSchema);

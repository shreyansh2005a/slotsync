const mongoose = require('mongoose');

const candidateEligibilitySchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  driveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruitmentDrive',
    required: true,
    index: true
  },
  currentRoundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewRound'
  },
  status: {
    type: String,
    enum: ['eligible', 'scheduled', 'in_progress', 'passed', 'rejected'],
    default: 'eligible'
  },
  completedRounds: [{
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewRound'
    },
    score: Number,
    decision: {
      type: String,
      enum: ['pass', 'fail']
    },
    evaluatorNotes: String,
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookingToken: {
    type: String,
    index: true
  },
  tokenExpiresAt: {
    type: Date
  },
  assignedTrack: {
    type: String,
    default: 'Software Engineering'
  }
}, {
  timestamps: true
});

candidateEligibilitySchema.index({ candidateId: 1, driveId: 1 }, { unique: true });

module.exports = mongoose.model('CandidateEligibility', candidateEligibilitySchema);

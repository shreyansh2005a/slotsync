const mongoose = require('mongoose');

const schedulingJobSchema = new mongoose.Schema({
  driveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruitmentDrive',
    required: true,
    index: true
  },
  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewRound'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'completed'
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  proposedInterviews: [{
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    candidateName: String,
    roundId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewRound' },
    roundName: String,
    interviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    interviewerNames: [String],
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewRoom' },
    roomName: String,
    startTime: Date,
    endTime: Date,
    reasoning: String
  }],
  unscheduledCandidates: [{
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    candidateName: String,
    reason: String,
    constraintsBlocked: [String],
    suggestedResolution: String
  }],
  conflicts: [{
    type: { type: String },
    description: String,
    affectedIds: [String]
  }],
  metrics: {
    totalCandidates: Number,
    scheduledCount: Number,
    unscheduledCount: Number,
    successRate: Number,
    executionTimeMs: Number,
    interviewerWorkloads: [{
      interviewerId: String,
      interviewerName: String,
      count: Number,
      totalMinutes: Number
    }],
    roomUtilization: [{
      roomId: String,
      roomName: String,
      bookedSlots: Number
    }]
  },
  stabilityScore: {
    unchangedCount: Number,
    changedCount: Number,
    scorePercentage: Number
  },
  published: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SchedulingJob', schedulingJobSchema);

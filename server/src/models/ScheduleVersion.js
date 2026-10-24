const mongoose = require('mongoose');

const scheduleVersionSchema = new mongoose.Schema({
  driveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruitmentDrive',
    required: true,
    index: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  snapshot: [{
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    roundId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewRound' },
    interviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewRoom' },
    startTime: Date,
    endTime: Date,
    status: String
  }],
  changeSummary: {
    type: String,
    default: 'Initial published schedule'
  },
  stabilityMetrics: {
    totalAppointments: Number,
    retainedCount: Number,
    modifiedCount: Number,
    stabilityScore: Number
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

scheduleVersionSchema.index({ driveId: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model('ScheduleVersion', scheduleVersionSchema);

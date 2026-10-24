const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  driveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruitmentDrive',
    required: true,
    index: true
  },
  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewRound',
    required: true,
    index: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  interviewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewRoom'
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['proposed', 'scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled',
    index: true
  },
  bookingToken: {
    type: String,
    index: true
  },
  isCandidateSelfBooked: {
    type: Boolean,
    default: false
  },
  meetingLink: {
    type: String,
    default: ''
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  },
  previousAssignment: {
    startTime: Date,
    endTime: Date,
    interviewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewRoom'
    },
    changedAt: Date,
    reason: String
  },
  scheduleVersion: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

interviewSchema.index({ driveId: 1, startTime: 1, endTime: 1 });
interviewSchema.index({ candidateId: 1, startTime: 1, endTime: 1 });
interviewSchema.index({ interviewers: 1, startTime: 1, endTime: 1 });
interviewSchema.index({ roomId: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Interview', interviewSchema);

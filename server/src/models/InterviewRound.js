const mongoose = require('mongoose');

const interviewRoundSchema = new mongoose.Schema({
  driveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruitmentDrive',
    required: true,
    index: true
  },
  roundOrder: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['coding', 'technical', 'hr', 'behavioral', 'final'],
    default: 'technical'
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 45
  },
  panelSize: {
    type: Number,
    required: true,
    default: 1
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  roomRequired: {
    type: Boolean,
    default: true
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewRound'
  }],
  passThresholdScore: {
    type: Number,
    default: 70
  },
  isEliminatory: {
    type: Boolean,
    default: true
  },
  allowCandidateSelfBooking: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

interviewRoundSchema.index({ driveId: 1, roundOrder: 1 }, { unique: true });

module.exports = mongoose.model('InterviewRound', interviewRoundSchema);

const mongoose = require('mongoose');

const interviewerSkillSchema = new mongoose.Schema({
  interviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skills: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'intermediate'
    },
    verified: {
      type: Boolean,
      default: true
    }
  }],
  eligibleRoundTypes: [{
    type: String,
    enum: ['coding', 'technical', 'hr', 'behavioral', 'final']
  }],
  maxInterviewsPerDay: {
    type: Number,
    default: 4
  },
  maxInterviewsPerWeek: {
    type: Number,
    default: 15
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InterviewerSkill', interviewerSkillSchema);

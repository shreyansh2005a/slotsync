const mongoose = require('mongoose');

const interviewRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    default: 4
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true,
    default: 'Main Campus'
  },
  meetingLink: {
    type: String,
    trim: true,
    default: ''
  },
  equipment: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InterviewRoom', interviewRoomSchema);

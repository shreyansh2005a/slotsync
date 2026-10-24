const mongoose = require('mongoose');

const recruitmentDriveSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a drive title'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  companyName: {
    type: String,
    trim: true,
    default: 'TechCorp Innovations'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  workingHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '18:00'
    }
  },
  allowedDays: {
    type: [Number], // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    default: [1, 2, 3, 4, 5]
  },
  slotIntervalMinutes: {
    type: Number,
    default: 15
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'active'
  },
  publicationSettings: {
    isPublished: {
      type: Boolean,
      default: false
    },
    publishedAt: Date,
    publishedVersion: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RecruitmentDrive', recruitmentDriveSchema);

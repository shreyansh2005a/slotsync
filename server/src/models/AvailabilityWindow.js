const mongoose = require('mongoose');

const availabilityWindowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['interviewer', 'candidate'],
    required: true
  },
  isRecurring: {
    type: Boolean,
    default: true
  },
  dayOfWeek: {
    type: Number, // 0 = Sun, 1 = Mon ... 6 = Sat
    min: 0,
    max: 6
  },
  startTime: {
    type: String, // "09:00" in 24hr format
    required: true
  },
  endTime: {
    type: String, // "17:00" in 24hr format
    required: true
  },
  specificDate: {
    type: Date // When isRecurring = false
  },
  isUnavailableOverride: {
    type: Boolean, // true if user marks this block as Out Of Office / unavailable
    default: false
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

availabilityWindowSchema.index({ userId: 1, dayOfWeek: 1, isRecurring: 1 });
availabilityWindowSchema.index({ userId: 1, specificDate: 1 });

module.exports = mongoose.model('AvailabilityWindow', availabilityWindowSchema);

const Notification = require('../models/Notification');
const Interview = require('../models/Interview');
const InterviewRound = require('../models/InterviewRound');
const User = require('../models/User');
const InterviewRoom = require('../models/InterviewRoom');
const { generateIcs } = require('../services/calendarService');

// @desc    Get user's notifications
// @route   GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      read: false
    });

    res.json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { read: true },
      { new: true }
    );

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download standard iCalendar (.ics) event file
// @route   GET /api/notifications/calendar/:interviewId.ics
const downloadCalendarIcs = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.interviewId)
      .populate('candidateId', 'name email')
      .populate('interviewers', 'name email')
      .populate('roundId', 'name type durationMinutes')
      .populate('roomId', 'name location isVirtual meetingLink');

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    const icsContent = generateIcs(
      interview,
      interview.roundId,
      interview.candidateId,
      interview.interviewers || [],
      interview.roomId
    );

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="interview-${interview._id}.ics"`);
    res.send(icsContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  downloadCalendarIcs
};

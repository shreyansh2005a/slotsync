const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const driveRoutes = require('./routes/driveRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const interviewerRoutes = require('./routes/interviewerRoutes');
const roomRoutes = require('./routes/roomRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const schedulingRoutes = require('./routes/schedulingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'SlotSync AI Recruitment Platform API',
    team: 'TriStack (Team ID: 211)',
    competition: 'CodeSangam 2026 / Webster',
    problemStatement: 'Problem Statement 05 — The Ancient One\'s Trials'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/drives', driveRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviewers', interviewerRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/bookings', bookingRoutes); // Alias
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);

// Centralized error handler
app.use(errorHandler);

module.exports = app;

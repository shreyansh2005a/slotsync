/**
 * SlotSync Safe & Repeatable Development Database Seed Script
 * Run with: npm run seed
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MONGODB_URI } = require('../src/config/env');

const User = require('../src/models/User');
const RecruitmentDrive = require('../src/models/RecruitmentDrive');
const InterviewRound = require('../src/models/InterviewRound');
const CandidateEligibility = require('../src/models/CandidateEligibility');
const InterviewerSkill = require('../src/models/InterviewerSkill');
const AvailabilityWindow = require('../src/models/AvailabilityWindow');
const InterviewRoom = require('../src/models/InterviewRoom');
const Interview = require('../src/models/Interview');
const InterviewEvaluation = require('../src/models/InterviewEvaluation');
const Notification = require('../src/models/Notification');
const ScheduleVersion = require('../src/models/ScheduleVersion');
const AuditLog = require('../src/models/AuditLog');

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB at', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Clearing existing collections for idempotent rebuild...');

    await Promise.all([
      User.deleteMany({}),
      RecruitmentDrive.deleteMany({}),
      InterviewRound.deleteMany({}),
      CandidateEligibility.deleteMany({}),
      InterviewerSkill.deleteMany({}),
      AvailabilityWindow.deleteMany({}),
      InterviewRoom.deleteMany({}),
      Interview.deleteMany({}),
      InterviewEvaluation.deleteMany({}),
      Notification.deleteMany({}),
      ScheduleVersion.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('[Seed] Creating demo users...');
    const defaultPassword = 'Password123!';

    // Coordinator
    const coordinator = await User.create({
      name: 'Sarah Connor (Lead Coordinator)',
      email: 'coordinator@slotsync.io',
      password: defaultPassword,
      role: 'coordinator',
      department: 'Technical Talent Acquisition',
      phone: '+1-555-0101',
      timezone: 'UTC'
    });

    // Interviewers
    const alex = await User.create({
      name: 'Alex Chen',
      email: 'alex.chen@slotsync.io',
      password: defaultPassword,
      role: 'interviewer',
      department: 'Platform Architecture',
      phone: '+1-555-0102',
      timezone: 'UTC'
    });

    const sarahJ = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@slotsync.io',
      password: defaultPassword,
      role: 'interviewer',
      department: 'Frontend Systems',
      phone: '+1-555-0103',
      timezone: 'UTC'
    });

    const priya = await User.create({
      name: 'Priya Sharma',
      email: 'priya.sharma@slotsync.io',
      password: defaultPassword,
      role: 'interviewer',
      department: 'Engineering Leadership & HR',
      phone: '+1-555-0104',
      timezone: 'UTC'
    });

    const marcus = await User.create({
      name: 'Marcus Vance',
      email: 'marcus.vance@slotsync.io',
      password: defaultPassword,
      role: 'interviewer',
      department: 'Core Infrastructure',
      phone: '+1-555-0105',
      timezone: 'UTC'
    });

    // Candidates
    const candidates = await User.create([
      {
        name: 'David Miller',
        email: 'david.miller@candidate.io',
        password: defaultPassword,
        role: 'candidate',
        department: 'Full-Stack Engineering',
        phone: '+1-555-0201'
      },
      {
        name: 'Elena Rostova',
        email: 'elena.rostova@candidate.io',
        password: defaultPassword,
        role: 'candidate',
        department: 'Backend Distributed Systems',
        phone: '+1-555-0202'
      },
      {
        name: 'Michael Chang',
        email: 'michael.chang@candidate.io',
        password: defaultPassword,
        role: 'candidate',
        department: 'UI/UX & Frontend Architecture',
        phone: '+1-555-0203'
      },
      {
        name: 'Amara Okafor',
        email: 'amara.okafor@candidate.io',
        password: defaultPassword,
        role: 'candidate',
        department: 'Cloud & Database Reliability',
        phone: '+1-555-0204'
      },
      {
        name: 'Lucas Silva',
        email: 'lucas.silva@candidate.io',
        password: defaultPassword,
        role: 'candidate',
        department: 'Security & DevOps',
        phone: '+1-555-0205'
      },
      {
        name: 'Sophia Kim',
        email: 'sophia.kim@candidate.io',
        password: defaultPassword,
        role: 'candidate',
        department: 'AI & Data Engineering',
        phone: '+1-555-0206'
      }
    ]);

    console.log('[Seed] Setting up Interviewer Skills & Capacities...');
    await InterviewerSkill.create([
      {
        interviewerId: alex._id,
        skills: [
          { name: 'System Design', proficiency: 'expert', verified: true },
          { name: 'Node.js', proficiency: 'expert', verified: true },
          { name: 'Distributed Systems', proficiency: 'expert', verified: true }
        ],
        eligibleRoundTypes: ['technical', 'coding'],
        maxInterviewsPerDay: 4
      },
      {
        interviewerId: sarahJ._id,
        skills: [
          { name: 'React', proficiency: 'expert', verified: true },
          { name: 'Frontend Architecture', proficiency: 'expert', verified: true },
          { name: 'JavaScript', proficiency: 'expert', verified: true }
        ],
        eligibleRoundTypes: ['technical', 'coding'],
        maxInterviewsPerDay: 4
      },
      {
        interviewerId: priya._id,
        skills: [
          { name: 'Leadership', proficiency: 'expert', verified: true },
          { name: 'Cultural Fit', proficiency: 'expert', verified: true },
          { name: 'Behavioral', proficiency: 'expert', verified: true }
        ],
        eligibleRoundTypes: ['hr', 'behavioral', 'final'],
        maxInterviewsPerDay: 5
      },
      {
        interviewerId: marcus._id,
        skills: [
          { name: 'Python', proficiency: 'expert', verified: true },
          { name: 'Algorithms', proficiency: 'expert', verified: true },
          { name: 'Node.js', proficiency: 'intermediate', verified: true },
          { name: 'System Design', proficiency: 'intermediate', verified: true }
        ],
        eligibleRoundTypes: ['coding', 'technical'],
        maxInterviewsPerDay: 4
      }
    ]);

    console.log('[Seed] Creating Availability Windows...');
    const interviewers = [alex, sarahJ, priya, marcus];
    const availabilityEntries = [];

    // Mon - Fri, 09:00 - 18:00 recurring windows
    interviewers.forEach(int => {
      for (let day = 1; day <= 5; day++) {
        availabilityEntries.push({
          userId: int._id,
          role: 'interviewer',
          isRecurring: true,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00',
          isUnavailableOverride: false
        });
      }
    });

    await AvailabilityWindow.insertMany(availabilityEntries);

    console.log('[Seed] Creating Interview Rooms (Physical & Virtual)...');
    const rooms = await InterviewRoom.create([
      {
        name: 'Conference Room Apollo',
        capacity: 6,
        isVirtual: false,
        location: 'Tech Tower, 3rd Floor',
        equipment: ['Whiteboard', 'Dual 4K Displays', 'Telepresence Unit']
      },
      {
        name: 'Boardroom Turing',
        capacity: 8,
        isVirtual: false,
        location: 'Innovation Wing, Room 402',
        equipment: ['Smart Whiteboard', 'Video Conferencing Suite']
      },
      {
        name: 'Virtual Breakout Delta',
        capacity: 10,
        isVirtual: true,
        meetingLink: 'https://meet.slotsync.io/room-delta',
        equipment: ['WebRTC HD Video', 'Collaborative IDE Integration']
      },
      {
        name: 'Virtual Breakout Gamma',
        capacity: 10,
        isVirtual: true,
        meetingLink: 'https://meet.slotsync.io/room-gamma',
        equipment: ['WebRTC HD Video', 'Miro Whiteboard Integration']
      }
    ]);

    console.log('[Seed] Creating Recruitment Drive & Multi-Stage Pipeline...');
    const now = new Date();
    const driveStart = new Date(now);
    driveStart.setDate(driveStart.getDate() + 1); // Tomorrow
    const driveEnd = new Date(now);
    driveEnd.setDate(driveEnd.getDate() + 14); // 2 weeks duration

    const drive = await RecruitmentDrive.create({
      title: 'Global Engineering & Placement Drive 2026',
      description: 'Annual campus placement and lateral hiring pipeline for high-performance software engineering tracks.',
      companyName: 'TechCorp Global Systems',
      startDate: driveStart,
      endDate: driveEnd,
      timezone: 'UTC',
      workingHours: {
        start: '09:00',
        end: '18:00'
      },
      allowedDays: [1, 2, 3, 4, 5],
      slotIntervalMinutes: 15,
      status: 'active',
      publicationSettings: {
        isPublished: true,
        publishedAt: new Date(),
        publishedVersion: 1
      },
      createdBy: coordinator._id
    });

    console.log('[Seed] Creating Configurable Interview Rounds...');
    // Round 1: Coding & Algorithms
    const round1 = await InterviewRound.create({
      driveId: drive._id,
      roundOrder: 1,
      name: 'Round 1: Coding & Algorithmic Problem Solving',
      type: 'coding',
      durationMinutes: 45,
      panelSize: 1,
      requiredSkills: ['Algorithms', 'Python'],
      roomRequired: true,
      prerequisites: [],
      passThresholdScore: 70
    });

    // Round 2: System Architecture (Prerequisite: Round 1, Panel size: 2)
    const round2 = await InterviewRound.create({
      driveId: drive._id,
      roundOrder: 2,
      name: 'Round 2: Distributed Systems & Technical Architecture',
      type: 'technical',
      durationMinutes: 60,
      panelSize: 2,
      requiredSkills: ['System Design', 'Node.js'],
      roomRequired: true,
      prerequisites: [round1._id],
      passThresholdScore: 75
    });

    // Round 3: Executive Leadership & Culture (Prerequisite: Round 2)
    const round3 = await InterviewRound.create({
      driveId: drive._id,
      roundOrder: 3,
      name: 'Round 3: Leadership, Behavioral & Values Alignment',
      type: 'hr',
      durationMinutes: 45,
      panelSize: 1,
      requiredSkills: ['Leadership', 'Cultural Fit'],
      roomRequired: true,
      prerequisites: [round2._id],
      passThresholdScore: 80
    });

    console.log('[Seed] Enrolling Candidates with Pipeline Eligibility States...');
    // David Miller: Has passed Round 1, currently in Round 2
    await CandidateEligibility.create({
      candidateId: candidates[0]._id,
      driveId: drive._id,
      currentRoundId: round2._id,
      status: 'scheduled',
      assignedTrack: 'Full-Stack Engineering',
      completedRounds: [
        {
          roundId: round1._id,
          score: 88,
          decision: 'pass',
          evaluatorNotes: 'Excellent complexity optimization on graph traversal algorithm.'
        }
      ]
    });

    // Elena Rostova: In Round 1, eligible for booking
    await CandidateEligibility.create({
      candidateId: candidates[1]._id,
      driveId: drive._id,
      currentRoundId: round1._id,
      status: 'eligible',
      assignedTrack: 'Backend Distributed Systems'
    });

    // Michael Chang: In Round 1, eligible
    await CandidateEligibility.create({
      candidateId: candidates[2]._id,
      driveId: drive._id,
      currentRoundId: round1._id,
      status: 'eligible',
      assignedTrack: 'Frontend Architecture'
    });

    // Amara Okafor: Completed Round 1 and Round 2, in Round 3
    await CandidateEligibility.create({
      candidateId: candidates[3]._id,
      driveId: drive._id,
      currentRoundId: round3._id,
      status: 'eligible',
      assignedTrack: 'Cloud Infrastructure',
      completedRounds: [
        {
          roundId: round1._id,
          score: 92,
          decision: 'pass',
          evaluatorNotes: 'Flawless dynamic programming solution'
        },
        {
          roundId: round2._id,
          score: 89,
          decision: 'pass',
          evaluatorNotes: 'Deep understanding of Raft consensus and database partitioning'
        }
      ]
    });

    // Lucas Silva & Sophia Kim
    await CandidateEligibility.create([
      {
        candidateId: candidates[4]._id,
        driveId: drive._id,
        currentRoundId: round1._id,
        status: 'eligible',
        assignedTrack: 'Security Engineering'
      },
      {
        candidateId: candidates[5]._id,
        driveId: drive._id,
        currentRoundId: round1._id,
        status: 'eligible',
        assignedTrack: 'AI Systems'
      }
    ]);

    console.log('[Seed] Creating Sample Confirmed Appointments & Blinded Evaluations...');
    // Create interview for David Miller in Round 2 tomorrow at 10:00 AM
    const tomorrow10Am = new Date(driveStart);
    tomorrow10Am.setUTCHours(10, 0, 0, 0);
    const tomorrow11Am = new Date(tomorrow10Am);
    tomorrow11Am.setUTCMinutes(60);

    const interviewDavid = await Interview.create({
      driveId: drive._id,
      roundId: round2._id,
      candidateId: candidates[0]._id,
      interviewers: [alex._id, marcus._id],
      roomId: rooms[0]._id,
      startTime: tomorrow10Am,
      endTime: tomorrow11Am,
      status: 'scheduled',
      isCandidateSelfBooked: true,
      meetingLink: 'https://meet.slotsync.io/room-apollo'
    });

    // Interview for Amara Okafor in Round 2 (past completed)
    const yesterday2Pm = new Date(now);
    yesterday2Pm.setUTCHours(14, 0, 0, 0);
    const yesterday3Pm = new Date(yesterday2Pm);
    yesterday3Pm.setUTCMinutes(60);

    const interviewAmara = await Interview.create({
      driveId: drive._id,
      roundId: round2._id,
      candidateId: candidates[3]._id,
      interviewers: [alex._id, marcus._id],
      roomId: rooms[1]._id,
      startTime: yesterday2Pm,
      endTime: yesterday3Pm,
      status: 'completed',
      meetingLink: 'https://meet.slotsync.io/room-turing'
    });

    // Evaluations for Amara in Blinded Mode
    await InterviewEvaluation.create([
      {
        interviewId: interviewAmara._id,
        candidateId: candidates[3]._id,
        interviewerId: alex._id,
        roundId: round2._id,
        rubricScores: {
          technical: 5,
          problemSolving: 4,
          communication: 5,
          roleSpecific: 5
        },
        writtenFeedback: 'Amara exhibited deep knowledge of distributed transaction handling, saga patterns, and CAP theorem trade-offs. Code was clear and modular.',
        keyStrengths: ['Distributed Systems Architecture', 'Event-Driven Patterns', 'Clear Communication'],
        areasForImprovement: ['Could go deeper into cache invalidation strategies'],
        overallRating: 5,
        recommendation: 'strong_hire',
        isBlinded: true,
        submissionStatus: 'submitted'
      },
      {
        interviewId: interviewAmara._id,
        candidateId: candidates[3]._id,
        interviewerId: marcus._id,
        roundId: round2._id,
        rubricScores: {
          technical: 4,
          problemSolving: 5,
          communication: 4,
          roleSpecific: 4
        },
        writtenFeedback: 'Strong analytical skills. Quickly identified edge cases with concurrent writes and zaproposed optimistic locking with etag versioning.',
        keyStrengths: ['Concurrency handling', 'Database indexing knowledge'],
        areasForImprovement: ['Minor hesitation on networking latency calculations'],
        overallRating: 4,
        recommendation: 'hire',
        isBlinded: true,
        submissionStatus: 'submitted'
      }
    ]);

    // Initial Schedule Version
    await ScheduleVersion.create({
      driveId: drive._id,
      versionNumber: 1,
      snapshot: [
        {
          interviewId: interviewDavid._id,
          candidateId: candidates[0]._id,
          roundId: round2._id,
          interviewers: [alex._id, marcus._id],
          roomId: rooms[0]._id,
          startTime: tomorrow10Am,
          endTime: tomorrow11Am,
          status: 'scheduled'
        }
      ],
      changeSummary: 'Initial published baseline schedule',
      stabilityMetrics: {
        totalAppointments: 1,
        retainedCount: 1,
        modifiedCount: 0,
        stabilityScore: 100
      },
      publishedBy: coordinator._id
    });

    console.log('[Seed] Creating Audit Log and Notifications...');
    await AuditLog.create([
      {
        userId: coordinator._id,
        userName: coordinator.name,
        userRole: 'coordinator',
        action: 'SCHEDULE_PUBLISHED',
        entityType: 'Schedule',
        entityId: drive._id.toString(),
        details: { versionNumber: 1, driveTitle: drive.title }
      },
      {
        userId: candidates[0]._id,
        userName: candidates[0].name,
        userRole: 'candidate',
        action: 'SLOT_SELF_BOOKED',
        entityType: 'Interview',
        entityId: interviewDavid._id.toString(),
        details: { round: 'Round 2', time: tomorrow10Am }
      }
    ]);

    await Notification.create([
      {
        recipientId: coordinator._id,
        title: 'Recruitment Drive Active',
        message: 'Global Engineering & Placement Drive 2026 is published and open for scheduling.',
        type: 'system'
      },
      {
        recipientId: candidates[0]._id,
        title: 'Interview Confirmed',
        message: `Your interview for Round 2 is scheduled for ${tomorrow10Am.toLocaleString()}.`,
        type: 'booking'
      }
    ]);

    console.log('\n======================================================');
    console.log('       SLOTSYNC SEED DATA SUCCESSFULLY CREATED!       ');
    console.log('======================================================');
    console.log('DEMO CREDENTIALS:');
    console.log('Coordinator: coordinator@slotsync.io  / Password123!');
    console.log('Interviewer: alex.chen@slotsync.io    / Password123!');
    console.log('Interviewer: sarah.jenkins@slotsync.io / Password123!');
    console.log('Interviewer: priya.sharma@slotsync.io / Password123!');
    console.log('Interviewer: marcus.vance@slotsync.io / Password123!');
    console.log('Candidate:   david.miller@candidate.io / Password123!');
    console.log('Candidate:   elena.rostova@candidate.io / Password123!');
    console.log('======================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedDatabase();

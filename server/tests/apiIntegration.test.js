const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { MONGODB_URI } = require('../src/config/env');

describe('API Integration & RBAC Tests', () => {
  let coordinatorToken;
  let candidateToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    const coordLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'coordinator@slotsync.io', password: 'Password123!' });
    coordinatorToken = coordLogin.body.data?.token;

    const candLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'david.miller@candidate.io', password: 'Password123!' });
    candidateToken = candLogin.body.data?.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('GET /api/health returns online status and competition info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.team).toBe('TriStack (Team ID: 211)');
  });

  test('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'coordinator@slotsync.io',
        password: 'Password123!'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.role).toBe('coordinator');
  });

  test('POST /api/auth/logout succeeds', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Rejects access to protected coordinator route without token', async () => {
    const res = await request(app).get('/api/drives');
    expect(res.statusCode).toBe(401);
  });

  test('Enforces RBAC: candidate cannot create a recruitment drive', async () => {
    const driveRes = await request(app)
      .post('/api/drives')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        title: 'Unauthorized Drive',
        startDate: new Date(),
        endDate: new Date()
      });

    expect(driveRes.statusCode).toBe(403);
    expect(driveRes.body.message).toContain('Forbidden');
  });

  test('Coordinator can fetch and create candidates via /api/candidates', async () => {
    const getRes = await request(app)
      .get('/api/candidates')
      .set('Authorization', `Bearer ${coordinatorToken}`);

    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body.data)).toBe(true);

    // Create a new candidate
    const createRes = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${coordinatorToken}`)
      .send({
        name: 'Test Candidate QA',
        email: `qa.cand.${Date.now()}@test.io`,
        password: 'Password123!',
        department: 'CSE'
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.data.name).toBe('Test Candidate QA');
  });

  test('Coordinator can fetch and create interviewers with skills via /api/interviewers', async () => {
    const getRes = await request(app)
      .get('/api/interviewers')
      .set('Authorization', `Bearer ${coordinatorToken}`);

    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body.data)).toBe(true);

    const createRes = await request(app)
      .post('/api/interviewers')
      .set('Authorization', `Bearer ${coordinatorToken}`)
      .send({
        name: 'Dr. Alan Turing',
        email: `turing.${Date.now()}@slotsync.io`,
        password: 'Password123!',
        department: 'Computer Science',
        skills: ['Algorithms', 'System Design'],
        maxInterviewsPerDay: 3
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.data.name).toBe('Dr. Alan Turing');
    expect(createRes.body.data.skills).toContain('Algorithms');
  });

  test('Coordinator can fetch and create rooms via /api/rooms', async () => {
    const getRes = await request(app)
      .get('/api/rooms')
      .set('Authorization', `Bearer ${coordinatorToken}`);

    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body.data)).toBe(true);

    const createRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${coordinatorToken}`)
      .send({
        name: `Executive Lab ${Date.now()}`,
        capacity: 6,
        isVirtual: false,
        location: 'Wing C, Floor 3',
        equipment: ['Projector', 'Whiteboard']
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.data.capacity).toBe(6);
  });

  test('Rejects overlapping concurrent booking with 409 Conflict', async () => {
    const drivesRes = await request(app)
      .get('/api/drives')
      .set('Authorization', `Bearer ${coordinatorToken}`);

    if (drivesRes.body.data.length > 0) {
      const driveId = drivesRes.body.data[0]._id;
      const slotsRes = await request(app)
        .get(`/api/booking/available-slots?driveId=${driveId}`)
        .set('Authorization', `Bearer ${candidateToken}`);

      if (slotsRes.body.data && slotsRes.body.data.length > 0) {
        const slot = slotsRes.body.data[0];

        // First booking should succeed or report conflict if already taken
        const book1 = await request(app)
          .post('/api/booking/reserve')
          .set('Authorization', `Bearer ${candidateToken}`)
          .send({
            driveId,
            slotStart: slot.slotStart,
            slotEnd: slot.slotEnd,
            interviewerIds: slot.suggestedInterviewerIds,
            roomId: slot.roomId
          });

        if (book1.statusCode === 201) {
          // Immediately try to book the exact same overlapping slot again -> MUST BE 409 Conflict
          const bookConflict = await request(app)
            .post('/api/booking/reserve')
            .set('Authorization', `Bearer ${candidateToken}`)
            .send({
              driveId,
              slotStart: slot.slotStart,
              slotEnd: slot.slotEnd,
              interviewerIds: slot.suggestedInterviewerIds,
              roomId: slot.roomId
            });

          expect(bookConflict.statusCode).toBe(409);
          expect(bookConflict.body.message).toContain('Slot is no longer available');
        }
      }
    }
  });

  test('Coordinator can fetch drives and ranking matrix', async () => {
    const drivesRes = await request(app)
      .get('/api/drives')
      .set('Authorization', `Bearer ${coordinatorToken}`);

    expect(drivesRes.statusCode).toBe(200);
    expect(Array.isArray(drivesRes.body.data)).toBe(true);

    if (drivesRes.body.data.length > 0) {
      const driveId = drivesRes.body.data[0]._id;
      const rankingRes = await request(app)
        .get(`/api/evaluations/ranking-matrix/${driveId}`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(rankingRes.statusCode).toBe(200);
      expect(rankingRes.body.success).toBe(true);
      expect(Array.isArray(rankingRes.body.data)).toBe(true);
    }
  });
});

const SchedulingEngine = require('../src/scheduling/engine');
const ReschedulingEngine = require('../src/scheduling/reschedulingEngine');

describe('SchedulingEngine Constraint Satisfaction', () => {
  const mockDrive = {
    _id: 'drive-test-1',
    startDate: new Date('2026-10-26T00:00:00Z'),
    endDate: new Date('2026-10-28T23:59:59Z'),
    workingHours: { start: '09:00', end: '18:00' },
    allowedDays: [1, 2, 3], // Mon - Wed
    slotIntervalMinutes: 30
  };

  const mockRound = {
    _id: 'round-test-1',
    name: 'Technical Architecture Round',
    durationMinutes: 60,
    panelSize: 1,
    requiredSkills: ['System Design'],
    roomRequired: true
  };

  const mockCandidates = [
    { _id: 'cand-1', name: 'Candidate One' },
    { _id: 'cand-2', name: 'Candidate Two' }
  ];

  const mockInterviewers = [
    {
      _id: 'int-1',
      name: 'Senior Architect',
      skills: [{ name: 'System Design' }]
    }
  ];

  const mockRooms = [
    { _id: 'room-1', name: 'Boardroom A' }
  ];

  test('Generates valid schedule without overlapping assignments', () => {
    const engine = new SchedulingEngine({
      drive: mockDrive,
      round: mockRound,
      candidates: mockCandidates,
      interviewers: mockInterviewers,
      rooms: mockRooms,
      existingInterviews: []
    });

    const result = engine.solve();
    expect(result.valid).toBe(true);
    expect(result.metrics.scheduledCount).toBe(2);
    expect(result.metrics.unscheduledCount).toBe(0);

    // Ensure interview 1 and interview 2 do not overlap on int-1 or room-1
    const [i1, i2] = result.proposedInterviews;
    const s1 = new Date(i1.startTime).getTime();
    const e1 = new Date(i1.endTime).getTime();
    const s2 = new Date(i2.startTime).getTime();
    const e2 = new Date(i2.endTime).getTime();

    const overlaps = s1 < e2 && e1 > s2;
    expect(overlaps).toBe(false);
  });

  test('Marks candidate unscheduled if no interviewers possess required skills', () => {
    const unqualifiedInterviewers = [
      {
        _id: 'int-2',
        name: 'Junior Developer',
        skills: [{ name: 'CSS' }] // Lacks 'System Design'
      }
    ];

    const engine = new SchedulingEngine({
      drive: mockDrive,
      round: mockRound,
      candidates: mockCandidates,
      interviewers: unqualifiedInterviewers,
      rooms: mockRooms,
      existingInterviews: []
    });

    const result = engine.solve();
    expect(result.metrics.scheduledCount).toBe(0);
    expect(result.metrics.unscheduledCount).toBe(2);
    expect(result.unscheduledCandidates[0].constraintsBlocked).toContain('INTERVIEWER_SKILLS_DEFICIT');
  });

  test('ReschedulingEngine calculates accurate Schedule Stability Score upon disruption', () => {
    const existingInterviews = [
      {
        _id: 'interview-1',
        candidateId: 'cand-1',
        interviewers: ['int-1'],
        roomId: 'room-1',
        startTime: new Date('2026-10-26T10:00:00Z'),
        endTime: new Date('2026-10-26T11:00:00Z'),
        status: 'scheduled'
      },
      {
        _id: 'interview-2',
        candidateId: 'cand-2',
        interviewers: ['int-2'],
        roomId: 'room-1',
        startTime: new Date('2026-10-26T11:30:00Z'),
        endTime: new Date('2026-10-26T12:30:00Z'),
        status: 'scheduled'
      }
    ];

    const rescheduling = new ReschedulingEngine({
      drive: mockDrive,
      round: mockRound,
      existingInterviews,
      candidates: mockCandidates,
      interviewers: [
        { _id: 'int-1', name: 'Architect 1', skills: [{ name: 'System Design' }] },
        { _id: 'int-2', name: 'Architect 2', skills: [{ name: 'System Design' }] },
        { _id: 'int-3', name: 'Architect 3', skills: [{ name: 'System Design' }] }
      ],
      rooms: mockRooms,
      trigger: {
        type: 'INTERVIEWER_CANCELLED',
        interviewerId: 'int-1'
      }
    });

    const resolution = rescheduling.resolveDisruption();
    expect(resolution.affectedCount).toBe(1);
    expect(resolution.unaffectedCount).toBe(1);
    expect(resolution.stabilityScore.unchangedCount).toBe(1);
    expect(resolution.stabilityScore.scorePercentage).toBe(50); // 1 out of 2 preserved
  });
});

const { datesOverlap, validateInterviewAssignment, validateSchedule } = require('../src/scheduling/validator');

describe('Independent Schedule Validator', () => {
  test('datesOverlap correctly identifies overlapping time intervals', () => {
    const aStart = new Date('2026-10-25T10:00:00Z');
    const aEnd = new Date('2026-10-25T11:00:00Z');

    const bStart = new Date('2026-10-25T10:30:00Z');
    const bEnd = new Date('2026-10-25T11:30:00Z');

    const cStart = new Date('2026-10-25T11:00:00Z');
    const cEnd = new Date('2026-10-25T12:00:00Z');

    expect(datesOverlap(aStart, aEnd, bStart, bEnd)).toBe(true);
    // Boundary touching is NOT an overlap
    expect(datesOverlap(aStart, aEnd, cStart, cEnd)).toBe(false);
  });

  test('Rejects interview assignment with start time after end time', () => {
    const invalidInterview = {
      startTime: new Date('2026-10-25T12:00:00Z'),
      endTime: new Date('2026-10-25T11:00:00Z')
    };

    const res = validateInterviewAssignment(invalidInterview, {});
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.code === 'INVALID_TIME_RANGE')).toBe(true);
  });

  test('Rejects interview with duration mismatch', () => {
    const interview = {
      startTime: new Date('2026-10-25T10:00:00Z'),
      endTime: new Date('2026-10-25T10:30:00Z'), // 30 min
      interviewers: ['int-1']
    };
    const context = {
      round: { durationMinutes: 60, panelSize: 1 }
    };

    const res = validateInterviewAssignment(interview, context);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.code === 'DURATION_MISMATCH')).toBe(true);
  });

  test('Detects candidate and room double-booking in schedule', () => {
    const interviews = [
      {
        _id: 'int-1',
        candidateId: 'cand-A',
        interviewers: ['interviewer-1'],
        roomId: 'room-1',
        startTime: new Date('2026-10-25T10:00:00Z'),
        endTime: new Date('2026-10-25T11:00:00Z'),
        status: 'scheduled'
      },
      {
        _id: 'int-2',
        candidateId: 'cand-B',
        interviewers: ['interviewer-2'],
        roomId: 'room-1', // Conflicting room
        startTime: new Date('2026-10-25T10:30:00Z'),
        endTime: new Date('2026-10-25T11:30:00Z'),
        status: 'scheduled'
      }
    ];

    const res = validateSchedule(interviews);
    expect(res.valid).toBe(false);
    expect(res.violations.some(v => v.type === 'ROOM_OVERLAP')).toBe(true);
  });
});

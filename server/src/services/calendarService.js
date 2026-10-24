/**
 * iCalendar (RFC 5545) Generator Service
 * Creates downloadable .ics files for interview appointments
 */

function formatIcsDate(date) {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function generateIcs(interview, round, candidate, interviewers, room) {
  const start = formatIcsDate(interview.startTime);
  const end = formatIcsDate(interview.endTime);
  const now = formatIcsDate(new Date());
  const uid = `interview-${interview._id}@slotsync.io`;

  const interviewerNames = interviewers.map(i => i.name).join(', ') || 'Interview Panel';
  const roomLocation = room ? (room.isVirtual ? `Virtual: ${room.meetingLink || 'Online'}` : room.name) : 'Virtual Meeting';

  const summary = `Interview: ${round ? round.name : 'Recruitment Round'} - ${candidate ? candidate.name : 'Candidate'}`;
  const description = `SlotSync Recruitment Interview\\nRound: ${round ? round.name : 'Interview'}\\nCandidate: ${candidate ? candidate.name : ''}\\nPanel: ${interviewerNames}\\nMeeting Link / Venue: ${roomLocation}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SlotSync//AI Recruitment Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${roomLocation}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Upcoming Interview in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

module.exports = {
  generateIcs
};

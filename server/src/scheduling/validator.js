/**
 * Independent Schedule Validator
 * 
 * Verifies all proposed schedules and individual interview bookings against
 * 12 authoritative hard constraints prior to preview, booking, or publication.
 */

function datesOverlap(startA, endA, startB, endB) {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();
  return sA < eB && eA > sB;
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

function validateInterviewAssignment(interview, context) {
  const errors = [];
  const start = new Date(interview.startTime);
  const end = new Date(interview.endTime);
  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  // Constraint 11: Valid time range and chronological order
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    errors.push({
      code: 'INVALID_TIME_RANGE',
      message: `Start time (${interview.startTime}) must be strictly before end time (${interview.endTime}).`
    });
    return { valid: false, errors };
  }

  // Constraint 7 & 11: Drive window & working hours check
  if (context.drive) {
    const driveStart = new Date(context.drive.startDate);
    const driveEnd = new Date(context.drive.endDate);
    if (start < driveStart || end > driveEnd) {
      errors.push({
        code: 'OUTSIDE_DRIVE_WINDOW',
        message: `Interview window (${start.toISOString()} - ${end.toISOString()}) falls outside drive dates (${driveStart.toISOString()} - ${driveEnd.toISOString()}).`
      });
    }

    // Working hours check
    if (context.drive.workingHours) {
      const startMin = start.getUTCHours() * 60 + start.getUTCMinutes();
      const endMin = end.getUTCHours() * 60 + end.getUTCMinutes();
      const driveWorkStart = parseTimeToMinutes(context.drive.workingHours.start || '09:00');
      const driveWorkEnd = parseTimeToMinutes(context.drive.workingHours.end || '18:00');

      if (startMin < driveWorkStart || endMin > driveWorkEnd) {
        errors.push({
          code: 'OUTSIDE_WORKING_HOURS',
          message: `Interview time (${start.toISOString().substring(11, 16)} - ${end.toISOString().substring(11, 16)}) violates drive working hours (${context.drive.workingHours.start} - ${context.drive.workingHours.end}).`
        });
      }
    }

    // Allowed days check
    if (context.drive.allowedDays && Array.isArray(context.drive.allowedDays)) {
      const day = start.getUTCDay();
      if (!context.drive.allowedDays.includes(day)) {
        errors.push({
          code: 'DISALLOWED_DAY',
          message: `Interview scheduled on day of week ${day}, which is not in drive allowed days [${context.drive.allowedDays.join(', ')}].`
        });
      }
    }
  }

  // Constraint 7: Duration requirement check
  if (context.round && context.round.durationMinutes) {
    if (durationMinutes !== context.round.durationMinutes) {
      errors.push({
        code: 'DURATION_MISMATCH',
        message: `Interview duration of ${durationMinutes} minutes does not match required round duration of ${context.round.durationMinutes} minutes.`
      });
    }
  }

  // Constraint 6: Panel size check
  const requiredPanelSize = context.round?.panelSize || 1;
  const interviewers = interview.interviewers || [];
  if (interviewers.length !== requiredPanelSize) {
    errors.push({
      code: 'PANEL_SIZE_MISMATCH',
      message: `Panel requires ${requiredPanelSize} interviewer(s), but ${interviewers.length} assigned.`
    });
  }

  // Constraint 5: Skills qualification check
  if (context.round?.requiredSkills && context.round.requiredSkills.length > 0 && context.interviewersMap) {
    const requiredSkills = context.round.requiredSkills.map(s => s.toLowerCase());
    const panelSkills = new Set();
    
    interviewers.forEach(intId => {
      const idStr = intId._id ? intId._id.toString() : intId.toString();
      const interviewerInfo = context.interviewersMap ? context.interviewersMap[idStr] : null;
      if (interviewerInfo && interviewerInfo.skills) {
        interviewerInfo.skills.forEach(sk => panelSkills.add((sk.name || sk).toLowerCase()));
      }
    });

    const missingSkills = requiredSkills.filter(req => !panelSkills.has(req));
    if (missingSkills.length > 0) {
      errors.push({
        code: 'SKILL_MISMATCH',
        message: `Assigned panel lacks required skill(s): ${missingSkills.join(', ')}.`
      });
    }
  }

  // Constraint 8 & 9: Candidate eligibility & round prerequisites
  if (context.candidateEligibility) {
    const eligibility = context.candidateEligibility;
    if (eligibility.status === 'rejected') {
      errors.push({
        code: 'CANDIDATE_REJECTED',
        message: `Candidate has been rejected from this drive.`
      });
    }

    if (context.round?.prerequisites && context.round.prerequisites.length > 0) {
      const completedRoundIds = (eligibility.completedRounds || [])
        .filter(r => r.decision === 'pass')
        .map(r => (r.roundId?._id || r.roundId).toString());
      
      const unmetPrereqs = context.round.prerequisites
        .map(p => (p._id || p).toString())
        .filter(pId => !completedRoundIds.includes(pId));

      if (unmetPrereqs.length > 0) {
        errors.push({
          code: 'PREREQUISITE_NOT_MET',
          message: `Candidate has not satisfied required prerequisite round(s): ${unmetPrereqs.join(', ')}.`
        });
      }
    }
  }

  // Constraint 4: Interviewer availability check
  if (context.availabilityMap) {
    interviewers.forEach(intId => {
      const idStr = intId._id ? intId._id.toString() : intId.toString();
      const userWindows = context.availabilityMap[idStr] || [];
      const day = start.getUTCDay();
      const startMin = start.getUTCHours() * 60 + start.getUTCMinutes();
      const endMin = end.getUTCHours() * 60 + end.getUTCMinutes();

      // Check if blocked by specific date override
      const hasOverrideBlocked = userWindows.some(w => {
        if (!w.isUnavailableOverride) return false;
        if (w.specificDate) {
          const wDate = new Date(w.specificDate);
          return wDate.toISOString().slice(0, 10) === start.toISOString().slice(0, 10);
        }
        return false;
      });

      if (hasOverrideBlocked) {
        errors.push({
          code: 'INTERVIEWER_OUT_OF_OFFICE',
          message: `Interviewer ${idStr} has marked this date as unavailable/out-of-office.`
        });
      } else if (userWindows.length > 0) {
        // Must match at least one recurring availability window if windows are defined
        const isWithinWindow = userWindows.some(w => {
          if (w.isUnavailableOverride) return false;
          if (w.isRecurring && w.dayOfWeek === day) {
            const wStart = parseTimeToMinutes(w.startTime);
            const wEnd = parseTimeToMinutes(w.endTime);
            return startMin >= wStart && endMin <= wEnd;
          }
          if (!w.isRecurring && w.specificDate) {
            const wDate = new Date(w.specificDate).toISOString().slice(0, 10);
            const curDate = start.toISOString().slice(0, 10);
            if (wDate === curDate) {
              const wStart = parseTimeToMinutes(w.startTime);
              const wEnd = parseTimeToMinutes(w.endTime);
              return startMin >= wStart && endMin <= wEnd;
            }
          }
          return false;
        });

        if (!isWithinWindow) {
          errors.push({
            code: 'INTERVIEWER_UNAVAILABLE_SLOT',
            message: `Interviewer ${idStr} is not available during ${start.toISOString().slice(11, 16)} - ${end.toISOString().slice(11, 16)}.`
          });
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates an entire proposed schedule collection for overlapping hard conflicts
 */
function validateSchedule(interviews, context = {}) {
  const violations = [];
  const candidateBookings = new Map();
  const interviewerBookings = new Map();
  const roomBookings = new Map();

  // Combine proposed interviews with existing confirmed bookings to prevent silent overwriting (Constraint 10)
  const existingBookings = context.existingInterviews || [];
  const allInterviews = [...existingBookings, ...interviews];

  allInterviews.forEach((interview, idx) => {
    const interviewId = (interview._id || `proposed-${idx}`).toString();
    const candidateId = (interview.candidateId?._id || interview.candidateId || '').toString();
    const roomId = (interview.roomId?._id || interview.roomId || '').toString();
    const start = new Date(interview.startTime);
    const end = new Date(interview.endTime);

    // Skip cancelled entries
    if (interview.status === 'cancelled') return;

    // Validate single assignment constraints
    const singleValidation = validateInterviewAssignment(interview, {
      ...context,
      round: interview.roundId || context.round,
      candidateEligibility: context.candidateEligibilityMap ? context.candidateEligibilityMap[candidateId] : null
    });

    if (!singleValidation.valid) {
      violations.push({
        interviewId,
        candidateId,
        type: 'INDIVIDUAL_CONSTRAINT_VIOLATION',
        errors: singleValidation.errors
      });
    }

    // Constraint 1: Candidate Overlap
    if (candidateId) {
      if (!candidateBookings.has(candidateId)) candidateBookings.set(candidateId, []);
      const existing = candidateBookings.get(candidateId);
      for (const b of existing) {
        if (b.interviewId !== interviewId && datesOverlap(start, end, b.start, b.end)) {
          violations.push({
            interviewId,
            conflictingInterviewId: b.interviewId,
            type: 'CANDIDATE_OVERLAP',
            message: `Candidate ${candidateId} has overlapping interviews between ${start.toISOString()} and ${b.start.toISOString()}.`
          });
        }
      }
      existing.push({ interviewId, start, end });
    }

    // Constraint 2: Interviewer Overlap
    const interviewers = interview.interviewers || [];
    interviewers.forEach(intRef => {
      const intId = (intRef._id || intRef).toString();
      if (!interviewerBookings.has(intId)) interviewerBookings.set(intId, []);
      const existing = interviewerBookings.get(intId);
      for (const b of existing) {
        if (b.interviewId !== interviewId && datesOverlap(start, end, b.start, b.end)) {
          violations.push({
            interviewId,
            conflictingInterviewId: b.interviewId,
            type: 'INTERVIEWER_OVERLAP',
            message: `Interviewer ${intId} has overlapping interviews between ${start.toISOString()} and ${b.start.toISOString()}.`
          });
        }
      }
      existing.push({ interviewId, start, end });
    });

    // Constraint 3: Room Double-Booking
    if (roomId) {
      if (!roomBookings.has(roomId)) roomBookings.set(roomId, []);
      const existing = roomBookings.get(roomId);
      for (const b of existing) {
        if (b.interviewId !== interviewId && datesOverlap(start, end, b.start, b.end)) {
          violations.push({
            interviewId,
            conflictingInterviewId: b.interviewId,
            type: 'ROOM_OVERLAP',
            message: `Room ${roomId} has double-booking between ${start.toISOString()} and ${b.start.toISOString()}.`
          });
        }
      }
      existing.push({ interviewId, start, end });
    }
  });

  return {
    valid: violations.length === 0,
    violationCount: violations.length,
    violations
  };
}

module.exports = {
  datesOverlap,
  parseTimeToMinutes,
  validateInterviewAssignment,
  validateSchedule
};

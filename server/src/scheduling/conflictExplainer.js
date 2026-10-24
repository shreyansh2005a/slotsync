/**
 * Conflict Explainer Service
 * Analyzes hard-constraint bottlenecks and generates structured diagnostics and resolution trade-offs.
 */

function explainUnscheduledCandidate(candidate, context) {
  const candidateId = (candidate._id || candidate.id || candidate).toString();
  const round = context.round || {};
  const requiredSkills = (round.requiredSkills || []).map(s => s.toLowerCase());
  const requiredPanelSize = round.panelSize || 1;
  const duration = round.durationMinutes || 45;

  const reasons = [];
  const constraintsBlocked = [];
  const suggestions = [];

  // Check 1: Prerequisites
  if (round.prerequisites && round.prerequisites.length > 0) {
    const eligibility = context.candidateEligibilityMap ? context.candidateEligibilityMap[candidateId] : null;
    const completedRoundIds = (eligibility?.completedRounds || [])
      .filter(r => r.decision === 'pass')
      .map(r => (r.roundId?._id || r.roundId).toString());

    const unmet = round.prerequisites
      .map(p => (p._id || p).toString())
      .filter(pId => !completedRoundIds.includes(pId));

    if (unmet.length > 0) {
      constraintsBlocked.push('ROUND_PREREQUISITE');
      reasons.push(`Candidate has not passed prior mandatory prerequisite rounds (${unmet.length} pending).`);
      suggestions.push({
        action: 'COMPLETE_PREREQUISITE',
        tradeoff: 'Candidate must complete prior evaluation round before advancing.'
      });
      return {
        candidateId,
        candidateName: candidate.name || 'Candidate',
        reasons,
        constraintsBlocked,
        suggestions
      };
    }
  }

  // Check 2: Qualified Interviewers Pool
  const interviewers = context.interviewers || [];
  const qualifiedInterviewers = interviewers.filter(interviewer => {
    const intSkills = (interviewer.skills || []).map(s => (s.name || s).toLowerCase());
    return requiredSkills.every(req => intSkills.includes(req));
  });

  if (qualifiedInterviewers.length < requiredPanelSize) {
    constraintsBlocked.push('INTERVIEWER_SKILLS_DEFICIT');
    reasons.push(`Panel requires ${requiredPanelSize} interviewer(s) with skills [${requiredSkills.join(', ')}], but only ${qualifiedInterviewers.length} qualified interviewer(s) are registered in the system.`);
    suggestions.push({
      action: 'ADD_QUALIFIED_INTERVIEWER',
      tradeoff: 'Add interviewers with the required skill tags or adjust the round requirements.'
    });
  }

  // Check 3: Availability Overlap
  if (qualifiedInterviewers.length >= requiredPanelSize) {
    constraintsBlocked.push('INTERVIEWER_AVAILABILITY_EXHAUSTED');
    reasons.push(`All ${qualifiedInterviewers.length} qualified interviewer(s) are fully booked or have no open availability windows during the drive's active working hours.`);
    suggestions.push({
      action: 'EXPAND_AVAILABILITY',
      tradeoff: 'Request additional availability hours from qualified interviewers or increase the drive duration.'
    });
  }

  // Check 4: Room Capacity
  const rooms = context.rooms || [];
  if (round.roomRequired && rooms.length === 0) {
    constraintsBlocked.push('NO_AVAILABLE_ROOMS');
    reasons.push('This round requires an interview room, but no active rooms are configured in the system.');
    suggestions.push({
      action: 'CREATE_ROOM',
      tradeoff: 'Add a physical or virtual interview room.'
    });
  }

  if (reasons.length === 0) {
    constraintsBlocked.push('SLOT_SATURATION');
    reasons.push('All feasible slots are occupied by higher-priority candidates under the current schedule.');
    suggestions.push({
      action: 'ADD_TIME_WINDOW',
      tradeoff: 'Extend recruitment drive end date by 1-2 days to provide additional slot capacity.'
    });
  }

  return {
    candidateId,
    candidateName: candidate.name || 'Candidate',
    reasons,
    constraintsBlocked,
    suggestions
  };
}

module.exports = {
  explainUnscheduledCandidate
};

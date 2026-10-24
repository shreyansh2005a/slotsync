/**
 * Automated Rescheduling Engine
 * Handles dropouts, room closures, and ripple-effect mitigation.
 * Calculates transparent Schedule Stability Score.
 */

const SchedulingEngine = require('./engine');
const { validateSchedule } = require('./validator');

class ReschedulingEngine {
  constructor(data = {}) {
    this.drive = data.drive;
    this.round = data.round;
    this.allExistingInterviews = data.existingInterviews || [];
    this.candidates = data.candidates || [];
    this.interviewers = data.interviewers || [];
    this.availabilityMap = data.availabilityMap || {};
    this.rooms = data.rooms || [];
    this.trigger = data.trigger || {}; // e.g., { type: 'INTERVIEWER_CANCELLED', interviewerId: '...' }
  }

  /**
   * Identifies affected interviews based on the disruption event
   */
  findAffectedInterviews() {
    const affected = [];
    const unaffected = [];

    const { type, interviewerId, roomId, candidateId, slotTime } = this.trigger;

    this.allExistingInterviews.forEach(interview => {
      if (interview.status === 'cancelled') return;

      let isAffected = false;
      const intIds = (interview.interviewers || []).map(i => (i._id || i).toString());
      const curRoomId = (interview.roomId?._id || interview.roomId || '').toString();
      const candId = (interview.candidateId?._id || interview.candidateId || '').toString();

      if (type === 'INTERVIEWER_CANCELLED' && interviewerId && intIds.includes(interviewerId.toString())) {
        isAffected = true;
      } else if (type === 'ROOM_UNAVAILABLE' && roomId && curRoomId === roomId.toString()) {
        isAffected = true;
      } else if (type === 'CANDIDATE_CANCELLED' && candidateId && candId === candidateId.toString()) {
        isAffected = true;
      }

      if (isAffected) {
        affected.push(interview);
      } else {
        unaffected.push(interview);
      }
    });

    return { affected, unaffected };
  }

  /**
   * Reschedule only the affected candidates while preserving unaffected interviews
   */
  resolveDisruption() {
    const { affected, unaffected } = this.findAffectedInterviews();

    if (affected.length === 0) {
      return {
        affectedCount: 0,
        unaffectedCount: unaffected.length,
        rescheduledInterviews: [],
        unresolvedCandidates: [],
        stabilityScore: {
          unchangedCount: unaffected.length,
          changedCount: 0,
          totalPriorAppointments: unaffected.length,
          scorePercentage: 100,
          formula: '(unchangedCount / totalPriorAppointments) * 100'
        }
      };
    }

    // Filter out the disrupted entity from the available resources
    let availableInterviewers = [...this.interviewers];
    let availableRooms = [...this.rooms];

    if (this.trigger.type === 'INTERVIEWER_CANCELLED' && this.trigger.interviewerId) {
      availableInterviewers = availableInterviewers.filter(
        i => (i._id || i.id).toString() !== this.trigger.interviewerId.toString()
      );
    }

    if (this.trigger.type === 'ROOM_UNAVAILABLE' && this.trigger.roomId) {
      availableRooms = availableRooms.filter(
        r => (r._id || r.id).toString() !== this.trigger.roomId.toString()
      );
    }

    // Extract the candidate objects that need rescheduling
    const affectedCandidateIds = affected.map(i => (i.candidateId?._id || i.candidateId).toString());
    const candidatesToReschedule = this.candidates.filter(c => 
      affectedCandidateIds.includes((c._id || c.id).toString())
    );

    // Run scheduling engine targeting only affected candidates, locking unaffected appointments
    const subEngine = new SchedulingEngine({
      drive: this.drive,
      round: this.round,
      candidates: candidatesToReschedule,
      interviewers: availableInterviewers,
      availabilityMap: this.availabilityMap,
      rooms: availableRooms,
      existingInterviews: unaffected
    });

    const schedulingResult = subEngine.solve();

    // Attach previousAssignment to each rescheduled interview to preserve audit trail
    const proposedChanges = schedulingResult.proposedInterviews.map(proposed => {
      const original = affected.find(
        a => (a.candidateId?._id || a.candidateId).toString() === proposed.candidateId.toString()
      );

      return {
        ...proposed,
        originalInterviewId: original?._id,
        isRescheduled: true,
        previousAssignment: original ? {
          startTime: original.startTime,
          endTime: original.endTime,
          interviewers: original.interviewers,
          roomId: original.roomId,
          changedAt: new Date(),
          reason: `Automated recovery due to ${this.trigger.type}`
        } : null,
        changeExplanation: `Shifted from ${original ? new Date(original.startTime).toISOString() : 'None'} to resolve ${this.trigger.type}`
      };
    });

    // Calculate Schedule Stability Score
    // Stability Score = (Unchanged Appointments / Total Prior Confirmed Appointments) * 100
    const totalPrior = this.allExistingInterviews.filter(i => i.status !== 'cancelled').length;
    const unchangedCount = unaffected.length;
    const changedCount = affected.length;
    const scorePercentage = totalPrior > 0 
      ? Math.round((unchangedCount / totalPrior) * 100) 
      : 100;

    return {
      disruptionType: this.trigger.type,
      affectedCount: affected.length,
      unaffectedCount: unaffected.length,
      proposedRescheduling: proposedChanges,
      unresolvedCandidates: schedulingResult.unscheduledCandidates,
      stabilityScore: {
        unchangedCount,
        changedCount,
        totalPriorAppointments: totalPrior,
        scorePercentage,
        formula: 'Application-defined: (unchangedCount / totalPriorAppointments) * 100'
      },
      valid: schedulingResult.valid,
      validationErrors: schedulingResult.validationErrors
    };
  }
}

module.exports = ReschedulingEngine;

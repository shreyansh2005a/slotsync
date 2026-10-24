/**
 * Schedule Digital Twin & What-If Simulator
 * Evaluates hypothetical changes against active schedules in memory without mutating database state.
 */

const SchedulingEngine = require('./engine');
const { validateSchedule } = require('./validator');

class ScheduleSimulator {
  constructor(baselineState) {
    this.drive = baselineState.drive;
    this.round = baselineState.round;
    this.candidates = [...(baselineState.candidates || [])];
    this.interviewers = [...(baselineState.interviewers || [])];
    this.availabilityMap = { ...(baselineState.availabilityMap || {}) };
    this.rooms = [...(baselineState.rooms || [])];
    this.currentInterviews = [...(baselineState.currentInterviews || [])];
  }

  /**
   * Run scenario simulation:
   * scenario: {
   *   type: 'REMOVE_INTERVIEWER' | 'ADD_CANDIDATES' | 'REMOVE_ROOM' | 'CHANGE_DURATION' | 'INCREASE_PANEL_SIZE',
   *   targetId: '...',
   *   newCandidates: [...],
   *   newDuration: 60,
   *   newPanelSize: 2
   * }
   */
  simulate(scenario) {
    const simulatedDrive = { ...this.drive };
    const simulatedRound = { ...this.round };
    let simulatedCandidates = [...this.candidates];
    let simulatedInterviewers = [...this.interviewers];
    let simulatedRooms = [...this.rooms];

    // Apply scenario modifications to the digital twin
    switch (scenario.type) {
      case 'REMOVE_INTERVIEWER':
        simulatedInterviewers = simulatedInterviewers.filter(
          i => (i._id || i.id).toString() !== scenario.targetId.toString()
        );
        break;

      case 'ADD_CANDIDATES':
        if (scenario.newCandidates && Array.isArray(scenario.newCandidates)) {
          simulatedCandidates = [...simulatedCandidates, ...scenario.newCandidates];
        }
        break;

      case 'REMOVE_ROOM':
        simulatedRooms = simulatedRooms.filter(
          r => (r._id || r.id).toString() !== scenario.targetId.toString()
        );
        break;

      case 'CHANGE_DURATION':
        if (scenario.newDuration) {
          simulatedRound.durationMinutes = scenario.newDuration;
        }
        break;

      case 'INCREASE_PANEL_SIZE':
        if (scenario.newPanelSize) {
          simulatedRound.panelSize = scenario.newPanelSize;
        }
        break;

      default:
        break;
    }

    // Run engine on simulated twin
    const engine = new SchedulingEngine({
      drive: simulatedDrive,
      round: simulatedRound,
      candidates: simulatedCandidates,
      interviewers: simulatedInterviewers,
      availabilityMap: this.availabilityMap,
      rooms: simulatedRooms,
      existingInterviews: [] // evaluate fresh or incrementally
    });

    const simulatedResult = engine.solve();

    // Baseline stats vs Simulated stats
    const baselineScheduledCount = this.currentInterviews.filter(i => i.status !== 'cancelled').length;
    const simScheduledCount = simulatedResult.metrics.scheduledCount;
    const baselineUnscheduledCount = Math.max(0, this.candidates.length - baselineScheduledCount);
    const simUnscheduledCount = simulatedResult.metrics.unscheduledCount;

    return {
      scenarioApplied: scenario,
      comparison: {
        baseline: {
          totalCandidates: this.candidates.length,
          scheduledCount: baselineScheduledCount,
          unscheduledCount: baselineUnscheduledCount,
          activeRoomsCount: this.rooms.length,
          activeInterviewersCount: this.interviewers.length
        },
        simulated: {
          totalCandidates: simulatedCandidates.length,
          scheduledCount: simScheduledCount,
          unscheduledCount: simUnscheduledCount,
          activeRoomsCount: simulatedRooms.length,
          activeInterviewersCount: simulatedInterviewers.length,
          successRate: simulatedResult.metrics.successRate
        },
        delta: {
          scheduledChange: simScheduledCount - baselineScheduledCount,
          unscheduledChange: simUnscheduledCount - baselineUnscheduledCount,
          executionTimeMs: simulatedResult.executionTimeMs
        }
      },
      simulatedInterviews: simulatedResult.proposedInterviews,
      unscheduledReasons: simulatedResult.unscheduledCandidates,
      workloadDistribution: simulatedResult.metrics.interviewerWorkloads,
      roomUtilization: simulatedResult.metrics.roomUtilization
    };
  }
}

module.exports = ScheduleSimulator;

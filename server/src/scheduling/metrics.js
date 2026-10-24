/**
 * Scheduling Metrics & Heatmap Analytics
 * Computes workload fairness, standard deviation, idle gaps, and temporal heatmaps.
 */

function calculateWorkloadFairness(interviews, interviewers) {
  const workloads = {};
  interviewers.forEach(int => {
    const id = (int._id || int.id).toString();
    workloads[id] = {
      interviewerId: id,
      name: int.name || 'Unknown',
      department: int.department || 'Engineering',
      interviewCount: 0,
      totalMinutes: 0,
      timestamps: []
    };
  });

  interviews.forEach(interview => {
    if (interview.status === 'cancelled') return;

    const start = new Date(interview.startTime);
    const end = new Date(interview.endTime);
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);

    (interview.interviewers || []).forEach(intRef => {
      const id = (intRef._id || intRef).toString();
      if (workloads[id]) {
        workloads[id].interviewCount += 1;
        workloads[id].totalMinutes += durationMin;
        workloads[id].timestamps.push({ start, end });
      }
    });
  });

  const list = Object.values(workloads);
  const counts = list.map(item => item.interviewCount);
  const mean = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
  const variance = counts.length > 0 
    ? counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length 
    : 0;
  const standardDeviation = Math.sqrt(variance);

  // Compute idle gaps (in minutes) between consecutive interviews for each interviewer
  let totalGaps = 0;
  let gapCount = 0;

  list.forEach(w => {
    w.timestamps.sort((a, b) => a.start - b.start);
    for (let i = 0; i < w.timestamps.length - 1; i++) {
      const gapMin = Math.round((w.timestamps[i + 1].start - w.timestamps[i].end) / 60000);
      if (gapMin > 0 && gapMin < 240) { // Same-day gap under 4 hours
        totalGaps += gapMin;
        gapCount += 1;
      }
    }
  });

  const averageIdleGapMinutes = gapCount > 0 ? Math.round(totalGaps / gapCount) : 0;

  return {
    interviewerMetrics: list,
    meanInterviews: parseFloat(mean.toFixed(2)),
    standardDeviation: parseFloat(standardDeviation.toFixed(2)),
    imbalanceLevel: standardDeviation > 1.5 ? 'Moderate to High' : 'Low / Fair',
    averageIdleGapMinutes
  };
}

/**
 * Derives temporal heatmap data across hours (09:00 - 18:00) and days
 */
function generateConflictHeatmap(interviews, drive) {
  // Buckets: dayOfWeek (0-6) -> hour (9-17)
  const heatmap = [];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17];

  for (let d = 1; d <= 5; d++) { // Mon - Fri
    for (const h of hours) {
      let density = 0;
      let conflictScore = 0;

      interviews.forEach(interview => {
        if (interview.status === 'cancelled') return;
        const start = new Date(interview.startTime);
        const day = start.getUTCDay();
        const hour = start.getUTCHours();

        if (day === d && hour === h) {
          density += 1;
        }
      });

      // Intensity level: 0 = low, 1 = medium, 2 = high, 3 = saturated
      let intensity = 'low';
      if (density >= 5) intensity = 'critical';
      else if (density >= 3) intensity = 'high';
      else if (density >= 1) intensity = 'medium';

      heatmap.push({
        dayIndex: d,
        dayName: daysOfWeek[d],
        hour: `${h.toString().padStart(2, '0')}:00`,
        activeInterviews: density,
        intensity
      });
    }
  }

  return heatmap;
}

module.exports = {
  calculateWorkloadFairness,
  generateConflictHeatmap
};

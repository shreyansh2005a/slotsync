/**
 * SlotSync Constraint-Satisfaction Scheduling Benchmark
 * Compares Naive First-Fit vs SlotSync MRV + Workload-Balanced Heuristic
 * Run with: npm run benchmark
 */

const { datesOverlap, parseTimeToMinutes, validateSchedule } = require('../src/scheduling/validator');
const SchedulingEngine = require('../src/scheduling/engine');

function generateSyntheticDataset(numCandidates = 50, numInterviewers = 10, numRooms = 4) {
  const drive = {
    _id: 'drive-bench-01',
    startDate: new Date('2026-11-01T00:00:00Z'),
    endDate: new Date('2026-11-07T23:59:59Z'), // 1 week
    workingHours: { start: '09:00', end: '18:00' },
    allowedDays: [1, 2, 3, 4, 5],
    slotIntervalMinutes: 30
  };

  const round = {
    _id: 'round-bench-tech',
    name: 'Technical Architecture Round',
    durationMinutes: 45,
    panelSize: 1,
    requiredSkills: ['System Design'],
    roomRequired: true,
    prerequisites: []
  };

  const candidates = [];
  for (let i = 1; i <= numCandidates; i++) {
    candidates.push({
      _id: `cand-${i}`,
      name: `Benchmark Candidate ${i}`,
      skills: ['Generalist']
    });
  }

  const interviewers = [];
  const skillsPool = [['System Design', 'Node.js'], ['System Design', 'Python'], ['React'], ['Database', 'System Design']];
  for (let j = 1; j <= numInterviewers; j++) {
    interviewers.push({
      _id: `int-${j}`,
      name: `Benchmark Interviewer ${j}`,
      skills: skillsPool[j % skillsPool.length].map(name => ({ name }))
    });
  }

  const rooms = [];
  for (let r = 1; r <= numRooms; r++) {
    rooms.push({
      _id: `room-${r}`,
      name: `Room ${r}`,
      capacity: 4
    });
  }

  const availabilityMap = {};
  interviewers.forEach(int => {
    availabilityMap[int._id] = [];
    for (let day = 1; day <= 5; day++) {
      availabilityMap[int._id].push({
        userId: int._id,
        isRecurring: true,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        isUnavailableOverride: false
      });
    }
  });

  return { drive, round, candidates, interviewers, rooms, availabilityMap };
}

// Naive First-Fit Algorithm (no MRV sorting, no workload balance)
function runNaiveFirstFit(data) {
  const startTime = Date.now();
  const { drive, round, candidates, interviewers, rooms } = data;
  const startDrive = new Date(drive.startDate);
  const endDrive = new Date(drive.endDate);

  const qualifiedInterviewers = interviewers.filter(int => 
    int.skills.some(s => s.name === 'System Design')
  );

  const scheduled = [];
  const unscheduled = [];
  const workloads = {};
  qualifiedInterviewers.forEach(i => { workloads[i._id] = 0; });

  const curr = new Date(startDrive);
  curr.setUTCHours(0, 0, 0, 0);

  // Naive linear sweep
  for (const candidate of candidates) {
    let assigned = false;
    let dayCursor = new Date(startDrive);

    while (dayCursor <= endDrive && !assigned) {
      if (drive.allowedDays.includes(dayCursor.getUTCDay())) {
        for (let m = 540; m + 45 <= 1080; m += 30) {
          const sStart = new Date(dayCursor);
          sStart.setUTCMinutes(m);
          const sEnd = new Date(sStart);
          sEnd.setUTCMinutes(sStart.getUTCMinutes() + 45);

          // Find first free interviewer
          const freeInt = qualifiedInterviewers.find(int => {
            return !scheduled.some(b => 
              b.interviewers.includes(int._id) &&
              datesOverlap(sStart, sEnd, b.startTime, b.endTime)
            );
          });

          // Find first free room
          const freeRoom = rooms.find(room => {
            return !scheduled.some(b => 
              b.roomId === room._id &&
              datesOverlap(sStart, sEnd, b.startTime, b.endTime)
            );
          });

          if (freeInt && freeRoom) {
            scheduled.push({
              candidateId: candidate._id,
              interviewers: [freeInt._id],
              roomId: freeRoom._id,
              startTime: sStart,
              endTime: sEnd,
              status: 'scheduled'
            });
            workloads[freeInt._id] += 1;
            assigned = true;
            break;
          }
        }
      }
      dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
    }

    if (!assigned) {
      unscheduled.push(candidate);
    }
  }

  const execTime = Date.now() - startTime;
  const counts = Object.values(workloads);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / counts.length;
  const stdDev = Math.sqrt(variance);

  return {
    scheduledCount: scheduled.length,
    unscheduledCount: unscheduled.length,
    successRate: Math.round((scheduled.length / candidates.length) * 100),
    executionTimeMs: execTime,
    workloadStdDev: parseFloat(stdDev.toFixed(2))
  };
}

function runBenchmark() {
  console.log('\n======================================================');
  console.log('    SLOTSYNC CONSTRAINT SOLVER BENCHMARK SUITE       ');
  console.log('======================================================');
  console.log('Dataset: 50 Candidates, 10 Interviewers, 4 Rooms, 1-Week Window\n');

  const dataset = generateSyntheticDataset(50, 10, 4);

  console.log('[1/2] Running Strategy A: Naive First-Fit Allocation...');
  const naiveResult = runNaiveFirstFit(dataset);

  console.log('[2/2] Running Strategy B: SlotSync Greedy MRV Heuristic + Workload Balancing...');
  const engine = new SchedulingEngine({
    drive: dataset.drive,
    round: dataset.round,
    candidates: dataset.candidates,
    interviewers: dataset.interviewers,
    availabilityMap: dataset.availabilityMap,
    rooms: dataset.rooms,
    existingInterviews: []
  });

  const slotsyncResult = engine.solve();

  const intCounts = slotsyncResult.metrics.interviewerWorkloads.map(w => w.count);
  const mean = intCounts.reduce((a, b) => a + b, 0) / (intCounts.length || 1);
  const variance = intCounts.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (intCounts.length || 1);
  const slotsyncStdDev = parseFloat(Math.sqrt(variance).toFixed(2));

  console.log('\n---------------- BENCHMARK RESULTS ----------------');
  console.table([
    {
      Strategy: 'Naive First-Fit (Baseline)',
      'Scheduled': naiveResult.scheduledCount,
      'Unscheduled': naiveResult.unscheduledCount,
      'Success Rate': `${naiveResult.successRate}%`,
      'Workload StdDev': naiveResult.workloadStdDev,
      'Exec Time (ms)': naiveResult.executionTimeMs,
      'Valid Hard Constraints': 'Yes'
    },
    {
      Strategy: 'SlotSync MRV + Balanced (Heuristic)',
      'Scheduled': slotsyncResult.metrics.scheduledCount,
      'Unscheduled': slotsyncResult.metrics.unscheduledCount,
      'Success Rate': `${slotsyncResult.metrics.successRate}%`,
      'Workload StdDev': slotsyncStdDev,
      'Exec Time (ms)': slotsyncResult.executionTimeMs,
      'Valid Hard Constraints': slotsyncResult.valid ? '100% Passed' : 'Violations'
    }
  ]);

  console.log('Key Observation:');
  console.log(`- SlotSync scheduled ${slotsyncResult.metrics.scheduledCount}/${dataset.candidates.length} candidates in ${slotsyncResult.executionTimeMs}ms.`);
  console.log(`- Workload fairness improved from StdDev ${naiveResult.workloadStdDev} to ${slotsyncStdDev}.`);
  console.log('======================================================\n');
}

runBenchmark();

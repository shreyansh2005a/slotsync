import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Sliders,
  Play,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Users,
  DoorOpen,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function WhatIfSimulator() {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');

  // Scenario states
  const [scenarioType, setScenarioType] = useState('REMOVE_INTERVIEWER');
  const [targetInterviewerId, setTargetInterviewerId] = useState('');
  const [targetRoomId, setTargetRoomId] = useState('');
  const [newDuration, setNewDuration] = useState(60);
  const [newCandidatesCount, setNewCandidatesCount] = useState(10);

  const [interviewers, setInterviewers] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [drivesRes, roomsRes, skillsRes] = await Promise.all([
        api.get('/drives'),
        api.get('/availability/rooms'),
        api.get('/scheduling/interviews')
      ]);

      setDrives(drivesRes.data.data);
      setRooms(roomsRes.data.data);
      if (roomsRes.data.data.length > 0) setTargetRoomId(roomsRes.data.data[0]._id);

      if (drivesRes.data.data.length > 0) {
        const dId = drivesRes.data.data[0]._id;
        setSelectedDriveId(dId);
        const driveRes = await api.get(`/drives/${dId}`);
        const roundList = driveRes.data.data.rounds || [];
        setRounds(roundList);
        if (roundList.length > 0) setSelectedRoundId(roundList[0]._id);
      }

      // Interviewers
      const usersRes = await api.get('/drives/' + drivesRes.data.data[0]._id + '/candidates');
      // Fetch interviewers list
      const intRes = await api.get('/availability/rooms'); // dummy fallback, let's load interviewers from seed
    } catch (err) {}
  };

  const handleRunSimulation = async () => {
    if (!selectedDriveId || !selectedRoundId) return;
    setSimulating(true);
    try {
      let scenario = { type: scenarioType };

      if (scenarioType === 'REMOVE_INTERVIEWER') {
        scenario.targetId = targetInterviewerId || 'int-1';
      } else if (scenarioType === 'REMOVE_ROOM') {
        scenario.targetId = targetRoomId;
      } else if (scenarioType === 'CHANGE_DURATION') {
        scenario.newDuration = Number(newDuration);
      } else if (scenarioType === 'ADD_CANDIDATES') {
        const extraCandidates = [];
        for (let i = 1; i <= newCandidatesCount; i++) {
          extraCandidates.push({
            _id: `sim-candidate-${i}`,
            name: `Surge Candidate ${i}`
          });
        }
        scenario.newCandidates = extraCandidates;
      }

      const res = await api.post('/scheduling/simulate', {
        driveId: selectedDriveId,
        roundId: selectedRoundId,
        scenario
      });

      setSimulationResult(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error running digital twin simulation');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2 border border-indigo-200">
          <Sliders className="w-3.5 h-3.5" />
          <span>Schedule Digital Twin & What-If Engine</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">What-If Scenario Simulation</h1>
        <p className="text-xs text-slate-500 mt-1">
          Evaluate disruptions and capacity changes in-memory without mutating the published schedule.
        </p>
      </div>

      {/* Scenario Builder Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Define Simulation Hypothesis</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Recruitment Drive</label>
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              {drives.map(d => (
                <option key={d._id} value={d._id}>{d.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Interview Round</label>
            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              {rounds.map(r => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hypothetical Scenario</label>
            <select
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="REMOVE_INTERVIEWER">What if an interviewer cancels / drops out?</option>
              <option value="ADD_CANDIDATES">What if candidate count surges (+10 candidates)?</option>
              <option value="REMOVE_ROOM">What if a venue/room becomes unavailable?</option>
              <option value="CHANGE_DURATION">What if interview duration increases to 60m?</option>
            </select>
          </div>
        </div>

        {/* Dynamic Scenario Options */}
        <div className="pt-2 flex items-center gap-4 text-xs">
          {scenarioType === 'REMOVE_ROOM' && (
            <div className="flex-1">
              <label className="block font-semibold text-slate-700 mb-1">Room to Close</label>
              <select
                value={targetRoomId}
                onChange={(e) => setTargetRoomId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                {rooms.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          {scenarioType === 'CHANGE_DURATION' && (
            <div className="flex-1">
              <label className="block font-semibold text-slate-700 mb-1">New Duration (minutes)</label>
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          )}

          {scenarioType === 'ADD_CANDIDATES' && (
            <div className="flex-1">
              <label className="block font-semibold text-slate-700 mb-1">Additional Candidate Count</label>
              <input
                type="number"
                value={newCandidatesCount}
                onChange={(e) => setNewCandidatesCount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={simulating}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{simulating ? 'Simulating in Digital Twin...' : 'Execute What-If Simulation'}</span>
        </button>
      </div>

      {/* Simulation Results Comparison */}
      {simulationResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Baseline Schedule</span>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Candidates:</span>
                  <span className="font-bold text-slate-900">{simulationResult.comparison?.baseline?.totalCandidates}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scheduled:</span>
                  <span className="font-bold text-slate-900">{simulationResult.comparison?.baseline?.scheduledCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Rooms:</span>
                  <span className="font-bold text-slate-900">{simulationResult.comparison?.baseline?.activeRoomsCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-200 shadow-sm">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Simulated Scenario</span>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Candidates:</span>
                  <span className="font-bold text-indigo-950">{simulationResult.comparison?.simulated?.totalCandidates}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scheduled:</span>
                  <span className="font-bold text-indigo-950">{simulationResult.comparison?.simulated?.scheduledCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-bold text-emerald-600">{simulationResult.comparison?.simulated?.successRate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Operational Delta</span>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Net Scheduled Delta:</span>
                  <span className={`font-black text-sm ${simulationResult.comparison?.delta?.scheduledChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {simulationResult.comparison?.delta?.scheduledChange >= 0 ? '+' : ''}
                    {simulationResult.comparison?.delta?.scheduledChange}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Simulation Runtime:</span>
                  <span className="font-bold text-slate-800">{simulationResult.comparison?.delta?.executionTimeMs} ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Unscheduled Candidates in Simulated Twin */}
          {simulationResult.unscheduledReasons?.length > 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 text-xs">
              <div className="flex items-center gap-2 mb-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Simulated Capacity Bottlenecks ({simulationResult.unscheduledReasons.length} Candidates Unscheduled)</span>
              </div>
              <p className="text-slate-600 mb-3">
                The simulated scenario saturated available slots. Here are the blocking constraints:
              </p>
              <div className="space-y-1.5">
                {simulationResult.unscheduledReasons.map((u, i) => (
                  <div key={i} className="bg-white p-2.5 rounded-lg border border-amber-200/60 flex justify-between">
                    <span className="font-bold text-slate-800">{u.candidateName}</span>
                    <span className="text-rose-600">{u.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

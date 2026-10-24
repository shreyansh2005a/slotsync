import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Layers,
  Plus,
  GitBranch,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  ChevronRight,
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react';

export default function DriveDetail() {
  const { id } = useParams();
  const [drive, setDrive] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'candidates'
  const [showAddRoundModal, setShowAddRoundModal] = useState(false);
  const [newRound, setNewRound] = useState({
    name: '',
    type: 'technical',
    roundOrder: 1,
    durationMinutes: 45,
    panelSize: 1,
    requiredSkills: '',
    passThresholdScore: 75
  });

  useEffect(() => {
    fetchDriveDetails();
  }, [id]);

  const fetchDriveDetails = async () => {
    try {
      setLoading(true);
      const [driveRes, candRes] = await Promise.all([
        api.get(`/drives/${id}`),
        api.get(`/drives/${id}/candidates`)
      ]);
      setDrive(driveRes.data.data);
      setCandidates(candRes.data.data);
      if (driveRes.data.data.rounds) {
        setNewRound(prev => ({
          ...prev,
          roundOrder: driveRes.data.data.rounds.length + 1
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = newRound.requiredSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await api.post(`/drives/${id}/rounds`, {
        ...newRound,
        requiredSkills: skillsArray,
        roundOrder: Number(newRound.roundOrder),
        durationMinutes: Number(newRound.durationMinutes),
        panelSize: Number(newRound.panelSize)
      });

      setShowAddRoundModal(false);
      fetchDriveDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding round');
    }
  };

  const handleAdvanceCandidate = async (candidateId, decision) => {
    try {
      await api.post(`/drives/${id}/candidates/${candidateId}/advance`, {
        decision,
        score: decision === 'pass' ? 85 : 45,
        evaluatorNotes: decision === 'pass' ? 'Advanced by Coordinator' : 'Rejected by Coordinator'
      });
      fetchDriveDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Error advancing candidate');
    }
  };

  if (loading || !drive) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const rounds = drive.rounds || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Drive Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Pipeline Architect
            </span>
            <span className="text-xs text-slate-400">Timezone: {drive.timezone || 'UTC'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">{drive.title}</h1>
          <p className="text-xs text-slate-500 mt-1">{drive.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/coordinator/generator"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Schedule This Drive</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'pipeline'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Multi-Stage Pipeline ({rounds.length} Rounds)</span>
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'candidates'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Enrolled Candidates ({candidates.length})</span>
        </button>
      </div>

      {/* Pipeline View */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900">Sequential Hiring Stages</h2>
            <button
              onClick={() => setShowAddRoundModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stage</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rounds.map((round, idx) => (
              <div
                key={round._id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-600"></div>
                <div>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-extrabold text-brand-600">Stage #{round.roundOrder}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold uppercase text-[10px] text-slate-600">
                      {round.type}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-2">{round.name}</h3>

                  <div className="space-y-1.5 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-semibold text-slate-700">{round.durationMinutes} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Panel Size:</span>
                      <span className="font-semibold text-slate-700">{round.panelSize} interviewer(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pass Threshold:</span>
                      <span className="font-semibold text-slate-700">{round.passThresholdScore}%</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Required Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {(round.requiredSkills || []).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] font-semibold border border-brand-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidates View */}
      {activeTab === 'candidates' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
              <tr>
                <th className="p-3.5 pl-5">Candidate</th>
                <th className="p-3.5">Assigned Track</th>
                <th className="p-3.5">Current Stage</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Passed Rounds</th>
                <th className="p-3.5 pr-5 text-right">Pipeline Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((cand) => (
                <tr key={cand._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 pl-5 font-bold text-slate-900">
                    {cand.candidateId?.name}
                    <div className="text-[11px] font-normal text-slate-400">{cand.candidateId?.email}</div>
                  </td>
                  <td className="p-3.5 text-slate-600">{cand.assignedTrack}</td>
                  <td className="p-3.5 font-semibold text-brand-700">
                    {cand.currentRoundId?.name || 'Round 1'}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        cand.status === 'passed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : cand.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {cand.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-medium text-slate-600">
                    {cand.completedRounds?.length || 0} stages passed
                  </td>
                  <td className="p-3.5 pr-5 text-right space-x-1.5">
                    {cand.status !== 'rejected' && cand.status !== 'passed' && (
                      <>
                        <button
                          onClick={() => handleAdvanceCandidate(cand.candidateId?._id, 'pass')}
                          className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200"
                        >
                          Pass & Advance
                        </button>
                        <button
                          onClick={() => handleAdvanceCandidate(cand.candidateId?._id, 'fail')}
                          className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add Round */}
      {showAddRoundModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Interview Stage</h3>
              <button onClick={() => setShowAddRoundModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRound} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Round Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems & Concurrency"
                  value={newRound.name}
                  onChange={(e) => setNewRound({ ...newRound, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stage Order</label>
                  <input
                    type="number"
                    value={newRound.roundOrder}
                    onChange={(e) => setNewRound({ ...newRound, roundOrder: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Type</label>
                  <select
                    value={newRound.type}
                    onChange={(e) => setNewRound({ ...newRound, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="coding">Coding</option>
                    <option value="technical">Technical</option>
                    <option value="hr">HR</option>
                    <option value="behavioral">Behavioral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newRound.durationMinutes}
                    onChange={(e) => setNewRound({ ...newRound, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Panel Size</label>
                  <input
                    type="number"
                    value={newRound.panelSize}
                    onChange={(e) => setNewRound({ ...newRound, panelSize: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Required Skill Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="System Design, Node.js"
                  value={newRound.requiredSkills}
                  onChange={(e) => setNewRound({ ...newRound, requiredSkills: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoundModal(false)}
                  className="px-3 py-1.5 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold"
                >
                  Save Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

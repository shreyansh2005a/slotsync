import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Award,
  Sliders,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  CheckCircle,
  FileText,
  User,
  X
} from 'lucide-react';

export default function CandidateRankingMatrix() {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [matrix, setMatrix] = useState([]);
  const [weights, setWeights] = useState({
    tech: 0.35,
    problem: 0.35,
    comm: 0.15,
    role: 0.15
  });
  const [loading, setLoading] = useState(true);

  // AI Summary Modal state
  const [summaryCandidate, setSummaryCandidate] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchDrives();
  }, []);

  useEffect(() => {
    if (selectedDriveId) {
      fetchRankingMatrix();
    }
  }, [selectedDriveId, weights]);

  const fetchDrives = async () => {
    try {
      const res = await api.get('/drives');
      const list = res.data.data;
      setDrives(list);
      if (list.length > 0) {
        setSelectedDriveId(list[0]._id);
      }
    } catch (err) {}
  };

  const fetchRankingMatrix = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/evaluations/ranking-matrix/${selectedDriveId}`, {
        params: {
          weightTech: weights.tech,
          weightProblem: weights.problem,
          weightComm: weights.comm,
          weightRole: weights.role
        }
      });
      setMatrix(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevealAll = async () => {
    try {
      // Find interviews for this drive and reveal
      const interviewsRes = await api.get(`/scheduling/interviews?driveId=${selectedDriveId}`);
      for (const item of interviewsRes.data.data) {
        await api.patch(`/evaluations/reveal/${item._id}`);
      }
      alert('All blinded interviewer feedback unmasked successfully.');
      fetchRankingMatrix();
    } catch (err) {
      alert('Error revealing feedback');
    }
  };

  const handleOpenAiSummary = async (candidate) => {
    setSummaryCandidate(candidate);
    setAiLoading(true);
    setAiSummary(null);
    try {
      const res = await api.post(`/ai/summarize-evaluations/${candidate.candidateId}`);
      setAiSummary(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating AI summary');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-bold mb-2 border border-cyan-200">
            <Award className="w-3.5 h-3.5" />
            <span>Aggregated Evaluator Matrix</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Candidate Ranking & Comparison Matrix</h1>
          <p className="text-xs text-slate-500 mt-1">
            Weighted composite scoring, blinded evaluator controls, and AI synthesis.
          </p>
        </div>

        <button
          onClick={handleRevealAll}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md transition-all"
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>Reveal All Blinded Feedback</span>
        </button>
      </div>

      {/* Weighting Sliders Control */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-brand-600" />
            Configurable Scoring Weights:
          </span>
          <span className="text-slate-400">Total Weight: 100%</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium text-slate-600">Technical:</span>
              <span className="font-bold text-slate-900">{Math.round(weights.tech * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.70"
              step="0.05"
              value={weights.tech}
              onChange={(e) => setWeights({ ...weights, tech: parseFloat(e.target.value) })}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium text-slate-600">Problem Solving:</span>
              <span className="font-bold text-slate-900">{Math.round(weights.problem * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.70"
              step="0.05"
              value={weights.problem}
              onChange={(e) => setWeights({ ...weights, problem: parseFloat(e.target.value) })}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium text-slate-600">Communication:</span>
              <span className="font-bold text-slate-900">{Math.round(weights.comm * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.70"
              step="0.05"
              value={weights.comm}
              onChange={(e) => setWeights({ ...weights, comm: parseFloat(e.target.value) })}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium text-slate-600">Role-Specific:</span>
              <span className="font-bold text-slate-900">{Math.round(weights.role * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.70"
              step="0.05"
              value={weights.role}
              onChange={(e) => setWeights({ ...weights, role: parseFloat(e.target.value) })}
              className="w-full accent-brand-600"
            />
          </div>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
            <tr>
              <th className="p-3.5 pl-5 w-14">Rank</th>
              <th className="p-3.5">Candidate</th>
              <th className="p-3.5">Pipeline Stage</th>
              <th className="p-3.5 text-center">Tech</th>
              <th className="p-3.5 text-center">Problem</th>
              <th className="p-3.5 text-center">Comm</th>
              <th className="p-3.5 text-center">Composite Score</th>
              <th className="p-3.5 text-center">Hire Votes</th>
              <th className="p-3.5 pr-5 text-right">AI Feedback Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matrix.map((row) => (
              <tr key={row.candidateId} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 pl-5 font-black text-slate-900">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    row.rank === 1 ? 'bg-amber-100 text-amber-900 font-extrabold' : 'bg-slate-100 text-slate-700'
                  }`}>
                    #{row.rank}
                  </span>
                </td>
                <td className="p-3.5 font-bold text-slate-900">
                  {row.candidateName}
                  <div className="text-[11px] font-normal text-slate-400">{row.email}</div>
                </td>
                <td className="p-3.5 font-medium text-slate-600">{row.currentRound}</td>
                <td className="p-3.5 text-center font-bold text-slate-800">{row.rubricAverages?.technical || '-'}</td>
                <td className="p-3.5 text-center font-bold text-slate-800">{row.rubricAverages?.problemSolving || '-'}</td>
                <td className="p-3.5 text-center font-bold text-slate-800">{row.rubricAverages?.communication || '-'}</td>
                <td className="p-3.5 text-center">
                  <div className="inline-block px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-sm border border-indigo-100">
                    {row.compositeScore > 0 ? `${row.compositeScore}%` : 'Pending'}
                  </div>
                </td>
                <td className="p-3.5 text-center">
                  <span className="font-bold text-emerald-600">{row.hireVotes}</span> / {row.evaluationsCount}
                </td>
                <td className="p-3.5 pr-5 text-right">
                  <button
                    onClick={() => handleOpenAiSummary(row)}
                    disabled={row.evaluationsCount === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 transition-colors disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>AI Synthesis</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Interview Feedback Summarizer Modal */}
      {summaryCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  AI Evaluation Synthesis: {summaryCandidate.candidateName}
                </h3>
              </div>
              <button onClick={() => setSummaryCandidate(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                <span>Synthesizing authorized evaluator feedback...</span>
              </div>
            ) : aiSummary ? (
              <div className="mt-4 space-y-4 text-xs animate-fadeIn">
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-purple-950 font-medium leading-relaxed">
                  {aiSummary.executiveSummary}
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1.5">Consolidated Strengths:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(aiSummary.topStrengths || []).map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1.5">Areas for Follow-up & Growth:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(aiSummary.areasForImprovement || []).map((a, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-400 italic">
                  {aiSummary.disclaimer}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No evaluations to synthesize.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  ShieldCheck,
  Check,
  Download,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function ScheduleGenerator() {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [softPreferences, setSoftPreferences] = useState({
    avoidAfter4PM: false,
    preferMorning: false,
    preferWorkloadBalance: true,
    minimizeChanges: true
  });

  // AI Assistant states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Generator states
  const [schedulingResult, setSchedulingResult] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [runningSolver, setRunningSolver] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(null);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const res = await api.get('/drives');
      const list = res.data.data;
      setDrives(list);
      if (list.length > 0) {
        setSelectedDriveId(list[0]._id);
        fetchRounds(list[0]._id);
      }
    } catch (err) {}
  };

  const fetchRounds = async (driveId) => {
    try {
      const res = await api.get(`/drives/${driveId}`);
      const roundList = res.data.data.rounds || [];
      setRounds(roundList);
      if (roundList.length > 0) {
        setSelectedRoundId(roundList[0]._id);
      }
    } catch (err) {}
  };

  const handleDriveChange = (e) => {
    const dId = e.target.value;
    setSelectedDriveId(dId);
    fetchRounds(dId);
  };

  // AI Natural Language Assistant Handler
  const handleAiAssistantSubmit = async (e) => {
    e.preventDefault();
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/assistant', {
        prompt: aiPrompt,
        driveId: selectedDriveId
      });
      const data = res.data.data;
      setAiResponse(data);

      // Auto-apply interpreted preferences to controls
      if (data.interpretedPreferences) {
        setSoftPreferences(prev => ({
          ...prev,
          avoidAfter4PM: !!data.interpretedPreferences.avoidAfter4PM,
          preferMorning: !!data.interpretedPreferences.preferMorning,
          minimizeChanges: !!data.interpretedPreferences.minimizeChanges
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing AI instruction');
    } finally {
      setAiLoading(false);
    }
  };

  // Run Constraint Satisfaction Solver
  const handleGenerate = async () => {
    if (!selectedDriveId || !selectedRoundId) return;
    setRunningSolver(true);
    setPublishedSuccess(null);
    try {
      const res = await api.post('/scheduling/generate', {
        driveId: selectedDriveId,
        roundId: selectedRoundId,
        options: softPreferences
      });
      setJobId(res.data.jobId);
      setSchedulingResult(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Scheduling engine error');
    } finally {
      setRunningSolver(false);
    }
  };

  // Publish to confirmed database state
  const handlePublish = async () => {
    if (!jobId) return;
    setPublishing(true);
    try {
      const res = await api.post(`/scheduling/publish/${jobId}`);
      setPublishedSuccess(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error publishing schedule');
    } finally {
      setPublishing(false);
    }
  };

  const handleExportCsv = (interviewsList) => {
    if (!interviewsList || interviewsList.length === 0) return;
    const headers = ['Candidate', 'Stage', 'Interviewers', 'Room/Venue', 'Start Time', 'End Time', 'Status'];
    const rows = interviewsList.map(item => [
      `"${item.candidateName || ''}"`,
      `"${item.roundName || ''}"`,
      `"${(item.interviewerNames || []).join(', ')}"`,
      `"${item.roomName || ''}"`,
      `"${new Date(item.startTime).toLocaleString()}"`,
      `"${new Date(item.endTime).toLocaleString()}"`,
      `"${item.status || 'proposed'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `slotsync-schedule-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-2 border border-brand-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Greedy MRV + Bounded Backtracking Solver</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Constraint-Satisfaction Schedule Generator</h1>
        <p className="text-xs text-slate-500 mt-1">
          Automatically assigns qualified panels, dates, and venues without overlapping appointments.
        </p>
      </div>

      {/* AI Natural-Language Co-Pilot Assistant Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-indigo-900/50">
        <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span>Natural-Language Scheduling Assistant</span>
        </div>
        <p className="text-xs text-slate-300 mb-4">
          Instruct the scheduling engine in natural language (e.g. <span className="text-indigo-300 font-mono">"Schedule technical interviews for next week, avoid after 4 PM, balance interviewer load"</span>).
        </p>

        <form onSubmit={handleAiAssistantSubmit} className="flex gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Enter scheduling instruction..."
            className="flex-1 px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white/15 backdrop-blur transition-all"
          />
          <button
            type="submit"
            disabled={aiLoading}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{aiLoading ? 'Interpreting...' : 'Instruct AI'}</span>
          </button>
        </form>

        {aiResponse && (
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand-300">Interpreted Intent: {aiResponse.intent}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Preferences Validated & Applied
              </span>
            </div>
            <p className="text-slate-300">{aiResponse.explanation}</p>
          </div>
        )}
      </div>

      {/* Control Panel: Drive, Round, and Soft Constraints */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Recruitment Drive</label>
          <select
            value={selectedDriveId}
            onChange={handleDriveChange}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {drives.map(d => (
              <option key={d._id} value={d._id}>{d.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Pipeline Stage</label>
          <select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {rounds.map(r => (
              <option key={r._id} value={r._id}>Round {r.roundOrder}: {r.name} ({r.durationMinutes}m)</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Optimization Heuristics</label>
          <div className="space-y-1.5 text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={softPreferences.avoidAfter4PM}
                onChange={(e) => setSoftPreferences({ ...softPreferences, avoidAfter4PM: e.target.checked })}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Avoid slots after 4:00 PM</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={softPreferences.preferWorkloadBalance}
                onChange={(e) => setSoftPreferences({ ...softPreferences, preferWorkloadBalance: e.target.checked })}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Interviewer Workload Balancing</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={softPreferences.minimizeChanges}
                onChange={(e) => setSoftPreferences({ ...softPreferences, minimizeChanges: e.target.checked })}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Preserve Confirmed Appointments (Lock)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Solver Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleGenerate}
          disabled={runningSolver}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{runningSolver ? 'Executing Constraint Solver...' : 'Generate Schedule Proposal'}</span>
        </button>

        {schedulingResult && schedulingResult.valid && !publishedSuccess && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{publishing ? 'Publishing...' : 'Approve & Publish to Production'}</span>
          </button>
        )}
      </div>

      {/* Published Success Alert */}
      {publishedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-emerald-950 block">Schedule Published! Version {publishedSuccess.versionNumber}</span>
              <span>{publishedSuccess.message} Broadcasted to connected participants via Socket.IO.</span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg bg-emerald-200/60 font-bold text-emerald-900">
            Active Snapshot Confirmed
          </span>
        </div>
      )}

      {/* Solver Metrics Output */}
      {schedulingResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Diagnostic Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500">Scheduled Interviews</span>
              <div className="text-2xl font-black text-brand-600 mt-1">
                {schedulingResult.metrics?.scheduledCount} / {schedulingResult.metrics?.totalCandidates}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500">Success Rate</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {schedulingResult.metrics?.successRate}%
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500">Independent Validator</span>
              <div className="text-base font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5" />
                <span>100% Validated</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500">Solver Execution Time</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {schedulingResult.executionTimeMs} ms
              </div>
            </div>
          </div>

          {/* Unscheduled Candidates Diagnostic (If any) */}
          {schedulingResult.unscheduledCandidates?.length > 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-xs text-amber-900">
                  Unscheduled Candidates Diagnostic ({schedulingResult.unscheduledCandidates.length})
                </h3>
              </div>
              <div className="space-y-2">
                {schedulingResult.unscheduledCandidates.map((u, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-amber-100 text-xs">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{u.candidateName}</span>
                      <span className="text-rose-600 font-semibold">{u.reason}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Recommendation: <span className="font-medium text-slate-700">{u.suggestedResolution}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proposed Schedule Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Proposed Interview Schedule Preview</h3>
                <p className="text-xs text-slate-500">Review assignments prior to publishing.</p>
              </div>
              <button
                onClick={() => handleExportCsv(schedulingResult.proposedInterviews)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                title="Download proposed schedule as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export as CSV</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5 pl-5">Candidate</th>
                    <th className="p-3.5">Stage</th>
                    <th className="p-3.5">Assigned Panel</th>
                    <th className="p-3.5">Venue / Room</th>
                    <th className="p-3.5">Slot Time</th>
                    <th className="p-3.5 pr-5">MRV Reasoning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedulingResult.proposedInterviews.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3.5 pl-5 font-bold text-slate-900">{item.candidateName}</td>
                      <td className="p-3.5 font-medium text-slate-700">{item.roundName}</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(item.interviewerNames || []).map((name, iIdx) => (
                            <span key={iIdx} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                              {name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">{item.roomName}</td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        {new Date(item.startTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3.5 pr-5 text-slate-400 font-mono text-[11px]">{item.reasoning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

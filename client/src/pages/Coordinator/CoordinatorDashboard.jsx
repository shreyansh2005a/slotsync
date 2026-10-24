import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Layers,
  Users,
  Calendar,
  Sparkles,
  Sliders,
  Award,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  Download,
  DoorOpen,
  Activity,
  UserCheck
} from 'lucide-react';

export default function CoordinatorDashboard() {
  const [drives, setDrives] = useState([]);
  const [activeDrive, setActiveDrive] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({
    totalDrives: 0,
    totalCandidates: 0,
    totalInterviewers: 0,
    totalRooms: 0,
    totalScheduled: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [drivesRes, candsRes, intsRes, roomsRes, interviewsRes, auditRes] = await Promise.all([
        api.get('/drives'),
        api.get('/candidates'),
        api.get('/interviewers'),
        api.get('/rooms'),
        api.get('/scheduling/interviews'),
        api.get('/audit')
      ]);

      const allDrives = drivesRes.data.data || [];
      const allCands = candsRes.data.data || [];
      const allInts = intsRes.data.data || [];
      const allRooms = roomsRes.data.data || [];
      const allInterviews = interviewsRes.data.data || [];
      const allLogs = (auditRes.data.data || []).slice(0, 5);

      setDrives(allDrives);
      setInterviews(allInterviews);
      setAuditLogs(allLogs);

      setStats({
        totalDrives: allDrives.length,
        totalCandidates: allCands.length,
        totalInterviewers: allInts.length,
        totalRooms: allRooms.length,
        totalScheduled: allInterviews.length
      });

      if (allDrives.length > 0) {
        const drive = allDrives[0];
        setActiveDrive(drive);

        // Fetch metrics & analytics
        try {
          const metricsRes = await api.get(`/analytics/dashboard/${drive._id}`);
          setMetrics(metricsRes.data.data);
        } catch (e) {}

        // Fetch AI Recruitment Insights
        try {
          const aiRes = await api.get(`/ai/recruitment-insights/${drive._id}`);
          setAiInsights(aiRes.data.data);
        } catch (e) {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Drive: {activeDrive?.title || 'Campus Placement Drive 2026'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Recruitment Operations Console</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Deterministic CSP scheduling, role-based dashboards & server-side conflict detection.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/coordinator/generator"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-xs shadow-md shadow-brand-500/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Run Scheduler</span>
          </Link>
          <Link
            to="/coordinator/simulator"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-xs backdrop-blur border border-white/10 transition-all"
          >
            <Sliders className="w-4 h-4" />
            <span>What-If Simulator</span>
          </Link>
        </div>
      </div>

      {/* 5 Core Required KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Recruitment Drives</span>
            <Layers className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalDrives}</span>
            <span className="text-xs text-brand-600 font-bold">Active</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Total Candidates</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalCandidates}</span>
            <span className="text-xs text-emerald-600 font-bold">Enrolled</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Total Interviewers</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalInterviewers}</span>
            <span className="text-xs text-emerald-600 font-bold">Verified</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Total Rooms</span>
            <DoorOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalRooms}</span>
            <span className="text-xs text-slate-500">Venues</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Scheduled Interviews</span>
            <Calendar className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalScheduled}</span>
            <span className="text-xs text-emerald-600 font-bold">0 Overlaps</span>
          </div>
        </div>
      </div>

      {/* AI Recruitment Insights Banner */}
      {aiInsights && (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-brand-50 p-6 rounded-2xl border border-brand-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-brand-600 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">AI Operational Health Assessment</h3>
            <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {aiInsights.healthAssessment}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-3">
            <div className="space-y-1.5">
              <span className="font-bold text-slate-700">Operational Observations:</span>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                {(aiInsights.keyObservations || []).map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1.5">
              <span className="font-bold text-slate-700">Strategic Recommendations:</span>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                {(aiInsights.strategicRecommendations || []).map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recent Recruitment Activity Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Recruitment Activity</h3>
              <p className="text-xs text-slate-500">Real-time audit trail of schedule changes and candidate bookings.</p>
            </div>
          </div>
          <Link
            to="/coordinator/audit"
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
          >
            <span>View All Activity</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead className="bg-slate-50/75 text-slate-500 border-b border-slate-100 font-semibold">
              <tr>
                <th className="p-3 pl-5">Timestamp</th>
                <th className="p-3">User & Role</th>
                <th className="p-3">Action Event</th>
                <th className="p-3">Entity</th>
                <th className="p-3 pr-5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No recent activity logged.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80">
                    <td className="p-3 pl-5 text-slate-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {log.userName}
                      <span className="block text-[10px] text-slate-400 font-normal capitalize">{log.userRole}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-mono text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-medium">{log.entityType}</td>
                    <td className="p-3 pr-5 text-slate-500 text-[11px] font-mono truncate max-w-xs">
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming & Confirmed Interviews Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Confirmed Interview Schedule</h3>
            <p className="text-xs text-slate-500">Live assignments verified by Independent Schedule Validator.</p>
          </div>
          <Link
            to="/coordinator/calendar"
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
          >
            <span>Open Interactive Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/75 text-slate-500 border-b border-slate-100 font-semibold">
              <tr>
                <th className="p-3.5 pl-5">Candidate</th>
                <th className="p-3.5">Round</th>
                <th className="p-3.5">Assigned Interviewer Panel</th>
                <th className="p-3.5">Venue / Meeting</th>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5 text-right">Calendar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No confirmed interviews yet. Use the Schedule Generator to propose appointments.
                  </td>
                </tr>
              ) : (
                interviews.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-slate-900">
                      {item.candidateId?.name || 'Candidate'}
                      <div className="text-[11px] font-normal text-slate-400">{item.candidateId?.email}</div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">
                      {item.roundId?.name || 'Interview Round'}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(item.interviewers || []).map((int) => (
                          <span
                            key={int._id}
                            className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px] border border-indigo-100"
                          >
                            {int.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {item.roomId ? item.roomId.name : 'Virtual Meeting Room'}
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {new Date(item.startTime).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <a
                        href={`/api/notifications/calendar/${item._id}.ics`}
                        download
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                        title="Download RFC 5545 iCalendar Event"
                      >
                        <Download className="w-3 h-3" />
                        <span>.ICS</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

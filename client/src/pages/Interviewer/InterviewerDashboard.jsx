import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  ClipboardCheck,
  CheckCircle,
  Download,
  Video,
  Award,
  ArrowRight
} from 'lucide-react';

export default function InterviewerDashboard() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyInterviews();
  }, []);

  const fetchMyInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/scheduling/interviews');
      setInterviews(res.data.data);
    } catch (err) {}
    finally {
      setLoading(false);
    }
  };

  const upcomingInterviews = interviews.filter(i => i.status === 'scheduled');
  const completedInterviews = interviews.filter(i => i.status === 'completed');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-2 inline-block">
            Engineering Evaluator Workspace
          </span>
          <h1 className="text-2xl font-black">Welcome back, {user?.name}</h1>
          <p className="text-xs text-slate-400 mt-1">{user?.department} • Panel Assigned Interviews</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/interviewer/evaluate"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Submit Evaluation</span>
          </Link>
          <Link
            to="/interviewer/availability"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur border border-white/10 transition-all"
          >
            <Clock className="w-4 h-4" />
            <span>Manage Hours</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Upcoming Interviews</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{upcomingInterviews.length}</div>
          <span className="text-[11px] text-brand-600 font-semibold">Scheduled sessions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Evaluations Completed</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{completedInterviews.length}</div>
          <span className="text-[11px] text-slate-400 font-semibold">Submissions recorded</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Blinded Review Protection</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">Active</div>
          <span className="text-[11px] text-slate-400 font-semibold">Peer feedback masked</span>
        </div>
      </div>

      {/* Assigned Interviews Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900">Your Assigned Interview Schedule</h2>
          <Link to="/interviewer/calendar" className="text-xs font-bold text-brand-600 hover:underline">
            View Full Calendar
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="p-3.5 pl-5">Candidate</th>
                <th className="p-3.5">Stage</th>
                <th className="p-3.5">Venue / Meeting</th>
                <th className="p-3.5">Slot Time</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No interviews assigned to you currently.
                  </td>
                </tr>
              ) : (
                interviews.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 pl-5 font-bold text-slate-900">
                      {item.candidateId?.name}
                      <div className="text-[11px] font-normal text-slate-400">{item.candidateId?.email}</div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">{item.roundId?.name}</td>
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-2">
                      <a
                        href={`/api/notifications/calendar/${item._id}.ics`}
                        download
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]"
                      >
                        <Download className="w-3 h-3" />
                        <span>.ICS</span>
                      </a>
                      <Link
                        to="/interviewer/evaluate"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 font-bold text-[11px]"
                      >
                        <ClipboardCheck className="w-3 h-3" />
                        <span>Evaluate</span>
                      </Link>
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

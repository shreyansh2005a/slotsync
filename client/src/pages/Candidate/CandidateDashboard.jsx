import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Sparkles,
  GitBranch,
  Clock,
  Download,
  Video,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAppointments();
  }, []);

  const fetchMyAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/scheduling/interviews');
      setAppointments(res.data.data);
    } catch (err) {}
    finally {
      setLoading(false);
    }
  };

  const nextAppointment = appointments.find(a => a.status === 'scheduled');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-2 inline-block">
            Candidate Hiring Portal
          </span>
          <h1 className="text-2xl font-black">Welcome, {user?.name}</h1>
          <p className="text-xs text-slate-400 mt-1">Track interview progression and self-schedule available slots.</p>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/candidate/book"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Book Interview Slot</span>
          </Link>
          <Link
            to="/candidate/pipeline"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur border border-white/10 transition-all"
          >
            <GitBranch className="w-4 h-4" />
            <span>View Progress</span>
          </Link>
        </div>
      </div>

      {/* Next Upcoming Appointment Highlight */}
      {nextAppointment ? (
        <div className="bg-white p-6 rounded-3xl border border-brand-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-600 to-indigo-600"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block mb-1">
                Next Upcoming Interview
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {nextAppointment.roundId?.name || 'Technical Round'}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Clock className="w-4 h-4 text-brand-600" />
                  {new Date(nextAppointment.startTime).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span>•</span>
                <span>Venue: {nextAppointment.roomId?.name || 'Virtual Breakout Room'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/api/notifications/calendar/${nextAppointment._id}.ics`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export to Calendar (.ICS)</span>
              </a>
              {nextAppointment.meetingLink && (
                <a
                  href={nextAppointment.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Meeting</span>
                </a>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No active interviews scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You are eligible to book a slot for your current recruitment drive round.
          </p>
          <Link
            to="/candidate/book"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <span>Choose Available Slot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Calendar,
  Download,
  Video,
  XCircle,
  Clock,
  DoorOpen,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function CandidateAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/scheduling/interviews');
      setAppointments(res.data.data);
    } catch (err) {}
    finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (interviewId) => {
    if (!window.confirm('Are you sure you want to cancel this interview booking? Your slot will be released back to the pool.')) {
      return;
    }
    setCancellingId(interviewId);
    try {
      await api.post(`/booking/cancel/${interviewId}`, {
        reason: 'Cancelled by candidate'
      });
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling interview');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-2 border border-brand-200">
          <Calendar className="w-3.5 h-3.5" />
          <span>Active Bookings</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">My Interview Appointments</h1>
        <p className="text-xs text-slate-500 mt-1">
          Export compliant RFC 5545 (.ics) events or manage your scheduled sessions.
        </p>
      </div>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            No active or past interview appointments found.
          </div>
        ) : (
          appointments.map((item) => (
            <div
              key={item._id}
              className={`p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                item.status === 'cancelled'
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200 hover:border-brand-300'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    item.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : item.status === 'cancelled'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-brand-50 text-brand-700 border border-brand-200'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {item.roundId?.name || 'Interview Session'}
                  </span>
                </div>

                <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-600" />
                  <span>
                    {new Date(item.startTime).toLocaleString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-500 flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                    {item.roomId ? item.roomId.name : 'Virtual Meeting Room'}
                  </span>
                </div>
              </div>

              {item.status !== 'cancelled' && (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/api/notifications/calendar/${item._id}.ics`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .ICS</span>
                  </a>

                  {item.meetingLink && (
                    <a
                      href={item.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Room</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleCancelBooking(item._id)}
                    disabled={cancellingId === item._id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Booking</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

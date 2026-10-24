import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Sparkles,
  Calendar,
  Clock,
  DoorOpen,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight
} from 'lucide-react';

export default function SlotBookingPage() {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [roundName, setRoundName] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [confirmedInterview, setConfirmedInterview] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await api.get('/drives');
      const list = res.data.data;
      setDrives(list);
      if (list.length > 0) {
        setSelectedDriveId(list[0]._id);
        fetchSlots(list[0]._id);
      }
    } catch (err) {}
    finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (driveId) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/booking/available-slots?driveId=${driveId}`);
      setAvailableSlots(res.data.data || []);
      setRoundName(res.data.roundName || 'Interview Round');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to discover available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleDriveChange = (e) => {
    const dId = e.target.value;
    setSelectedDriveId(dId);
    fetchSlots(dId);
  };

  const handleReserve = async (slot) => {
    setBookingSlot(slot);
    setError('');
    try {
      const res = await api.post('/booking/reserve', {
        driveId: selectedDriveId,
        slotStart: slot.slotStart,
        slotEnd: slot.slotEnd,
        interviewerIds: slot.suggestedInterviewerIds,
        roomId: slot.roomId
      });

      setConfirmedInterview(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Slot conflict: This slot was just reserved or is no longer available.');
    } finally {
      setBookingSlot(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-2 border border-brand-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Atomic Self-Booking</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Select Interview Slot</h1>
        <p className="text-xs text-slate-500 mt-1">
          Feasible slots dynamically generated from interviewer working hours and venue capacity.
        </p>
      </div>

      {/* Drive Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Target Drive</span>
          <span className="font-bold text-sm text-slate-900">{roundName}</span>
        </div>

        <select
          value={selectedDriveId}
          onChange={handleDriveChange}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
        >
          {drives.map(d => (
            <option key={d._id} value={d._id}>{d.title}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Booking Confirmation Card */}
      {confirmedInterview ? (
        <div className="p-8 bg-white rounded-3xl border border-emerald-200 shadow-md text-center space-y-4 animate-fadeIn">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Your Interview is Confirmed!</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Scheduled for{' '}
            <strong className="text-slate-900">{new Date(confirmedInterview.startTime).toLocaleString()}</strong>.
            A calendar invitation has been generated and notifications sent to your interviewer panel.
          </p>

          <div className="flex justify-center gap-3 pt-2">
            <a
              href={`/api/notifications/calendar/${confirmedInterview._id}.ics`}
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download .ICS Calendar Event</span>
            </a>
            <button
              onClick={() => navigate('/candidate/appointments')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              View My Appointments
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Available Feasible Slots ({availableSlots.length})</span>
            <span className="text-emerald-600 font-bold">100% Conflict-Free</span>
          </div>

          {availableSlots.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
              {loading ? 'Discovering available slots...' : 'No available slots found for this round window.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableSlots.map((slot, idx) => {
                const start = new Date(slot.slotStart);
                const end = new Date(slot.slotEnd);
                const isBooking = bookingSlot === slot;

                return (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-300 shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-600" />
                          {start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                          {slot.durationMinutes} min
                        </span>
                      </div>

                      <div className="text-sm font-extrabold text-brand-700 mt-1">
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>Venue: {slot.roomName}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReserve(slot)}
                      disabled={isBooking}
                      className="mt-4 w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <span>{isBooking ? 'Reserving...' : 'Book This Slot'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

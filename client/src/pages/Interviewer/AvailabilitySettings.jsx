import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Clock, Calendar, Check, AlertCircle, Plus, Trash2 } from 'lucide-react';

export default function AvailabilitySettings() {
  const { user } = useAuth();
  const [windows, setWindows] = useState([]);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/availability/user/${user._id}`);
      const list = res.data.data;
      if (list.length > 0) {
        setWindows(list.filter(w => w.isRecurring));
      } else {
        // Default Mon-Fri 09:00 - 18:00
        const defaults = [1, 2, 3, 4, 5].map(d => ({
          dayOfWeek: d,
          startTime: '09:00',
          endTime: '18:00',
          isRecurring: true
        }));
        setWindows(defaults);
      }
    } catch (err) {}
    finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (index, field, value) => {
    const updated = [...windows];
    updated[index][field] = value;
    setWindows(updated);
  };

  const handleSaveWindows = async () => {
    try {
      await api.post(`/availability/user/${user._id}`, { windows });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Error updating availability');
    }
  };

  const handleAddOverride = async (e) => {
    e.preventDefault();
    if (!overrideDate) return;
    try {
      await api.post('/availability/override', {
        specificDate: overrideDate,
        notes: overrideNotes || 'Out of office',
        userId: user._id
      });
      alert('Out-of-office block registered. Schedulers will respect this override.');
      setOverrideDate('');
      setOverrideNotes('');
    } catch (err) {
      alert('Error saving override');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-2 border border-brand-200">
          <Clock className="w-3.5 h-3.5" />
          <span>Interviewer Calendar Integration</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Manage Availability & Working Windows</h1>
        <p className="text-xs text-slate-500 mt-1">
          The constraint-satisfaction engine will only propose interviews within your confirmed windows.
        </p>
      </div>

      {/* Recurring Weekly Availability Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Weekly Recurring Hours</h2>
          <button
            onClick={handleSaveWindows}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Availability</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-fadeIn">
            Availability successfully saved to database.
          </div>
        )}

        <div className="space-y-3">
          {windows.map((w, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-bold text-slate-800 w-28">{daysOfWeek[w.dayOfWeek]}</span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={w.startTime}
                  onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="time"
                  value={w.endTime}
                  onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Date-Specific Out-of-Office Override Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-rose-500" />
          <span>Mark Out-of-Office / Unavailable Day</span>
        </h2>
        <p className="text-xs text-slate-500">
          Overrides your recurring availability for a specific date (e.g. medical leave or external conference).
        </p>

        <form onSubmit={handleAddOverride} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Select Date</label>
            <input
              type="date"
              required
              value={overrideDate}
              onChange={(e) => setOverrideDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">Reason / Notes</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Attending Distributed Systems Summit"
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
              >
                Block Date
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

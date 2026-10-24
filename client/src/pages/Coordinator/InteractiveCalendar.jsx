import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../services/api';
import {
  Calendar as CalendarIcon,
  Download,
  X,
  Video,
  MapPin,
  Users,
  Table,
  Search,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function InteractiveCalendar() {
  const [interviews, setInterviews] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/scheduling/interviews');
      setInterviews(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calendarEvents = interviews.map(item => ({
    id: item._id,
    title: `${item.candidateId?.name || 'Candidate'} - ${item.roundId?.name || 'Interview'}`,
    start: item.startTime,
    end: item.endTime,
    backgroundColor: '#6366f1',
    borderColor: '#4f46e5',
    extendedProps: item
  }));

  const handleEventClick = (info) => {
    setSelectedEvent(info.event.extendedProps);
  };

  const handleExportCsv = () => {
    if (!interviews || interviews.length === 0) return;
    const headers = ['Candidate', 'Email', 'Round', 'Panelists', 'Venue / Link', 'Start Time', 'End Time', 'Status'];
    const rows = interviews.map(item => [
      `"${item.candidateId?.name || 'Candidate'}"`,
      `"${item.candidateId?.email || ''}"`,
      `"${item.roundId?.name || ''}"`,
      `"${(item.interviewers || []).map(i => i.name).join('; ')}"`,
      `"${item.roomId?.name || (item.roomId?.isVirtual ? item.roomId.meetingLink : 'Virtual Room')}"`,
      `"${new Date(item.startTime).toLocaleString()}"`,
      `"${new Date(item.endTime).toLocaleString()}"`,
      `"${item.status || 'scheduled'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `slotsync-bookings-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInterviews = interviews.filter(item => {
    const candName = item.candidateId?.name?.toLowerCase() || '';
    const roundName = item.roundId?.name?.toLowerCase() || '';
    const panelNames = (item.interviewers || []).map(i => i.name.toLowerCase()).join(' ');
    const search = searchTerm.toLowerCase();
    return candName.includes(search) || roundName.includes(search) || panelNames.includes(search);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-2 border border-brand-200">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Interactive Multi-Panel Calendar & Timetable</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Live Interview Schedule & Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Day, week, and month calendar views synchronized with database state and live Socket updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Timetable</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            disabled={interviews.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            title="Export confirmed bookings to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'calendar' ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            events={calendarEvents}
            eventClick={handleEventClick}
            height="auto"
            allDaySlot={false}
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Search & Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidate, round, or panelist..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Showing {filteredInterviews.length} of {interviews.length} scheduled sessions
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3.5 pl-6">Candidate</th>
                  <th className="p-3.5">Stage / Round</th>
                  <th className="p-3.5">Interviewer Panel</th>
                  <th className="p-3.5">Venue / Meeting</th>
                  <th className="p-3.5">Time Interval</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInterviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No interviews match your search.
                    </td>
                  </tr>
                ) : (
                  filteredInterviews.map((item) => {
                    const start = new Date(item.startTime);
                    const end = new Date(item.endTime);

                    return (
                      <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 pl-6">
                          <span className="font-bold text-slate-900 block">{item.candidateId?.name || 'Candidate'}</span>
                          <span className="text-[11px] text-slate-400">{item.candidateId?.email}</span>
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
                          {item.roomId?.name || (item.roomId?.isVirtual ? item.roomId.meetingLink : 'Virtual Meeting Room')}
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">
                          <div>
                            {start.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-6 text-right">
                          <a
                            href={`/api/notifications/calendar/${item._id}.ics`}
                            download
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                            title="Download iCalendar file"
                          >
                            <Download className="w-3 h-3" />
                            <span>.ICS</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block mb-0.5">
                  Interview Appointment
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  {selectedEvent.candidateId?.name}
                </h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-400 block mb-1">Stage:</span>
                <p className="font-bold text-slate-800">{selectedEvent.roundId?.name}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-400 block mb-1">Assigned Panelists:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedEvent.interviewers || []).map(int => (
                    <span key={int._id} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-100">
                      {int.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-400 block mb-1">Venue / Room:</span>
                <p className="font-semibold text-slate-700">
                  {selectedEvent.roomId ? selectedEvent.roomId.name : 'Virtual Meeting Room'}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-400 block mb-1">Time Slot:</span>
                <p className="font-bold text-brand-700">
                  {new Date(selectedEvent.startTime).toLocaleString()} -{' '}
                  {new Date(selectedEvent.endTime).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between items-center">
              <a
                href={`/api/notifications/calendar/${selectedEvent._id}.ics`}
                download
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ICS</span>
              </a>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

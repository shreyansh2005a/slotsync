import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DoorOpen, Plus, Video, MapPin, Users, X, Check } from 'lucide-react';

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 4,
    isVirtual: false,
    location: 'Tech Tower, Wing B',
    meetingLink: '',
    equipment: 'Whiteboard, Dual Displays'
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/availability/rooms');
      setRooms(res.data.data);
    } catch (err) {}
    finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const eqArray = formData.equipment.split(',').map(s => s.trim()).filter(Boolean);
      await api.post('/availability/rooms', {
        ...formData,
        capacity: Number(formData.capacity),
        equipment: eqArray
      });
      setShowModal(false);
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating room');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Venue & Interview Room Management</h1>
          <p className="text-xs text-slate-500 mt-1">Configure physical conference rooms and virtual WebRTC breakout rooms.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Venue / Room</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <div
            key={room._id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  room.isVirtual ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {room.isVirtual ? 'Virtual Room' : 'Physical Venue'}
                </span>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Cap: {room.capacity}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">{room.name}</h3>

              <div className="mt-3 text-xs text-slate-500 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  {room.isVirtual ? <Video className="w-3.5 h-3.5 text-cyan-600" /> : <MapPin className="w-3.5 h-3.5 text-slate-400" />}
                  <span className="truncate">{room.isVirtual ? (room.meetingLink || 'meet.slotsync.io') : room.location}</span>
                </div>
              </div>

              {room.equipment?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                  {room.equipment.map((eq, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                      {eq}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Venue Resource</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boardroom Turing"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Room Type</label>
                  <select
                    value={formData.isVirtual ? 'virtual' : 'physical'}
                    onChange={(e) => setFormData({ ...formData, isVirtual: e.target.value === 'virtual' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="physical">Physical Venue</option>
                    <option value="virtual">Virtual Online</option>
                  </select>
                </div>
              </div>

              {formData.isVirtual ? (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Meeting Link</label>
                  <input
                    type="url"
                    placeholder="https://meet.slotsync.io/room-alpha"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Location Details</label>
                  <input
                    type="text"
                    placeholder="Building B, Floor 4, Room 401"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Equipment / Features (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Whiteboard, Dual 4K Displays"
                  value={formData.equipment}
                  onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold"
                >
                  Save Venue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Search,
  Award,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  Plus,
  X,
  Check,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function CandidateInterviewerMgmt({ initialTab = 'interviewers' }) {
  const [candidates, setCandidates] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [drives, setDrives] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab); // 'interviewers' | 'candidates'

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [showInterviewerModal, setShowInterviewerModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [editingInterviewer, setEditingInterviewer] = useState(null);

  // Form states
  const [interviewerForm, setInterviewerForm] = useState({
    name: '',
    email: '',
    department: 'Platform Architecture',
    skills: 'System Design, Node.js, Distributed Systems',
    maxInterviewsPerDay: 4
  });

  const [candidateForm, setCandidateForm] = useState({
    name: '',
    email: '',
    department: 'Computer Science & Engineering',
    assignedTrack: 'Software Engineering',
    driveId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [intRes, candRes, drivesRes] = await Promise.all([
        api.get('/interviewers'),
        api.get('/candidates'),
        api.get('/drives')
      ]);

      setInterviewers(intRes.data.data || []);
      setCandidates(candRes.data.data || []);
      const driveList = drivesRes.data.data || [];
      setDrives(driveList);
      if (driveList.length > 0) {
        setCandidateForm(prev => ({ ...prev, driveId: driveList[0]._id }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load personnel records from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInterviewer = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!interviewerForm.name || !interviewerForm.email) {
        setError('Please provide interviewer name and email.');
        return;
      }

      await api.post('/interviewers', {
        ...interviewerForm,
        maxInterviewsPerDay: Number(interviewerForm.maxInterviewsPerDay)
      });

      setShowInterviewerModal(false);
      setInterviewerForm({
        name: '',
        email: '',
        department: 'Platform Architecture',
        skills: 'System Design, Node.js, Distributed Systems',
        maxInterviewsPerDay: 4
      });
      setSuccessMsg('Interviewer registered successfully with default availability windows.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating interviewer');
    }
  };

  const handleUpdateInterviewer = async (e) => {
    e.preventDefault();
    if (!editingInterviewer) return;
    setError('');
    try {
      await api.patch(`/interviewers/${editingInterviewer._id}`, {
        name: editingInterviewer.name,
        department: editingInterviewer.department,
        skills: editingInterviewer.skills,
        maxInterviewsPerDay: Number(editingInterviewer.maxInterviewsPerDay)
      });

      setEditingInterviewer(null);
      setSuccessMsg('Interviewer profile & skill tags updated.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating interviewer');
    }
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!candidateForm.name || !candidateForm.email) {
        setError('Please provide candidate name and email.');
        return;
      }

      await api.post('/candidates', candidateForm);

      setShowCandidateModal(false);
      setCandidateForm({
        name: '',
        email: '',
        department: 'Computer Science & Engineering',
        assignedTrack: 'Software Engineering',
        driveId: drives[0]?._id || ''
      });
      setSuccessMsg('Candidate created and enrolled in drive pipeline.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating candidate');
    }
  };

  const filteredInterviewers = interviewers.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.email?.toLowerCase().includes(search.toLowerCase()) ||
    (i.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredCandidates = candidates.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Personnel & Evaluator Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage interviewer skill tags, daily interview caps, candidate enrollment, and availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, skill..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            />
          </div>

          {activeTab === 'interviewers' ? (
            <button
              onClick={() => setShowInterviewerModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Interviewer</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCandidateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Candidate</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-fadeIn">
          <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('interviewers')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'interviewers'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Engineering Evaluators ({interviewers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'candidates'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Candidates ({candidates.length})</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          Loading personnel records from database...
        </div>
      ) : activeTab === 'interviewers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInterviewers.length === 0 ? (
            <div className="col-span-2 p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
              No interviewers matching your criteria.
            </div>
          ) : (
            filteredInterviewers.map((int) => (
              <div key={int._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{int.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">{int.department}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{int.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Cap: {int.maxInterviewsPerDay}/day
                      </span>
                      <button
                        onClick={() => setEditingInterviewer({ ...int, skills: (int.skills || []).join(', ') })}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Edit Skills & Limit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Verified Skill Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(int.skills || []).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
              <tr>
                <th className="p-3.5 pl-5">Candidate Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Department & Track</th>
                <th className="p-3.5">Recruitment Drive</th>
                <th className="p-3.5 pr-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No candidates found. Use the "Add Candidate" button to register candidates.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => (
                  <tr key={cand._id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 pl-5 font-bold text-slate-900">{cand.name}</td>
                    <td className="p-3.5 text-slate-600">{cand.email}</td>
                    <td className="p-3.5 text-slate-500">
                      <span className="font-semibold text-slate-700">{cand.department || 'CSE'}</span>
                      {cand.enrollments?.[0]?.assignedTrack && (
                        <span className="block text-[11px] text-slate-400">{cand.enrollments[0].assignedTrack}</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {cand.enrollments?.[0]?.driveId?.title || 'General Pool'}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        cand.latestStatus === 'scheduled'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : cand.latestStatus === 'eligible'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {cand.latestStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Interviewer Modal */}
      {showInterviewerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Interviewer / Evaluator</h3>
              <button onClick={() => setShowInterviewerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInterviewer} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={interviewerForm.name}
                  onChange={(e) => setInterviewerForm({ ...interviewerForm, name: e.target.value })}
                  placeholder="e.g. Dr. Jane Goodall"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={interviewerForm.email}
                  onChange={(e) => setInterviewerForm({ ...interviewerForm, email: e.target.value })}
                  placeholder="e.g. jane@slotsync.io"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={interviewerForm.department}
                    onChange={(e) => setInterviewerForm({ ...interviewerForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Daily Interviews</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={interviewerForm.maxInterviewsPerDay}
                    onChange={(e) => setInterviewerForm({ ...interviewerForm, maxInterviewsPerDay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Skill Tags (comma-separated) *</label>
                <input
                  type="text"
                  required
                  value={interviewerForm.skills}
                  onChange={(e) => setInterviewerForm({ ...interviewerForm, skills: e.target.value })}
                  placeholder="e.g. System Design, React, Node.js, Algorithms"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  The MRV scheduler matches candidates against these verified skills.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInterviewerModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20"
                >
                  Save Interviewer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Interviewer Modal */}
      {editingInterviewer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Edit Interviewer Profile</h3>
              <button onClick={() => setEditingInterviewer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateInterviewer} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingInterviewer.name}
                  onChange={(e) => setEditingInterviewer({ ...editingInterviewer, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={editingInterviewer.department}
                    onChange={(e) => setEditingInterviewer({ ...editingInterviewer, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Daily Interviews</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingInterviewer.maxInterviewsPerDay}
                    onChange={(e) => setEditingInterviewer({ ...editingInterviewer, maxInterviewsPerDay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Skill Tags (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={editingInterviewer.skills}
                  onChange={(e) => setEditingInterviewer({ ...editingInterviewer, skills: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingInterviewer(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showCandidateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add & Enroll Candidate</h3>
              <button onClick={() => setShowCandidateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCandidate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  value={candidateForm.name}
                  onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                  placeholder="e.g. Krishnaraj Singh"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={candidateForm.email}
                  onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                  placeholder="e.g. candidate@university.edu"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch / Department</label>
                  <input
                    type="text"
                    value={candidateForm.department}
                    onChange={(e) => setCandidateForm({ ...candidateForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Career Track</label>
                  <input
                    type="text"
                    value={candidateForm.assignedTrack}
                    onChange={(e) => setCandidateForm({ ...candidateForm, assignedTrack: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enroll in Drive</label>
                <select
                  value={candidateForm.driveId}
                  onChange={(e) => setCandidateForm({ ...candidateForm, driveId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">-- No Initial Drive (Pool only) --</option>
                  {drives.map(d => (
                    <option key={d._id} value={d._id}>{d.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20"
                >
                  Register Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

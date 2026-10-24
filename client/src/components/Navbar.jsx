import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Calendar,
  Bell,
  LogOut,
  User,
  Shield,
  Sparkles,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  HelpCircle,
  X,
  Award,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';

export default function Navbar() {
  const { user, logout, quickLogin } = useAuth();
  const { latestAlert, clearAlert } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showVivaGuide, setShowVivaGuide] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, latestAlert]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // Quiet fallback
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      fetchNotifications();
    } catch (err) {}
  };

  const handleSwitchRole = async (targetRole) => {
    await quickLogin(targetRole);
    if (targetRole === 'coordinator') navigate('/coordinator');
    else if (targetRole === 'interviewer') navigate('/interviewer');
    else navigate('/candidate');
  };

  const vivaSteps = [
    { num: 1, title: 'Start frontend & backend', desc: 'Vite on 5173, Express API on 5000 with MongoDB connected.' },
    { num: 2, title: 'Log in as Coordinator', desc: 'Use coordinator@slotsync.io / Password123! or 1-Click Role Switcher.' },
    { num: 3, title: 'Create Recruitment Drive', desc: 'Navigate to Drives -> Create drive with dates & working hours.' },
    { num: 4, title: 'Add Two or More Candidates', desc: 'Navigate to Personnel -> Candidates tab -> Add Candidate.' },
    { num: 5, title: 'Add Two or More Interviewers', desc: 'Navigate to Personnel -> Interviewers tab -> Add Interviewer with skills.' },
    { num: 6, title: 'Create Interview Room', desc: 'Navigate to Rooms -> Add Venue/Room (physical or virtual link).' },
    { num: 7, title: 'Configure Skills & Availability', desc: 'Verify skill tags and daily limits in Personnel & Availability.' },
    { num: 8, title: 'Generate Proposed Schedule', desc: 'Navigate to Schedule Generator -> Click Generate Schedule Proposal.' },
    { num: 9, title: 'Review Schedule & Unassigned', desc: 'Inspect MRV diagnostic metrics, proposed table, and validator status.' },
    { num: 10, title: 'Log in as Candidate', desc: 'Switch role to Candidate (David Miller or Elena Rostova).' },
    { num: 11, title: 'View Eligible Slots & Self-Book', desc: 'Open Book Available Slot -> Pick feasible slot -> Reserve.' },
    { num: 12, title: 'Verify Booking on Coordinator Console', desc: 'Switch to Coordinator -> See confirmed interview on Dashboard.' },
    { num: 13, title: 'Attempt Conflicting Booking', desc: 'Try booking the same resource/time slot simultaneously -> Rejected with 409 Conflict.' },
    { num: 14, title: 'Refresh & Verify Persistence', desc: 'Refresh browser -> All records and states remain persisted in MongoDB.' }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Competition Info */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent">
                  SlotSync
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  MVP 2026
                </span>
              </div>
            </Link>

            {/* Team TriStack Pill */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-800">
              <Award className="w-3.5 h-3.5 text-brand-600" />
              <span>Team TriStack (ID: 211) • CodeSangam '26</span>
            </div>
          </div>

          {/* Right Header Navigation & Role Tools */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Viva Demo Guide Trigger */}
            <button
              onClick={() => setShowVivaGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors"
              title="Open Mid-Evaluation Viva Demonstration Checklist"
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Viva Demo Flow</span>
            </button>

            {user ? (
              <>
                {/* 1-Click Role Switcher Demo Tool */}
                <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
                  <span className="px-2 py-1 text-slate-400 font-semibold">Demo Role:</span>
                  <button
                    onClick={() => handleSwitchRole('coordinator')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      user.role === 'coordinator'
                        ? 'bg-white text-brand-700 shadow-sm font-semibold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Coordinator
                  </button>
                  <button
                    onClick={() => handleSwitchRole('interviewer')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      user.role === 'interviewer'
                        ? 'bg-white text-brand-700 shadow-sm font-semibold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Interviewer
                  </button>
                  <button
                    onClick={() => handleSwitchRole('candidate')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      user.role === 'candidate'
                        ? 'bg-white text-brand-700 shadow-sm font-semibold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Candidate
                  </button>
                </div>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Popover */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-fadeIn">
                      <div className="px-4 pb-2 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-semibold text-sm text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">No new notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id}
                              className={`p-3 text-xs ${n.read ? 'bg-white text-slate-600' : 'bg-brand-50/50 text-slate-900 font-medium'}`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-semibold text-slate-900">{n.title}</span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="mt-1 text-slate-600">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Pill */}
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-brand-700">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-semibold text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-[11px] text-slate-400 capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-brand-600 px-3 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl shadow-sm shadow-brand-500/20 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Viva Demo Walkthrough Modal */}
      {showVivaGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                    Team TriStack (Team ID: 211)
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Problem Statement 05</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  SlotSync Mid-Evaluation Demonstration Walkthrough
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shreyansh Agrawal (20243268) • Nipun Gupta (20243185) • Krishnaraj Singh (20243278)
                </p>
              </div>
              <button
                onClick={() => setShowVivaGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-2">
              {vivaSteps.map((step) => (
                <div
                  key={step.num}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-all flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step.num}
                  </div>
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-slate-900 block">{step.title}</span>
                    <span className="text-slate-600 text-[11px] mt-0.5 block">{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Use the Top Demo Role Switcher to toggle portals.</span>
              <button
                onClick={() => setShowVivaGuide(false)}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

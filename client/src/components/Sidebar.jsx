import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  Sparkles,
  GitBranch,
  Users,
  Award,
  BarChart3,
  Sliders,
  History,
  DoorOpen,
  AlertTriangle,
  Clock,
  ClipboardCheck,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  // Explicitly matching the 8 required items from Master Prompt Section 8:
  // Dashboard, Recruitment Drives, Candidates, Interviewers, Rooms, Availability, Schedule, Bookings
  const coordinatorLinks = [
    { to: '/coordinator', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/coordinator/drives', icon: Layers, label: 'Recruitment Drives' },
    { to: '/coordinator/candidates', icon: Users, label: 'Candidates' },
    { to: '/coordinator/interviewers', icon: UserCheck, label: 'Interviewers' },
    { to: '/coordinator/rooms', icon: DoorOpen, label: 'Rooms' },
    { to: '/coordinator/availability', icon: Clock, label: 'Availability' },
    { to: '/coordinator/generator', icon: Sparkles, label: 'Schedule' },
    { to: '/coordinator/calendar', icon: Calendar, label: 'Bookings' },
    { to: '/coordinator/simulator', icon: Sliders, label: 'What-If Simulator' },
    { to: '/coordinator/rankings', icon: Award, label: 'Rankings' },
    { to: '/coordinator/conflicts', icon: AlertTriangle, label: 'Conflict Diagnostics' },
    { to: '/coordinator/analytics', icon: BarChart3, label: 'Workload & Analytics' },
    { to: '/coordinator/audit', icon: History, label: 'Audit Logs' }
  ];

  const interviewerLinks = [
    { to: '/interviewer', icon: LayoutDashboard, label: 'Overview' },
    { to: '/interviewer/calendar', icon: Calendar, label: 'Assigned Interviews' },
    { to: '/interviewer/availability', icon: Clock, label: 'My Availability' },
    { to: '/interviewer/evaluate', icon: ClipboardCheck, label: 'Submit Evaluations' }
  ];

  const candidateLinks = [
    { to: '/candidate', icon: LayoutDashboard, label: 'Portal Home' },
    { to: '/candidate/book', icon: Sparkles, label: 'Book Available Slot' },
    { to: '/candidate/appointments', icon: Calendar, label: 'My Appointments' },
    { to: '/candidate/pipeline', icon: GitBranch, label: 'Round Progression' }
  ];

  let links = candidateLinks;
  if (role === 'coordinator') links = coordinatorLinks;
  if (role === 'interviewer') links = interviewerLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {role === 'coordinator' ? 'Operations Console' : `${role} Workspace`}
        </span>
      </div>
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/coordinator' || item.to === '/interviewer' || item.to === '/candidate'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200/60 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 text-emerald-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Constraint Engine: 100% Active
        </div>
      </div>
    </aside>
  );
}

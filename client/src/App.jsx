import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layout
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LiveCoordinationBanner from './components/LiveCoordinationBanner';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Coordinator Pages
import CoordinatorDashboard from './pages/Coordinator/CoordinatorDashboard';
import RecruitmentDrives from './pages/Coordinator/RecruitmentDrives';
import DriveDetail from './pages/Coordinator/DriveDetail';
import ScheduleGenerator from './pages/Coordinator/ScheduleGenerator';
import WhatIfSimulator from './pages/Coordinator/WhatIfSimulator';
import CandidateRankingMatrix from './pages/Coordinator/CandidateRankingMatrix';
import InteractiveCalendar from './pages/Coordinator/InteractiveCalendar';
import CandidateInterviewerMgmt from './pages/Coordinator/CandidateInterviewerMgmt';
import RoomManagement from './pages/Coordinator/RoomManagement';
import ConflictDiagnostics from './pages/Coordinator/ConflictDiagnostics';
import AnalyticsPage from './pages/Coordinator/AnalyticsPage';
import AuditLogsPage from './pages/Coordinator/AuditLogsPage';

// Interviewer Pages
import InterviewerDashboard from './pages/Interviewer/InterviewerDashboard';
import AvailabilitySettings from './pages/Interviewer/AvailabilitySettings';
import EvaluationSubmission from './pages/Interviewer/EvaluationSubmission';

// Candidate Pages
import CandidateDashboard from './pages/Candidate/CandidateDashboard';
import SlotBookingPage from './pages/Candidate/SlotBookingPage';
import CandidateAppointments from './pages/Candidate/CandidateAppointments';
import PipelineTracking from './pages/Candidate/PipelineTracking';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's home role
    return <Navigate to={`/${user.role}`} replace />;
  }
  return children;
}

function AppLayout({ children }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />
      <LiveCoordinationBanner />
      <div className="flex-1 flex">
        {user && <Sidebar />}
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Coordinator */}
              <Route path="/coordinator" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <CoordinatorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/drives" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <RecruitmentDrives />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/drives/:id" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <DriveDetail />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/generator" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <ScheduleGenerator />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/simulator" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <WhatIfSimulator />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/rankings" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <CandidateRankingMatrix />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/calendar" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <InteractiveCalendar />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/bookings" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <InteractiveCalendar />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/schedule" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <ScheduleGenerator />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/candidates" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <CandidateInterviewerMgmt initialTab="candidates" />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/interviewers" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <CandidateInterviewerMgmt initialTab="interviewers" />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/availability" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <AvailabilitySettings />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/users" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <CandidateInterviewerMgmt />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/rooms" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <RoomManagement />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/conflicts" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <ConflictDiagnostics />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/analytics" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />
              <Route path="/coordinator/audit" element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              } />

              {/* Interviewer */}
              <Route path="/interviewer" element={
                <ProtectedRoute allowedRoles={['interviewer', 'coordinator']}>
                  <InterviewerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/interviewer/calendar" element={
                <ProtectedRoute allowedRoles={['interviewer', 'coordinator']}>
                  <InteractiveCalendar />
                </ProtectedRoute>
              } />
              <Route path="/interviewer/availability" element={
                <ProtectedRoute allowedRoles={['interviewer', 'coordinator']}>
                  <AvailabilitySettings />
                </ProtectedRoute>
              } />
              <Route path="/interviewer/evaluate" element={
                <ProtectedRoute allowedRoles={['interviewer', 'coordinator']}>
                  <EvaluationSubmission />
                </ProtectedRoute>
              } />

              {/* Candidate */}
              <Route path="/candidate" element={
                <ProtectedRoute allowedRoles={['candidate', 'coordinator']}>
                  <CandidateDashboard />
                </ProtectedRoute>
              } />
              <Route path="/candidate/book" element={
                <ProtectedRoute allowedRoles={['candidate', 'coordinator']}>
                  <SlotBookingPage />
                </ProtectedRoute>
              } />
              <Route path="/candidate/appointments" element={
                <ProtectedRoute allowedRoles={['candidate', 'coordinator']}>
                  <CandidateAppointments />
                </ProtectedRoute>
              } />
              <Route path="/candidate/pipeline" element={
                <ProtectedRoute allowedRoles={['candidate', 'coordinator']}>
                  <PipelineTracking />
                </ProtectedRoute>
              } />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

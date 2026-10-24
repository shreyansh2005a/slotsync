import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
  Sliders,
  CheckCircle2,
  Clock,
  ArrowRight,
  GitBranch,
  Award
} from 'lucide-react';

export default function LandingPage() {
  const { user, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoAccess = async (role) => {
    await quickLogin(role);
    if (role === 'coordinator') navigate('/coordinator');
    else if (role === 'interviewer') navigate('/interviewer');
    else navigate('/candidate');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold mb-8 animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Algorithmic Constraint-Satisfaction Recruitment Scheduler</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Intelligent Interview Coordination with{' '}
            <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
              Zero Hard Conflicts.
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal">
            Automate multi-stage campus drives and lateral hiring with bipartite constraint satisfaction, atomic candidate self-booking, blinded rubrics, and real AI operational intelligence.
          </p>

          {/* Quick Demo Launch Buttons */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleDemoAccess('coordinator')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-lg shadow-brand-500/25 transition-all text-sm"
            >
              <span>Launch Coordinator Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDemoAccess('candidate')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 shadow-sm transition-all text-sm"
            >
              <span>Test Candidate Self-Booking</span>
            </button>
            <button
              onClick={() => handleDemoAccess('interviewer')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 shadow-sm transition-all text-sm"
            >
              <span>Interviewer Rubric Portal</span>
            </button>
          </div>

          {/* Demo Credentials Helper Pill */}
          <div className="mt-6 text-xs text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Pre-seeded with active drive, 6 candidates, 4 interviewers, and 4 venues. Password: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Password123!</code></span>
          </div>
        </div>
      </section>

      {/* Feature Architecture Matrix */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Engineered for High-Concurrency Hiring Drives
          </h2>
          <p className="mt-3 text-slate-500 text-sm max-w-xl mx-auto">
            Combines deterministic algorithmic rigor with real LLM reasoning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Deterministic CSP Engine</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Greedy MRV heuristic with bounded backtracking enforces 12 hard constraints: candidate & interviewer overlaps, room bottlenecks, panel sizes, skill qualifications, and working hours.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Real AI Co-Pilot</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Natural language assistant converts coordinator prompts to structured constraints, explains mathematical scheduling conflicts, and synthesizes authorized evaluator feedback.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Digital Twin & What-If Simulator</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Simulate candidate surge, interviewer dropouts, room closures, or panel expansions in memory before publishing. Tracks Schedule Stability Score to minimize ripples.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Atomic Candidate Self-Booking</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Server-side revalidation prevents race conditions. Candidates pick feasible slots matching interviewer availability windows with 1-click RFC 5545 calendar (.ics) download.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
              <GitBranch className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Stage Pipeline Orchestrator</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Configurable rounds (Coding → Tech Architecture → HR) with strict prerequisite enforcement and automated conditional pass/fail candidate routing.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Blinded Rubric & Ranking Matrix</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Prevents evaluator bias by masking peer reviews until unmasked. Generates weighted composite score comparison matrices with custom tie handling.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

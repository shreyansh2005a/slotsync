import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'coordinator') navigate('/coordinator');
      else if (user.role === 'interviewer') navigate('/interviewer');
      else navigate('/candidate');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async (role) => {
    setError('');
    setLoading(true);
    try {
      const user = await quickLogin(role);
      if (user.role === 'coordinator') navigate('/coordinator');
      else if (user.role === 'interviewer') navigate('/interviewer');
      else navigate('/candidate');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-100">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome to SlotSync</h2>
          <p className="text-xs text-slate-500 mt-1">Sign in to access your recruitment portal</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login Shortcuts */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
            Instant 1-Click Demo Login
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDemoFill('coordinator')}
              className="py-2 px-2 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all text-center"
            >
              Coordinator
            </button>
            <button
              onClick={() => handleDemoFill('interviewer')}
              className="py-2 px-2 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all text-center"
            >
              Interviewer
            </button>
            <button
              onClick={() => handleDemoFill('candidate')}
              className="py-2 px-2 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all text-center"
            >
              Candidate
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 hover:underline font-bold">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

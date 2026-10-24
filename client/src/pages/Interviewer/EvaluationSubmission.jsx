import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ClipboardCheck,
  Star,
  ShieldCheck,
  CheckCircle,
  EyeOff,
  Send,
  AlertCircle
} from 'lucide-react';

export default function EvaluationSubmission() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [selectedInterviewId, setSelectedInterviewId] = useState('');
  const [rubricScores, setRubricScores] = useState({
    technical: 4,
    problemSolving: 4,
    communication: 4,
    roleSpecific: 4
  });
  const [overallRating, setOverallRating] = useState(4);
  const [recommendation, setRecommendation] = useState('hire');
  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [keyStrengths, setKeyStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyInterviews();
  }, []);

  const fetchMyInterviews = async () => {
    try {
      const res = await api.get('/scheduling/interviews');
      const list = res.data.data;
      setInterviews(list);
      if (list.length > 0) {
        setSelectedInterviewId(list[0]._id);
      }
    } catch (err) {}
  };

  const selectedInterview = interviews.find(i => i._id === selectedInterviewId);

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedInterview) return;
    setLoading(true);
    try {
      const strengthsArr = keyStrengths.split(',').map(s => s.trim()).filter(Boolean);
      const improveArr = areasForImprovement.split(',').map(s => s.trim()).filter(Boolean);

      await api.post('/evaluations/submit', {
        interviewId: selectedInterview._id,
        candidateId: selectedInterview.candidateId?._id || selectedInterview.candidateId,
        roundId: selectedInterview.roundId?._id || selectedInterview.roundId,
        rubricScores,
        writtenFeedback,
        keyStrengths: strengthsArr,
        areasForImprovement: improveArr,
        overallRating,
        recommendation
      });

      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting evaluation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-2 border border-brand-200">
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Standardized Evaluation Rubric</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Submit Candidate Evaluation</h1>
        <p className="text-xs text-slate-500 mt-1">
          Objective rubric scoring with automated Blinded Feedback mode.
        </p>
      </div>

      {/* Blinded Review Pill */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 text-xs flex items-center gap-2.5 text-indigo-900">
        <EyeOff className="w-4 h-4 text-indigo-600 flex-shrink-0" />
        <div>
          <span className="font-bold">Blinded Feedback Active: </span>
          <span>Your ratings and written review remain completely hidden from peer interviewers until unmasked.</span>
        </div>
      </div>

      {submitted ? (
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4 animate-fadeIn">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Evaluation Submitted Successfully!</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your scores have been encrypted and submitted to the aggregated candidate ranking matrix.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setWrittenFeedback('');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Submit Another Evaluation
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitEvaluation} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* Select Interview */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Interview Session</label>
            <select
              value={selectedInterviewId}
              onChange={(e) => setSelectedInterviewId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
            >
              {interviews.map(i => (
                <option key={i._id} value={i._id}>
                  {i.candidateId?.name} — {i.roundId?.name} ({new Date(i.startTime).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* 4 Rubric Criteria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Technical Aptitude (1-5)</span>
                <span className="font-bold text-brand-600">{rubricScores.technical} / 5</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={rubricScores.technical}
                onChange={(e) => setRubricScores({ ...rubricScores, technical: Number(e.target.value) })}
                className="w-full accent-brand-600"
              />
            </div>

            <div>
              <label className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Problem Solving & Algorithms (1-5)</span>
                <span className="font-bold text-brand-600">{rubricScores.problemSolving} / 5</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={rubricScores.problemSolving}
                onChange={(e) => setRubricScores({ ...rubricScores, problemSolving: Number(e.target.value) })}
                className="w-full accent-brand-600"
              />
            </div>

            <div>
              <label className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Communication & Articulation (1-5)</span>
                <span className="font-bold text-brand-600">{rubricScores.communication} / 5</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={rubricScores.communication}
                onChange={(e) => setRubricScores({ ...rubricScores, communication: Number(e.target.value) })}
                className="w-full accent-brand-600"
              />
            </div>

            <div>
              <label className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Role-Specific Experience (1-5)</span>
                <span className="font-bold text-brand-600">{rubricScores.roleSpecific} / 5</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={rubricScores.roleSpecific}
                onChange={(e) => setRubricScores({ ...rubricScores, roleSpecific: Number(e.target.value) })}
                className="w-full accent-brand-600"
              />
            </div>
          </div>

          {/* Qualitative Feedback */}
          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Detailed Written Feedback</label>
              <textarea
                required
                rows={4}
                value={writtenFeedback}
                onChange={(e) => setWrittenFeedback(e.target.value)}
                placeholder="Analyze candidate performance on architectural trade-offs, code modularity, and communication..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Key Strengths (comma-separated)</label>
                <input
                  type="text"
                  placeholder="System Design, Clean Code"
                  value={keyStrengths}
                  onChange={(e) => setKeyStrengths(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Areas for Improvement</label>
                <input
                  type="text"
                  placeholder="Distributed lock nuances"
                  value={areasForImprovement}
                  onChange={(e) => setAreasForImprovement(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Overall Recommendation */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Overall Rating (1-5)</label>
                <select
                  value={overallRating}
                  onChange={(e) => setOverallRating(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value={5}>5 - Outstanding (Top 5%)</option>
                  <option value={4}>4 - Strong Hire</option>
                  <option value={3}>3 - Acceptable / Meets Bar</option>
                  <option value={2}>2 - Marginal / Below Bar</option>
                  <option value={1}>1 - Definite No-Hire</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hiring Recommendation</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="strong_hire">Strong Hire</option>
                  <option value="hire">Hire</option>
                  <option value="lean_hire">Lean Hire</option>
                  <option value="lean_no">Lean No Hire</option>
                  <option value="no_hire">No Hire</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Submitting...' : 'Submit Evaluation to Matrix'}</span>
          </button>
        </form>
      )}
    </div>
  );
}

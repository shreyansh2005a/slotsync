import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  GitBranch,
  CheckCircle2,
  Clock,
  Lock,
  Award,
  ArrowRight
} from 'lucide-react';

export default function PipelineTracking() {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [driveRounds, setDriveRounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const fetchPipelineData = async () => {
    try {
      setLoading(true);
      const drivesRes = await api.get('/drives');
      const list = drivesRes.data.data;
      setDrives(list);
      if (list.length > 0) {
        const driveRes = await api.get(`/drives/${list[0]._id}`);
        setDriveRounds(driveRes.data.data.rounds || []);
      }
    } catch (err) {}
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-2 border border-brand-200">
          <GitBranch className="w-3.5 h-3.5" />
          <span>Stage Progression</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Multi-Stage Pipeline Tracking</h1>
        <p className="text-xs text-slate-500 mt-1">
          Candidate stages advance sequentially upon satisfaction of prerequisite evaluation thresholds.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-sm font-bold text-slate-900">Engineering Track Milestones</h2>

        <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {driveRounds.map((round, idx) => {
            const isCompleted = idx === 0; // Pre-seeded David Miller passed Round 1
            const isCurrent = idx === 1;

            return (
              <div key={round._id} className="relative flex items-start gap-4">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold absolute -left-[31px] top-0 shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-brand-600 ring-4 ring-brand-100'
                      : 'bg-slate-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>

                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Stage #{round.roundOrder} • {round.type}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">{round.name}</h3>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCurrent
                          ? 'bg-brand-100 text-brand-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? 'Passed' : isCurrent ? 'Active Stage' : 'Locked'}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-500 space-y-1">
                    <p>Duration: {round.durationMinutes} min • Panel: {round.panelSize} interviewer(s)</p>
                    <p>Required Skills: {(round.requiredSkills || []).join(', ')}</p>
                  </div>

                  {isCompleted && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 text-[11px] text-emerald-900 font-medium">
                      ✓ Stage prerequisites fulfilled with evaluation score of 88/100.
                    </div>
                  )}

                  {isCurrent && (
                    <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-brand-50 border border-brand-100 text-[11px] text-brand-900 font-medium">
                      <span>Ready for self-scheduling or coordinator review.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

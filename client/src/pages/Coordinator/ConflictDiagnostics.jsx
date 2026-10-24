import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ConflictHeatmap from '../../components/ConflictHeatmap';
import {
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Layers,
  CheckCircle2
} from 'lucide-react';

export default function ConflictDiagnostics() {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [heatmapData, setHeatmapData] = useState([]);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const drivesRes = await api.get('/drives');
      const list = drivesRes.data.data;
      setDrives(list);
      if (list.length > 0) {
        setSelectedDriveId(list[0]._id);
        fetchAnalytics(list[0]._id);
      }
    } catch (err) {}
    finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (driveId) => {
    try {
      const res = await api.get(`/analytics/dashboard/${driveId}`);
      setHeatmapData(res.data.data.heatmap || []);
    } catch (err) {}
  };

  const handleRunAiExplainer = async () => {
    setLoadingAi(true);
    try {
      // Simulate raw validator bottleneck scenario to diagnose
      const res = await api.post('/ai/explain-conflict', {
        validatorOutput: {
          violations: [
            { type: 'SKILL_MISMATCH', message: 'Assigned panel lacks required skill: System Design' },
            { type: 'SLOT_SATURATION', message: 'All 4 rooms occupied during 10:00 AM - 12:00 PM peak' }
          ]
        },
        context: { driveId: selectedDriveId }
      });
      setAiExplanation(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error running conflict explainer');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold mb-2 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Constraint Bottlenecks & Explanations</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Conflict Diagnostics & Capacity Heatmap</h1>
        <p className="text-xs text-slate-500 mt-1">
          Derives peak contention zones, scarce interviewer skill tags, and AI-assisted resolution trade-offs.
        </p>
      </div>

      {/* Heatmap Grid Component */}
      <ConflictHeatmap data={heatmapData} />

      {/* AI Conflict Explainer Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>AI Conflict Diagnostic Explainer</span>
            </h2>
            <p className="text-xs text-slate-500">
              Evaluates hard-constraint logs from the validator to explain why candidate assignments blocked.
            </p>
          </div>
          <button
            onClick={handleRunAiExplainer}
            disabled={loadingAi}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loadingAi ? 'Analyzing Validator Output...' : 'Run Conflict Explainer'}</span>
          </button>
        </div>

        {aiExplanation && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{aiExplanation.summary}</span>
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 text-[10px]">
                {aiExplanation.rootCauseCategory}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">{aiExplanation.detailedExplanation}</p>

            <div className="pt-2 border-t border-slate-200/60">
              <span className="font-bold text-slate-800 block mb-2">Recommended Operational Trade-Offs:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(aiExplanation.recommendedActions || []).map((action, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>{action.action}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        Feasibility: {action.feasibility}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{action.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

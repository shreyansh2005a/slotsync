import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Sparkles, X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function LiveCoordinationBanner() {
  const { latestAlert, clearAlert } = useSocket();
  if (!latestAlert) return null;

  const bgStyles = {
    SUCCESS: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    WARNING: 'bg-amber-50 border-amber-200 text-amber-800',
    INFO: 'bg-brand-50 border-brand-200 text-brand-800'
  }[latestAlert.type] || 'bg-slate-50 border-slate-200 text-slate-800';

  const Icon = {
    SUCCESS: CheckCircle,
    WARNING: AlertCircle,
    INFO: Info
  }[latestAlert.type] || Info;

  return (
    <div className={`border-b px-4 py-2.5 transition-all animate-fadeIn ${bgStyles}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 flex-shrink-0" />
          <div>
            <span className="font-bold mr-2">{latestAlert.title}</span>
            <span>{latestAlert.message}</span>
          </div>
        </div>
        <button
          onClick={clearAlert}
          className="p-1 hover:opacity-75 rounded transition-opacity"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

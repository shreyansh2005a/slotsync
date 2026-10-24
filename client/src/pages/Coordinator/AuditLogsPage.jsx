import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, Shield, Clock, Search } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit');
      setLogs(res.data.data);
    } catch (err) {}
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-2 border border-slate-200">
          <History className="w-3.5 h-3.5" />
          <span>Compliance & Security Audit Trail</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">System Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable event log of schedule publications, evaluations, and candidate bookings.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
            <tr>
              <th className="p-3.5 pl-5">Timestamp</th>
              <th className="p-3.5">User</th>
              <th className="p-3.5">Action Event</th>
              <th className="p-3.5">Entity</th>
              <th className="p-3.5 pr-5">Payload Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-slate-50/80">
                <td className="p-3.5 pl-5 text-slate-500 font-sans">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-3.5 font-bold font-sans text-slate-900">
                  {log.userName}
                  <span className="ml-1 text-[10px] text-slate-400 capitalize">({log.userRole})</span>
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold text-[10px]">
                    {log.action}
                  </span>
                </td>
                <td className="p-3.5 text-slate-600 font-sans">{log.entityType}</td>
                <td className="p-3.5 pr-5 text-slate-500 text-[11px] truncate max-w-xs">
                  {JSON.stringify(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

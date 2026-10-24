import React from 'react';

export default function ConflictHeatmap({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
        No interview distribution data available to render heatmap.
      </div>
    );
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const getCellColor = (intensity, count) => {
    if (count === 0) return 'bg-slate-50 text-slate-300 border-slate-100 hover:border-slate-300';
    if (intensity === 'critical') return 'bg-rose-500 text-white font-bold shadow-sm';
    if (intensity === 'high') return 'bg-amber-400 text-slate-900 font-semibold';
    if (intensity === 'medium') return 'bg-brand-300 text-brand-950 font-medium';
    return 'bg-brand-100 text-brand-800';
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Interactive Conflict & Demand Heatmap</h3>
          <p className="text-xs text-slate-500">Visualizes slot saturation, room bottlenecks, and peak interview concurrency.</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border"></span> Free</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-100"></span> Normal</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400"></span> High</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500"></span> Saturated</div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-semibold text-slate-400 w-16">Day</th>
              {hours.map(h => (
                <th key={h} className="p-2 text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((dayName, dIdx) => {
              const dayIndex = dIdx + 1; // Mon = 1 ... Fri = 5
              return (
                <tr key={dayName}>
                  <td className="p-2 text-left text-xs font-bold text-slate-700">{dayName}</td>
                  {hours.map(hour => {
                    const cell = data.find(c => c.dayIndex === dayIndex && c.hour === hour) || { activeInterviews: 0, intensity: 'low' };
                    return (
                      <td key={hour} className="p-1">
                        <div
                          title={`${dayName} at ${hour}: ${cell.activeInterviews} interview(s) booked (${cell.intensity} load)`}
                          className={`w-full h-10 rounded-lg flex items-center justify-center text-xs border transition-all cursor-pointer ${getCellColor(
                            cell.intensity,
                            cell.activeInterviews
                          )}`}
                        >
                          {cell.activeInterviews > 0 ? cell.activeInterviews : '-'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

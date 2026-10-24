import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export function WorkloadDistributionChart({ data = [] }) {
  const chartData = data.map(item => ({
    name: item.name ? item.name.split(' ')[0] : (item.interviewerName ? item.interviewerName.split(' ')[0] : 'Int'),
    interviews: item.interviewCount !== undefined ? item.interviewCount : (item.count || 0),
    minutes: item.totalMinutes || 0
  }));

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">Interviewer Workload Distribution</h3>
        <p className="text-xs text-slate-500">Scheduled interviews assigned across engineering evaluators.</p>
      </div>
      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar dataKey="interviews" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RoomUtilizationChart({ data = [] }) {
  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  const chartData = data.map(r => ({
    name: r.name || r.roomName || 'Room',
    value: r.bookedInterviews !== undefined ? r.bookedInterviews : (r.bookedSlots || 0)
  })).filter(r => r.value > 0);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">Venue & Room Utilization</h3>
        <p className="text-xs text-slate-500">Distribution of meetings across physical halls and virtual rooms.</p>
      </div>
      <div className="flex-1 min-h-[240px] flex items-center justify-center">
        {chartData.length === 0 ? (
          <div className="text-xs text-slate-400">No rooms currently occupied</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

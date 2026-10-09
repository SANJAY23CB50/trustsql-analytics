import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, AreaChart as AreaIcon, Hash, Table as TableIcon } from 'lucide-react';

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
  '#06b6d4', '#f97316', '#14b8a6', '#3b82f6', '#84cc16'
];

export default function VisualizationView({
  visualization,
  data,
  onSwitchToTable
}) {
  const [chartType, setChartType] = useState(visualization?.recommended_chart || 'bar');

  if (!data || !data.rows || data.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
        <p className="text-sm">No data returned to visualize.</p>
      </div>
    );
  }

  const { rows, columns } = data;
  const xAxisKey = visualization?.x_axis || columns[0];
  const yAxisKey = visualization?.y_axis || (columns.length > 1 ? columns[1] : columns[0]);
  const secondaryMetrics = visualization?.secondary_metrics || [];

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur text-xs">
          <p className="font-semibold text-slate-200 mb-1 border-b border-slate-800 pb-1">{label || payload[0]?.name}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between space-x-4 py-0.5">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name || entry.dataKey}:</span>
              </span>
              <span className="font-mono font-medium text-slate-100">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
      {/* Visualization Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Automated Visual Analytics</h3>
          <p className="text-xs text-slate-400">
            Detected best format: <strong className="text-indigo-300 uppercase">{visualization?.recommended_chart || 'Auto'}</strong>
          </p>
        </div>

        {/* Chart Type Selector */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setChartType('bar')}
            className={`p-1.5 rounded text-xs flex items-center space-x-1 transition-all ${
              chartType === 'bar' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Bar</span>
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-1.5 rounded text-xs flex items-center space-x-1 transition-all ${
              chartType === 'line' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Line Chart"
          >
            <LineIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Line</span>
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`p-1.5 rounded text-xs flex items-center space-x-1 transition-all ${
              chartType === 'area' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Area Chart"
          >
            <AreaIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Area</span>
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-1.5 rounded text-xs flex items-center space-x-1 transition-all ${
              chartType === 'pie' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Pie Chart"
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Pie</span>
          </button>
          {visualization?.kpi_data && (
            <button
              onClick={() => setChartType('kpi')}
              className={`p-1.5 rounded text-xs flex items-center space-x-1 transition-all ${
                chartType === 'kpi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="KPI Cards"
            >
              <Hash className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">KPI</span>
            </button>
          )}
          <button
            onClick={onSwitchToTable}
            className="p-1.5 rounded text-xs flex items-center space-x-1 text-slate-400 hover:text-slate-200"
            title="View Raw Data Table"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-80">
        {chartType === 'kpi' && visualization?.kpi_data ? (
          <div className="h-full flex items-center justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {visualization.kpi_data.map((kpi, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-slate-800 p-6 rounded-xl shadow text-center">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{kpi.label}</p>
                  <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 font-mono">
                    {kpi.format === 'currency' ? `$${Number(kpi.value).toLocaleString()}` : (kpi.format === 'percentage' ? `${kpi.value}%` : Number(kpi.value).toLocaleString())}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : chartType === 'pie' ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey={yAxisKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={50}
                paddingAngle={4}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {rows.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : chartType === 'line' ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Line type="monotone" dataKey={yAxisKey} stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              {secondaryMetrics.map((sec, sIdx) => (
                <Line key={sec} type="monotone" dataKey={sec} stroke={COLORS[(sIdx + 1) % COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : chartType === 'area' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Area type="monotone" dataKey={yAxisKey} stroke="#6366f1" fillOpacity={1} fill="url(#areaGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Bar dataKey={yAxisKey} fill="#6366f1" radius={[4, 4, 0, 0]}>
                {rows.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
              {secondaryMetrics.map((sec, sIdx) => (
                <Bar key={sec} dataKey={sec} fill={COLORS[(sIdx + 1) % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

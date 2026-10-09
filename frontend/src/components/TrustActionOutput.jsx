import React from 'react';
import { Check } from 'lucide-react';

export default function TrustActionOutput({ logs }) {
  const defaultLogs = [
    {
      id: 1,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action: 'SELECT SUM(total) AS total_revenue, COUNT(*) AS total_orders, ROUND(AVG(total), 2) AS avg_order_value FROM orders LIMIT 1000;',
      message: '1 row(s) returned',
      success: true
    }
  ];

  const displayLogs = logs && logs.length > 0 ? logs : defaultLogs;

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      {/* Header */}
      <div className="h-8 px-3 bg-[#eef2f6] border-b border-slate-200 flex items-center text-xs font-semibold text-slate-700 select-none">
        Action Output
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-36 overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 font-semibold select-none">
              <th className="w-10 px-3 py-1.5 border-r border-slate-200 text-center">#</th>
              <th className="w-28 px-3 py-1.5 border-r border-slate-200">Time</th>
              <th className="px-3 py-1.5 border-r border-slate-200">Action</th>
              <th className="w-48 px-3 py-1.5">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
            {displayLogs.map((log, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80">
                <td className="px-3 py-1.5 border-r border-slate-200 text-center text-slate-500">
                  {idx + 1}
                </td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-slate-500 whitespace-nowrap">
                  {log.time}
                </td>
                <td className="px-3 py-1.5 border-r border-slate-100 text-slate-800 truncate max-w-md" title={log.action}>
                  {log.action}
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap">
                  {log.success ? (
                    <span className="text-emerald-600 font-medium flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{log.message}</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 font-medium">
                      {log.message}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Volume2, VolumeX, Sparkles, BookOpen, AlertCircle, Lightbulb, CheckCircle2 } from 'lucide-react';

const COLORS = ['#007b88', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export default function TrustResultGrid({
  data,
  explanation,
  visualization,
  ambiguityReport,
  queryResponse
}) {
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'visual' | 'breakdown' | 'copilot'
  const [isSpeaking, setIsSpeaking] = useState(false);

  const columns = data?.columns || ['total_revenue', 'total_orders', 'avg_order_value'];
  const rows = data?.rows || [{ total_revenue: 865553, total_orders: 76, avg_order_value: 11388.86 }];
  const rowCount = data?.row_count !== undefined ? data.row_count : rows.length;
  const executionTime = data?.execution_time_ms !== undefined ? data.execution_time_ms : 0.47;

  // Text to Speech
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      let speechText = `Analysis complete. Total records returned: ${rowCount}. `;
      if (rows.length > 0) {
        const first = rows[0];
        const keys = Object.keys(first);
        speechText += keys.map(k => `${k.replace(/_/g, ' ')} is ${first[k]}`).join(', ');
      }
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs flex flex-col">
      {/* Tabs Header Bar */}
      <div className="h-9 px-3 bg-[#f8fafc] border-b border-slate-200 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('grid')}
            className={`px-3 py-1.5 font-medium rounded-t border-b-2 transition-colors ${
              activeTab === 'grid'
                ? 'border-[#007b88] text-[#006677] bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Result Grid
          </button>

          <button
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1.5 font-medium rounded-t border-b-2 transition-colors ${
              activeTab === 'visual'
                ? 'border-[#007b88] text-[#006677] bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Visual
          </button>

          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-3 py-1.5 font-medium rounded-t border-b-2 transition-colors ${
              activeTab === 'breakdown'
                ? 'border-[#007b88] text-[#006677] bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Query Breakdown
          </button>

          <button
            onClick={() => setActiveTab('copilot')}
            className={`px-3 py-1.5 font-medium rounded-t border-b-2 transition-colors flex items-center space-x-1 ${
              activeTab === 'copilot'
                ? 'border-[#007b88] text-[#006677] bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>✦ Copilot</span>
          </button>
        </div>

        {/* Right Metadata */}
        <div className="text-[11px] text-slate-500 font-mono">
          {rowCount} row(s) · {executionTime} ms
        </div>
      </div>

      {/* Tab Body */}
      <div className="p-0 overflow-x-auto min-h-[140px]">
        {/* Tab 1: Result Grid Table */}
        {activeTab === 'grid' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-700 font-semibold select-none">
                <th className="w-10 px-2.5 py-1.5 border-r border-slate-200 bg-[#f1f5f9] text-center text-slate-400 font-normal">
                  &nbsp;
                </th>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-1.5 border-r border-slate-200 font-mono font-medium text-slate-700 last:border-r-0">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-2.5 py-1.5 border-r border-slate-200 bg-[#f8fafc] text-center text-slate-400 text-[11px] select-none">
                    {rIdx + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-1.5 border-r border-slate-100 last:border-r-0 text-slate-900">
                      {row[col] === null ? (
                        <span className="text-slate-400 italic">null</span>
                      ) : typeof row[col] === 'number' ? (
                        row[col].toLocaleString()
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Tab 2: Visual Charts */}
        {activeTab === 'visual' && (
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey={columns[0]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey={columns[1] || columns[0]} fill="#007b88" radius={[4, 4, 0, 0]}>
                  {rows.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 3: Query Breakdown */}
        {activeTab === 'breakdown' && (
          <div className="p-4 space-y-2 text-xs">
            <p className="text-slate-700 font-medium mb-2">
              {explanation?.summary || 'Executes an analytical aggregation with read-only sandbox safety.'}
            </p>
            {explanation?.clauses ? (
              explanation.clauses.map((clause, cIdx) => (
                <div key={cIdx} className="p-2 bg-slate-50 border border-slate-200 rounded flex items-start space-x-2">
                  <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-mono font-bold text-[10px]">
                    {clause.clause}
                  </span>
                  <div className="text-slate-700">
                    <span>{clause.explanation}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500">Clause breakdown ready for active query.</p>
            )}
          </div>
        )}

        {/* Tab 4: ✦ Copilot & Voice Narration */}
        {activeTab === 'copilot' && (
          <div className="p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded p-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span className="font-semibold text-teal-900">AI Analytics Copilot</span>
              </div>
              <button
                onClick={handleSpeak}
                className="flex items-center space-x-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-medium"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isSpeaking ? 'Stop Voice' : 'Read Aloud (TTS)'}</span>
              </button>
            </div>

            {ambiguityReport?.assumptions_made?.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded space-y-1">
                <p className="font-semibold text-amber-900">Ambiguity Handled & Assumptions Made:</p>
                {ambiguityReport.assumptions_made.map((a, i) => (
                  <p key={i} className="text-amber-800">• {a}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

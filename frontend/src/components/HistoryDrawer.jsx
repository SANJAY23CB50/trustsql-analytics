import React from 'react';
import { X, History, Clock, ArrowRight, Play, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';

export default function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onSelectQuery,
  onClearHistory
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-slate-100 text-sm">Query Execution History</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {history.length}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {history.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs">
                No queries executed yet in this session.
              </div>
            ) : (
              history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectQuery(item)}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate flex-1">
                      {item.question}
                    </p>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  {item.generated_sql && (
                    <pre className="font-mono text-[10px] text-emerald-400/90 bg-slate-900 p-1.5 rounded truncate mb-2">
                      {item.generated_sql}
                    </pre>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.timestamp}</span>
                    </span>
                    <span>
                      {item.data?.row_count ?? 0} rows • {item.data?.execution_time_ms ?? 0}ms
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

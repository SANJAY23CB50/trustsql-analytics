import React, { useState } from 'react';
import { Terminal, ShieldCheck, ShieldAlert, Copy, Check, Play, Edit3, RotateCcw, AlertTriangle } from 'lucide-react';

export default function SQLEditor({
  sql,
  safetyReport,
  onExecuteRaw,
  isLoading
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableSql, setEditableSql] = useState(sql);
  const [copied, setCopied] = useState(false);

  // Sync if prop changes and not currently editing
  React.useEffect(() => {
    setEditableSql(sql);
  }, [sql]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableSql || sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCustom = () => {
    if (editableSql.trim() && !isLoading) {
      onExecuteRaw(editableSql);
    }
  };

  const isSafe = safetyReport?.is_safe ?? true;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Editor Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">Generated SQL Query</span>

          {/* AST Safety Badge */}
          {isSafe ? (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
              <ShieldCheck className="w-3 h-3" />
              <span>AST Verified (Read-Only)</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-medium animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              <span>Safety Violation</span>
            </span>
          )}

          {safetyReport?.tables_accessed?.length > 0 && (
            <span className="hidden sm:inline text-[10px] text-slate-400">
              Tables: <strong className="text-indigo-300">{safetyReport.tables_accessed.join(', ')}</strong>
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center space-x-1 ${
              isEditing
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEditing ? 'Editing Mode' : 'Edit SQL'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-xs flex items-center space-x-1"
            title="Copy SQL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {isEditing && (
            <button
              onClick={handleRunCustom}
              disabled={isLoading || !editableSql.trim()}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow flex items-center space-x-1"
            >
              <Play className="w-3 h-3" />
              <span>Execute</span>
            </button>
          )}
        </div>
      </div>

      {/* SQL View / Editor Box */}
      <div className="p-4 bg-slate-950 font-mono text-xs">
        {isEditing ? (
          <textarea
            rows={5}
            value={editableSql}
            onChange={(e) => setEditableSql(e.target.value)}
            className="w-full bg-slate-900 border border-indigo-500/50 rounded-lg p-3 text-emerald-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
          />
        ) : (
          <pre className="text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {sql}
          </pre>
        )}
      </div>

      {/* Safety issues banner if any */}
      {!isSafe && safetyReport?.issues?.length > 0 && (
        <div className="p-3 bg-rose-950/40 border-t border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{safetyReport.issues.join(' | ')}</span>
        </div>
      )}
    </div>
  );
}

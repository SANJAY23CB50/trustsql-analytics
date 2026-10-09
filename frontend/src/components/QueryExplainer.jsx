import React from 'react';
import { BookOpen, HelpCircle, Layers, CheckCircle } from 'lucide-react';

export default function QueryExplainer({ explanation }) {
  if (!explanation || !explanation.clauses || explanation.clauses.length === 0) {
    return null;
  }

  const { summary, clauses } = explanation;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center space-x-2 mb-3">
        <BookOpen className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-slate-100">Plain English Query Explanation</h3>
      </div>
      <p className="text-xs text-slate-400 mb-4">{summary}</p>

      <div className="space-y-2.5">
        {clauses.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
          >
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono font-semibold text-[10px] border border-indigo-500/20 shrink-0">
              {item.clause}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200">{item.explanation}</p>
              {item.sql && (
                <p className="font-mono text-[11px] text-slate-400 mt-1 truncate">
                  {item.sql}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

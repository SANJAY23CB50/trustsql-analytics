import React, { useState } from 'react';
import { X, Play, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

export default function BenchmarkRunnerModal({
  isOpen,
  onClose,
  onRunBenchmark,
  benchmarkResults,
  isRunning
}) {
  const [filter, setFilter] = useState('all');

  if (!isOpen) return null;

  const results = benchmarkResults?.results || [];
  const totalTests = benchmarkResults?.total_tests || 0;
  const totalPassed = benchmarkResults?.total_passed || 0;
  const passRate = benchmarkResults?.pass_rate_percentage || 0;

  const filteredResults = results.filter((r) => {
    if (filter === 'passed') return r.passed;
    if (filter === 'failed') return !r.passed;
    if (filter === 'security') return r.category.includes('Security');
    if (filter === 'correctness') return r.category.includes('Correctness');
    if (filter === 'ambiguity') return r.category.includes('Ambiguity');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
                Correctness & Safety Benchmark Suite
              </h3>
              <p className="text-xs text-slate-400">
                Tests query accuracy, ambiguity resolution, and AST guardrail injection defense
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Stats Bar */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Pass Rate:</span>
              <span className={`text-base font-bold font-mono ${passRate === 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                {passRate}%
              </span>
              <span className="text-xs text-slate-500">({totalPassed}/{totalTests} Passed)</span>
            </div>

            {/* Filter Pills */}
            <div className="hidden sm:flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              {['all', 'correctness', 'ambiguity', 'security'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 rounded capitalize transition-all ${
                    filter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onRunBenchmark}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Test Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Complete Suite</span>
              </>
            )}
          </button>
        </div>

        {/* Benchmark Results List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
          {results.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Zap className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-medium">Click "Run Complete Suite" to execute all tests.</p>
            </div>
          ) : (
            filteredResults.map((test) => (
              <div
                key={test.id}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  test.passed
                    ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    : 'bg-rose-950/20 border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {test.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-semibold uppercase font-mono ${
                            test.category.includes('Security')
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                              : test.category.includes('Ambiguity')
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                          }`}
                        >
                          {test.category}
                        </span>
                        <span className="font-semibold text-slate-200 truncate">
                          {test.question}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{test.details}</p>
                      {test.sql && (
                        <pre className="font-mono text-[10px] text-emerald-400/80 bg-slate-900 p-1.5 rounded mt-1.5 truncate">
                          {test.sql}
                        </pre>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-slate-500">
                      {test.execution_time_ms} ms
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

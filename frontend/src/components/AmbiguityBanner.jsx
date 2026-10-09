import React from 'react';
import { AlertCircle, HelpCircle, CheckCircle, ArrowRight, Lightbulb } from 'lucide-react';

export default function AmbiguityBanner({
  ambiguityReport,
  onApplyClarification
}) {
  if (!ambiguityReport || !ambiguityReport.is_ambiguous) {
    return null;
  }

  const { confidence_score, detected_ambiguities, assumptions_made, clarifications } = ambiguityReport;

  return (
    <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/30 rounded-xl p-4 shadow-lg backdrop-blur mb-6 animate-fadeIn">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0 text-amber-400 mt-0.5">
          <HelpCircle className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-amber-200">Ambiguous Business Question Detected</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                Confidence: {Math.round(confidence_score * 100)}%
              </span>
            </div>
            <span className="text-xs text-amber-400/80">Refining will produce more accurate queries</span>
          </div>

          {/* Assumptions Made by AI */}
          <div className="space-y-1 mb-3">
            {assumptions_made.map((assumption, idx) => (
              <div key={idx} className="flex items-center space-x-1.5 text-xs text-slate-300">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span><strong className="text-amber-200 font-medium">Automatic Assumption:</strong> {assumption}</span>
              </div>
            ))}
          </div>

          {/* Interactive Clarification Chips */}
          {clarifications && clarifications.length > 0 && (
            <div className="pt-2 border-t border-amber-500/20">
              <p className="text-xs text-amber-300 font-medium mb-2">Click to clarify your question:</p>
              <div className="space-y-2">
                {clarifications.map((clar, cIdx) => (
                  <div key={cIdx} className="space-y-1.5">
                    <p className="text-[11px] text-slate-400">{clar.question}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {clar.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => onApplyClarification(opt)}
                          className="px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/30 text-xs transition-all hover:scale-[1.02] flex items-center space-x-1"
                        >
                          <span>{opt}</span>
                          <ArrowRight className="w-3 h-3 text-amber-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

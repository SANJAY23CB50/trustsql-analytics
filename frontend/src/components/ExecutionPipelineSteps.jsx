import React from 'react';
import { Mic, FileText, Code2, ShieldCheck, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ExecutionPipelineSteps({
  currentStage = 'completed',
  isVoiceInput = false
}) {
  const steps = [
    {
      id: 'audio',
      label: 'Voice / Audio In',
      desc: 'Speech input or prompt',
      icon: Mic,
      color: 'text-purple-400',
      activeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    },
    {
      id: 'stt',
      label: 'Speech-to-Text',
      desc: 'Intent & Entity parsing',
      icon: FileText,
      color: 'text-indigo-400',
      activeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
    },
    {
      id: 'code',
      label: 'Schema & Coding',
      desc: 'Relations & SQL generation',
      icon: Code2,
      color: 'text-blue-400',
      activeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    },
    {
      id: 'guard',
      label: 'AST Safety Sandbox',
      desc: 'Read-only & limit guards',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      activeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    {
      id: 'analytics',
      label: 'Visual & Spoken Output',
      desc: 'Charts, tables & narration',
      icon: BarChart3,
      color: 'text-amber-400',
      activeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    }
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
      <div className="flex items-center justify-between overflow-x-auto pb-1 gap-2 scrollbar-none">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center space-x-2 shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-semibold ${step.activeColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">{step.label}</p>
                  <p className="text-[10px] text-slate-400">{step.desc}</p>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0 mx-1 hidden sm:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

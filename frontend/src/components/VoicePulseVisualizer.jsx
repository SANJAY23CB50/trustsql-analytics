import React, { useEffect, useState } from 'react';
import { Mic, Volume2 } from 'lucide-react';

export default function VoicePulseVisualizer({ isRecording, isSpeaking, label }) {
  const [bars, setBars] = useState([20, 45, 80, 60, 30, 70, 90, 40, 60, 35, 75, 50]);

  useEffect(() => {
    if (!isRecording && !isSpeaking) return;
    const interval = setInterval(() => {
      setBars((prev) =>
        prev.map(() => Math.floor(Math.random() * 75) + 20)
      );
    }, 100);
    return () => clearInterval(interval);
  }, [isRecording, isSpeaking]);

  if (!isRecording && !isSpeaking) return null;

  return (
    <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 shadow-lg shadow-indigo-500/20 animate-fadeIn">
      <div className="relative flex items-center justify-center">
        <span className="absolute w-8 h-8 rounded-full bg-indigo-500/30 animate-ping" />
        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white relative z-10">
          {isRecording ? <Mic className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
        </div>
      </div>

      <div className="flex items-center space-x-1 h-5">
        {bars.map((h, i) => (
          <span
            key={i}
            className="w-1 bg-gradient-to-t from-indigo-500 via-purple-400 to-emerald-400 rounded-full transition-all duration-100"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      <span className="text-xs font-semibold text-indigo-200 tracking-wide font-mono">
        {label || (isRecording ? 'Listening to voice...' : 'Narrating insight...')}
      </span>
    </div>
  );
}

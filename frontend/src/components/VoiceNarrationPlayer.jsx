import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Sparkles, RefreshCw } from 'lucide-react';
import VoicePulseVisualizer from './VoicePulseVisualizer';

export default function VoiceNarrationPlayer({
  queryResponse
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false);
    }
  }, []);

  const generateNarrativeText = () => {
    if (!queryResponse || !queryResponse.data) return '';
    const { question, generated_sql, explanation, data, visualization } = queryResponse;
    const count = data.row_count || 0;
    const time = data.execution_time_ms || 0;

    let narrative = `Analysis for: ${question}. `;
    
    if (visualization?.kpi_data && visualization.kpi_data.length > 0) {
      const kpis = visualization.kpi_data.map(k => `${k.label} is ${k.value}`).join(', and ');
      narrative += `The result shows that ${kpis}. `;
    } else if (count > 0 && data.rows.length > 0) {
      narrative += `We retrieved ${count} records in ${time} milliseconds. `;
      // Add first row highlight
      const firstRow = data.rows[0];
      const keys = Object.keys(firstRow);
      if (keys.length >= 2) {
        narrative += `Top finding: ${keys[0]} is ${firstRow[keys[0]]}, with ${keys[1]} at ${firstRow[keys[1]]}. `;
      }
    }
    
    if (explanation?.summary) {
      narrative += explanation.summary;
    }
    return narrative;
  };

  const handleToggleSpeak = () => {
    if (!supported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const textToSpeak = generateNarrativeText();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!queryResponse || !queryResponse.data || queryResponse.data.row_count === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md backdrop-blur">
      <div className="flex items-center space-x-3">
        <button
          onClick={handleToggleSpeak}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
            isPlaying
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/25 animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
          }`}
          title="Narrate findings with AI Voice"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Stop Voice Narration</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Read Insights Aloud (TTS)</span>
            </>
          )}
        </button>

        <span className="text-xs text-slate-400 hidden sm:inline">
          Converts query output & summary into natural spoken audio.
        </span>
      </div>

      {isPlaying && (
        <VoicePulseVisualizer isSpeaking={true} label="Speaking Analytics Briefing..." />
      )}
    </div>
  );
}

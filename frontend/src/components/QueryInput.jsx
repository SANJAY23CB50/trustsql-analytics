import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, CornerDownLeft, Zap, Mic, Upload } from 'lucide-react';

export default function QueryInput({
  query,
  setQuery,
  onExecute,
  isLoading,
  sampleCategories,
  provider,
  setProvider,
  onOpenVoiceModal,
  onOpenFileUpload
}) {
  const [selectedCategory, setSelectedCategory] = useState(0);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query.trim() && !isLoading) {
        onExecute();
      }
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xl shadow-black/40 backdrop-blur">
      {/* Top bar with quick provider selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">Voice & Natural Language to SQL</span>
          <span className="text-slate-500">• Spoken Voice / Text / File Upload → AST-Verified SQL</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400 text-[11px]">AI Model:</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
          >
            <option value="gemini">Gemini 1.5 Flash (Voice & Multimodal)</option>
            <option value="openai">OpenAI GPT-4o-Mini</option>
            <option value="heuristic">Smart Local Semantic Engine</option>
          </select>
        </div>
      </div>

      {/* Main Natural Language & Voice Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5 text-indigo-400" />
        </div>
        <textarea
          rows={2}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Speak into microphone, upload a file, or ask in English (e.g. 'What is our total revenue and average order value?')"
          className="w-full pl-12 pr-56 py-3.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none font-sans"
        />

        {/* Right side controls: Upload + Voice Mic + Run Query */}
        <div className="absolute right-2.5 bottom-3 flex items-center space-x-2">
          {/* File Upload Button */}
          <button
            type="button"
            onClick={onOpenFileUpload}
            className="flex items-center space-x-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all shadow-sm"
            title="Upload audio, CSV dataset, or SQLite DB file"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Upload</span>
          </button>

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/70 text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95"
            title="Speak your question using microphone"
          >
            <Mic className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="hidden sm:inline">Voice</span>
          </button>

          {/* Run Query Button */}
          <button
            onClick={() => onExecute()}
            disabled={!query.trim() || isLoading}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg font-medium text-xs transition-all shadow-md ${
              query.trim() && !isLoading
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-indigo-500/25 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Run</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sample Query Suggestions */}
      {sampleCategories && sampleCategories.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Suggested Spoken Analytical Questions:</span>
            </div>
            {/* Category tabs */}
            <div className="flex space-x-1 overflow-x-auto pb-1 max-w-[60%] scrollbar-none">
              {sampleCategories.map((cat, idx) => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(idx)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all shrink-0 ${
                    selectedCategory === idx
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sampleCategories[selectedCategory]?.questions.map((sampleQ, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(sampleQ);
                  onExecute(sampleQ);
                }}
                className="text-left px-3 py-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
              >
                <span className="truncate pr-2">{sampleQ}</span>
                <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

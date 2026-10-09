import React, { useState } from 'react';
import { X, Database, Key, Check, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  onConnectCustomDb,
  onResetDb,
  apiKey,
  setApiKey,
  dialect
}) {
  const [dbUrl, setDbUrl] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!dbUrl.trim()) return;
    setIsConnecting(true);
    setStatusMsg(null);
    try {
      const res = await onConnectCustomDb(dbUrl.trim());
      setStatusMsg({ type: res.success ? 'success' : 'error', text: res.message });
    } catch (e) {
      setStatusMsg({ type: 'error', text: String(e) });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleReset = async () => {
    setIsConnecting(true);
    try {
      await onResetDb();
      setDbUrl('');
      setStatusMsg({ type: 'success', text: 'Database reset to default sample e-commerce store.' });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
              Configuration & Database Connection
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* PostgreSQL Connection Section */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Custom Database Connection URL</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Current: {dialect.toUpperCase()}</span>
            </label>
            <input
              type="text"
              placeholder="postgresql://user:password@localhost:5432/analytics_db"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={handleConnect}
                disabled={isConnecting || !dbUrl.trim()}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium rounded-lg transition-all text-xs"
              >
                {isConnecting ? 'Connecting...' : 'Connect to Database'}
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-xs flex items-center space-x-1"
                title="Reset to default SQLite sample DB"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Default</span>
              </button>
            </div>
          </div>

          {/* API Key Section */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <label className="font-semibold text-slate-200 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>LLM API Key (Optional)</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Enter your Gemini or OpenAI API Key. If left blank, the built-in smart semantic heuristic engine is used automatically.
            </p>
            <input
              type="password"
              placeholder="AIzaSy... / sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-lg flex items-center space-x-2 text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

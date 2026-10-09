import React, { useState } from 'react';
import { X, Upload, FileText, FileAudio, Database, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function FileUploadModal({
  isOpen,
  onClose,
  onTranscriptReady,
  onSchemaUpdated
}) {
  const [activeType, setActiveType] = useState('audio'); // 'audio' | 'csv' | 'db'
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setStatusMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      if (activeType === 'audio') {
        const res = await fetch('http://localhost:8000/api/audio/transcribe', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatusMsg({ type: 'success', text: `Audio transcribed: "${data.transcript}"` });
          setTimeout(() => {
            onTranscriptReady(data.transcript);
            onClose();
          }, 1000);
        } else {
          setStatusMsg({ type: 'error', text: data.detail || 'Audio transcription failed.' });
        }
      } else if (activeType === 'csv') {
        const res = await fetch('http://localhost:8000/api/upload/csv', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatusMsg({ type: 'success', text: data.message });
          if (onSchemaUpdated) onSchemaUpdated(data.schema);
        } else {
          setStatusMsg({ type: 'error', text: data.detail || 'CSV upload failed.' });
        }
      } else if (activeType === 'db') {
        const res = await fetch('http://localhost:8000/api/upload/sqlite-db', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatusMsg({ type: 'success', text: data.message });
          if (onSchemaUpdated) onSchemaUpdated(data.schema);
        } else {
          setStatusMsg({ type: 'error', text: data.detail || 'Database file upload failed.' });
        }
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Upload error: ${err.message}` });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
              Universal File Upload Center
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Type Tabs */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex space-x-2">
          <button
            onClick={() => { setActiveType('audio'); setSelectedFile(null); setStatusMsg(null); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              activeType === 'audio'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            <span>Voice Audio (.wav/.mp3)</span>
          </button>

          <button
            onClick={() => { setActiveType('csv'); setSelectedFile(null); setStatusMsg(null); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              activeType === 'csv'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>CSV Dataset (.csv)</span>
          </button>

          <button
            onClick={() => { setActiveType('db'); setSelectedFile(null); setStatusMsg(null); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              activeType === 'db'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>SQLite DB (.db)</span>
          </button>
        </div>

        {/* Modal Body / Dropzone */}
        <div className="p-6 space-y-4">
          <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/70 bg-slate-950/80 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 transition-all group-hover:scale-110">
              {activeType === 'audio' ? (
                <FileAudio className="w-6 h-6" />
              ) : activeType === 'csv' ? (
                <FileText className="w-6 h-6" />
              ) : (
                <Database className="w-6 h-6" />
              )}
            </div>

            <p className="text-xs font-semibold text-slate-200 mb-1">
              {selectedFile ? selectedFile.name : `Click to select or drag & drop ${activeType.toUpperCase()} file`}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              {activeType === 'audio' && 'Supports .wav, .mp3, .webm, .m4a, .ogg'}
              {activeType === 'csv' && 'Auto-infers schema & creates SQL table'}
              {activeType === 'db' && 'Loads full SQLite relational database file'}
            </p>

            <input
              type="file"
              accept={
                activeType === 'audio'
                  ? 'audio/*'
                  : activeType === 'csv'
                  ? '.csv'
                  : '.db,.sqlite'
              }
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {/* Action Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg flex items-center justify-center space-x-2 ${
              selectedFile && !isUploading
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-indigo-500/25 active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing & Importing...</span>
              </>
            ) : (
              <>
                <span>Upload & Process File</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Status Alert */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl flex items-center space-x-2 text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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

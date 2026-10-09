import React from 'react';
import { Download, Maximize2, X, Play, Upload } from 'lucide-react';

export default function TrustNavbar({
  onRunQuery,
  onOpenUpload,
  onExportCSV,
  isLoading
}) {
  return (
    <header className="h-12 px-4 flex items-center justify-between bg-white border-b border-slate-200 select-none">
      {/* Left: TrustSQL Logo + Run + Upload Database */}
      <div className="flex items-center space-x-3">
        <h1 className="text-base font-bold text-[#006677] tracking-tight mr-1">
          TrustSQL
        </h1>

        {/* Run Button */}
        <button
          onClick={onRunQuery}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#007b88] hover:bg-[#006677] text-white rounded font-semibold text-xs transition-colors shadow-xs active:scale-95 disabled:opacity-60"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{isLoading ? 'Running...' : 'Run'}</span>
        </button>

        {/* Divider */}
        <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>

        {/* Upload database Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded font-normal text-xs transition-colors shadow-xs"
        >
          <Upload className="w-3.5 h-3.5 text-slate-600 stroke-[2]" />
          <span>Upload database</span>
        </button>
      </div>

      {/* Right: Export + Fullscreen + Close */}
      <div className="flex items-center space-x-2">
        {/* Export Button */}
        <button
          onClick={onExportCSV}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-black hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        {/* Fullscreen Icon */}
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Close Icon */}
        <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400">
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

import React from 'react';

export default function TrustSQLEditor({
  sql,
  onChangeSql
}) {
  const lines = (sql || '').split('\n');

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      <div className="flex font-mono text-xs leading-6">
        {/* Line Numbers Gutter */}
        <div className="bg-[#fcfdfe] border-r border-slate-100 px-2.5 py-2 text-right text-slate-400 select-none shrink-0 min-w-[32px]">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* SQL Code Textarea / Viewer */}
        <div className="flex-1 p-2 bg-white relative">
          <textarea
            value={sql}
            onChange={(e) => onChangeSql(e.target.value)}
            rows={Math.max(lines.length, 5)}
            className="w-full h-full bg-transparent font-mono text-xs text-slate-800 focus:outline-none resize-none leading-6 tracking-normal"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

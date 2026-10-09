import React from 'react';
import { Folder } from 'lucide-react';

export default function TrustNavigatorSidebar({
  schema,
  onSelectTable,
  activeTable
}) {
  const tables = ['customers', 'orders', 'order_items', 'products'];

  return (
    <aside className="w-56 bg-[#f8fafc] border-r border-slate-200 flex flex-col shrink-0 select-none text-xs">
      {/* Navigator Header */}
      <div className="px-3 py-2 border-b border-slate-200 bg-[#eef2f6] text-[11px] font-bold text-slate-600 uppercase tracking-wide">
        NAVIGATOR - SCHEMAS
      </div>

      {/* Schema Navigation */}
      <div className="p-3 space-y-2 overflow-y-auto flex-1 font-sans">
        {/* sales_db Database node */}
        <div className="flex items-center space-x-1.5 text-slate-800 font-semibold text-xs">
          <span className="text-slate-400 font-normal text-[10px] mr-0.5"></span>
          <Folder className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
          <span>sales_db</span>
        </div>

        {/* Table list */}
        <div className="pl-4 space-y-1.5">
          {tables.map((tblName) => {
            const isSelected = activeTable === tblName;
            return (
              <button
                key={tblName}
                onClick={() => onSelectTable(tblName)}
                className={`w-full text-left flex items-center space-x-2 py-0.5 px-1 rounded transition-colors ${
                  isSelected
                    ? 'text-teal-900 font-medium'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {/* Blue Table Grid Icon */}
                <div className="w-3.5 h-3.5 border border-[#007b88] rounded-[2px] grid grid-cols-2 grid-rows-2 gap-[1px] p-[1px] shrink-0 bg-white">
                  <div className="bg-[#007b88] rounded-[0.5px]"></div>
                  <div className="bg-[#007b88] rounded-[0.5px]"></div>
                  <div className="bg-[#007b88] rounded-[0.5px]"></div>
                  <div className="bg-[#007b88] rounded-[0.5px]"></div>
                </div>
                <span className="truncate text-xs">{tblName}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

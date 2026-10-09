import React, { useState } from 'react';
import { X, Database, Key, Link2, Table, Eye, Layers, ChevronRight } from 'lucide-react';

export default function SchemaExplorerModal({
  isOpen,
  onClose,
  schema
}) {
  const [selectedTable, setSelectedTable] = useState(null);

  if (!isOpen || !schema) return null;

  const tableNames = Object.keys(schema.tables || {});
  const activeTable = selectedTable || tableNames[0];
  const tableData = schema.tables?.[activeTable];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
              Database Schema & Relationship Explorer
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
              {schema.dialect?.toUpperCase()} • {tableNames.length} Tables
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Table List Sidebar */}
          <div className="w-full md:w-64 border-r border-slate-800 bg-slate-950/40 p-3 overflow-y-auto space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Database Tables
            </p>
            {tableNames.map((tbl) => {
              const info = schema.tables[tbl];
              const isSelected = tbl === activeTable;
              return (
                <button
                  key={tbl}
                  onClick={() => setSelectedTable(tbl)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-medium shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Table className="w-3.5 h-3.5 opacity-70" />
                    <span className="truncate">{tbl}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {info.row_count}
                  </span>
                </button>
              );
            })}

            {/* Relationships Graph summary */}
            {schema.relationships && schema.relationships.length > 0 && (
              <div className="pt-4 mt-4 border-t border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center space-x-1">
                  <Link2 className="w-3 h-3 text-indigo-400" />
                  <span>Foreign Keys ({schema.relationships.length})</span>
                </p>
                <div className="space-y-1.5 px-2 text-[11px] text-slate-400">
                  {schema.relationships.map((rel, rIdx) => (
                    <div key={rIdx} className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                      <span className="text-indigo-300 font-mono">{rel.from_table}.{rel.from_column}</span>
                      <span className="text-slate-600 mx-1">→</span>
                      <span className="text-emerald-300 font-mono">{rel.to_table}.{rel.to_column}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Table Details */}
          <div className="flex-1 p-5 overflow-y-auto space-y-6">
            {tableData && (
              <>
                {/* Table Header Info */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                      <span>Table:</span>
                      <span className="text-indigo-400 font-mono">{tableData.name}</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Contains {tableData.columns.length} columns and {tableData.row_count} records
                    </p>
                  </div>
                </div>

                {/* Columns Definition Grid */}
                <div>
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                    Columns & Data Types
                  </h5>
                  <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                          <th className="p-3">Column Name</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Key Attributes</th>
                          <th className="p-3">Nullable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70 font-mono">
                        {tableData.columns.map((col) => (
                          <tr key={col.name} className="hover:bg-slate-900/40">
                            <td className="p-3 text-slate-200 font-medium flex items-center space-x-1.5">
                              {col.is_primary_key && (
                                <span title="Primary Key">
                                  <Key className="w-3.5 h-3.5 text-amber-400" />
                                </span>
                              )}
                              <span>{col.name}</span>
                            </td>
                            <td className="p-3 text-indigo-300">{col.type}</td>
                            <td className="p-3">
                              {col.foreign_key ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                                  <Link2 className="w-2.5 h-2.5" />
                                  <span>FK → {col.foreign_key.referred_table}({col.foreign_key.referred_column})</span>
                                </span>
                              ) : col.is_primary_key ? (
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                                  PRIMARY KEY
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">—</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-400">
                              {col.nullable ? 'YES' : 'NO'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sample Rows Preview */}
                {tableData.sample_rows && tableData.sample_rows.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Sample Records Preview</span>
                    </h5>
                    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                            {tableData.columns.map((c) => (
                              <th key={c.name} className="p-2.5 whitespace-nowrap">{c.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {tableData.sample_rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-900/40">
                              {tableData.columns.map((c) => (
                                <td key={c.name} className="p-2.5 text-slate-300 whitespace-nowrap">
                                  {String(row[c.name] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

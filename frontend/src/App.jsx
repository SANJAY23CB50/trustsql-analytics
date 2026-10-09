import React, { useState, useEffect } from 'react';
import TrustNavbar from './components/TrustNavbar';
import TrustNavigatorSidebar from './components/TrustNavigatorSidebar';
import TrustVoiceMicBanner from './components/TrustVoiceMicBanner';
import TrustSQLEditor from './components/TrustSQLEditor';
import TrustResultGrid from './components/TrustResultGrid';
import TrustActionOutput from './components/TrustActionOutput';

import FileUploadModal from './components/FileUploadModal';
import SchemaExplorerModal from './components/SchemaExplorerModal';
import BenchmarkRunnerModal from './components/BenchmarkRunnerModal';
import SettingsModal from './components/SettingsModal';

const API_BASE = 'http://localhost:8000/api';

const DEFAULT_SQL = `SELECT SUM(total_amount) AS total_revenue,
       COUNT(*) AS total_orders,
       ROUND(AVG(total_amount), 2) AS avg_order_value
FROM orders
LIMIT 1000;`;

export default function App() {
  const [question, setQuestion] = useState('What is our total revenue and overall average order value?');
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [isLoading, setIsLoading] = useState(false);
  const [dialect, setDialect] = useState('sqlite');
  const [schema, setSchema] = useState(null);
  const [activeTable, setActiveTable] = useState('orders');

  // Query execution results
  const [queryResponse, setQueryResponse] = useState(null);
  const [logs, setLogs] = useState([]);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Benchmark results
  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [isBenchmarkRunning, setIsBenchmarkRunning] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Initial load
  useEffect(() => {
    fetchSchema();
    // Run initial default query
    handleGenerateAndExecute('What is our total revenue and overall average order value?');
  }, []);

  const fetchSchema = async () => {
    try {
      const res = await fetch(`${API_BASE}/schema`);
      if (res.ok) {
        const data = await res.json();
        setSchema(data);
        setDialect(data.dialect || 'sqlite');
      }
    } catch (err) {
      console.error('Failed to load schema', err);
    }
  };

  const handleGenerateAndExecute = async (questionText) => {
    const prompt = questionText || question;
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/query/generate-and-execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          provider: 'gemini',
          api_key: apiKey || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setQueryResponse(data);
        setSql(data.generated_sql);
        
        // Add log entry to Action Output
        const newLog = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: data.generated_sql.replace(/\s+/g, ' ').slice(0, 75) + '...',
          message: `${data.data?.row_count ?? 1} row(s) returned`,
          success: true
        };
        setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
      } else {
        const errorLog = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: prompt,
          message: data.message || 'Execution error',
          success: false
        };
        setLogs((prev) => [errorLog, ...prev.slice(0, 19)]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunCustomSql = async () => {
    if (!sql.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/query/execute-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql })
      });
      const data = await res.json();
      if (data.success) {
        setQueryResponse((prev) => ({
          ...prev,
          data: data.data,
          explanation: data.explanation,
          visualization: data.visualization
        }));
        const newLog = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: sql.replace(/\s+/g, ' ').slice(0, 75) + '...',
          message: `${data.data?.row_count ?? 0} row(s) returned`,
          success: true
        };
        setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
      } else {
        const errorLog = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: sql.slice(0, 50),
          message: data.message || 'SQL Error',
          success: false
        };
        setLogs((prev) => [errorLog, ...prev.slice(0, 19)]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBenchmark = async () => {
    setIsBenchmarkRunning(true);
    try {
      const res = await fetch(`${API_BASE}/benchmark/run`, { method: 'POST' });
      const data = await res.json();
      setBenchmarkResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBenchmarkRunning(false);
    }
  };

  const handleExportCSV = () => {
    const rows = queryResponse?.data?.rows;
    const columns = queryResponse?.data?.columns;
    if (!rows || !columns) return;

    const header = columns.join(',');
    const csvRows = rows.map((r) => columns.map((c) => JSON.stringify(r[c] ?? '')).join(','));
    const blob = new Blob([[header, ...csvRows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustsql_export_${Date.now()}.csv`;
    a.click();
  };

  const handleExportJSON = () => {
    const rows = queryResponse?.data?.rows;
    if (!rows) return;
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustsql_export_${Date.now()}.json`;
    a.click();
  };

  const handleExportSQL = () => {
    navigator.clipboard.writeText(sql);
    alert('SQL copied to clipboard!');
  };

  const handleSelectTable = (tblName) => {
    setActiveTable(tblName);
    const quickQuery = `SELECT * FROM ${tblName} LIMIT 100;`;
    setSql(quickQuery);
    setQuestion(`Show records from ${tblName} table`);
    handleRunCustomSql();
  };

  const handleTranscript = (transcriptText) => {
    setQuestion(transcriptText);
    handleGenerateAndExecute(transcriptText);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-800 flex flex-col font-sans">
      {/* Top Application Navbar */}
      <TrustNavbar
        dialect={dialect}
        onRunQuery={handleRunCustomSql}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSchema={() => setIsSchemaOpen(true)}
        onOpenBenchmark={() => {
          setIsBenchmarkOpen(true);
          if (!benchmarkResults) handleRunBenchmark();
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onExportSQL={handleExportSQL}
        isLoading={isLoading}
      />

      {/* Main Two-Column Workbench Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: NAVIGATOR - SCHEMAS */}
        <TrustNavigatorSidebar
          schema={schema}
          onSelectTable={handleSelectTable}
          activeTable={activeTable}
        />

        {/* Right Main Content Area */}
        <main className="flex-1 p-4 space-y-3.5 overflow-y-auto max-w-[calc(100vw-16rem)]">
          {/* 1. Voice Microphone Banner */}
          <TrustVoiceMicBanner onTranscriptReceived={handleTranscript} />

          {/* 2. Question Input Box */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerateAndExecute(question);
              }}
              placeholder="What is our total revenue and overall average order value?"
              className="w-full text-xs text-slate-800 focus:outline-none placeholder-slate-400 bg-transparent font-normal"
            />
          </div>

          {/* 3. Numbered SQL Query Editor */}
          <TrustSQLEditor
            sql={sql}
            onChangeSql={(val) => setSql(val)}
          />

          {/* 4. Result Grid & Visual Analytics Tabs */}
          <TrustResultGrid
            data={queryResponse?.data}
            explanation={queryResponse?.explanation}
            visualization={queryResponse?.visualization}
            ambiguityReport={queryResponse?.ambiguity_report}
            queryResponse={queryResponse}
          />

          {/* 5. Action Output Log Panel */}
          <TrustActionOutput logs={logs} />
        </main>
      </div>

      {/* Modals */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onTranscriptReady={handleTranscript}
        onSchemaUpdated={(newSchema) => {
          setSchema(newSchema);
          fetchSchema();
        }}
      />

      <SchemaExplorerModal
        isOpen={isSchemaOpen}
        onClose={() => setIsSchemaOpen(false)}
        schema={schema}
      />

      <BenchmarkRunnerModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        onRunBenchmark={handleRunBenchmark}
        benchmarkResults={benchmarkResults}
        isRunning={isBenchmarkRunning}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConnectCustomDb={async (url) => {
          const res = await fetch(`${API_BASE}/database/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connection_url: url })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setSchema(data.schema);
            setDialect(data.dialect);
            return { success: true, message: data.message };
          }
          return { success: false, message: data.detail || 'Failed' };
        }}
        onResetDb={async () => {
          const res = await fetch(`${API_BASE}/database/reset`, { method: 'POST' });
          const data = await res.json();
          if (res.ok && data.success) {
            setSchema(data.schema);
            setDialect(data.dialect);
          }
        }}
        apiKey={apiKey}
        setApiKey={setApiKey}
        dialect={dialect}
      />
    </div>
  );
}

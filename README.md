# QueryCraft AI — Natural Language to SQL Analytics Platform

An enterprise-grade analytics platform that converts plain English business questions into secure, optimized SQL queries, executes them against relational databases in a sandboxed read-only environment, and renders interactive visual analytics.

---

## 🎙️ Voice & Audio-to-Code-to-SQL Pipeline

The platform now features a complete **Voice-to-Speech-to-Code-to-SQL** processing lifecycle:
1. 🎙️ **Voice / Audio Capture**: Live browser microphone recording with real-time waveform visualizers + file upload support (`.wav`, `.mp3`, `.webm`).
2. 📝 **Speech-to-Text & Entity Parsing**: Streaming transcription with intent recognition & business keyword extraction.
3. 🧠 **Dynamic Schema Coding & SQL Generation**: Schema graph traversal matching tables and relational foreign keys.
4. 🛡️ **AST Safety Guardrails**: Strict read-only enforcement, injection protection, and `LIMIT` capping.
5. 📊 **Interactive Analytics & Voice Narration (TTS)**: Dynamic Recharts visual analytics + AI voice readout that speaks the analytical briefing aloud.

### 2. AST Safety Guardrails & Defense Engine
- **Strict Read-Only Enforcement**: Deep AST parsing using `sqlglot` and `sqlparse`.
- **Destructive Query Blocking**: Explicitly detects and rejects DDL (`DROP`, `ALTER`, `CREATE`, `TRUNCATE`) and DML (`INSERT`, `UPDATE`, `DELETE`, `MERGE`, `REPLACE`).
- **Stacked Query / Injection Prevention**: Blocks multi-statement injection attempts (e.g. `; DROP TABLE...`).
- **Dangerous System Function Neutralization**: Blocks system-level commands and sleep functions (`pg_sleep`, `xp_cmdshell`, file reads).
- **Query Limit Enforcer**: Automatically injects a safe `LIMIT 100` if missing and caps any limit to a maximum of 500 rows.
- **Read-Only Transaction Isolation & Timeouts**: Sandboxed query execution with timeout controls.

### 3. Ambiguity Resolution & Interactive Clarifications
- Detects ambiguous business terminology (e.g., *"top customers"*, *"best products"*, *"active users"*, *"recent sales"*).
- Displays explicit AI assumptions made, confidence ratings, and interactive clarification buttons to refine the prompt.

### 4. Automated Visual Analytics & Data Exploration
- **Auto-Recommended Visualizations**: Analyzes query result dimensions and datatypes:
  - **KPI Cards**: Single metrics (Revenue, AOV, Totals).
  - **Bar Charts**: Categorical comparisons.
  - **Line & Area Charts**: Time-series trends (Monthly/Daily).
  - **Pie / Donut Charts**: Proportional distribution.
  - **Interactive Data Table**: Searchable, sortable, paginated grid with CSV and JSON exports.
- **Live SQL Editor**: In-place query editor to tweak and run custom SQL safely.

### 5. Automated Correctness & Safety Benchmark Suite
- Includes an automated test suite evaluating **16 comprehensive test cases**:
  - Correctness test cases across analytical aggregations & joins.
  - Ambiguity detection & assumption generation test cases.
  - Security guardrail attack prevention test cases (`DROP`, `UPDATE`, `DELETE`, `TRUNCATE`, Stacked statements).
- Achieves **100% Pass Rate**.

---

## 🗄️ Database Schemas Supported

- **Bundled Out-of-the-box Analytics Database (SQLite)**:
  - `customers`: ID, names, email, city, country, segment (Enterprise, SMB, Consumer), LTV, created_at.
  - `products`: ID, name, category, price, cost, stock, rating.
  - `orders`: ID, customer_id, sales_rep_id, order_date, status, total_amount, shipping_fee, discount, payment_method.
  - `order_items`: ID, order_id, product_id, quantity, unit_price, total_price.
  - `subscriptions`: ID, customer_id, plan_name, MRR, status, billing_cycle, renewal_date.
  - `support_tickets`: ID, customer_id, subject, priority, status, satisfaction_score, created_at.
  - `sales_reps`: ID, name, region, quota, commission_rate.
  - `reviews`: ID, product_id, customer_id, rating, review_text.
- **Custom PostgreSQL Support**: Dynamic connection string switcher (`postgresql://user:password@host:port/dbname`).

---

## 🚀 Quickstart Guide

### 1. Launch Platform with One Command
```bash
python run_platform.py
```
This automatically starts:
- **FastAPI Backend**: `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`)
- **React Dashboard**: `http://localhost:5173`

---

## 📂 Project Structure
```
nl_sql_analytics_platform/
├── backend/
│   ├── main.py                      # FastAPI App entrypoint
│   ├── database/
│   │   ├── connection.py            # Connection engine & read-only executor
│   │   ├── schema_inspector.py      # Schema introspection & relationship graphs
│   │   └── seed_data.py             # Realistic enterprise database seeder
│   ├── safety/
│   │   ├── validator.py             # AST-level SQL safety guardrails & injection defense
│   │   └── limit_enforcer.py        # Safe LIMIT capping & injection
│   ├── nl_engine/
│   │   ├── llm_client.py            # Gemini, OpenAI & Smart heuristic engine
│   │   ├── ambiguity_detector.py    # Ambiguity detection & interactive clarifications
│   │   └── query_explainer.py       # Plain English step-by-step SQL breakdown
│   ├── analytics/
│   │   └── visualizer.py            # Result pattern analysis & chart recommendation
│   ├── benchmarks/
│   │   └── test_suite.py            # 16-case Correctness & Security benchmark suite
│   └── routes/
│       ├── query_routes.py          # /api/query/* endpoints
│       ├── schema_routes.py         # /api/schema & /api/database/* endpoints
│       └── benchmark_routes.py      # /api/benchmark/run endpoint
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Master dashboard coordinator
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # App navigation & status indicators
│   │   │   ├── QueryInput.jsx       # Natural language search bar & suggestions
│   │   │   ├── AmbiguityBanner.jsx  # Interactive assumptions & clarification chips
│   │   │   ├── VisualizationView.jsx# Interactive Recharts (KPI, Bar, Line, Area, Pie)
│   │   │   ├── DataTable.jsx        # Sortable, searchable table with CSV/JSON export
│   │   │   ├── SQLEditor.jsx        # SQL inspector with AST verification badge
│   │   │   ├── QueryExplainer.jsx   # Plain English clause explainer
│   │   │   ├── SchemaExplorerModal.jsx # Schema & FK relationship explorer
│   │   │   ├── BenchmarkRunnerModal.jsx# Test runner scorecard modal
│   │   │   ├── SettingsModal.jsx    # PostgreSQL connection & API key configuration
│   │   │   └── HistoryDrawer.jsx    # Session query history drawer
│   │   ├── index.css                # Tailwind styling
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── run_platform.py                  # One-click dual server startup script
```

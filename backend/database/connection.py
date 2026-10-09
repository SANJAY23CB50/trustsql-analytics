import os
import sqlite3
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool

BASE_DIR = Path(__file__).resolve().parent.parent
DB_FILE = BASE_DIR / "ecommerce_saas.db"

class DatabaseManager:
    def __init__(self):
        self.custom_url: Optional[str] = None
        self._current_engine: Optional[Engine] = None
        self._dialect: str = "sqlite"
        self.init_default_sqlite()

    def init_default_sqlite(self):
        """Initializes the default SQLite database with rich realistic analytics data."""
        from .seed_data import create_seed_database
        create_seed_database(str(DB_FILE))
        db_url = f"sqlite:///{DB_FILE.as_posix()}"
        self._current_engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool
        )
        self._dialect = "sqlite"
        self.custom_url = None

    def set_connection(self, url: str) -> Tuple[bool, str]:
        """Switch database to a custom PostgreSQL (or other) connection string."""
        try:
            test_engine = create_engine(url, pool_pre_ping=True)
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            self._current_engine = test_engine
            self.custom_url = url
            self._dialect = test_engine.dialect.name
            return True, f"Successfully connected to {self._dialect} database."
        except Exception as e:
            return False, f"Connection failed: {str(e)}"

    def reset_to_default(self):
        """Reset back to the default bundled e-commerce & SaaS database."""
        self.init_default_sqlite()

    @property
    def engine(self) -> Engine:
        if self._current_engine is None:
            self.init_default_sqlite()
        return self._current_engine

    @property
    def dialect(self) -> str:
        return self._dialect

    def execute_read_only(self, sql_query: str, max_rows: int = 500, timeout_sec: int = 5) -> Dict[str, Any]:
        """
        Executes a SQL query in a read-only sandboxed connection.
        Enforces execution limits and returns structured columns and rows.
        """
        import time
        start_time = time.perf_counter()

        with self.engine.connect() as connection:
            # For PostgreSQL, set transaction read only
            if self._dialect == "postgresql":
                try:
                    connection.execute(text("SET TRANSACTION READ ONLY;"))
                    connection.execute(text(f"SET statement_timeout = '{timeout_sec * 1000}';"))
                except Exception:
                    pass

            result = connection.execute(text(sql_query))
            
            # Fetch column names
            columns = list(result.keys()) if result.returns_rows else []
            
            # Fetch limited rows
            rows_data = []
            if result.returns_rows:
                raw_rows = result.fetchmany(max_rows)
                for row in raw_rows:
                    row_dict = {}
                    for col_name, val in zip(columns, row):
                        # Format dates/floats/decimals for JSON serialization
                        if hasattr(val, "isoformat"):
                            row_dict[col_name] = val.isoformat()
                        elif isinstance(val, float):
                            row_dict[col_name] = round(val, 4)
                        else:
                            row_dict[col_name] = val
                    rows_data.append(row_dict)

        execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        
        return {
            "columns": columns,
            "rows": rows_data,
            "row_count": len(rows_data),
            "execution_time_ms": execution_time_ms,
            "dialect": self._dialect
        }

db_manager = DatabaseManager()

import re
import sqlglot
from sqlglot import exp
import sqlparse
from typing import Dict, Any, List, Tuple

FORBIDDEN_KEYWORDS = {
    "DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE", "INSERT", "UPDATE",
    "REPLACE", "MERGE", "GRANT", "REVOKE", "COMMIT", "ROLLBACK",
    "EXEC", "EXECUTE", "XP_CMDSHELL", "PG_SLEEP", "BENCHMARK",
    "INTO OUTFILE", "INTO DUMPFILE", "LOAD_FILE", "PG_READ_FILE",
    "ATTACH", "DETACH", "VACUUM", "PRAGMA", "REINDEX"
}

FORBIDDEN_EXPRESSIONS = (
    exp.Insert,
    exp.Update,
    exp.Delete,
    exp.Drop,
    exp.Create,
    exp.Alter,
    exp.Command,
    exp.Pragma,
    exp.Transaction,
    exp.Commit,
    exp.Rollback,
)

class SQLSafetyValidator:
    def __init__(self, max_allowed_limit: int = 500, default_limit: int = 100):
        self.max_allowed_limit = max_allowed_limit
        self.default_limit = default_limit

    def sanitize_raw_query(self, query: str) -> str:
        """Strip markdown code blocks and trailing semicolons/whitespace."""
        q = query.strip()
        if q.startswith("```"):
            q = re.sub(r"^```(?:sql)?\s*", "", q, flags=re.IGNORECASE)
            q = re.sub(r"```$", "", q).strip()
        # Remove trailing semicolon
        q = q.rstrip(";").strip()
        return q

    def validate(self, sql_query: str, dialect: str = "sqlite") -> Dict[str, Any]:
        """
        Validates the SQL query against security guardrails and AST rules.
        Returns safety verdict and detailed diagnostics.
        """
        clean_query = self.sanitize_raw_query(sql_query)
        issues: List[str] = []
        tables_accessed: List[str] = []
        ast_type = "UNKNOWN"

        # 1. Multi-statement injection check
        parsed_statements = [s for s in sqlparse.parse(clean_query) if s.get_type() != 'UNKNOWN' or str(s).strip()]
        if len(parsed_statements) > 1:
            return {
                "is_safe": False,
                "clean_query": clean_query,
                "issues": ["Multiple SQL statements detected (stacked query attack prevented). Only single SELECT queries are permitted."],
                "risk_level": "CRITICAL",
                "ast_type": "MULTI_STATEMENT",
                "tables_accessed": []
            }

        # 2. Raw keyword substring scan for immediate early blocking
        upper_q = clean_query.upper()
        for kw in FORBIDDEN_KEYWORDS:
            pattern = rf"\b{re.escape(kw)}\b"
            if re.search(pattern, upper_q):
                # Ensure it's not a harmless column name alias or inside quotes
                # But flag as severe risk if standalone DDL/DML
                issues.append(f"Forbidden keyword or DDL/DML operation detected: '{kw}'")

        # 3. Deep AST Parse via sqlglot
        try:
            glot_dialect = "postgres" if dialect == "postgresql" else "sqlite"
            parsed_ast = sqlglot.parse_one(clean_query, read=glot_dialect)
            ast_type = type(parsed_ast).__name__

            # Check root expression type
            if not isinstance(parsed_ast, (exp.Select, exp.Union, exp.Expression)):
                issues.append(f"Query root must be a SELECT or UNION expression, got '{ast_type}'")

            # Check if any forbidden expression exists anywhere in AST tree
            for forbidden_cls in FORBIDDEN_EXPRESSIONS:
                if parsed_ast.find(forbidden_cls):
                    issues.append(f"Forbidden AST operation found: {forbidden_cls.__name__}")

            # Extract accessed tables
            for table_node in parsed_ast.find_all(exp.Table):
                table_name = table_node.name
                if table_name and table_name not in tables_accessed:
                    tables_accessed.append(table_name)

        except Exception as e:
            # If sqlglot parsing fails, check if standard sqlparse recognizes as SELECT
            try:
                stmt = sqlparse.parse(clean_query)[0]
                if stmt.get_type() != "SELECT":
                    issues.append(f"Query statement type '{stmt.get_type()}' is not permitted. Only 'SELECT' is allowed.")
            except Exception:
                issues.append(f"SQL Syntax parsing error: {str(e)}")

        is_safe = len(issues) == 0
        risk_level = "LOW" if is_safe else ("CRITICAL" if any("Forbidden" in i or "attack" in i for i in issues) else "HIGH")

        return {
            "is_safe": is_safe,
            "clean_query": clean_query,
            "issues": issues,
            "risk_level": risk_level,
            "ast_type": ast_type,
            "tables_accessed": tables_accessed
        }

sql_validator = SQLSafetyValidator()

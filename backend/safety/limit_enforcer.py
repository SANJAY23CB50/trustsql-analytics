import re
import sqlglot
from sqlglot import exp

DEFAULT_LIMIT = 100
MAX_ALLOWED_LIMIT = 500

def enforce_query_limits(sql_query: str, default_limit: int = DEFAULT_LIMIT, max_limit: int = MAX_ALLOWED_LIMIT) -> str:
    """
    Ensures the SQL query contains a safe LIMIT clause.
    - Adds LIMIT default_limit if no limit exists.
    - Clamps limits that exceed max_limit down to max_limit.
    """
    clean_sql = sql_query.strip().rstrip(";")
    
    try:
        parsed = sqlglot.parse_one(clean_sql)
        
        # Check for LIMIT expression
        limit_node = parsed.args.get("limit")
        if limit_node is None:
            # Inject limit
            parsed = parsed.limit(default_limit)
        else:
            # Check existing limit value
            limit_val_str = limit_node.expression.sql()
            try:
                limit_val = int(limit_val_str)
                if limit_val > max_limit or limit_val <= 0:
                    parsed.set("limit", exp.Limit(expression=exp.Literal.number(max_limit)))
            except ValueError:
                # Non-numeric limit or complex expression -> cap it safely
                parsed.set("limit", exp.Limit(expression=exp.Literal.number(max_limit)))

        return parsed.sql(pretty=True)

    except Exception:
        # Fallback regex-based limit enforcer if custom dialect AST parse had minor edge case
        upper = clean_sql.upper()
        limit_match = re.search(r"\bLIMIT\s+(\d+)", clean_sql, flags=re.IGNORECASE)
        if limit_match:
            val = int(limit_match.group(1))
            if val > max_limit:
                return re.sub(r"\bLIMIT\s+\d+", f"LIMIT {max_limit}", clean_sql, flags=re.IGNORECASE)
            return clean_sql
        else:
            return f"{clean_sql} LIMIT {default_limit}"

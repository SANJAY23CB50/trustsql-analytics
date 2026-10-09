import re
import sqlglot
from sqlglot import exp
from typing import Dict, Any, List

def explain_sql_query(sql_query: str) -> Dict[str, Any]:
    """
    Parses a SQL query and provides structured clause-by-clause English explanations.
    """
    clean_sql = sql_query.strip().rstrip(";")
    clauses = []
    summary = "This query retrieves analytics data based on your question."

    try:
        parsed = sqlglot.parse_one(clean_sql)

        # 1. SELECT Clause
        select_expressions = parsed.expressions
        selected_cols = [col.sql() for col in select_expressions]
        clauses.append({
            "clause": "SELECT",
            "sql": ", ".join(selected_cols),
            "explanation": f"Selects and calculates: {', '.join(selected_cols)}"
        })

        # 2. FROM Clause
        from_table = parsed.args.get("from")
        if from_table:
            clauses.append({
                "clause": "FROM",
                "sql": from_table.sql(),
                "explanation": f"Reads base records from the `{from_table.sql()}` table."
            })

        # 3. JOIN Clauses
        joins = parsed.args.get("joins") or []
        for j in joins:
            clauses.append({
                "clause": f"{j.side or 'INNER'} JOIN",
                "sql": j.sql(),
                "explanation": f"Links related data from `{j.this.sql()}` matching on key `{j.args.get('on', '').sql() if j.args.get('on') else ''}`."
            })

        # 4. WHERE Filters
        where_node = parsed.args.get("where")
        if where_node:
            clauses.append({
                "clause": "WHERE",
                "sql": where_node.this.sql(),
                "explanation": f"Filters records where condition holds true: `{where_node.this.sql()}`"
            })

        # 5. GROUP BY
        group_node = parsed.args.get("group")
        if group_node:
            clauses.append({
                "clause": "GROUP BY",
                "sql": group_node.sql(),
                "explanation": f"Aggregates calculations grouped by `{group_node.sql()}`"
            })

        # 6. HAVING
        having_node = parsed.args.get("having")
        if having_node:
            clauses.append({
                "clause": "HAVING",
                "sql": having_node.this.sql(),
                "explanation": f"Filters aggregated groups having `{having_node.this.sql()}`"
            })

        # 7. ORDER BY
        order_node = parsed.args.get("order")
        if order_node:
            clauses.append({
                "clause": "ORDER BY",
                "sql": order_node.sql(),
                "explanation": f"Sorts output results by `{order_node.sql()}`"
            })

        # 8. LIMIT
        limit_node = parsed.args.get("limit")
        if limit_node:
            clauses.append({
                "clause": "LIMIT",
                "sql": limit_node.sql(),
                "explanation": f"Caps the returned rows to a safe maximum of {limit_node.expression.sql()} records."
            })

        summary = f"Executes an analytical aggregation over `{from_table.sql() if from_table else 'tables'}` with {len(clauses)} operations."

    except Exception:
        # Fallback simple explanation
        clauses.append({
            "clause": "QUERY",
            "sql": clean_sql,
            "explanation": "Custom analytical SELECT query structured for read-only evaluation."
        })

    return {
        "summary": summary,
        "clauses": clauses
    }

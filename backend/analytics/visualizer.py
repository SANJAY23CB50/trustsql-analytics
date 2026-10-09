from typing import Dict, Any, List

def recommend_visualization(columns: List[str], rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyzes the query result schema and row values to recommend optimal chart types
    and configuration mappings.
    """
    if not rows or not columns:
        return {
            "recommended_chart": "table",
            "available_charts": ["table"],
            "x_axis": None,
            "y_axis": None,
            "kpi_data": None
        }

    # Case 1: Single KPI / Single Row Single Metric
    if len(rows) == 1 and len(columns) <= 3:
        kpi_metrics = []
        for col in columns:
            val = rows[0][col]
            if isinstance(val, (int, float)):
                kpi_metrics.append({
                    "label": col.replace("_", " ").title(),
                    "value": val,
                    "format": "currency" if any(kw in col.lower() for kw in ["revenue", "sales", "amount", "price", "spent", "value", "mrr", "cost", "profit"]) else ("percentage" if "pct" in col.lower() or "rate" in col.lower() else "number")
                })
        if kpi_metrics:
            return {
                "recommended_chart": "kpi",
                "available_charts": ["kpi", "table"],
                "x_axis": None,
                "y_axis": None,
                "kpi_data": kpi_metrics
            }

    # Inspect column types
    first_row = rows[0]
    string_cols = []
    numeric_cols = []
    date_cols = []

    for col in columns:
        val = first_row.get(col)
        col_lower = col.lower()
        if "date" in col_lower or "month" in col_lower or "year" in col_lower or "day" in col_lower:
            date_cols.append(col)
        elif isinstance(val, (int, float)):
            numeric_cols.append(col)
        elif isinstance(val, str):
            string_cols.append(col)

    # Case 2: Time-series analysis -> Line or Area Chart
    if date_cols and numeric_cols:
        return {
            "recommended_chart": "line",
            "available_charts": ["line", "area", "bar", "table"],
            "x_axis": date_cols[0],
            "y_axis": numeric_cols[0],
            "secondary_metrics": numeric_cols[1:] if len(numeric_cols) > 1 else [],
            "kpi_data": None
        }

    # Case 3: Categorical Breakdown with Few Items (<= 7) -> Pie / Donut or Bar
    if string_cols and numeric_cols:
        x_col = string_cols[0]
        y_col = numeric_cols[0]
        
        if len(rows) <= 7 and not ("id" in x_col.lower() or "name" in x_col.lower() and len(rows) > 5):
            rec = "pie" if len(rows) <= 5 else "bar"
            return {
                "recommended_chart": rec,
                "available_charts": ["pie", "bar", "table"],
                "x_axis": x_col,
                "y_axis": y_col,
                "secondary_metrics": numeric_cols[1:] if len(numeric_cols) > 1 else [],
                "kpi_data": None
            }
        else:
            return {
                "recommended_chart": "bar",
                "available_charts": ["bar", "table", "line"],
                "x_axis": x_col,
                "y_axis": y_col,
                "secondary_metrics": numeric_cols[1:] if len(numeric_cols) > 1 else [],
                "kpi_data": None
            }

    # Default: Table
    return {
        "recommended_chart": "table",
        "available_charts": ["table"],
        "x_axis": columns[0] if columns else None,
        "y_axis": columns[1] if len(columns) > 1 else None,
        "kpi_data": None
    }

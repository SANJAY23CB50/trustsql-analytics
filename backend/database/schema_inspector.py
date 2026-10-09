from typing import Dict, Any, List
from sqlalchemy import inspect, text
from .connection import db_manager

def get_database_schema() -> Dict[str, Any]:
    """
    Introspects the current active database schema and returns structured
    tables, columns, foreign keys, relationships graph, and sample rows.
    """
    engine = db_manager.engine
    inspector = inspect(engine)
    
    schema_info = {
        "dialect": db_manager.dialect,
        "tables": {},
        "relationships": [],
        "total_tables": 0
    }
    
    table_names = inspector.get_table_names()
    schema_info["total_tables"] = len(table_names)
    
    with engine.connect() as conn:
        for table_name in table_names:
            # Columns
            cols = inspector.get_columns(table_name)
            pk_constraint = inspector.get_pk_constraint(table_name)
            pks = pk_constraint.get("constrained_columns", []) if pk_constraint else []
            fks = inspector.get_foreign_keys(table_name)
            
            # Map foreign keys for quick lookup
            fk_map = {}
            for fk in fks:
                for constrained_col, referred_col in zip(fk["constrained_columns"], fk["referred_columns"]):
                    fk_map[constrained_col] = {
                        "referred_table": fk["referred_table"],
                        "referred_column": referred_col
                    }
                    schema_info["relationships"].append({
                        "from_table": table_name,
                        "from_column": constrained_col,
                        "to_table": fk["referred_table"],
                        "to_column": referred_col
                    })

            columns_data = []
            for col in cols:
                col_name = col["name"]
                col_type = str(col["type"])
                columns_data.append({
                    "name": col_name,
                    "type": col_type,
                    "nullable": col.get("nullable", True),
                    "is_primary_key": col_name in pks,
                    "foreign_key": fk_map.get(col_name)
                })

            # Fetch row count
            try:
                count_res = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
            except Exception:
                count_res = 0

            # Fetch 3 sample rows
            sample_rows = []
            try:
                sample_res = conn.execute(text(f"SELECT * FROM {table_name} LIMIT 3"))
                col_keys = list(sample_res.keys())
                for r in sample_res.fetchall():
                    row_dict = {}
                    for k, v in zip(col_keys, r):
                        if hasattr(v, "isoformat"):
                            row_dict[k] = v.isoformat()
                        else:
                            row_dict[k] = v
                    sample_rows.append(row_dict)
            except Exception:
                pass

            schema_info["tables"][table_name] = {
                "name": table_name,
                "columns": columns_data,
                "row_count": count_res,
                "sample_rows": sample_rows
            }

    return schema_info

def get_schema_prompt_string() -> str:
    """Formats the schema into a rich text prompt representation for LLM context."""
    schema = get_database_schema()
    lines = [f"### Database Dialect: {schema['dialect'].upper()}", "### Schema Structure:"]
    
    for table_name, info in schema["tables"].items():
        col_strs = []
        for col in info["columns"]:
            fk_str = f" REFERENCES {col['foreign_key']['referred_table']}({col['foreign_key']['referred_column']})" if col['foreign_key'] else ""
            pk_str = " PRIMARY KEY" if col['is_primary_key'] else ""
            col_strs.append(f"  - {col['name']} ({col['type']}{pk_str}{fk_str})")
        
        lines.append(f"\nTable: {table_name} ({info['row_count']} records)")
        lines.extend(col_strs)
        
        # Sample preview
        if info["sample_rows"]:
            lines.append("  Sample row preview: " + str(info["sample_rows"][0]))

    if schema["relationships"]:
        lines.append("\n### Verified Table Relationships (JOIN Keys):")
        for rel in schema["relationships"]:
            lines.append(f"  - {rel['from_table']}.{rel['from_column']} = {rel['to_table']}.{rel['to_column']}")

    return "\n".join(lines)

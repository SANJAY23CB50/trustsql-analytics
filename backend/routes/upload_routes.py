import os
import shutil
import csv
import io
import re
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
from sqlalchemy import text
from ..database.connection import db_manager, DB_FILE
from ..database.schema_inspector import get_database_schema

router = APIRouter(prefix="/api/upload", tags=["File Uploads"])

def infer_sql_type(values):
    """Simple type inference for CSV column values."""
    is_int = True
    is_float = True
    for v in values:
        if v is None or v.strip() == "":
            continue
        v_str = v.strip()
        # Test integer
        if is_int:
            if not (v_str.isdigit() or (v_str.startswith("-") and v_str[1:].isdigit())):
                is_int = False
        # Test float
        if is_float:
            try:
                float(v_str)
            except ValueError:
                is_float = False
        if not is_int and not is_float:
            return "TEXT"
    if is_int:
        return "INTEGER"
    if is_float:
        return "REAL"
    return "TEXT"

@router.post("/csv")
async def upload_csv_dataset(file: UploadFile = File(...)):
    """
    Uploads a CSV file, infers column schemas, creates a new table in the database,
    and inserts all rows.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    try:
        content = await file.read()
        decoded = content.decode("utf-8-sig", errors="replace")
        csv_reader = csv.reader(io.StringIO(decoded))
        
        headers = next(csv_reader, None)
        if not headers:
            raise HTTPException(status_code=400, detail="CSV file is empty or has no header row.")

        # Clean column names (alphanumeric + underscore only)
        clean_headers = []
        for i, h in enumerate(headers):
            clean_name = re.sub(r"[^\w]", "_", h.strip().lower())
            if not clean_name:
                clean_name = f"col_{i+1}"
            clean_headers.append(clean_name)
        
        rows = list(csv_reader)
        if not rows:
            raise HTTPException(status_code=400, detail="CSV file has no data rows.")

        # Table name derived from filename
        raw_name = Path(file.filename).stem
        table_name = re.sub(r"[^\w]", "_", raw_name.lower()) or "custom_dataset"

        # Infer column types based on sample rows
        col_types = {}
        for col_idx, col_name in enumerate(clean_headers):
            sample_vals = [r[col_idx] for r in rows[:100] if len(r) > col_idx]
            col_types[col_name] = infer_sql_type(sample_vals)

        # Build column definitions safely
        has_existing_id = "id" in clean_headers
        col_defs = []
        if not has_existing_id:
            col_defs.append("id INTEGER PRIMARY KEY AUTOINCREMENT")

        for col_name in clean_headers:
            if col_name == "id" and has_existing_id:
                col_defs.append(f'"{col_name}" {col_types[col_name]} PRIMARY KEY')
            else:
                col_defs.append(f'"{col_name}" {col_types[col_name]}')

        create_sql = f'CREATE TABLE IF NOT EXISTS "{table_name}" ({", ".join(col_defs)});'

        with db_manager.engine.begin() as conn:
            conn.execute(text(f'DROP TABLE IF EXISTS "{table_name}";'))
            conn.execute(text(create_sql))

            # Insert rows
            placeholders = ", ".join([f":{col}" for col in clean_headers])
            cols_str = ", ".join([f'"{col}"' for col in clean_headers])
            insert_sql = f'INSERT INTO "{table_name}" ({cols_str}) VALUES ({placeholders})'

            for row in rows:
                if len(row) < len(clean_headers):
                    row += [""] * (len(clean_headers) - len(row))
                row_dict = {}
                for col_idx, col_name in enumerate(clean_headers):
                    val_str = row[col_idx].strip()
                    if col_types[col_name] == "INTEGER":
                        try:
                            row_dict[col_name] = int(val_str) if val_str else None
                        except ValueError:
                            row_dict[col_name] = None
                    elif col_types[col_name] == "REAL":
                        try:
                            row_dict[col_name] = float(val_str) if val_str else None
                        except ValueError:
                            row_dict[col_name] = None
                    else:
                        row_dict[col_name] = val_str
                conn.execute(text(insert_sql), row_dict)

        return {
            "success": True,
            "message": f"Successfully imported '{file.filename}' into table '{table_name}' with {len(rows)} rows and {len(clean_headers)} columns.",
            "table_name": table_name,
            "row_count": len(rows),
            "columns": clean_headers,
            "schema": get_database_schema()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV upload: {str(e)}")

@router.post("/sqlite-db")
async def upload_sqlite_database(file: UploadFile = File(...)):
    """
    Uploads a full SQLite database file (.db or .sqlite) and mounts it as the active database.
    """
    if not (file.filename.endswith(".db") or file.filename.endswith(".sqlite")):
        raise HTTPException(status_code=400, detail="Only .db or .sqlite files are supported.")

    try:
        content = await file.read()
        target_path = DB_FILE.parent / f"uploaded_{file.filename}"
        with open(target_path, "wb") as f:
            f.write(content)

        db_url = f"sqlite:///{target_path.as_posix()}"
        success, msg = db_manager.set_connection(db_url)
        if not success:
            raise HTTPException(status_code=400, detail=msg)

        return {
            "success": True,
            "message": f"Successfully loaded database '{file.filename}'.",
            "dialect": "sqlite",
            "schema": get_database_schema()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load database file: {str(e)}")

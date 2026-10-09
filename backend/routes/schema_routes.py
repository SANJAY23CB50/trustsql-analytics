from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..database.connection import db_manager
from ..database.schema_inspector import get_database_schema

router = APIRouter(prefix="/api", tags=["Database & Schema"])

class ConnectRequest(BaseModel):
    connection_url: str

@router.get("/schema")
def get_schema():
    """Retrieves current database tables, columns, relations, and row stats."""
    try:
        return get_database_schema()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to inspect database schema: {str(e)}")

@router.post("/database/connect")
def connect_database(req: ConnectRequest):
    """Switches the active database engine to a custom PostgreSQL or other database."""
    if not req.connection_url.strip():
        raise HTTPException(status_code=400, detail="Database connection URL is required.")
    
    success, msg = db_manager.set_connection(req.connection_url.strip())
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    
    return {
        "success": True,
        "message": msg,
        "dialect": db_manager.dialect,
        "schema": get_database_schema()
    }

@router.post("/database/reset")
def reset_database():
    """Resets database back to bundled realistic sample SQLite database."""
    db_manager.reset_to_default()
    return {
        "success": True,
        "message": "Reset to default realistic E-Commerce & SaaS database.",
        "dialect": "sqlite",
        "schema": get_database_schema()
    }

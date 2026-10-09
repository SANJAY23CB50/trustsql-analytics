import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from .routes import query_routes, schema_routes, benchmark_routes, audio_routes, upload_routes
from .database.connection import db_manager

app = FastAPI(
    title="QueryCraft AI - Voice & Natural Language to SQL Analytics Platform",
    description="Enterprise-grade Voice-to-Speech & NL-to-SQL analytics platform with AST safety guardrails, schema introspection, ambiguity resolution, dataset uploads, and voice narration.",
    version="1.2.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(query_routes.router)
app.include_router(schema_routes.router)
app.include_router(benchmark_routes.router)
app.include_router(audio_routes.router)
app.include_router(upload_routes.router)

@app.get("/")
def root():
    return {
        "platform": "QueryCraft AI Voice & NL-to-SQL Analytics",
        "status": "online",
        "dialect": db_manager.dialect,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ..database.connection import db_manager
from ..safety.validator import sql_validator
from ..safety.limit_enforcer import enforce_query_limits
from ..nl_engine.ambiguity_detector import analyze_question_ambiguity
from ..nl_engine.llm_client import llm_engine
from ..nl_engine.query_explainer import explain_sql_query
from ..analytics.visualizer import recommend_visualization

router = APIRouter(prefix="/api/query", tags=["Query Engine"])

class QueryRequest(BaseModel):
    question: str
    api_key: Optional[str] = None
    provider: Optional[str] = "gemini"

class RawExecuteRequest(BaseModel):
    sql: str
    limit: Optional[int] = 100

SAMPLE_QUESTIONS = [
    {
        "category": "Revenue & Sales",
        "questions": [
            "What is our total revenue and overall average order value?",
            "Break down total revenue and units sold by product category.",
            "Show monthly sales revenue trend over time.",
            "What are the top 5 revenue-generating customers?"
        ]
    },
    {
        "category": "Products & Profitability",
        "questions": [
            "What are our best selling products by units sold?",
            "Show the most profitable products and their profit margins.",
            "List product ratings and total reviews by category."
        ]
    },
    {
        "category": "SaaS & Subscriptions",
        "questions": [
            "What is our monthly recurring revenue (MRR) by subscription plan?",
            "Show distribution of active vs churned subscriptions.",
            "What is the average customer lifetime value by segment?"
        ]
    },
    {
        "category": "Team & Operations",
        "questions": [
            "Compare sales rep performance and quota attainment percentage.",
            "What is the breakdown of support tickets by priority and resolution status?",
            "Show total order volume and customer counts by country."
        ]
    }
]

@router.get("/sample-questions")
def get_sample_questions():
    """Returns curated enterprise business questions."""
    return SAMPLE_QUESTIONS

@router.post("/generate-and-execute")
async def generate_and_execute(req: QueryRequest):
    """
    Translates Natural Language to SQL, checks safety, enforces limits,
    executes query, explains SQL, and recommends optimal visualization.
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # 1. Ambiguity Detection
    ambiguity_report = analyze_question_ambiguity(req.question)

    # 2. Generate SQL via LLM / Semantic Engine
    generated_sql, provider_used = await llm_engine.generate_sql(
        question=req.question,
        dialect=db_manager.dialect,
        api_key=req.api_key,
        provider=req.provider or "gemini"
    )

    # 3. Security Guardrails & AST Validation
    safety_report = sql_validator.validate(generated_sql, dialect=db_manager.dialect)
    if not safety_report["is_safe"]:
        return {
            "success": False,
            "error_type": "SECURITY_VIOLATION",
            "message": "Query blocked by Safety Guardrail. Non-SELECT or destructive statements are prohibited.",
            "generated_sql": generated_sql,
            "safety_report": safety_report,
            "ambiguity_report": ambiguity_report
        }

    # 4. Limit Enforcement
    safe_sql = enforce_query_limits(safety_report["clean_query"])

    # 5. Read-Only Execution with Timeout
    try:
        execution_result = db_manager.execute_read_only(safe_sql)
    except Exception as e:
        return {
            "success": False,
            "error_type": "EXECUTION_ERROR",
            "message": f"Database execution failed: {str(e)}",
            "generated_sql": safe_sql,
            "safety_report": safety_report,
            "ambiguity_report": ambiguity_report
        }

    # 6. SQL Step-by-Step Explanation
    explanation = explain_sql_query(safe_sql)

    # 7. Visualization Recommendation
    viz_recommendation = recommend_visualization(
        columns=execution_result["columns"],
        rows=execution_result["rows"]
    )

    return {
        "success": True,
        "question": req.question,
        "generated_sql": safe_sql,
        "provider_used": provider_used,
        "safety_report": safety_report,
        "ambiguity_report": ambiguity_report,
        "explanation": explanation,
        "visualization": viz_recommendation,
        "data": execution_result
    }

@router.post("/execute-raw")
def execute_raw_sql(req: RawExecuteRequest):
    """Safely executes a manually edited/custom SQL query."""
    if not req.sql.strip():
        raise HTTPException(status_code=400, detail="SQL query cannot be empty.")

    # 1. AST Validation
    safety_report = sql_validator.validate(req.sql, dialect=db_manager.dialect)
    if not safety_report["is_safe"]:
        return {
            "success": False,
            "error_type": "SECURITY_VIOLATION",
            "message": f"Execution blocked: {'; '.join(safety_report['issues'])}",
            "safety_report": safety_report
        }

    # 2. Limit Enforcement
    safe_sql = enforce_query_limits(safety_report["clean_query"], default_limit=req.limit or 100)

    # 3. Execution
    try:
        execution_result = db_manager.execute_read_only(safe_sql)
        explanation = explain_sql_query(safe_sql)
        viz_recommendation = recommend_visualization(
            columns=execution_result["columns"],
            rows=execution_result["rows"]
        )
        return {
            "success": True,
            "executed_sql": safe_sql,
            "safety_report": safety_report,
            "explanation": explanation,
            "visualization": viz_recommendation,
            "data": execution_result
        }
    except Exception as e:
        return {
            "success": False,
            "error_type": "EXECUTION_ERROR",
            "message": str(e),
            "safety_report": safety_report
        }

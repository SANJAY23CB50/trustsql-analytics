import re
from typing import Dict, Any, List

AMBIGUITY_PATTERNS = [
    {
        "pattern": r"\b(top|best|highest|leading)\s+(customers?|users?|clients?)\b",
        "description": "Undefined ranking metric for 'top customers'.",
        "assumption": "Ranked by Total Revenue / Completed Order Volume (Lifetime Value)",
        "clarification": {
            "id": "top_customers_metric",
            "question": "How would you like to rank 'top customers'?",
            "options": [
                "By Total Spending (Revenue)",
                "By Order Count (Frequency)",
                "By Subscription Tier / MRR"
            ]
        }
    },
    {
        "pattern": r"\b(top|best|popular)\s+(products?|items?|goods?)\b",
        "description": "Undefined metric for 'best products'.",
        "assumption": "Ranked by Total Sales Quantity / Units Sold",
        "clarification": {
            "id": "best_products_metric",
            "question": "How should 'best products' be evaluated?",
            "options": [
                "By Total Units Sold",
                "By Gross Revenue Generated",
                "By Customer Review Rating",
                "By Net Profit Margin"
            ]
        }
    },
    {
        "pattern": r"\b(active\s+users?|active\s+customers?)\b",
        "description": "Vague definition of 'active' status.",
        "assumption": "Assumed customers with an 'Active' subscription or completed orders in the last 90 days.",
        "clarification": {
            "id": "active_users_def",
            "question": "What defines an 'active' customer?",
            "options": [
                "Customers with an Active SaaS Subscription",
                "Customers with orders placed in the last 90 days",
                "All registered customers without cancellations"
            ]
        }
    },
    {
        "pattern": r"\b(recent|recently|lately)\b",
        "description": "Relative time period 'recent' has no specified date range.",
        "assumption": "Filtered to the last 30 days of data.",
        "clarification": {
            "id": "recent_timeframe",
            "question": "What timeframe do you mean by 'recent'?",
            "options": [
                "Last 7 Days",
                "Last 30 Days",
                "Last 90 Days",
                "Current Year (YTD)"
            ]
        }
    },
    {
        "pattern": r"\b(churn|churned)\b",
        "description": "Multiple churn definitions exist across orders vs subscriptions.",
        "assumption": "Identified subscriptions with status = 'Churned'.",
        "clarification": {
            "id": "churn_def",
            "question": "Which churn calculation would you prefer?",
            "options": [
                "SaaS Subscription Churn (Status = 'Churned')",
                "Order Inactivity (No purchase in >180 days)"
            ]
        }
    },
    {
        "pattern": r"\b(sales\s+rep|rep\s+performance)\b",
        "description": "Rep performance can be evaluated by total closed sales vs quota attainment %.",
        "assumption": "Ranked by Total Closed Order Value.",
        "clarification": {
            "id": "rep_performance_metric",
            "question": "How should sales rep performance be measured?",
            "options": [
                "Total Closed Sales ($ Amount)",
                "Quota Attainment Percentage",
                "Commission Earned"
            ]
        }
    }
]

def analyze_question_ambiguity(question: str) -> Dict[str, Any]:
    """
    Analyzes natural language business question for ambiguities and returns
    detected assumptions and interactive clarification options.
    """
    detected_ambiguities = []
    assumptions_made = []
    clarifications = []
    
    q_lower = question.lower()
    
    for item in AMBIGUITY_PATTERNS:
        if re.search(item["pattern"], q_lower):
            detected_ambiguities.append(item["description"])
            assumptions_made.append(item["assumption"])
            clarifications.append(item["clarification"])
            
    is_ambiguous = len(detected_ambiguities) > 0
    # Confidence is 0.95 when question is precise, lower if multiple vague terms
    confidence = max(0.60, 0.98 - (len(detected_ambiguities) * 0.12)) if is_ambiguous else 0.98
    
    return {
        "is_ambiguous": is_ambiguous,
        "confidence_score": round(confidence, 2),
        "detected_ambiguities": detected_ambiguities,
        "assumptions_made": assumptions_made,
        "clarifications": clarifications
    }

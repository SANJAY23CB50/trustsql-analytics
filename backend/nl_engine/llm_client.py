import os
import re
import json
import httpx
from typing import Dict, Any, Optional, Tuple
from ..database.schema_inspector import get_schema_prompt_string, get_database_schema

class LLMEngine:
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")

    async def generate_sql(
        self,
        question: str,
        dialect: str = "sqlite",
        api_key: Optional[str] = None,
        provider: str = "gemini"
    ) -> Tuple[str, str]:
        """
        Translates plain text business question into SQL.
        Returns (sql_query, provider_used)
        """
        schema_context = get_schema_prompt_string()
        key_to_use = api_key or (self.gemini_api_key if provider == "gemini" else self.openai_api_key)

        # 1. If LLM API Key is provided, call external API
        if key_to_use:
            try:
                if provider == "gemini" or key_to_use.startswith("AIza"):
                    sql = await self._call_gemini_api(question, schema_context, dialect, key_to_use)
                    return sql, "Gemini LLM"
                elif provider == "openai" or key_to_use.startswith("sk-"):
                    sql = await self._call_openai_api(question, schema_context, dialect, key_to_use)
                    return sql, "OpenAI GPT"
            except Exception as e:
                # Log error and gracefully fall back to local semantic parser
                print(f"External LLM API call error: {e}, falling back to intelligent semantic engine.")

        # 2. Intelligent Local Heuristic/Semantic SQL Engine
        sql = self._generate_heuristic_sql(question, dialect)
        return sql, "Local Smart Semantic Engine"

    async def _call_gemini_api(self, question: str, schema_context: str, dialect: str, api_key: str) -> str:
        prompt = f"""You are an expert Principal Database Engineer. Convert the following business question into a safe, valid, high-performance SQL query for {dialect.upper()}.

{schema_context}

CRITICAL RULES:
1. Return ONLY the raw SQL query. Do NOT wrap in markdown block (no ```sql).
2. ONLY use SELECT or WITH (Common Table Expression). NEVER produce INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE.
3. Ensure all table and column names exist in the schema. Use proper JOIN conditions based on foreign keys.
4. If ranking or top N is requested, include an ORDER BY and LIMIT clause.

User Business Question: {question}
SQL Query:"""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 800}
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            raw_text = re.sub(r"^```(?:sql)?\s*", "", raw_text, flags=re.IGNORECASE)
            raw_text = re.sub(r"```$", "", raw_text).strip()
            return raw_text

    async def _call_openai_api(self, question: str, schema_context: str, dialect: str, api_key: str) -> str:
        prompt = f"""You are an expert Principal Database Engineer. Convert the following business question into a safe, valid, high-performance SQL query for {dialect.upper()}.

{schema_context}

CRITICAL RULES:
1. Return ONLY the raw SQL query.
2. ONLY use SELECT or WITH. Never produce modifying queries.
3. Use proper table aliases and join keys.

User Business Question: {question}
SQL Query:"""

        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"].strip()
            raw_text = re.sub(r"^```(?:sql)?\s*", "", raw_text, flags=re.IGNORECASE)
            raw_text = re.sub(r"```$", "", raw_text).strip()
            return raw_text

    def _generate_heuristic_sql(self, question: str, dialect: str) -> str:
        """
        High-precision semantic engine supporting extensive analytics queries
        across customers, revenue, products, subscriptions, tickets, reps, and reviews.
        """
        q = question.lower().strip()

        # 1. SaaS Subscriptions / MRR by Plan
        if "subscription" in q or "plan" in q or "mrr" in q:
            return """SELECT plan_name, status, COUNT(id) AS subscriber_count, ROUND(SUM(monthly_recurring_revenue), 2) AS total_mrr, ROUND(AVG(monthly_recurring_revenue), 2) AS avg_mrr
FROM subscriptions
GROUP BY plan_name, status
ORDER BY total_mrr DESC;"""

        # 2. Support Tickets / Issues by Priority and Status
        if "ticket" in q or "support" in q or "issue" in q:
            return """SELECT priority, status, COUNT(id) AS ticket_count, ROUND(AVG(satisfaction_score), 2) AS avg_satisfaction
FROM support_tickets
GROUP BY priority, status
ORDER BY ticket_count DESC;"""

        # 3. Sales Rep Performance & Quota Attainment
        if "rep" in q or "salesperson" in q or "quota" in q or "sales team" in q:
            return """SELECT sr.name AS rep_name, sr.region, sr.quota, ROUND(COALESCE(SUM(o.total_amount), 0), 2) AS actual_sales, ROUND((COALESCE(SUM(o.total_amount), 0) / sr.quota) * 100, 2) AS quota_attainment_pct
FROM sales_reps sr
LEFT JOIN orders o ON sr.id = o.sales_rep_id AND o.status IN ('Completed', 'Shipped')
GROUP BY sr.id, sr.name, sr.region, sr.quota
ORDER BY actual_sales DESC;"""

        # 4. Product Reviews / Ratings
        if "review" in q or "rating" in q:
            return """SELECT p.name AS product_name, p.category, ROUND(AVG(r.rating), 2) AS avg_rating, COUNT(r.id) AS total_reviews
FROM products p
JOIN reviews r ON p.id = r.product_id
GROUP BY p.id, p.name, p.category
ORDER BY avg_rating DESC, total_reviews DESC;"""

        # 5. Customer Geography / Sales by Country
        if "country" in q or "countries" in q or "geo" in q or "location" in q:
            return """SELECT c.country, COUNT(DISTINCT c.id) AS total_customers, COUNT(o.id) AS total_orders, ROUND(SUM(o.total_amount), 2) AS total_revenue
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id AND o.status IN ('Completed', 'Shipped')
GROUP BY c.country
ORDER BY total_revenue DESC
LIMIT 10;"""

        # 6. Customer Segments Breakdown
        if "segment" in q or "segments" in q:
            return """SELECT segment, COUNT(id) AS customer_count, ROUND(AVG(lifetime_value), 2) AS avg_lifetime_value, ROUND(SUM(lifetime_value), 2) AS total_segment_value
FROM customers
GROUP BY segment
ORDER BY total_segment_value DESC;"""

        # 7. High Margin / Most Profitable Products
        if "profit" in q or "margin" in q:
            return """SELECT p.name, p.category, p.price, p.cost, ROUND(p.price - p.cost, 2) AS profit_per_unit, ROUND(((p.price - p.cost) / p.price) * 100, 2) AS margin_percentage, SUM(oi.quantity) AS total_sold, ROUND(SUM(oi.quantity * (p.price - p.cost)), 2) AS total_profit
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('Completed', 'Shipped')
GROUP BY p.id, p.name, p.category, p.price, p.cost
ORDER BY total_profit DESC
LIMIT 10;"""

        # 8. Top Selling / Best Products
        if ("top" in q or "best" in q or "popular" in q or "most sold" in q) and ("product" in q or "item" in q):
            limit_val = 5 if "5" in q else 10
            return f"""SELECT p.id, p.name, p.category, p.price, SUM(oi.quantity) AS total_units_sold, ROUND(SUM(oi.total_price), 2) AS total_revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('Completed', 'Shipped')
GROUP BY p.id, p.name, p.category, p.price
ORDER BY total_units_sold DESC
LIMIT {limit_val};"""

        # 9. Top Customers by Spending / Revenue
        if ("top" in q or "best" in q or "highest" in q) and ("customer" in q or "client" in q or "spender" in q):
            limit_val = 5 if "5" in q else (10 if "10" in q else 10)
            return f"""SELECT c.id, c.first_name || ' ' || c.last_name AS customer_name, c.email, c.segment, c.country, ROUND(SUM(o.total_amount), 2) AS total_spent, COUNT(o.id) AS total_orders
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.status IN ('Completed', 'Shipped')
GROUP BY c.id, customer_name, c.email, c.segment, c.country
ORDER BY total_spent DESC
LIMIT {limit_val};"""

        # 10. Revenue by Product Category
        if "category" in q or "categories" in q:
            return """SELECT p.category, ROUND(SUM(oi.total_price), 2) AS total_revenue, SUM(oi.quantity) AS units_sold
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('Completed', 'Shipped')
GROUP BY p.category
ORDER BY total_revenue DESC;"""

        # 11. Monthly Sales Revenue Trend / Sales over time
        if "month" in q or "monthly" in q or "trend" in q or "over time" in q or "timeline" in q:
            if dialect == "postgresql":
                date_expr = "TO_CHAR(o.order_date::timestamp, 'YYYY-MM')"
            else:
                date_expr = "SUBSTR(o.order_date, 1, 7)"
            return f"""SELECT {date_expr} AS month, ROUND(SUM(o.total_amount), 2) AS total_revenue, COUNT(o.id) AS order_count
FROM orders o
WHERE o.status IN ('Completed', 'Shipped')
GROUP BY month
ORDER BY month ASC;"""

        # 12. Payment Methods Distribution
        if "payment" in q or "payment method" in q:
            return """SELECT payment_method, COUNT(id) AS total_transactions, ROUND(SUM(total_amount), 2) AS total_volume, ROUND(AVG(total_amount), 2) AS avg_transaction_value
FROM orders
GROUP BY payment_method
ORDER BY total_volume DESC;"""

        # 13. Total Revenue / Total Sales
        if "total revenue" in q or "total sales" in q or "overall sales" in q or "average order value" in q:
            return "SELECT ROUND(SUM(total_amount), 2) AS total_revenue, COUNT(id) AS total_orders, ROUND(AVG(total_amount), 2) AS average_order_value FROM orders WHERE status IN ('Completed', 'Shipped');"

        # 14. Default Fallback Analytics Query
        return """SELECT c.segment, COUNT(DISTINCT c.id) AS total_customers, COUNT(o.id) AS completed_orders, ROUND(SUM(o.total_amount), 2) AS total_revenue
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id AND o.status = 'Completed'
GROUP BY c.segment
ORDER BY total_revenue DESC;"""

llm_engine = LLMEngine()

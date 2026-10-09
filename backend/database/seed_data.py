import sqlite3
import random
from datetime import datetime, timedelta

def create_seed_database(db_path: str):
    """Creates a comprehensive sample database for E-Commerce & SaaS analytics."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Drop existing tables
    tables = ["order_items", "orders", "support_tickets", "subscriptions", "reviews", "products", "customers", "sales_reps"]
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table};")

    # 1. Customers Table
    cursor.execute("""
    CREATE TABLE customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        segment TEXT CHECK(segment IN ('Enterprise', 'SMB', 'Consumer')) NOT NULL,
        lifetime_value REAL DEFAULT 0.0,
        created_at TEXT NOT NULL
    );
    """)

    # 2. Sales Reps Table
    cursor.execute("""
    CREATE TABLE sales_reps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        region TEXT NOT NULL,
        quota REAL NOT NULL,
        commission_rate REAL NOT NULL
    );
    """)

    # 3. Products Table
    cursor.execute("""
    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        cost REAL NOT NULL,
        stock_quantity INTEGER NOT NULL,
        rating REAL DEFAULT 4.0,
        is_active INTEGER DEFAULT 1
    );
    """)

    # 4. Orders Table
    cursor.execute("""
    CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        sales_rep_id INTEGER,
        order_date TEXT NOT NULL,
        status TEXT CHECK(status IN ('Completed', 'Shipped', 'Pending', 'Cancelled', 'Refunded')) NOT NULL,
        total_amount REAL NOT NULL,
        shipping_fee REAL DEFAULT 0.0,
        discount_amount REAL DEFAULT 0.0,
        payment_method TEXT CHECK(payment_method IN ('Credit Card', 'PayPal', 'Wire Transfer', 'Stripe')) NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (sales_rep_id) REFERENCES sales_reps(id)
    );
    """)

    # 5. Order Items Table
    cursor.execute("""
    CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );
    """)

    # 6. Subscriptions Table (SaaS metrics)
    cursor.execute("""
    CREATE TABLE subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        plan_name TEXT CHECK(plan_name IN ('Starter', 'Professional', 'Enterprise', 'Ultimate')) NOT NULL,
        monthly_recurring_revenue REAL NOT NULL,
        status TEXT CHECK(status IN ('Active', 'Churned', 'Trial', 'Past Due')) NOT NULL,
        billing_cycle TEXT CHECK(billing_cycle IN ('Monthly', 'Annual')) NOT NULL,
        start_date TEXT NOT NULL,
        renewal_date TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
    """)

    # 7. Support Tickets Table
    cursor.execute("""
    CREATE TABLE support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')) NOT NULL,
        status TEXT CHECK(status IN ('Open', 'In Progress', 'Resolved', 'Closed')) NOT NULL,
        satisfaction_score INTEGER,
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
    """)

    # 8. Product Reviews Table
    cursor.execute("""
    CREATE TABLE reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        review_text TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
    """)

    # ------------------ INSERT SEED DATA ------------------

    # Sales Reps
    reps_data = [
        ("Sarah Jenkins", "North America", 250000.0, 0.08),
        ("Marcus Vance", "EMEA", 200000.0, 0.07),
        ("Akira Tanaka", "APAC", 180000.0, 0.075),
        ("Elena Rodriguez", "LATAM", 150000.0, 0.065),
        ("David Miller", "North America", 300000.0, 0.085),
    ]
    cursor.executemany("INSERT INTO sales_reps (name, region, quota, commission_rate) VALUES (?, ?, ?, ?);", reps_data)

    # Customers
    first_names = ["James", "Emma", "Liam", "Olivia", "Noah", "Ava", "William", "Sophia", "Mason", "Isabella", "Ethan", "Mia", "Alexander", "Charlotte", "Daniel", "Amelia", "Lucas", "Harper", "Benjamin", "Evelyn", "Michael", "Abigail", "Henry", "Emily", "Jacob"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris"]
    cities_countries = [
        ("New York", "USA"), ("San Francisco", "USA"), ("London", "UK"), ("Berlin", "Germany"),
        ("Tokyo", "Japan"), ("Toronto", "Canada"), ("Sydney", "Australia"), ("Paris", "France"),
        ("Singapore", "Singapore"), ("Austin", "USA"), ("Chicago", "USA"), ("Dublin", "Ireland"),
        ("Amsterdam", "Netherlands"), ("Madrid", "Spain"), ("Stockholm", "Sweden")
    ]
    segments = ["Enterprise", "SMB", "Consumer"]

    customers_data = []
    base_date = datetime(2025, 1, 1)
    for i in range(1, 41):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        email = f"{fn.lower()}.{ln.lower()}{i}@example.com"
        city, country = random.choice(cities_countries)
        segment = random.choices(segments, weights=[0.25, 0.35, 0.40])[0]
        created = base_date + timedelta(days=random.randint(0, 450))
        customers_data.append((fn, ln, email, city, country, segment, 0.0, created.strftime("%Y-%m-%d %H:%M:%S")))

    cursor.executemany("""
    INSERT INTO customers (first_name, last_name, email, city, country, segment, lifetime_value, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, customers_data)

    # Products
    products_raw = [
        ("Cloud Analytics Pro", "Software", 499.00, 50.00, 9999, 4.8),
        ("Enterprise Security Suite", "Software", 1200.00, 150.00, 9999, 4.9),
        ("AI Predictive Modeler", "Software", 850.00, 100.00, 9999, 4.7),
        ("Data Pipeline Orchestrator", "Software", 350.00, 40.00, 9999, 4.5),
        ("Smart Edge Gateway V2", "Hardware", 899.00, 450.00, 120, 4.6),
        ("High-Performance Server Blade", "Hardware", 3200.00, 1800.00, 45, 4.9),
        ("Developer Workstation Pro", "Hardware", 2400.00, 1400.00, 60, 4.7),
        ("IoT Sensor Hub Array", "Hardware", 450.00, 210.00, 250, 4.3),
        ("Database Consulting 10hr Pack", "Services", 2500.00, 800.00, 100, 5.0),
        ("Architecture Review Service", "Services", 4500.00, 1500.00, 50, 4.9),
        ("Annual Premium Support Tier", "Services", 3600.00, 600.00, 9999, 4.8),
        ("Data Migration Package", "Services", 5000.00, 1900.00, 30, 4.4),
    ]
    cursor.executemany("""
    INSERT INTO products (name, category, price, cost, stock_quantity, rating)
    VALUES (?, ?, ?, ?, ?, ?);
    """, products_raw)

    # Orders & Order Items
    order_statuses = ["Completed", "Completed", "Completed", "Shipped", "Pending", "Cancelled", "Refunded"]
    payment_methods = ["Credit Card", "Wire Transfer", "Stripe", "PayPal"]
    
    order_id = 1
    for cust_id in range(1, 41):
        num_orders = random.randint(1, 6)
        cust_total_spent = 0.0
        for _ in range(num_orders):
            sales_rep_id = random.randint(1, 5) if random.random() > 0.3 else None
            o_date = (base_date + timedelta(days=random.randint(60, 550))).strftime("%Y-%m-%d %H:%M:%S")
            status = random.choice(order_statuses)
            pay_method = random.choice(payment_methods)
            shipping = 0.0 if random.random() > 0.5 else 25.0
            discount = 50.0 if random.random() > 0.7 else 0.0

            # Insert order placeholder
            cursor.execute("""
            INSERT INTO orders (customer_id, sales_rep_id, order_date, status, total_amount, shipping_fee, discount_amount, payment_method)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, (cust_id, sales_rep_id, o_date, status, 0.0, shipping, discount, pay_method))

            curr_order_id = cursor.lastrowid
            
            # Create order items
            num_items = random.randint(1, 4)
            chosen_products = random.sample(range(1, len(products_raw) + 1), num_items)
            order_items_total = 0.0

            for prod_id in chosen_products:
                prod_price = products_raw[prod_id - 1][2]
                qty = random.randint(1, 3)
                item_total = prod_price * qty
                order_items_total += item_total
                cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
                VALUES (?, ?, ?, ?, ?);
                """, (curr_order_id, prod_id, qty, prod_price, item_total))

            final_total = max(0.0, order_items_total + shipping - discount)
            cursor.execute("UPDATE orders SET total_amount = ? WHERE id = ?;", (final_total, curr_order_id))

            if status in ["Completed", "Shipped"]:
                cust_total_spent += final_total

        # Update customer lifetime value
        cursor.execute("UPDATE customers SET lifetime_value = ? WHERE id = ?;", (round(cust_total_spent, 2), cust_id))

    # Subscriptions (SaaS)
    plans = [
        ("Starter", 49.00),
        ("Professional", 199.00),
        ("Enterprise", 599.00),
        ("Ultimate", 1299.00)
    ]
    sub_statuses = ["Active", "Active", "Active", "Active", "Trial", "Churned", "Past Due"]
    for cust_id in range(1, 41):
        if random.random() > 0.25:
            plan, mrr = random.choice(plans)
            status = random.choice(sub_statuses)
            cycle = "Annual" if random.random() > 0.6 else "Monthly"
            start = (base_date + timedelta(days=random.randint(0, 300))).strftime("%Y-%m-%d")
            renewal = (datetime.strptime(start, "%Y-%m-%d") + timedelta(days=365 if cycle == "Annual" else 30)).strftime("%Y-%m-%d")
            cursor.execute("""
            INSERT INTO subscriptions (customer_id, plan_name, monthly_recurring_revenue, status, billing_cycle, start_date, renewal_date)
            VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (cust_id, plan, mrr, status, cycle, start, renewal))

    # Support Tickets
    ticket_subjects = [
        ("API Rate limit reached", "High"),
        ("Invoice calculation query", "Medium"),
        ("Integration with Snowflake failing", "Critical"),
        ("Feature request: Dark mode export", "Low"),
        ("SSO SAML authentication issue", "Critical"),
        ("How to add secondary admin user", "Low"),
        ("Query latency spikes during peak hours", "High"),
        ("Webhook payload timeout", "Medium"),
        ("Data export CSV formatting error", "Medium"),
    ]
    ticket_statuses = ["Resolved", "Resolved", "Resolved", "Closed", "In Progress", "Open"]
    for _ in range(50):
        cust_id = random.randint(1, 40)
        subj, prio = random.choice(ticket_subjects)
        st = random.choice(ticket_statuses)
        sat = random.randint(3, 5) if st in ["Resolved", "Closed"] else None
        created = (base_date + timedelta(days=random.randint(100, 500))).strftime("%Y-%m-%d %H:%M:%S")
        resolved = (datetime.strptime(created, "%Y-%m-%d %H:%M:%S") + timedelta(hours=random.randint(2, 72))).strftime("%Y-%m-%d %H:%M:%S") if st in ["Resolved", "Closed"] else None
        cursor.execute("""
        INSERT INTO support_tickets (customer_id, subject, priority, status, satisfaction_score, created_at, resolved_at)
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (cust_id, subj, prio, st, sat, created, resolved))

    # Reviews
    review_snippets = [
        (5, "Exceptional performance and seamless deployment experience!"),
        (5, "Game-changer for our data science and BI workflow."),
        (4, "Great platform, would love more automated dashboard widgets."),
        (3, "Good features but initial setup required assistance."),
        (5, "Top notch customer support and lightning fast querying."),
        (4, "Reliable infrastructure for our high volume workloads."),
    ]
    for _ in range(35):
        prod_id = random.randint(1, len(products_raw))
        cust_id = random.randint(1, 40)
        rating, rev = random.choice(review_snippets)
        created = (base_date + timedelta(days=random.randint(50, 480))).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
        INSERT INTO reviews (product_id, customer_id, rating, review_text, created_at)
        VALUES (?, ?, ?, ?, ?);
        """, (prod_id, cust_id, rating, rev, created))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    import os
    create_seed_database("ecommerce_saas.db")
    print("Seed database created successfully.")

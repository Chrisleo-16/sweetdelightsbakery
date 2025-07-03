from flask import Flask, jsonify, request, session
from flask_cors import CORS
from datetime import datetime, timedelta
import sqlite3
import hashlib
import os
import json
from functools import wraps

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'
CORS(app, supports_credentials=True)

# Database initialization
def init_db():
    conn = sqlite3.connect('bakery.db')
    cursor = conn.cursor()
    
    # Products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            category TEXT NOT NULL,
            image TEXT,
            stock INTEGER NOT NULL DEFAULT 0,
            low_stock_threshold INTEGER DEFAULT 10,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Orders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Order items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_id INTEGER,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )
    ''')
    
    # Customers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            address TEXT,
            total_orders INTEGER DEFAULT 0,
            total_spent REAL DEFAULT 0,
            loyalty_tier TEXT DEFAULT 'Bronze',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_order_date TIMESTAMP
        )
    ''')
    
    # Admin users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insert sample data if tables are empty
    cursor.execute('SELECT COUNT(*) FROM products')
    if cursor.fetchone()[0] == 0:
        sample_products = [
            ('Chocolate Croissant', 'Buttery croissant filled with rich chocolate', 4.99, 'pastries', '/images/product-chocolate-croissant.jpg', 25, 10, 1),
            ('Red Velvet Cake', 'Classic red velvet with cream cheese frosting', 32.99, 'cakes', '/images/product-red-velvet.jpg', 5, 10, 1),
            ('Vanilla Bean Ice Cream', 'Made with Madagascar vanilla beans', 6.99, 'ice-cream', '/images/product-vanilla-ice-cream.jpg', 0, 15, 1),
            ('Chai Tea Latte', 'Spiced chai with steamed milk', 4.99, 'beverages', '/images/product-chai-latte.jpg', 50, 20, 1),
            ('Iced Caramel Latte', 'Espresso with caramel and cold milk', 5.49, 'cold-drinks', '/images/product-iced-caramel-latte.jpg', 8, 15, 1),
            ('Fresh Cream Cheese', 'Locally sourced cream cheese', 8.99, 'creamery', '/images/product-cream-cheese.jpg', 30, 10, 1),
            ('Blueberry Muffin', 'Fresh blueberry muffin with streusel top', 3.25, 'pastries', '/images/product-blueberry-muffin.jpg', 20, 8, 1),
            ('Sourdough Bread', 'Artisan sourdough bread', 8.00, 'pastries', '/images/product-sourdough.jpg', 15, 5, 1)
        ]
        
        cursor.executemany('''
            INSERT INTO products (name, description, price, category, image, stock, low_stock_threshold, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_products)
    
    # Insert admin user if not exists
    cursor.execute('SELECT COUNT(*) FROM admin_users')
    if cursor.fetchone()[0] == 0:
        admin_password = hashlib.sha256('`{cooki£}267'.encode()).hexdigest()
        cursor.execute('''
            INSERT INTO admin_users (username, email, password_hash)
            VALUES (?, ?, ?)
        ''', ('$Uv#ns0', 'admin@sweetdelights.com', admin_password))
    
    # Insert sample orders and customers
    cursor.execute('SELECT COUNT(*) FROM customers')
    if cursor.fetchone()[0] == 0:
        sample_customers = [
            ('John Smith', 'john@example.com', '+1-555-0123', '123 Main St', 5, 89.45, 'Silver'),
            ('Sarah Johnson', 'sarah@example.com', '+1-555-0124', '456 Oak Ave', 12, 234.67, 'Gold'),
            ('Mike Wilson', 'mike@example.com', '+1-555-0125', '789 Pine St', 3, 45.23, 'Bronze'),
            ('Emily Davis', 'emily@example.com', '+1-555-0126', '321 Elm St', 8, 156.78, 'Silver'),
            ('David Brown', 'david@example.com', '+1-555-0127', '654 Maple Dr', 15, 345.89, 'Platinum')
        ]
        
        cursor.executemany('''
            INSERT INTO customers (name, email, phone, address, total_orders, total_spent, loyalty_tier)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', sample_customers)
        
        # Insert sample orders
        sample_orders = [
            ('John Smith', 'john@example.com', '+1-555-0123', 24.99, 'delivered'),
            ('Sarah Johnson', 'sarah@example.com', '+1-555-0124', 45.67, 'processing'),
            ('Mike Wilson', 'mike@example.com', '+1-555-0125', 15.49, 'pending'),
            ('Emily Davis', 'emily@example.com', '+1-555-0126', 32.99, 'shipped'),
            ('David Brown', 'david@example.com', '+1-555-0127', 67.89, 'delivered')
        ]
        
        cursor.executemany('''
            INSERT INTO orders (customer_name, customer_email, customer_phone, total_amount, status)
            VALUES (?, ?, ?, ?, ?)
        ''', sample_orders)
    
    conn.commit()
    conn.close()

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Admin Authentication Routes
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username_or_email = data.get('username', '').lower()
    password = data.get('password', '')
    
    if not username_or_email or not password:
        return jsonify({'error': 'Username/email and password required'}), 400
    
    conn = sqlite3.connect('bakery.db')
    cursor = conn.cursor()
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    cursor.execute('''
        SELECT id, username, email FROM admin_users 
        WHERE (LOWER(username) = ? OR LOWER(email) = ?) AND password_hash = ?
    ''', (username_or_email, username_or_email, password_hash))
    
    admin = cursor.fetchone()
    conn.close()
    
    if admin:
        session['admin_id'] = admin[0]
        session['admin_username'] = admin[1]
        session['admin_email'] = admin[2]
        return jsonify({
            'success': True,
            'admin': {
                'id': admin[0],
                'username': admin[1],
                'email': admin[2]
            }
        })
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/admin/logout', methods=['POST'])
@login_required
def admin_logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/admin/verify', methods=['GET'])
def verify_admin():
    if 'admin_id' in session:
        return jsonify({
            'authenticated': True,
            'admin': {
                'id': session['admin_id'],
                'username': session['admin_username'],
                'email': session['admin_email']
            }
        })
    return jsonify({'authenticated': False}), 401

# Products API
@app.route('/api/products', methods=['GET'])
@login_required
def get_products():
    conn = sqlite3.connect('bakery.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, name, description, price, category, image, stock, 
               low_stock_threshold, is_active, created_at, updated_at
        FROM products ORDER BY created_at DESC
    ''')
    
    products = []
    for row in cursor.fetchall():
        products.append({
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'price': row[3],
            'category': row[4],
            'image': row[5],
            'stock': row[6],
            'lowStockThreshold': row[7],
            'isActive': bool(row[8]),
            'createdAt': row[9],
            'updatedAt': row[10]
        })
    
    conn.close()
    return jsonify(products)

@app.route('/api/products', methods=['POST'])
@login_required
def add_product():
    data = request.get_json()
    
    conn = sqlite3.connect('bakery.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO products (name, description, price, category, image, stock, low_stock_threshold, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['name'], data['description'], data['price'], data['category'],
        data['image'], data['stock'], data['lowStockThreshold'], data['isActive']
    ))
    
    product_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': product_id, 'message': 'Product added successfully'})

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@login_required
def update_product(product_id):
    data = request.get_json()
    
    conn = sqlite3.connect('bakery.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE products SET name=?, description=?, price=?, category=?, image=?, 
               stock=?, low_stock_threshold=?, is_active=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
    ''', (
        data['name'], data['description'], data['price'], data['category'],
        data['image'], data['stock'], data['lowStockThreshold'], data['isActive'], product_id
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Product updated successfully'})

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@login_required
def delete_product(product_id):
    conn = sqlite3.connect('bakery.db')
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM products WHERE id=?', (product_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Product deleted successfully'})

# Analytics API
@app.route('/api/analytics', methods=['GET'])
@login_required
def get_analytics():
    conn = sqlite3.connect('bakery.db')
    cursor = conn.cursor()
    
    # Get time range from query params
    days = int(request.args.get('days', 7))
    
    # Revenue analytics
    cursor.execute('''
        SELECT SUM(total_amount) FROM orders 
        WHERE order_date >= date('now', '-{} days')
    '''.format(days))
    current_revenue = cursor.fetchone()[0] or 0
    
    cursor.execute('''
        SELECT SUM(total_amount) FROM orders 
        WHERE order_date >= date('now', '-{} days') AND order_date < date('now', '-{} days')
    '''.format(days * 2, days))
    previous_revenue = cursor.fetchone()[0] or 0
    
    # Orders analytics
    cursor.execute('''
        SELECT COUNT(*) FROM orders 
        WHERE order_date >= date('now', '-{} days')
    '''.format(days))
    current_orders = cursor.fetchone()[0] or 0
    
    cursor.execute('''
        SELECT COUNT(*) FROM orders 
        WHERE order_date >= date('now', '-{} days') AND order_date < date('now', '-{} days')
    '''.format(days * 2, days))
    previous_orders = cursor.fetchone()[0] or 0
    
    # Customer analytics
    cursor.execute('''
        SELECT COUNT(DISTINCT customer_email) FROM orders 
        WHERE order_date >= date('now', '-{} days')
    '''.format(days))
    current_customers = cursor.fetchone()[0] or 0
    
    cursor.execute('''
        SELECT COUNT(DISTINCT customer_email) FROM orders 
        WHERE order_date >= date('now', '-{} days') AND order_date < date('now', '-{} days')
    '''.format(days * 2, days))
    previous_customers = cursor.fetchone()[0] or 0
    
    # Average order value
    avg_current = current_revenue / current_orders if current_orders > 0 else 0
    avg_previous = previous_revenue / previous_orders if previous_orders > 0 else 0
    
    # Top products
    cursor.execute('''
        SELECT p.name, SUM(oi.quantity) as sales, SUM(oi.quantity * oi.price) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.order_date >= date('now', '-{} days')
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
        LIMIT 5
    '''.format(days))
    
    top_products = []
    for row in cursor.fetchall():
        top_products.append({
            'name': row[0],
            'sales': row[1],
            'revenue': row[2]
        })
    
    # Revenue by day
    cursor.execute('''
        SELECT date(order_date) as day, SUM(total_amount) as revenue
        FROM orders
        WHERE order_date >= date('now', '-{} days')
        GROUP BY date(order_date)
        ORDER BY day
    '''.format(days))
    
    revenue_by_day = []
    for row in cursor.fetchall():
        day_name = datetime.strptime(row[0], '%Y-%m-%d').strftime('%a')
        revenue_by_day.append({
            'day': day_name,
            'revenue': row[1]
        })
    
    # Category performance
    cursor.execute('''
        SELECT p.category, COUNT(oi.id) as orders, SUM(oi.quantity * oi.price) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.order_date >= date('now', '-{} days')
        GROUP BY p.category
        ORDER BY revenue DESC
    '''.format(days))
    
    category_performance = []
    for row in cursor.fetchall():
        category_performance.append({
            'category': row[0].title(),
            'orders': row[1],
            'revenue': row[2]
        })
    
    # Calculate percentage changes
    def calc_change(current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return ((current - previous) / previous) * 100
    
    analytics = {
        'revenue': {
            'current': current_revenue,
            'previous': previous_revenue,
            'change': calc_change(current_revenue, previous_revenue)
        },
        'orders': {
            'current': current_orders,
            'previous': previous_orders,
            'change': calc_change(current_orders, previous_orders)
        },
        'customers': {
            'current': current_customers,
            'previous': previous_customers,
            'change': calc_change(current_customers, previous_customers)
        },
        'avgOrderValue': {
            'current': avg_current,
            'previous': avg_previous,
            'change': calc_change(avg_current, avg_previous)
        },
        'topProducts': top_products,
        'revenueByDay': revenue_by_day,
        'categoryPerformance': category_performance
    }
    
    conn.close()
    return jsonify(analytics)

# Dashboard Stats API
@app.route('/api/dashboard/stats', methods=['GET'])
@login_required
def get_dashboard_stats():
    conn = sqlite3.connect('bakery.db')
    cursor = conn.cursor()
    
    # Product stats
    cursor.execute('SELECT COUNT(*) FROM products WHERE is_active = 1')
    total_products = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM products WHERE stock = 0 AND is_active = 1')
    out_of_stock = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM products WHERE stock > 0 AND stock <= low_stock_threshold AND is_active = 1')
    low_stock = cursor.fetchone()[0]
    
    cursor.execute('SELECT SUM(price * stock) FROM products WHERE is_active = 1')
    total_value = cursor.fetchone()[0] or 0
    
    # Recent orders
    cursor.execute('''
        SELECT COUNT(*) FROM orders 
        WHERE order_date >= date('now', '-7 days')
    ''')
    recent_orders = cursor.fetchone()[0]
    
    # Today's revenue
    cursor.execute('''
        SELECT SUM(total_amount) FROM orders 
        WHERE date(order_date) = date('now')
    ''')
    todays_revenue = cursor.fetchone()[0] or 0
    
    conn.close()
    
    return jsonify({
        'totalProducts': total_products,
        'outOfStock': out_of_stock,
        'lowStock': low_stock,
        'totalValue': total_value,
        'recentOrders': recent_orders,
        'todaysRevenue': todays_revenue
    })

# Orders API
@app.route('/api/orders', methods=['GET'])
@login_required
def get_orders():
    conn = sqlite3.connect('bakery.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, customer_name, customer_email, customer_phone, 
               total_amount, status, order_date, updated_at
        FROM orders ORDER BY order_date DESC
    ''')
    
    orders = []
    for row in cursor.fetchall():
        orders.append({
            'id': row[0],
            'customerName': row[1],
            'customerEmail': row[2],
            'customerPhone': row[3],
            'totalAmount': row[4],
            'status': row[5],
            'orderDate': row[6],
            'updatedAt': row[7]
        })
    
    conn.close()
    return jsonify(orders)

# Customers API
@app.route('/api/customers', methods=['GET'])
@login_required
def get_customers():
    conn = sqlite3.connect('bakery.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, name, email, phone, address, total_orders, 
               total_spent, loyalty_tier, created_at, last_order_date
        FROM customers ORDER BY total_spent DESC
    ''')
    
    customers = []
    for row in cursor.fetchall():
        customers.append({
            'id': row[0],
            'name': row[1],
            'email': row[2],
            'phone': row[3],
            'address': row[4],
            'totalOrders': row[5],
            'totalSpent': row[6],
            'loyaltyTier': row[7],
            'createdAt': row[8],
            'lastOrderDate': row[9]
        })
    
    conn.close()
    return jsonify(customers)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)

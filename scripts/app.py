import os
import re
from datetime import datetime, timedelta
# import requests
from flask import *
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import json
# import base64
# from requests.auth import HTTPBasicAuth
import pymysql

# ------------- Load environment variables -------------
load_dotenv()

# ------------- Flask app setup -------------
app = Flask(__name__)

# Upload folder config
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads/')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'jfif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# JWT & session config
app.config['JWT_SECRET_KEY'] = "LonvqDT63A0a8nKUMmc7x4UTdfr5Z08iDjRz68UAOxQ"
app.config['SECRET_KEY'] =  "LonvqDT63A0a8nKUMmc7x4UTdfr5Z08iDjRz68UAOxQ"
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config["SESSION_COOKIE_NAME"] = "admin_session"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] =  "None"  # or "None" if truly cross-origin
app.config["SESSION_COOKIE_SECURE"] = True    # True if HTTPS
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=24)

jwt = JWTManager(app)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
# Note: Using Flask's built-in session requires SECRET_KEY set. For production, consider server-side sessions or secure cookie settings.

# ------------- Database helper -------------

def get_db():
    """
    Returns a new PyMySQL connection.
    Caller must close it after use.
    """
    conn = pymysql.connect(
        host="echoschribbie.mysql.pythonanywhere-services.com",
        user="echoschribbie",
        password="sweetdelights342",
        db="echoschribbie$sweetdelightsdb",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False  # we will commit manually
    )
    return conn

# ------------- Utility functions -------------

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ------------- Routes -------------

# Utility: validate email format
EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

# Signup route
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json() or {}
        required_fields = ['firstName', 'lastName', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        first_name = data['firstName'].strip()
        last_name = data['lastName'].strip()
        email = data['email'].lower().strip()
        password = data['password']

        if not re.match(EMAIL_REGEX, email):
            return jsonify({'error': 'Invalid email format'}), 400

        conn = get_db()
        try:
            with conn.cursor() as cursor:
                # Check if user exists
                cursor.execute("SELECT id FROM users WHERE email=%s", (email,))
                if cursor.fetchone():
                    return jsonify({'error': 'User already exists'}), 400

                # Insert new user; initialize JSON columns as empty arrays
                hashed = generate_password_hash(password)
                now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
                cursor.execute("""
                    INSERT INTO users
                      (first_name, last_name, email, password, created_at, is_active, addresses, favorites)
                    VALUES
                      (%s, %s, %s, %s, %s, TRUE, JSON_ARRAY(), JSON_ARRAY())
                """, (first_name, last_name, email, hashed, now))
                conn.commit()
                user_id = str(cursor.lastrowid)
        finally:
            conn.close()

        # Issue JWT with identity as string
        access_token = create_access_token(identity=user_id)
        return jsonify({
            'message': 'User created successfully',
            'access_token': access_token,
            'user': {
                'id': user_id,
                'firstName': first_name,
                'lastName': last_name,
                'email': email
            }
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Unified login route: admin or normal user
@app.route('/api/signin', methods=['POST'])
def unified_login():
    data = request.get_json() or {}
    identifier = (data.get('identifier') or '').strip()
    password = data.get('password') or ''
    if not identifier or not password:
        return jsonify({'error': 'Identifier and password required'}), 400

    conn = get_db()
    try:
        # 1. Try admin login by username
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, username, password, email, role FROM admin_users WHERE username=%s",
                (identifier,)
            )
            admin = cursor.fetchone()
        if admin and check_password_hash(admin['password'], password):
            # Create JWT with admin role
            access_token = create_access_token(
                identity=str(admin['id']),
                additional_claims={'role': 'admin'}
            )
            # Set session cookie only for admin
            session['admin_id'] = str(admin['id'])
            session['admin_username'] = admin['username']
            session.permanent = True  # uses app.permanent_session_lifetime

            return jsonify({
                'message': 'Admin login successful',
                'access_token': access_token,
                'role': 'admin',
                'user': {
                    'id': str(admin['id']),
                    'username': admin['username'],
                    'email': admin['email'],
                    'role': admin['role']
                }
            }), 200

        # 2. Validate email format before normal user check
        if not re.match(EMAIL_REGEX, identifier.lower()):
            return jsonify({'error': 'Invalid email format'}), 400

        # 3. Try normal user login
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, first_name, last_name, email, password, is_active FROM users WHERE email=%s",
                (identifier.lower(),)
            )
            user = cursor.fetchone()
        if user and check_password_hash(user['password'], password):
            if not user.get('is_active', True):
                return jsonify({'error': 'Account is deactivated'}), 401
            user_id = str(user['id'])
            access_token = create_access_token(
                identity=user_id,
                additional_claims={'role': 'user'}
            )
            # Do NOT set any session cookie for normal users
            return jsonify({
                'message': 'User login successful',
                'access_token': access_token,
                'role': 'user',
                'user': {
                    'id': user_id,
                    'firstName': user['first_name'],
                    'lastName': user['last_name'],
                    'email': user['email']
                }
            }), 200

        return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# Profile route
@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()  # this is a string
        # If your DB id column is integer, cast:
        try:
            user_id_int = int(user_id)
        except ValueError:
            return jsonify({'error': 'Invalid user ID in token'}), 400

        conn = get_db()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id, first_name, last_name, email, created_at, is_active, addresses, favorites
                    FROM users WHERE id=%s
                """, (user_id_int,))
                user = cursor.fetchone()
        finally:
            conn.close()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Handle JSON columns: PyMySQL may return Python dict via automatic decoding,
        # or a JSON string. Normalize to Python list.
        def parse_json_field(val):
            if val is None:
                return []
            if isinstance(val, (list, dict)):
                return val
            try:
                return json.loads(val)
            except Exception:
                return []

        addresses = parse_json_field(user.get('addresses'))
        favorites = parse_json_field(user.get('favorites'))

        created_at = user.get('created_at')
        if isinstance(created_at, datetime):
            created_str = created_at.strftime('%Y-%m-%dT%H:%M:%SZ')
        else:
            created_str = str(created_at)

        user_data = {
            'id': str(user['id']),
            'firstName': user['first_name'],
            'lastName': user['last_name'],
            'email': user['email'],
            'createdAt': created_str,
            'isActive': bool(user['is_active']),
            'addresses': addresses,
            'favorites': favorites
        }
        return jsonify({'user': user_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 4. Add product
@app.route('/api/add_products', methods=['POST'])
def add_products():
    try:
        name = request.form.get('name')
        price = request.form.get('price')
        category_name = request.form.get('category_name')
        description = request.form.get('description')
        image = request.files.get('image')

        if not all([name, price, category_name, description]):
            return jsonify({'error': 'There are some missing fields required to be filled'}), 400

        if not image or not allowed_file(image.filename):
            return jsonify({'error': 'Invalid or missing image file'}), 400

        # Save image
        filename = secure_filename(image.filename)
        image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

        conn = get_db()
        try:
            with conn.cursor() as cursor:
                # Check or create category
                cursor.execute("SELECT id FROM categories WHERE name=%s", (category_name.strip(),))
                cat = cursor.fetchone()
                if cat:
                    category_id = cat['id']
                else:
                    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
                    cursor.execute(
                        """
                        INSERT INTO categories (name, created_at, is_active)
                        VALUES (%s, %s, TRUE)
                        """,
                    (category_name.strip(), now))
                    conn.commit()
                    category_id = cursor.lastrowid

                # Insert product; set default stock=0, rating=0
                now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
                cursor.execute("""
                    INSERT INTO products
                      (name, price, category_id, description, image, is_active, created_at, rating, stock)
                    VALUES (%s, %s, %s, %s, %s, TRUE, %s, 0, 0)
                """, (name.strip(), float(price), category_id, description.strip(), filename, now))
                conn.commit()
                product_id = cursor.lastrowid

        finally:
            conn.close()

        return jsonify({
            'message': 'Product added successfully',
            'product_id': product_id,
            'image_url': f"/uploads/{filename}"
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 5. Get products list with pagination, filtering, sorting
@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        category = request.args.get('category')
        sort_by = request.args.get('sort', 'name')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        search = request.args.get('search', '')

        offset = (page - 1) * limit

        # Base SQL
        sql_base = """
            SELECT p.id, p.name, p.price, p.description, p.image,
                   p.is_active, p.created_at, p.rating, p.stock,
                   c.name AS category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = TRUE
        """
        params = []

        if category:
            sql_base += " AND c.name = %s"
            params.append(category.strip())

        if search:
            sql_base += " AND (p.name LIKE %s OR p.description LIKE %s)"
            like_term = f"%{search}%"
            params.extend([like_term, like_term])

        # Determine sorting
        # Allowed sorts: name (alphabetical), price-low, price-high, rating, newest
        if sort_by == 'price-low':
            sql_base += " ORDER BY p.price ASC"
        elif sort_by == 'price-high':
            sql_base += " ORDER BY p.price DESC"
        elif sort_by == 'rating':
            sql_base += " ORDER BY p.rating DESC"
        elif sort_by == 'newest':
            sql_base += " ORDER BY p.created_at DESC"
        else:
            # default 'name'
            sql_base += " ORDER BY p.name ASC"

        # For total count, wrap base query without ORDER BY, LIMIT
        count_sql = f"SELECT COUNT(*) AS cnt FROM ({sql_base}) AS sub"
        # Add pagination
        sql_base += " LIMIT %s OFFSET %s"
        params_for_data = params.copy() + [limit, offset]

        conn = get_db()
        try:
            with conn.cursor() as cursor:
                # Total count
                cursor.execute(count_sql, params)
                total = cursor.fetchone()['cnt']
                # Fetch page
                cursor.execute(sql_base, params_for_data)
                rows = cursor.fetchall()
        finally:
            conn.close()

        # Convert datetime to ISO strings
        safe_rows = []
        for row in rows:
            row_safe = {
                'id': row['id'],
                'name': row['name'],
                'price': float(row['price']),
                'description': row['description'],
                'image': row['image'],
                'isActive': bool(row['is_active']),
                'createdAt': row['created_at'].strftime('%Y-%m-%dT%H:%M:%SZ') if isinstance(row['created_at'], datetime) else row['created_at'],
                'rating': float(row['rating']),
                'stock': row['stock'],
                'category_name': row['category_name']
            }
            safe_rows.append(row_safe)

        return jsonify({
            'products': safe_rows,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 6. Get single product
@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT p.id, p.name, p.price, p.description, p.image,
                           p.is_active, p.created_at, p.rating, p.stock,
                           c.name AS category_name
                    FROM products p
                    JOIN categories c ON p.category_id = c.id
                    WHERE p.id = %s AND p.is_active = TRUE
                """, (product_id,))
                prod = cursor.fetchone()
        finally:
            conn.close()

        if not prod:
            return jsonify({'error': 'Product not found'}), 404

        row = prod
        product_data = {
            'id': row['id'],
            'name': row['name'],
            'price': float(row['price']),
            'description': row['description'],
            'image': row['image'],
            'isActive': bool(row['is_active']),
            'createdAt': row['created_at'].strftime('%Y-%m-%dT%H:%M:%SZ') if isinstance(row['created_at'], datetime) else row['created_at'],
            'rating': float(row['rating']),
            'stock': row['stock'],
            'category_name': row['category_name']
        }
        return jsonify({'product': product_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500



# assume get_db() gives a pymysql connection
# and your products table has columns: id, name, price, category_id (or category_name logic), description, image, is_active, stock, low_stock_threshold

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """
    Update product fields. No admin check—any authenticated user may call.
    Expects JSON body with any of:
      name, price, category_name, description, image, isActive, stock, lowStockThreshold
    """
    data = request.get_json() or {}
    allowed_fields = ['name', 'price', 'category_name', 'description', 'image', 'isActive', 'stock', 'lowStockThreshold']
    updates = {}
    for key in allowed_fields:
        if key in data:
            updates[key] = data[key]
    if not updates:
        return jsonify({'error': 'No valid fields to update'}), 400

    conn = get_db()
    try:
        with conn.cursor() as cursor:
            # Handle category_name: find or create category, then set category_id
            if 'category_name' in updates:
                cat_name = updates.pop('category_name').strip()
                cursor.execute("SELECT id FROM categories WHERE name=%s", (cat_name,))
                cat = cursor.fetchone()
                if cat:
                    category_id = cat['id']
                else:
                    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
                    cursor.execute(
                        "INSERT INTO categories (name, created_at, is_active) VALUES (%s, %s, TRUE)",
                        (cat_name, now)
                    )
                    conn.commit()
                    category_id = cursor.lastrowid
                updates['category_id'] = category_id

            # Build SET clauses
            set_clauses = []
            params = []
            for field, val in updates.items():
                if field == 'isActive':
                    set_clauses.append("is_active=%s")
                    params.append(bool(val))
                elif field == 'stock':
                    set_clauses.append("stock=%s")
                    params.append(int(val))
                elif field == 'price':
                    set_clauses.append("price=%s")
                    params.append(float(val))
                elif field == 'lowStockThreshold':
                    # ensure your products table has low_stock_threshold column
                    set_clauses.append("low_stock_threshold=%s")
                    params.append(int(val))
                elif field == 'category_id':
                    set_clauses.append("category_id=%s")
                    params.append(val)
                else:
                    # name, description, image
                    set_clauses.append(f"{field}=%s")
                    params.append(val)
            if not set_clauses:
                return jsonify({'error': 'Nothing to update'}), 400
            params.append(product_id)
            sql = f"UPDATE products SET {', '.join(set_clauses)} WHERE id=%s"
            cursor.execute(sql, tuple(params))
            if cursor.rowcount == 0:
                return jsonify({'error': 'Product not found'}), 404
            conn.commit()
        return jsonify({'message': 'Product updated', 'data': updates}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """
    Soft-delete product by setting is_active=False. No admin check.
    """
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE products SET is_active=FALSE WHERE id=%s", (product_id,))
            if cursor.rowcount == 0:
                return jsonify({'error': 'Product not found'}), 404
            conn.commit()
        return jsonify({'message': 'Product deleted'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# 7. Get categories (with their products)
@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        conn = get_db()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, name, created_at, is_active FROM categories WHERE is_active = TRUE ORDER BY name ASC")
                cats = cursor.fetchall()

            result = []
            for cat in cats:
                cat_id = cat['id']
                with conn.cursor() as cursor2:
                    cursor2.execute("""
                        SELECT id, name, price, description, image, is_active, created_at, rating, stock
                        FROM products
                        WHERE category_id = %s AND is_active = TRUE
                    """, (cat_id,))
                    prods = cursor2.fetchall()
                # Build product list
                prod_list = []
                for p in prods:
                    prod_list.append({
                        'id': p['id'],
                        'name': p['name'],
                        'price': float(p['price']),
                        'description': p['description'],
                        'image': p['image'],
                        'isActive': bool(p['is_active']),
                        'createdAt': p['created_at'].strftime('%Y-%m-%dT%H:%M:%SZ') if isinstance(p['created_at'], datetime) else p['created_at'],
                        'rating': float(p['rating']),
                        'stock': p['stock']
                    })
                result.append({
                    'id': cat_id,
                    'name': cat['name'],
                    'createdAt': cat['created_at'].strftime('%Y-%m-%dT%H:%M:%SZ') if isinstance(cat['created_at'], datetime) else cat['created_at'],
                    'isActive': bool(cat['is_active']),
                    'products': prod_list
                })
        finally:
            conn.close()

        return jsonify({'categories': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 9. Admin logout
@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.clear()
    return jsonify({'message': 'Logout successful'}), 200

# 10. Get admin profile
@app.route('/api/admin/me', methods=['GET'])
def get_admin_profile():
    if 'admin_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    admin_id = session['admin_id']
    try:
        conn = get_db()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, username, email, role, created_at FROM admin_users WHERE id=%s", (admin_id,))
                admin = cursor.fetchone()
        finally:
            conn.close()

        if not admin:
            return jsonify({'error': 'Admin not found'}), 404

        admin_data = {
            'id': admin['id'],
            'username': admin['username'],
            'email': admin['email'],
            'role': admin['role'],
            'createdAt': admin['created_at'].strftime('%Y-%m-%dT%H:%M:%SZ') if isinstance(admin['created_at'], datetime) else admin['created_at']
        }
        return jsonify({'admin': admin_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 11. Admin analytics
@app.route('/api/admin/analytics', methods=['GET'])
def get_analytics():
    if 'admin_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    try:
        conn = get_db()
        analytics = {}
        try:
            with conn.cursor() as cursor:
                # total products
                cursor.execute("SELECT COUNT(*) AS cnt FROM products")
                analytics['total_products'] = cursor.fetchone()['cnt']
                # total orders
                cursor.execute("SELECT COUNT(*) AS cnt FROM orders")
                analytics['total_orders'] = cursor.fetchone()['cnt']
                # total customers
                cursor.execute("SELECT COUNT(*) AS cnt FROM users")
                analytics['total_customers'] = cursor.fetchone()['cnt']
                # total revenue
                cursor.execute("SELECT SUM(total) AS rev FROM orders")
                rev = cursor.fetchone()['rev']
                analytics['total_revenue'] = float(rev) if rev is not None else 0.0
                # recent orders (5)
                cursor.execute("""
                    SELECT o.id, o.user_id, o.total, o.created_at
                    FROM orders o
                    ORDER BY o.created_at DESC
                    LIMIT 5
                """)
                recent_orders = cursor.fetchall()
                # low stock products (stock < 10)
                cursor.execute("""
                    SELECT id, name, price, stock
                    FROM products
                    WHERE stock < 10
                """)
                low_stock_products = cursor.fetchall()

        finally:
            conn.close()

        # Convert datetimes & types
        recent_orders_safe = []
        for o in recent_orders:
            recent_orders_safe.append({
                'id': o['id'],
                'user_id': o['user_id'],
                'total': float(o['total']),
                'createdAt': o['created_at'].strftime('%Y-%m-%dT%H:%M:%SZ') if isinstance(o['created_at'], datetime) else o['created_at']
            })
        low_stock_safe = []
        for p in low_stock_products:
            low_stock_safe.append({
                'id': p['id'],
                'name': p['name'],
                'price': float(p['price']),
                'stock': p['stock']
            })

        return jsonify({'analytics': {
            'total_products': analytics['total_products'],
            'total_orders': analytics['total_orders'],
            'total_customers': analytics['total_customers'],
            'total_revenue': analytics['total_revenue'],
            'recent_orders': recent_orders_safe,
            'low_stock_products': low_stock_safe
        }}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 12. Initialize database with sample admin (similar to init_database())
# You can call this manually in a script or a separate route (protected).
@app.route('/api/admin/init', methods=['POST'])
def init_database():
    """
    Initialize database with a default admin user.
    Call this once manually (ensure secure access).
    """
    try:
        # Consider: require a special token or environment variable to allow initialization
        default_username = '$Uv#ndo'
        default_password = "{cooki$}267}"
        default_email = 'admin@sweetdelights.com'
        hashed = generate_password_hash(default_password)
        now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

        conn = get_db()
        try:
            with conn.cursor() as cursor:
                # Check if admin exists
                cursor.execute("SELECT id FROM admin_users WHERE username=%s", (default_username,))
                if cursor.fetchone():
                    return jsonify({'message': 'Admin already initialized'}), 200
                cursor.execute("""
                    INSERT INTO admin_users
                      (username, password, email, role, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                """, (default_username, hashed, default_email, 'admin', now))
                conn.commit()
        finally:
            conn.close()

        return jsonify({'message': 'Admin user created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 13. (Optional) Additional endpoints for orders, addresses, favorites, etc.
# Since your original code didn’t include explicit routes for addresses/favorites or full order creation,
# you can add them here as needed, using JSON columns in users or separate tables.

# Example: Add address to user
@app.route('/api/profile/addresses', methods=['POST'])
@jwt_required()
def add_address():
    """
    Example: expects JSON body with address details (e.g., { "address": "123 St", ... }).
    Appends to addresses JSON array in users.addresses.
    """
    try:
        user_id = get_jwt_identity()
        address_data = request.get_json()
        if not address_data:
            return jsonify({'error': 'Address data required'}), 400

        # Fetch existing addresses
        conn = get_db()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT addresses FROM users WHERE id=%s", (user_id,))
                row = cursor.fetchone()
                if not row:
                    return jsonify({'error': 'User not found'}), 404
                existing = row['addresses'] or []
                # Append new address object
                existing.append(address_data)
                # Update JSON column
                cursor.execute("UPDATE users SET addresses=%s WHERE id=%s", (pymysql.converters.escape_bytes(
                    # Convert Python list to JSON string
                    pymysql.escape_string(
                        pymysql.escape_object(existing).decode() if isinstance(existing, bytes) else
                        ( __import__('json').dumps(existing))
                    ).encode('utf-8')
                ), user_id))
                # However, above is complicated. Better: use JSON_SET or directly send JSON:
                # cursor.execute("UPDATE users SET addresses=%s WHERE id=%s", (json.dumps(existing), user_id))
                # But pymysql will send Python str to JSON column.
                # For clarity, let's use:
                import json
                cursor.execute("UPDATE users SET addresses=%s WHERE id=%s", (json.dumps(existing), user_id))
                conn.commit()
        finally:
            conn.close()

        return jsonify({'message': 'Address added', 'addresses': existing}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Example: Add favorite product to user
@app.route('/api/profile/favorites', methods=['POST'])
@jwt_required()
def add_favorite():
    """
    Expects JSON body: { "product_id": <int> }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        pid = data.get('product_id')
        if pid is None:
            return jsonify({'error': 'product_id is required'}), 400

        conn = get_db()
        try:
            with conn.cursor() as cursor:
                # Check product exists
                cursor.execute("SELECT id FROM products WHERE id=%s AND is_active=TRUE", (pid,))
                if not cursor.fetchone():
                    return jsonify({'error': 'Product not found'},), 404
                # Fetch existing favorites
                cursor.execute("SELECT favorites FROM users WHERE id=%s", (user_id,))
                row = cursor.fetchone()
                if not row:
                    return jsonify({'error': 'User not found'}), 404
                existing = row['favorites'] or []
                if pid in existing:
                    return jsonify({'message': 'Already in favorites', 'favorites': existing}), 200
                existing.append(pid)
                import json
                cursor.execute("UPDATE users SET favorites=%s WHERE id=%s", (json.dumps(existing), user_id))
                conn.commit()
        finally:
            conn.close()

        return jsonify({'message': 'Added to favorites', 'favorites': existing}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 14. (Optional) Order creation endpoint
@app.route('/api/orders', methods=['POST'])
@jwt_required()
def create_order():
    """
    Expects JSON: { "items": [ { "product_id": int, "quantity": int }, ... ] }
    Calculates total, inserts into orders/order_items.
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        items = data.get('items')
        if not items or not isinstance(items, list):
            return jsonify({'error': 'Items array is required'}), 400

        conn = get_db()
        try:
            total = 0.0
            # First, fetch prices and check stock (if needed)
            with conn.cursor() as cursor:
                for it in items:
                    pid = it.get('product_id')
                    qty = it.get('quantity', 0)
                    if pid is None or qty <= 0:
                        return jsonify({'error': 'Invalid item format'}), 400
                    cursor.execute("SELECT price, stock FROM products WHERE id=%s AND is_active=TRUE", (pid,))
                    prod = cursor.fetchone()
                    if not prod:
                        return jsonify({'error': f'Product {pid} not found'}), 404
                    price = float(prod['price'])
                    stock = prod['stock']
                    if stock < qty:
                        return jsonify({'error': f'Insufficient stock for product {pid}'}), 400
                    total += price * qty
                # Insert into orders
                now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
                cursor.execute("""
                    INSERT INTO orders (user_id, total, created_at)
                    VALUES (%s, %s, %s)
                """, (user_id, total, now))
                order_id = cursor.lastrowid
                # Insert items, deduct stock
                for it in items:
                    pid = it['product_id']
                    qty = it['quantity']
                    cursor.execute("SELECT price, stock FROM products WHERE id=%s", (pid,))
                    prod = cursor.fetchone()
                    price = float(prod['price'])
                    # Insert order_item
                    cursor.execute("""
                        INSERT INTO order_items (order_id, product_id, quantity, price)
                        VALUES (%s, %s, %s, %s)
                    """, (order_id, pid, qty, price))
                    # Deduct stock
                    new_stock = prod['stock'] - qty
                    cursor.execute("UPDATE products SET stock=%s WHERE id=%s", (new_stock, pid))
                conn.commit()

        finally:
            conn.close()

        return jsonify({'message': 'Order created', 'order_id': order_id, 'total': total}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 15. (Optional) Get user orders
@app.route('/api/orders', methods=['GET'])
@jwt_required()
def list_orders():
    try:
        user_id = get_jwt_identity()
        conn = get_db()
        orders_list = []
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, total, created_at FROM orders WHERE user_id=%s ORDER BY created_at DESC", (user_id,))
                orders = cursor.fetchall()
                for o in orders:
                    # Fetch items
                    cursor.execute("""
                        SELECT oi.product_id, oi.quantity, oi.price, p.name
                        FROM order_items oi
                        JOIN products p ON oi.product_id = p.id
                        WHERE oi.order_id=%s
                    """, (o['id'],))
                    items = cursor.fetchall()
                    items_safe = []
                    for it in items:
                        items_safe.append({
                            'product_id': it['product_id'],
                            'name': it['name'],
                            'quantity': it['quantity'],
                            'price': float(it['price'])
                        })
                    orders_list.append({
                        'order_id': o['id'],
                        'total': float(o['total']),
                        'createdAt': o['created_at'].strftime('%Y-%m-%dT%H:%M:%SZ') if isinstance(o['created_at'], datetime) else o['created_at'],
                        'items': items_safe
                    })
        finally:
            conn.close()

        return jsonify({'orders': orders_list}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Mpesa Payment Route
import requests # Handles HTTP requests
import datetime # Works with date and time
import base64 # Encoding data in Base64 format (used for authentication)
from requests.auth import HTTPBasicAuth # Handles Basic authentication

@app.route('/api/mpesa_payment', methods=['POST'])
def mpesa_payment():
    if request.method == 'POST':
        # Extract POST Values sent by the user
        amount = request.form['amount'] # Payment amount
        phone = request.form['phone'] # Customer's phone number

        # Provide consumer_key and consumer_secret provided by safaricom
        consumer_key = "GTWADFxIpUfDoNikNGqq1C3023evM6UH"# Your API Consumer Key
        consumer_secret = "amFbAoUByPV2rM5A"# Your Api Consumer Secret

        # Authenticate Yourself using above credentials to Safaricom Services, and Bearer Token this is used by safaricom for security identification purposes - Your are given Access
        api_URL = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"  # AUTH URL
        # Provide your consumer_key and consumer_secret
        response = requests.get(api_URL, auth=HTTPBasicAuth(consumer_key, consumer_secret))
        # Get response as Dictionary
        data = response.json()
        # Retrieve the Provide Token
        # Token allows you to proceed with the transaction
        access_token = "Bearer" + ' ' + data['access_token']

        #  GETTING THE PASSWORD
        timestamp = datetime.datetime.today().strftime('%Y%m%d%H%M%S')  # Current Time
        passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'  # Passkey(Safaricom Provided)
        business_short_code = "174379"  # Test Paybile (Safaricom Provided)
        # Combine above 3 Strings to get data variable
        data = business_short_code + passkey + timestamp

        # Why Convert Back to a String?
        # The base64.b64encode() function returns a byte string
        # Safaricom's API expects the password as normal string, not bytes
        # So, we decode it back to UTF-8 string using .decode()
        #UTF-8 (Unicode Transformation Format - 8 bit) is a character encoding system
        # Encode to Base64
        encoded = base64.b64encode(data.encode())
        password = encoded.decode()

        # BODY OR PAYLOAD Prepare the STK push Payload(Request Body)
        payload = {
            "BusinessShortCode": "174379",# The Paybill number
            "Password":password,# Generated Password
            "Timestamp": timestamp,# Current timedtamp
            "TransactionType": "CustomerPayBillOnline", # Payment type
            "Amount": amount,  # use 1 when testing
            "PartyA": phone,  # change to your number
            "PartyB": "174379",# Business Paybill Number
            "PhoneNumber": phone,# Customer's phone number (Must be in 254 format)
            "CallBackURL": "https://coding.co.ke/api/confirm.php",#  Where your information goes
            "AccountReference": "SokoGarden Online", # Business Reference
            "TransactionDesc": "Payments for Products" # Description of payment
        }

        # POPULAING THE HTTP HEADER, PROVIDE THE TOKEN ISSUED EARLIER
        headers = {
            "Authorization": access_token,# Include the access token
            "Content-Type": "application/json" # set the content in json format
        }

        # Specify STK Push  Trigger URL
        url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        # Create a POST Request to above url, providing headers, payload
        # Below triggers an STK Push to the phone number indicated in the payload and the amount.
        response = requests.post(url, json=payload, headers=headers)
        print(response.text) # Print the response for debugging
        # Give a JSON Response to the user
        return jsonify({"message": "An MPESA Prompt has been sent to Your Phone, Please Check & Complete Payment"})
        #  push meaning (SIM Toolkit) initiating payment process in your moblie app

# 16. Run app
if __name__ == '__main__':
    # For development; in production, use a WSGI server and proper environment variables
    app.run(debug=True)

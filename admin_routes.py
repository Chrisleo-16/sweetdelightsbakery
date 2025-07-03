from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client['sweet_delights_bakery']

# Admin credentials
ADMIN_CREDENTIALS = {
    'username': '$Uv#ns0',
    'password': '`{cooki£}267'
}

def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
        return doc
    return None

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

def is_admin(user_id):
    """Check if user is admin"""
    # In a real app, you'd check against admin users in database
    # For now, we'll use a simple check
    admin_user = db.admin_users.find_one({'_id': ObjectId(user_id)})
    return admin_user is not None

# Admin Authentication
@admin_bp.route('/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Check admin credentials
        if username == ADMIN_CREDENTIALS['username'] and password == ADMIN_CREDENTIALS['password']:
            # Create or get admin user record
            admin_user = db.admin_users.find_one({'username': username})
            if not admin_user:
                admin_data = {
                    'username': username,
                    'email': 'admin@sweetdelights.com',
                    'role': 'admin',
                    'createdAt': datetime.utcnow(),
                    'lastLogin': datetime.utcnow()
                }
                result = db.admin_users.insert_one(admin_data)
                admin_id = str(result.inserted_id)
            else:
                admin_id = str(admin_user['_id'])
                # Update last login
                db.admin_users.update_one(
                    {'_id': ObjectId(admin_id)},
                    {'$set': {'lastLogin': datetime.utcnow()}}
                )
            
            from flask_jwt_extended import create_access_token
            access_token = create_access_token(identity=admin_id)
            
            return jsonify({
                'message': 'Admin login successful',
                'access_token': access_token,
                'admin': {
                    'id': admin_id,
                    'username': username,
                    'role': 'admin'
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Dashboard Stats
@admin_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get product stats
        total_products = db.products.count_documents({'isActive': True})
        out_of_stock = db.products.count_documents({'isActive': True, 'stock': 0})
        low_stock = db.products.count_documents({
            'isActive': True,
            'stock': {'$gt': 0, '$lte': 10}  # Assuming 10 is low stock threshold
        })
        
        # Get order stats
        total_orders = db.orders.count_documents({})
        pending_orders = db.orders.count_documents({'status': 'processing'})
        
        # Get revenue stats (last 30 days)
        thirty_days_ago = datetime.utcnow().replace(day=1)  # Simplified to month start
        monthly_revenue = list(db.orders.aggregate([
            {'$match': {'createdAt': {'$gte': thirty_days_ago}}},
            {'$group': {'_id': None, 'total': {'$sum': '$total'}}}
        ]))
        
        revenue = monthly_revenue[0]['total'] if monthly_revenue else 0
        
        # Get customer stats
        total_customers = db.users.count_documents({'isActive': True})
        
        # Get inventory value
        inventory_value = list(db.products.aggregate([
            {'$match': {'isActive': True}},
            {'$group': {'_id': None, 'total': {'$sum': {'$multiply': ['$price', '$stock']}}}}
        ]))
        
        inventory_total = inventory_value[0]['total'] if inventory_value else 0
        
        return jsonify({
            'products': {
                'total': total_products,
                'outOfStock': out_of_stock,
                'lowStock': low_stock
            },
            'orders': {
                'total': total_orders,
                'pending': pending_orders
            },
            'revenue': {
                'monthly': round(revenue, 2)
            },
            'customers': {
                'total': total_customers
            },
            'inventory': {
                'totalValue': round(inventory_total, 2)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Product Management
@admin_bp.route('/products', methods=['GET'])
@jwt_required()
def get_admin_products():
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        category = request.args.get('category')
        stock_filter = request.args.get('stockFilter')
        search = request.args.get('search', '')
        
        # Build query
        query = {}
        if category and category != 'all':
            query['category'] = category
        
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]
        
        products = list(db.products.find(query).sort('name', 1))
        
        # Apply stock filter
        if stock_filter and stock_filter != 'all':
            if stock_filter == 'out-of-stock':
                products = [p for p in products if p['stock'] == 0]
            elif stock_filter == 'low-stock':
                products = [p for p in products if 0 < p['stock'] <= p.get('lowStockThreshold', 10)]
            elif stock_filter == 'in-stock':
                products = [p for p in products if p['stock'] > p.get('lowStockThreshold', 10)]
        
        return jsonify({'products': serialize_docs(products)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'category', 'price', 'stock']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        product_data = {
            'name': data['name'],
            'description': data.get('description', ''),
            'price': float(data['price']),
            'category': data['category'],
            'image': data.get('image', '/placeholder.svg'),
            'rating': 0.0,
            'reviews': 0,
            'ingredients': data.get('ingredients', []),
            'allergens': data.get('allergens', []),
            'isActive': True,
            'stock': int(data['stock']),
            'lowStockThreshold': int(data.get('lowStockThreshold', 10)),
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        
        result = db.products.insert_one(product_data)
        
        return jsonify({
            'message': 'Product created successfully',
            'productId': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/products/<product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Check if product exists
        product = db.products.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Update fields
        update_data = {
            'updatedAt': datetime.utcnow()
        }
        
        if 'name' in data:
            update_data['name'] = data['name']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'price' in data:
            update_data['price'] = float(data['price'])
        if 'category' in data:
            update_data['category'] = data['category']
        if 'image' in data:
            update_data['image'] = data['image']
        if 'stock' in data:
            update_data['stock'] = int(data['stock'])
        if 'lowStockThreshold' in data:
            update_data['lowStockThreshold'] = int(data['lowStockThreshold'])
        if 'isActive' in data:
            update_data['isActive'] = data['isActive']
        
        db.products.update_one(
            {'_id': ObjectId(product_id)},
            {'$set': update_data}
        )
        
        return jsonify({'message': 'Product updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/products/<product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        # Check if product exists
        product = db.products.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Soft delete - set isActive to False
        db.products.update_one(
            {'_id': ObjectId(product_id)},
            {'$set': {'isActive': False, 'updatedAt': datetime.utcnow()}}
        )
        
        return jsonify({'message': 'Product deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/products/<product_id>/stock', methods=['PUT'])
@jwt_required()
def update_product_stock(product_id):
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        new_stock = data.get('stock')
        
        if new_stock is None:
            return jsonify({'error': 'Stock value is required'}), 400
        
        # Check if product exists
        product = db.products.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        db.products.update_one(
            {'_id': ObjectId(product_id)},
            {'$set': {'stock': int(new_stock), 'updatedAt': datetime.utcnow()}}
        )
        
        return jsonify({'message': 'Stock updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Inventory Management
@admin_bp.route('/inventory', methods=['GET'])
@jwt_required()
def get_inventory():
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get all products with inventory details
        products = list(db.products.find({'isActive': True}).sort('name', 1))
        
        inventory_items = []
        for product in products:
            inventory_items.append({
                'id': str(product['_id']),
                'name': product['name'],
                'category': product['category'],
                'currentStock': product.get('stock', 0),
                'maxCapacity': product.get('maxCapacity', 100),
                'lowStockThreshold': product.get('lowStockThreshold', 10),
                'reorderPoint': product.get('reorderPoint', 5),
                'lastRestocked': product.get('lastRestocked', product.get('updatedAt', datetime.utcnow())).isoformat() if isinstance(product.get('lastRestocked', product.get('updatedAt')), datetime) else product.get('lastRestocked', '2024-01-01'),
                'supplier': product.get('supplier', 'Default Supplier')
            })
        
        return jsonify({'inventory': inventory_items}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/inventory/<product_id>/restock', methods=['POST'])
@jwt_required()
def restock_item(product_id):
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        # Check if product exists
        product = db.products.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        max_capacity = product.get('maxCapacity', 100)
        
        db.products.update_one(
            {'_id': ObjectId(product_id)},
            {
                '$set': {
                    'stock': max_capacity,
                    'lastRestocked': datetime.utcnow(),
                    'updatedAt': datetime.utcnow()
                }
            }
        )
        
        return jsonify({'message': 'Item restocked successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Order Management
@admin_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_admin_orders():
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        status = request.args.get('status')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        # Build query
        query = {}
        if status and status != 'all':
            query['status'] = status
        
        skip = (page - 1) * limit
        orders = list(db.orders.find(query)
                     .sort('createdAt', -1)
                     .skip(skip)
                     .limit(limit))
        
        total = db.orders.count_documents(query)
        
        # Populate user details
        for order in orders:
            user = db.users.find_one({'_id': ObjectId(order['userId'])})
            if user:
                order['customer'] = {
                    'name': f"{user['firstName']} {user['lastName']}",
                    'email': user['email']
                }
        
        return jsonify({
            'orders': serialize_docs(orders),
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/orders/<order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'error': 'Status is required'}), 400
        
        valid_statuses = ['processing', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400
        
        # Check if order exists
        order = db.orders.find_one({'_id': ObjectId(order_id)})
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        db.orders.update_one(
            {'_id': ObjectId(order_id)},
            {'$set': {'status': new_status, 'updatedAt': datetime.utcnow()}}
        )
        
        return jsonify({'message': 'Order status updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Analytics
@admin_bp.route('/analytics/sales', methods=['GET'])
@jwt_required()
def get_sales_analytics():
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        period = request.args.get('period', 'week')  # week, month, year
        
        # Calculate date range
        if period == 'week':
            start_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            start_date = start_date.replace(day=start_date.day - 7)
        elif period == 'month':
            start_date = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:  # year
            start_date = datetime.utcnow().replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Sales by day
        sales_pipeline = [
            {'$match': {'createdAt': {'$gte': start_date}}},
            {
                '$group': {
                    '_id': {
                        'year': {'$year': '$createdAt'},
                        'month': {'$month': '$createdAt'},
                        'day': {'$dayOfMonth': '$createdAt'}
                    },
                    'total': {'$sum': '$total'},
                    'orders': {'$sum': 1}
                }
            },
            {'$sort': {'_id': 1}}
        ]
        
        sales_data = list(db.orders.aggregate(sales_pipeline))
        
        # Top products
        top_products_pipeline = [
            {'$match': {'createdAt': {'$gte': start_date}}},
            {'$unwind': '$items'},
            {
                '$group': {
                    '_id': '$items.productId',
                    'name': {'$first': '$items.name'},
                    'quantity': {'$sum': '$items.quantity'},
                    'revenue': {'$sum': '$items.total'}
                }
            },
            {'$sort': {'quantity': -1}},
            {'$limit': 10}
        ]
        
        top_products = list(db.orders.aggregate(top_products_pipeline))
        
        return jsonify({
            'salesData': sales_data,
            'topProducts': top_products
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Export Data
@admin_bp.route('/export/products', methods=['GET'])
@jwt_required()
def export_products():
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        products = list(db.products.find({'isActive': True}).sort('name', 1))
        
        export_data = []
        for product in products:
            stock_status = 'Out of Stock' if product.get('stock', 0) == 0 else 'Low Stock' if product.get('stock', 0) <= product.get('lowStockThreshold', 10) else 'In Stock'
            
            export_data.append({
                'name': product['name'],
                'category': product['category'],
                'price': product['price'],
                'stock': product.get('stock', 0),
                'status': stock_status,
                'lastUpdated': product.get('updatedAt', datetime.utcnow()).strftime('%Y-%m-%d %H:%M:%S')
            })
        
        return jsonify({'data': export_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
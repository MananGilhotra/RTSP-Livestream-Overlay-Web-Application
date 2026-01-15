"""
RTSP Livestream Overlay - Flask Backend
Handles video streaming (MJPEG), overlay CRUD, and JWT authentication.
"""

import cv2
from flask import Flask, Response, request, jsonify, g, send_from_directory
from flask_cors import CORS
from bson import ObjectId
import os
from dotenv import load_dotenv
import uuid
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# File upload configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "rtsp-overlay-secret-key-change-in-production")
JWT_EXPIRATION_HOURS = 24

# MongoDB Configuration - Optional
MONGO_URI = os.getenv("MONGO_URI", "")
mongo = None
use_mongodb = False

if MONGO_URI and MONGO_URI != "":
    try:
        from flask_pymongo import PyMongo
        app.config["MONGO_URI"] = MONGO_URI
        mongo = PyMongo(app)
        use_mongodb = True
        print("✓ MongoDB connected successfully")
    except Exception as e:
        print(f"⚠ MongoDB connection failed: {e}")
        print("  Using in-memory storage instead")
        use_mongodb = False
else:
    print("⚠ No MONGO_URI provided, using in-memory storage")

# In-memory storage fallback
in_memory_overlays = []
in_memory_users = []

# Video source configuration - can be changed dynamically
current_video_source = os.getenv("VIDEO_SOURCE", "0")
stream_active = False


def get_video_source():
    """Get the video source - either RTSP URL or webcam index."""
    global current_video_source
    try:
        return int(current_video_source)
    except ValueError:
        return current_video_source


def generate_frames():
    """Generator function to capture frames from video source."""
    source = get_video_source()
    camera = cv2.VideoCapture(source)
    
    if not camera.isOpened():
        print(f"Error: Could not open video source: {source}")
        return
    
    try:
        while True:
            success, frame = camera.read()
            if not success:
                camera.release()
                camera = cv2.VideoCapture(source)
                continue
            
            # Flip frame horizontally to fix mirrored camera
            frame = cv2.flip(frame, 1)
            
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if not ret:
                continue
                
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    finally:
        camera.release()


# ==================== JWT AUTHENTICATION ====================

def token_required(f):
    """Decorator to protect routes with JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            g.current_user_id = data['user_id']
            g.current_user_email = data['email']
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token is invalid"}), 401
        
        return f(*args, **kwargs)
    return decorated


def generate_token(user_id, email):
    """Generate JWT token for a user."""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


# ==================== AUTH ROUTES ====================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required"}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        
        # Check if user exists
        if use_mongodb:
            existing = mongo.db.users.find_one({"email": email})
            if existing:
                return jsonify({"error": "Email already registered"}), 400
            
            # Hash password and create user
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            user = {
                "email": email,
                "password_hash": password_hash,
                "created_at": datetime.utcnow()
            }
            result = mongo.db.users.insert_one(user)
            user_id = str(result.inserted_id)
        else:
            existing = next((u for u in in_memory_users if u['email'] == email), None)
            if existing:
                return jsonify({"error": "Email already registered"}), 400
            
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            user_id = str(uuid.uuid4())
            user = {
                "_id": user_id,
                "email": email,
                "password_hash": password_hash,
                "created_at": datetime.utcnow()
            }
            in_memory_users.append(user)
        
        token = generate_token(user_id, email)
        
        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "user": {"id": user_id, "email": email}
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login and get JWT token."""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required"}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        if use_mongodb:
            user = mongo.db.users.find_one({"email": email})
        else:
            user = next((u for u in in_memory_users if u['email'] == email), None)
        
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401
        
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash']):
            return jsonify({"error": "Invalid email or password"}), 401
        
        user_id = str(user['_id'])
        token = generate_token(user_id, email)
        
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {"id": user_id, "email": email}
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user():
    """Get current authenticated user."""
    return jsonify({
        "user": {
            "id": g.current_user_id,
            "email": g.current_user_email
        }
    }), 200


# ==================== VIDEO STREAMING ====================

@app.route('/video_feed')
def video_feed():
    """Video streaming route."""
    return Response(
        generate_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )


@app.route('/api/stream/source', methods=['POST'])
def set_stream_source():
    """Set the video stream source (RTSP URL or webcam)."""
    global current_video_source, stream_active
    try:
        data = request.get_json()
        source = data.get('source', '0')
        
        # Validate source
        if not source:
            return jsonify({"error": "Source is required"}), 400
        
        current_video_source = source
        stream_active = True
        
        return jsonify({
            "message": "Stream source updated",
            "source": current_video_source,
            "active": stream_active
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/stream/source', methods=['GET'])
def get_stream_source():
    """Get the current video stream source."""
    return jsonify({
        "source": current_video_source,
        "active": stream_active
    }), 200


@app.route('/api/stream/stop', methods=['POST'])
def stop_stream():
    """Stop the current stream."""
    global stream_active
    stream_active = False
    return jsonify({"message": "Stream stopped", "active": False}), 200


# ==================== OVERLAY CRUD API (Protected) ====================

def serialize_overlay(overlay):
    """Convert MongoDB document to JSON-serializable dict."""
    if '_id' in overlay and not isinstance(overlay['_id'], str):
        overlay['_id'] = str(overlay['_id'])
    if 'user_id' in overlay and not isinstance(overlay['user_id'], str):
        overlay['user_id'] = str(overlay['user_id'])
    return overlay


@app.route('/api/overlays', methods=['GET'])
@token_required
def get_overlays():
    """Get all overlays for the current user."""
    try:
        user_id = g.current_user_id
        
        if use_mongodb:
            overlays = list(mongo.db.overlays.find({"user_id": user_id}))
            return jsonify([serialize_overlay(o) for o in overlays]), 200
        else:
            user_overlays = [o for o in in_memory_overlays if o.get('user_id') == user_id]
            return jsonify(user_overlays), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/overlays', methods=['POST'])
@token_required
def create_overlay():
    """Create a new overlay."""
    try:
        data = request.get_json()
        user_id = g.current_user_id
        
        required_fields = ['type', 'content', 'x', 'y', 'width', 'height']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        if data['type'] not in ['text', 'image']:
            return jsonify({"error": "Type must be 'text' or 'image'"}), 400
        
        overlay = {
            "type": data['type'],
            "content": data['content'],
            "x": int(data['x']),
            "y": int(data['y']),
            "width": int(data['width']),
            "height": int(data['height']),
            "user_id": user_id
        }
        
        if use_mongodb:
            result = mongo.db.overlays.insert_one(overlay)
            overlay['_id'] = str(result.inserted_id)
        else:
            overlay['_id'] = str(uuid.uuid4())
            in_memory_overlays.append(overlay)
        
        return jsonify(serialize_overlay(overlay)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/overlays/<overlay_id>', methods=['PUT'])
@token_required
def update_overlay(overlay_id):
    """Update an existing overlay."""
    try:
        data = request.get_json()
        user_id = g.current_user_id
        
        update_fields = {}
        allowed_fields = ['type', 'content', 'x', 'y', 'width', 'height']
        
        for field in allowed_fields:
            if field in data:
                if field in ['x', 'y', 'width', 'height']:
                    update_fields[field] = int(data[field])
                else:
                    update_fields[field] = data[field]
        
        if not update_fields:
            return jsonify({"error": "No valid fields to update"}), 400
        
        if use_mongodb:
            from bson.errors import InvalidId
            try:
                obj_id = ObjectId(overlay_id)
            except InvalidId:
                return jsonify({"error": "Invalid overlay ID"}), 400
            
            result = mongo.db.overlays.update_one(
                {"_id": obj_id, "user_id": user_id},
                {"$set": update_fields}
            )
            
            if result.matched_count == 0:
                return jsonify({"error": "Overlay not found"}), 404
            
            updated = mongo.db.overlays.find_one({"_id": obj_id})
            return jsonify(serialize_overlay(updated)), 200
        else:
            for overlay in in_memory_overlays:
                if overlay['_id'] == overlay_id and overlay.get('user_id') == user_id:
                    overlay.update(update_fields)
                    return jsonify(overlay), 200
            return jsonify({"error": "Overlay not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/overlays/<overlay_id>', methods=['DELETE'])
@token_required
def delete_overlay(overlay_id):
    """Delete an overlay by ID."""
    try:
        user_id = g.current_user_id
        
        if use_mongodb:
            from bson.errors import InvalidId
            try:
                obj_id = ObjectId(overlay_id)
            except InvalidId:
                return jsonify({"error": "Invalid overlay ID"}), 400
            
            result = mongo.db.overlays.delete_one({"_id": obj_id, "user_id": user_id})
            
            if result.deleted_count == 0:
                return jsonify({"error": "Overlay not found"}), 404
        else:
            global in_memory_overlays
            original_len = len(in_memory_overlays)
            in_memory_overlays = [o for o in in_memory_overlays 
                                  if not (o['_id'] == overlay_id and o.get('user_id') == user_id)]
            if len(in_memory_overlays) == original_len:
                return jsonify({"error": "Overlay not found"}), 404
        
        return jsonify({"message": "Overlay deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== IMAGE UPLOAD ====================

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/upload', methods=['POST'])
@token_required
def upload_image():
    """Upload an image file."""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "File type not allowed. Use: png, jpg, jpeg, gif, webp"}), 400
        
        # Generate unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        file.save(filepath)
        
        # Return URL to access the image
        image_url = f"http://localhost:5001/uploads/{filename}"
        
        return jsonify({
            "message": "Image uploaded successfully",
            "url": image_url,
            "filename": filename
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/uploads/<filename>')
def serve_upload(filename):
    """Serve uploaded images."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "mongodb": use_mongodb
    }), 200


if __name__ == '__main__':
    print("Starting RTSP Livestream Overlay Backend...")
    print(f"Video source: {current_video_source}")
    print(f"Storage: {'MongoDB' if use_mongodb else 'In-Memory'}")
    print("Server running at http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)

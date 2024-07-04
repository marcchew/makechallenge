# main.py, flask backend
from flask import Flask, request, render_template, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from werkzeug.utils import secure_filename
import os
from flask_migrate import Migrate
from flask_cors import CORS  # Import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from solana_pay import PaymentRequest, SolanaPay
from solana.publickey import PublicKey
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from transformers import pipeline
import uuid
import requests
import json

# Initialize the Flask application
application = Flask(__name__)


application.secret_key = 'your_secret_key'

current_directory = os.path.dirname(os.path.abspath(__file__))
application.config['SECRET_KEY'] = 'your_strong_secret_key'
application.config["JWT_SECRET_KEY"] = 'your_jwt_secret_key'
application.config['JWT_TOKEN_LOCATION'] = ['headers']

# Configure the application to store uploaded images in the static/uploads folder
application.config['UPLOAD_FOLDER'] = os.path.join(current_directory, 'static/uploads')
application.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(current_directory, 'database.db')}"

# Ensure the upload directory exists
if not os.path.exists(application.config['UPLOAD_FOLDER']):
    os.makedirs(application.config['UPLOAD_FOLDER'])

# Initialize the database
db = SQLAlchemy(application)

# Initialize flask migrate
migrate = Migrate(application, db)

# Initial
jwt = JWTManager(application)

# Initialize CORS
CORS(application, supports_credentials=True)

# Initialize the spam detection pipeline
spam_detector = pipeline('text-classification', model='CalamitousVisibility/enron-spam-checker-10000')


# Define the User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(150), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    coins = db.Column(db.Integer, default=0)
    diamonds = db.Column(db.Integer, default=0)
    wallet_address = db.Column(db.String(150), default="")

# Define the Report model
class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    latitude = db.Column(db.String(150), nullable=False)
    longitude = db.Column(db.String(150), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    tags = db.Column(db.String(150), nullable=True)
    urgency = db.Column(db.String(150), nullable=True)
    severity = db.Column(db.String(150), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='Pending')
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    image_filename = db.Column(db.String(150), nullable=True)
    user = db.Column(db.Integer, nullable=False)

# Ensure the database tables are created
with application.app_context():
    db.create_all()

COINS_TOKEN_ADDRESS = "CRU7an8xhciarBgF7pQo1orUbv6hxt3vXa2vZotPBDWE"
DIAMONDS_TOKEN_ADDRESS = "LhPxyYRYyELFs45VvSNqvWZp994ZnDmXEqXqocTZdUg"

# Routes

@application.after_request
def after_request(response):
    # response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@application.route('/')
def landing():
    return jsonify({"message": "Welcome to the API"})

@application.route('/check_login', methods=['GET'])
def check_login():
    print("Session contents:", session)
    if 'username' in session:
        print("Session contents:", session)
        return jsonify(logged_in=True)
    return jsonify(logged_in=False)

@application.route('/login', methods=['POST'])
def login():

    data = request.json
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, password):
        access_token = create_access_token(identity=user.id)
        admin = user.username == 'admin'
        return jsonify({"message": "Login successful","token": access_token, "username": user.username, "user_id": user.id, "isAdmin": admin})
    else:
        return jsonify({"error": "Invalid username or password"}), 401


@application.route('/register', methods=['POST'])
def register():

    data = request.json
    username = data.get('username')
    password = data.get('password')
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409
    else:
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Registration successful"}), 201


@application.route('/upload', methods=['GET'])
def upload():
    print("Session contents:", session)
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"message": "Upload endpoint"})


@application.route('/docs', methods=['GET'])
def docs():
    print("Session contents:", session)
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"message": "Docs endpoint"})




@application.route('/submit', methods=['POST'])
@jwt_required()
def submit():

    print("submit")
    user_id = get_jwt_identity()
    print("hi")
    print(user_id)
    user = User.query.filter_by(id=user_id).first()
    print("user:",user)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.form
    title = data.get('title')
    description = data.get('description')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    name = data.get('name')
    tags = data.get('tags')
    urgency = data.get('urgency')
    severity = data.get('severity')
    image = request.files.get('image')
    user = user_id
    if not title or not description or not latitude or not longitude or not name or not image:
        print(title, description, latitude, longitude, name, image)
        return jsonify({"error": "All fields are required"}), 400
        
    # Spam detection
    spam_result = spam_detector(description)[0]
    if spam_result['label'] == 'spam':
        status = 'Potential Spam'
    else:
        status = 'Pending'

    # Get the original filename from the image object or generate a unique filename
    original_filename = secure_filename(image.filename)
    if original_filename.strip() == '':
        original_filename = str(uuid.uuid4())  # Generate a random filename if original is empty
    
    # Split the filename and extension
    filename, file_extension = os.path.splitext(original_filename)
    
    # Generate a unique filename
    unique_filename = original_filename
    counter = 1
    while os.path.exists(os.path.join(application.config['UPLOAD_FOLDER'], unique_filename)):
        unique_filename = f"{filename}_{counter}{file_extension}"
        counter += 1
    
    # Save the image with the unique filename
    image.save(os.path.join(application.config['UPLOAD_FOLDER'], unique_filename))
    print("id", user_id)
    new_report = Report(
        title=title,
        description=description,
        latitude=latitude,
        longitude=longitude,
        name=name,
        tags=tags,
        urgency=urgency,
        severity=severity,
        image_filename=unique_filename,
        user=int(user_id)
    )
    db.session.add(new_report)
    db.session.commit()
    return jsonify({"message": "Report submitted successfully","success":True}), 201





# only an admin should be able to access this route
@application.route('/report/<int:id>', methods=['GET'])
@jwt_required()
def singleReport(id):
    user_id = get_jwt_identity()
 
    user = User.query.filter_by(id=user_id).first()
    if user is None:
        return jsonify({"error": "User not found"}), 404
    isAdmin = user.username == 'admin' if user.username else False
    if not isAdmin:
        return jsonify({"error": "Unauthorized"}), 401
    
    report = Report.query.get_or_404(id)
    print(report.to_dict())
    return jsonify(report.to_dict())

@application.route('/report/<int:id>', methods=['POST'])
@jwt_required()
def edit(id):

    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if user is None:
        return jsonify({"error": "User not found"}), 404
    isAdmin = user.username == 'admin' if user.username else False
    if not isAdmin:
        return jsonify({"error": "Unauthorized"}), 401
    report = Report.query.get_or_404(id)
    data = request.json
    print(data)
    report.status = data.get("status")
    print(report.status)
    db.session.commit()
    return jsonify({"message": "Report updated successfully"}),201


@application.route('/admin', methods=['GET'])
@jwt_required()
def admin():
    user_id = get_jwt_identity()

    user = User.query.filter_by(id=user_id).first()
   
    isAdmin = user.username == 'admin' if user.username else False
    print("isAdmin:", isAdmin)
    if not isAdmin:
        return jsonify({"error": "Unauthorized"}), 401
    reports = Report.query.all()
    return jsonify([report.to_dict() for report in reports])

from datetime import timedelta,timezone
import json
application.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

@application.after_request
def refresh_expiring_jwts(response):
    try:
        exp_timestamp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
        if target_timestamp > exp_timestamp:
            access_token = create_access_token(identity=get_jwt_identity())
            data = response.get_json()
            if type(data) is dict:
                data["access_token"] = access_token 
                response.data = json.dumps(data)
        return response
    except (RuntimeError, KeyError):
        # Case where there is not a valid JWT. Just return the original respone
        return response

@application.route('/admin/award', methods=['POST'])
@jwt_required()
def award():

    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if user is None:
        return jsonify({"error": "User not found"}), 404
    isAdmin = user.username == 'admin' if user.username else False
    if not isAdmin:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    recipientid = data.get('user')
    print(recipientid)
    coins = data.get('coins', 0)
    diamonds = data.get('diamonds', 0)
    recipient = User.query.filter_by(id=recipientid).first()
    if recipient is None:
        print(404)
        return jsonify({"error": "Recipient not found"}), 404
    
    recipient.coins += int(coins)
    recipient.diamonds += int(diamonds)
    print(recipient.coins, recipient.diamonds)
    
    db.session.commit()
    return jsonify({"message": "Award successful", "new_coins_balance": recipient.coins, "new_diamonds_balance": recipient.diamonds}), 200

from_wallet = 'GeKNdVFKAFuUhVti3648AgHxNYMxdccsrxAhgrTbztFf'
@application.route('/swap', methods=['POST'])
@jwt_required()
def swap():
    sPay = SolanaPay("https://api.testnet.solana.com")
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if user is None:
        return jsonify({"error": "User not found"}), 404
    data = request.json
    coins = int(data.get('coins', 0))
    diamonds = int(data.get('diamonds', 0))
    recieve_currency = 'WSOL' # Only option for now
    if (coins > user.coins or diamonds > user.diamonds):
        return jsonify({"error": "Not enough currency"}), 400
    exchangeD = 1500000 // 1000000000
    exchangeC = 150000 // 1000000000
    nSol = diamonds * exchangeD + coins * exchangeC
    payment_request = PaymentRequest(recipient=PublicKey(user.wallet_address),
                                     amount=nSol,
                                     reference=[
                                         PublicKey(user.wallet_address)],
                                     message="test")
    trans = sPay.create_transfer_transaction(PublicKey(from_wallet), payment_request)
    return jsonify({"message": "Payment successful", "new_coins_balance": user.coins, "new_diamonds_balance": user.diamonds}), 200

    


    

@application.route('/user/reports', methods=['GET'])
@jwt_required()
def api_reports():
    user_id = get_jwt_identity()
 
    user = User.query.filter_by(id=user_id).first()
    if user is None:
        return jsonify({"error": "User not found"}), 404
    reports = Report.query.filter_by(user=user.id).all()  # Get all reports submitted by the user
    return jsonify([report.to_dict() for report in reports]), 200
   

@application.route('/api/getUsername', methods=['GET'])
def get_username():
    if 'user_id' in session:
        user = User.query.filter_by(id=session['user_id']).first()
        return jsonify({'username': user.username}), 200
    return jsonify({'error': 'Not logged in'}), 401

@application.route('/getuserfield/<field>', methods=['GET'])
@jwt_required()
def getuserfield(field):
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    print("field", field)
    return jsonify({field: getattr(user, field)}) 

@application.route('/update/<field>', methods=['POST'])
@jwt_required()
def update(field):

    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        data = request.json
        value = data.get('value')

        # Check if the field exists in the User class
        if hasattr(User, field):
            # Update the attribute dynamically
            setattr(user, field, value)
        else:
            return jsonify({"error": f"Invalid field: {field}"}), 400

        db.session.commit()  # Commit the changes to the database

        return jsonify({"message": f"Updated {field} successfully"}), 200

    except Exception as e:
        db.session.rollback()  # Rollback in case of any exception
        return jsonify({"error": str(e)}), 500



    
@application.route('/api/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200
    
# Custom method to serialize Report objects
def report_to_dict(self):
    return {
        'id': self.id,
        'title': self.title,
        'description': self.description,
        'latitude': self.latitude,
        'longitude': self.longitude,
        'name': self.name,
        'tags': self.tags,
        'urgency': self.urgency,
        'severity': self.severity,
        'status': self.status,
        'timestamp': self.timestamp,
        'image_filename': self.image_filename,
        'user': self.user
    }


Report.to_dict = report_to_dict

if __name__ == '__main__':
    application.run(debug=True, use_reloader=False, host='0.0.0.0', port=8080)
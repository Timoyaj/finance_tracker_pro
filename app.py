from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db, login_manager, mail, migrate
from datetime import datetime, timedelta
from flask_mail import Message
import os
from dotenv import load_dotenv
import secrets

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///finance_tracker.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Email configuration
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)

    # Configure login
    login_manager.login_view = 'login'

    # Import models
    from models import User, Transaction
    
    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    def send_reset_email(user):
        token = user.generate_reset_token()
        msg = Message('Password Reset Request',
                    sender=app.config['MAIL_USERNAME'],
                    recipients=[user.email])
        
        reset_url = url_for('reset_password', token=token, _external=True)
        msg.body = f'''To reset your password, visit the following link:
{reset_url}

If you did not make this request, simply ignore this email.
This link will expire in 1 hour.
'''
        mail.send(msg)

    @app.route('/')
    @login_required
    def index():
        return render_template('index.html')

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if current_user.is_authenticated:
            return redirect(url_for('index'))

        if request.method == 'POST':
            try:
                if request.is_json:
                    data = request.get_json()
                else:
                    data = request.form

                # Check if user exists
                if User.query.filter_by(username=data.get('username')).first():
                    return jsonify({'success': False, 'error': 'Username already exists'}), 400

                if User.query.filter_by(email=data.get('email')).first():
                    return jsonify({'success': False, 'error': 'Email already exists'}), 400

                # Create new user
                new_user = User(
                    username=data.get('username'),
                    email=data.get('email'),
                    password_hash=generate_password_hash(data.get('password'))
                )

                db.session.add(new_user)
                db.session.commit()

                if request.is_json:
                    return jsonify({'success': True}), 201
                return redirect(url_for('login'))

            except Exception as e:
                db.session.rollback()
                if request.is_json:
                    return jsonify({'success': False, 'error': str(e)}), 400
                return render_template('register.html', error=str(e))

        return render_template('register.html')

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for('index'))

        if request.method == 'POST':
            if request.is_json:
                data = request.get_json()
            else:
                data = request.form

            user = User.query.filter_by(username=data.get('username')).first()

            if user and check_password_hash(user.password_hash, data.get('password')):
                login_user(user)
                if request.is_json:
                    return jsonify({'success': True}), 200
                return redirect(url_for('index'))

            if request.is_json:
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
            return render_template('login.html', error='Invalid credentials')

        return render_template('login.html')

    @app.route('/logout')
    @login_required
    def logout():
        logout_user()
        return redirect(url_for('login'))

    @app.route('/reset_password_request', methods=['GET', 'POST'])
    def reset_password_request():
        if current_user.is_authenticated:
            return redirect(url_for('index'))
        
        if request.method == 'POST':
            email = request.form.get('email')
            user = User.query.filter_by(email=email).first()
            if user:
                send_reset_email(user)
                flash('Check your email for password reset instructions.', 'info')
                return redirect(url_for('login'))
            else:
                flash('Email address not found.', 'error')
        
        return render_template('reset_password_request.html')

    @app.route('/reset_password/<token>', methods=['GET', 'POST'])
    def reset_password(token):
        if current_user.is_authenticated:
            return redirect(url_for('index'))
        
        user = User.query.filter_by(reset_token=token).first()
        if not user or not user.verify_reset_token(token):
            flash('Invalid or expired reset token.', 'error')
            return redirect(url_for('reset_password_request'))
        
        if request.method == 'POST':
            password = request.form.get('password')
            user.password_hash = generate_password_hash(password)
            user.reset_token = None
            user.reset_token_expiry = None
            db.session.commit()
            flash('Your password has been reset.', 'success')
            return redirect(url_for('login'))
        
        return render_template('reset_password.html')

    @app.route('/add_transaction', methods=['POST'])
    @login_required
    def add_transaction():
        try:
            if request.is_json:
                data = request.get_json()
            else:
                data = request.form

            # Validate the data
            if not all(key in data for key in ['date', 'amount', 'category', 'description']):
                return jsonify({
                    'success': False,
                    'error': 'Missing required fields'
                }), 400

            try:
                amount = float(data['amount'])
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid amount'
                }), 400

            # Create new transaction
            transaction = Transaction(
                date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
                amount=amount,
                category=data['category'],
                description=data['description'],
                user_id=current_user.id
            )
            
            db.session.add(transaction)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'transaction': transaction.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400

    @app.route('/transactions', methods=['GET'])
    @login_required
    def get_transactions():
        try:
            category = request.args.get('category')
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')

            query = Transaction.query.filter_by(user_id=current_user.id)

            if category:
                query = query.filter_by(category=category)
            if start_date:
                query = query.filter(Transaction.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
            if end_date:
                query = query.filter(Transaction.date <= datetime.strptime(end_date, '%Y-%m-%d').date())

            transactions = query.order_by(Transaction.date.desc()).all()
            return jsonify({
                'success': True,
                'transactions': [t.to_dict() for t in transactions]
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400

    @app.route('/transaction/<int:id>', methods=['DELETE'])
    @login_required
    def delete_transaction(id):
        transaction = Transaction.query.get_or_404(id)
        
        if transaction.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        try:
            db.session.delete(transaction)
            db.session.commit()
            return jsonify({'success': True}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400

    @app.route('/monthly-summary', methods=['GET'])
    @login_required
    def monthly_summary():
        try:
            current_month = datetime.utcnow().replace(day=1)
            monthly_transactions = Transaction.query.filter(
                Transaction.user_id == current_user.id,
                Transaction.date >= current_month
            ).all()

            income = sum(t.amount for t in monthly_transactions if t.amount > 0)
            expenses = sum(t.amount for t in monthly_transactions if t.amount < 0)

            return jsonify({
                'success': True,
                'income': income,
                'expenses': abs(expenses),
                'balance': income + expenses  # expenses are already negative
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route('/update-profile', methods=['POST'])
    @login_required
    def update_profile():
        try:
            data = request.get_json()
            
            if 'current_password' in data and 'new_password' in data:
                if not check_password_hash(current_user.password_hash, data['current_password']):
                    return jsonify({'success': False, 'error': 'Current password is incorrect'}), 400
                
                current_user.password_hash = generate_password_hash(data['new_password'])
            
            if 'email' in data and data['email'] != current_user.email:
                if User.query.filter_by(email=data['email']).first():
                    return jsonify({'success': False, 'error': 'Email already exists'}), 400
                current_user.email = data['email']
            
            db.session.commit()
            return jsonify({'success': True})
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400

    @app.route('/settings', methods=['GET', 'POST'])
    @login_required
    def settings():
        if request.method == 'POST':
            try:
                data = request.get_json()
                # Save user preferences (theme, currency, etc.)
                return jsonify({'success': True})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)}), 400
        return render_template('settings.html')

    return app

# Create the application instance
app = create_app()

def init_db():
    with app.app_context():
        db.create_all()

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
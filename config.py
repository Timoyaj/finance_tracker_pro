import os
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///finance_tracker.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    # Mail settings
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = MAIL_USERNAME


# Generate a 32-byte random secret key
SECRET_KEY = "4f3c2e93a9e1a4f5a8235b7a16f9e6c42b5ab4f8d0a7b6e3c9a1e3a1b3c9e4d2"
    
    
class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    # Add PostgreSQL configuration for production
    # SQLALCHEMY_DATABASE_URI = 'postgresql://username:password@localhost/dbname'


# Heroku
# heroku config:set MAIL_USERNAME=tertimothy@gmail.com
# heroku config:set MAIL_PASSWORD=wzoi oxum owbk zrok
# heroku config:set MAIL_SERVER=smtp.gmail.com
# heroku config:set MAIL_PORT=587
# heroku config:set MAIL_USE_TLS=True
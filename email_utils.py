# email_utils.py
from flask_mail import Mail, Message
from flask import current_app, url_for

mail = Mail()

def send_reset_email(user):
    token = user.generate_reset_token()
    msg = Message('Password Reset Request',
                  sender='noreply@financetracker.com',
                  recipients=[user.email])
    
    reset_url = url_for('reset_password', token=token, _external=True)
    msg.body = f'''To reset your password, visit the following link:
{reset_url}

If you did not make this request, simply ignore this email.
'''
    mail.send(msg)
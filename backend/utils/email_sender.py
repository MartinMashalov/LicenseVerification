import os
from pydantic import BaseModel
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uuid
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Define the email settings
class EmailSettings(BaseModel):
    email_sender: str = os.getenv('GMAIL_EMAIL')
    app_password: str = os.getenv('GMAIL_APP_PASSWORD')


class LicenseEmailSender:
    def __init__(self):
        self.email_settings = EmailSettings()

    def define_email_body(self, license_key: str, company_name: str) -> str:
        """Define the email body for license key delivery."""
        return f"""
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .container {{
                    background-color: #ffffff;
                    border-radius: 8px;
                    padding: 30px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 28px;
                    font-weight: bold;
                    color: #5B67E8;
                    margin-bottom: 10px;
                }}
                .license-section {{
                    background-color: #f8fafc;
                    border-radius: 8px;
                    padding: 25px;
                    margin: 30px 0;
                    text-align: center;
                }}
                .license-label {{
                    font-size: 14px;
                    color: #718096;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }}
                .license-key {{
                    background-color: #ffffff;
                    border: 2px solid #5B67E8;
                    border-radius: 6px;
                    padding: 15px;
                    font-size: 18px;
                    font-weight: bold;
                    color: #2d3748;
                    letter-spacing: 2px;
                    word-break: break-all;
                    font-family: 'Courier New', monospace;
                }}
                .instructions {{
                    background-color: #f0f9ff;
                    border-left: 4px solid #5B67E8;
                    border-radius: 6px;
                    padding: 20px;
                    margin: 25px 0;
                    font-size: 16px;
                    line-height: 1.5;
                    color: #2d3748;
                }}
                .instructions-title {{
                    font-weight: bold;
                    color: #5B67E8;
                    margin-bottom: 8px;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }}
                .footer {{
                    text-align: center;
                    font-size: 14px;
                    color: #718096;
                    margin-top: 30px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 20px;
                }}
                .support {{
                    color: #5B67E8;
                    text-decoration: none;
                }}
                .welcome-footer {{
                    text-align: center;
                    font-size: 18px;
                    color: #5B67E8;
                    margin-top: 20px;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">VisionPay</div>
                </div>
                
                <div class="license-section">
                    <div class="license-label">Your License Key</div>
                    <div class="license-key">{license_key}</div>
                </div>
                
                <div class="instructions">
                    <div class="instructions-title">Next Steps</div>
                    Share this license key throughout your company so users can sign up using this key.
                </div>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact our support at <a href="mailto:support@visionpay.com" class="support">support@visionpay.com</a></p>
                
                <div class="instructions">
                    <div class="instructions-title">Important Disclosure</div>
                    This license key gives you and your internal team access to the tool. Feel free to share it with anyone on your team who needs to use it.<br><br>
                    It's meant for internal use only and not for external distribution.
                </div>
            </div>
        </body>
        </html>
        """

    def send_license_email(self, email: str, company_name: str, license_key: str) -> tuple[bool, str]:
        """Send a license key email to the user."""
        print("SENDING EMAIL")
        # Check if email credentials are configured
        if not self.email_settings.email_sender or not self.email_settings.app_password:
            logger.warning("Gmail credentials not configured. Running in test mode.")
            print(f"📧 TEST MODE: Would send license key email to {email}")
            print(f"🔑 Generated license key: {license_key}")
            print(f"🏢 Company: {company_name}")
            print("💡 To enable actual email sending, configure GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables")
            return True, license_key  # Return success for testing
        
        message = MIMEMultipart("alternative")
        message["Subject"] = "Your VisionPay Premium License Key 🔑"
        message["From"] = self.email_settings.email_sender
        message["To"] = email

        part = MIMEText(self.define_email_body(license_key, company_name), "html")
        message.attach(part)
        
        print(f'Sending license key email to {email}')
        context = ssl.create_default_context()
        try:
            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(self.email_settings.email_sender, self.email_settings.app_password)
                server.sendmail(
                    self.email_settings.email_sender, email, message.as_string()
                )
            print(f"✅ Email sent successfully to {email}")
            return True, license_key
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            print(f"❌ Error sending email: {e}")
            return False, ""


def test_send_license_email():
    """
    Test function to send a license key email.
    """
    email_sender = LicenseEmailSender()
    success, license_key = email_sender.send_license_email("test@example.com", "Test Company")
    if success:
        print(f"License email sent successfully. License key: {license_key}")
    else:
        print("Failed to send license email.")

# Uncomment to test
# test_send_license_email() 
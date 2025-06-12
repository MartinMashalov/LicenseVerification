from fastapi import FastAPI, Form, HTTPException
from fastapi import FastAPI, HTTPException, Request, Form
import uvicorn
import stripe
import os
from typing import Optional
from utils.email_sender import LicenseEmailSender
from utils.db_utils import get_license_repository, LicenseRepository
from datetime import datetime
import logging
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="VisionPay License Server", version="1.0.0")

origins = [
    "http://localhost:3000",  # Frontend dev server
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # or specify ["POST", "GET", ...]
    allow_headers=["*"],  # or specify custom headers if needed
)
# Configure Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database repository
license_repo = get_license_repository()


@app.get("/")
async def root():
    return {"message": "VisionPay License Server is running"}


@app.get("/check_license/{license_code}")
async def check_license(license_code: str):
    """Check if a license code is valid."""
    try:
        license_info = license_repo.get_license_by_code(license_code)
        if license_info:
            return {"valid": True}
        else:
            return {"valid": False}
    except Exception as e:
        logger.error(f"Error checking license {license_code}: {e}")
        raise HTTPException(status_code=500, detail="Error checking license")


@app.get("/api-key/by-email/{email}")
async def get_api_key_by_email(email: str):
    """Get API key by email address."""
    try:
        api_key = license_repo.get_api_key_by_email(email)
        if api_key:
            return {"email": email, "api_key": api_key}
        else:
            raise HTTPException(
                status_code=404, detail="API key not found for this email")
    except Exception as e:
        logger.error(f"Error retrieving API key for email {email}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving API key")


@app.get("/api-key/by-license/{license_key}")
async def get_api_key_by_license(license_key: str):
    """Get API key by license key."""
    try:
        api_key = license_repo.get_api_key_by_license_key(license_key)
        if api_key:
            return {"api_key": api_key}
        else:
            raise HTTPException(
                status_code=404, detail="API key not found for this license key")
    except Exception as e:
        logger.error(
            f"Error retrieving API key for license {license_key}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving API key")


@app.post("/create-account")
async def create_new_account(
    first_name: str,
    last_name: str,
    company_name: str,
    email: str,
    mistral_api_key: str
):
    """Create a new user account with automatic license key generation."""
    try:
        user_id = license_repo.add_new_user(
            first_name=first_name,
            last_name=last_name,
            company_name=company_name,
            email=email,
            mistral_api_key=mistral_api_key
        )

        if user_id:
            # Automatically create license key for the new user
            license_key = license_repo.create_and_set_license_key_by_user_id(
                user_id)

            if license_key:
                return {
                    "message": "Account and license key created successfully",
                    "email": email,
                    "user_id": user_id,
                    "license_key": license_key
                }
            else:
                # Account was created but license generation failed
                logger.error(
                    f"License key generation failed for user {user_id}")
                return {
                    "message": "Account created but license key generation failed",
                    "email": email,
                    "user_id": user_id,
                    "license_key": None
                }
        else:
            raise HTTPException(
                status_code=400, detail="Account already exists or creation failed")

    except Exception as e:
        logger.error(f"Error creating account for {email}: {e}")
        raise HTTPException(status_code=500, detail="Error creating account")


@app.put("/update-api-key")
async def update_api_key(email: str, new_api_key: str):
    """Update API key for an existing user."""
    try:
        success = license_repo.update_user_info(
            email=email,
            mistral_api_key=new_api_key
        )

        if success:
            return {"message": "API key updated successfully", "email": email}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logger.error(f"Error updating API key for {email}: {e}")
        raise HTTPException(status_code=500, detail="Error updating API key")


@app.get("/user/{email}")
async def get_user_info(email: str):
    """Get user information by email."""
    try:
        user_info = license_repo.get_license_by_email(email)
        if user_info:
            return user_info
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logger.error(f"Error retrieving user info for {email}: {e}")
        raise HTTPException(
            status_code=500, detail="Error retrieving user information")


@app.post("/send-license-email")
async def send_license_email_endpoint(email: str):
    """Create license key and send it via email if user exists."""
    try:
        # First, get user info
        user_info = license_repo.get_license_by_email(email)
        print(f"User info: {user_info}")
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")

        # Create license key if it doesn't exist
        if not user_info.get('license_code'):
            license_key = license_repo.create_and_set_license_key(email)
            if not license_key:
                raise HTTPException(
                    status_code=500, detail="Failed to create license key")
        else:
            license_key = user_info['license_code']

        # Send email
        email_sender = LicenseEmailSender()
        success, _ = email_sender.send_license_email(
            email,
            user_info['company_name'],
            license_key
        )

        if success:
            return {
                "message": "License key sent successfully",
                "email": email,
            }
        else:
            raise HTTPException(
                status_code=500, detail="Failed to send license email")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending license email to {email}: {e}")
        raise HTTPException(
            status_code=500, detail="Error sending license email")


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load Stripe API key from environment
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


@app.post("/create-checkout-session")
async def create_checkout_session(
    price_id: str = Form(...),
    user_email: str = Form(...),
    success_url: str = Form(...),
    cancel_url: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    company_name: str = Form(...),
    mistral_api_key: str = Form(...)
):
    """Create a Stripe checkout session for subscription."""
    try:
        # Log all incoming data
        logger.info("Received checkout session request:")
        logger.info(f"price_id={price_id}")
        logger.info(f"user_email={user_email}")
        logger.info(f"success_url={success_url}")
        logger.info(f"cancel_url={cancel_url}")
        logger.info(f"first_name={first_name}")
        logger.info(f"last_name={last_name}")
        logger.info(f"company_name={company_name}")
        logger.info(f"mistral_api_key={mistral_api_key}")

        # Check if Stripe is configured
        if not stripe.api_key:
            logger.warning(
                "Stripe API key not configured. Running in test mode.")
            return {
                "session_id": "cs_test_mock_session_id_for_testing_12345",
                "message": "TEST MODE: Stripe not configured. Set STRIPE_SECRET_KEY environment variable for real payments."
            }

        # Simulate user logic (stub this for now)
        try:
            logger.info("Simulating user creation/updating in database.")
            # Replace this with license_repo.add_new_user(...) if available
            user_id = 123
            logger.info(f"User ID: {user_id}")
        except Exception as user_error:
            logger.error(f"User handling error: {user_error}")

        # Create checkout session
        try:
            logger.info("Creating Stripe checkout session...")
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                mode='subscription',
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                subscription_data={
                    'trial_period_days': 30,
                },
                success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
                cancel_url=cancel_url,
                customer_email=user_email,
                metadata={
                    'user_email': user_email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'company_name': company_name,
                    'mistral_api_key': mistral_api_key,
                }
            )
            logger.info(f"Stripe session created: {session.id}")
            return {"session_id": session.id}
        except Exception as stripe_error:
            logger.error(f"Stripe error: {stripe_error}")
            raise HTTPException(
                status_code=400, detail=f"Stripe error: {stripe_error}")

    except Exception as e:
        logger.exception("Unexpected error during checkout session creation")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/stripe-webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']

        # Extract user data from metadata
        user_email = session['metadata']['user_email']
        company_name = session['metadata']['company_name']

        logger.info(f"Processing successful payment for {user_email}")

        # Get user info and create license key if needed
        user_info = license_repo.get_license_by_email(user_email)
        if user_info and not user_info.get('license_code'):
            license_key = license_repo.create_and_set_license_key(user_email)
        elif user_info:
            license_key = user_info.get('license_code')
        else:
            license_key = None

        if license_key:
            # Send license key email
            email_sender = LicenseEmailSender()
            success, sent_license_key = email_sender.send_license_email(
                user_email, company_name)

            if success:
                logger.info(
                    f"License key {license_key} created and emailed to {user_email}")
            else:
                logger.error(f"Failed to send license email to {user_email}")
        else:
            logger.error(f"Failed to create license key for {user_email}")

    elif event['type'] == 'customer.subscription.deleted':
        # Handle subscription cancellation
        subscription = event['data']['object']
        customer_id = subscription['customer']
        logger.info(f"Subscription cancelled for customer {customer_id}")

    return {"status": "success"}


if __name__ == "__main__":
    local: bool = False
    if local:
        uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
    else:
        uvicorn.run("api:app", host="0.0.0.0", port=8005, reload=True)

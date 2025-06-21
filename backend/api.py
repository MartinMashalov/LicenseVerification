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
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')

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
        # Check if user exists
        user_info = license_repo.get_license_by_email(email)
        if user_info:
            return {"email": email, "api_key": MISTRAL_API_KEY}
        else:
            raise HTTPException(
                status_code=404, detail="User not found")
    except Exception as e:
        logger.error(f"Error retrieving API key for email {email}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving API key")


@app.get("/api-key/by-license/{license_key}")
async def get_api_key_by_license(license_key: str):
    """Get API key by license key."""
    try:
        # Check if license exists
        license_info = license_repo.get_license_by_code(license_key)
        if license_info:
            return {"api_key": MISTRAL_API_KEY}
        else:
            raise HTTPException(
                status_code=404, detail="License key not found")
    except Exception as e:
        logger.error(
            f"Error retrieving API key for license {license_key}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving API key")


@app.post("/create-account")
async def create_new_account(
    first_name: str = Form(...),
    last_name: str = Form(...),
    company_name: str = Form(...),
    email: str = Form(...)
):
    """Create a new user account with automatic license key generation."""
    try:
        user_id = license_repo.add_new_user(
            first_name=first_name,
            last_name=last_name,
            company_name=company_name,
            email=email
        )
        return {"message": "Account created successfully", "user_id": user_id}

    except Exception as e:
        logger.error(f"Error creating account for {email}: {e}")
        raise HTTPException(status_code=500, detail="Error creating account")


@app.put("/update-api-key")
async def update_api_key(email: str = Form(...), new_api_key: str = Form(...)):
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
async def send_license_email_endpoint(email: str = Form(...)):
    """Create license key and send it via email if user exists."""
    try:
        # First, get user info
        user_info = license_repo.get_license_by_email(email)
        logger.info(f"User info for {email}: {user_info}")
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")

        # Create license key if it doesn't exist
        if not user_info.get('license_code'):
            logger.info(f"Creating license key for {email}")
            license_key = license_repo.create_and_set_license_key(email)
            if not license_key:
                logger.error(f"Failed to create license key for {email}")
                raise HTTPException(
                    status_code=500, detail="Failed to create license key")
            logger.info(f"Created license key for {email}: {license_key}")
        else:
            license_key = user_info['license_code']
            logger.info(f"Using existing license key for {email}: {license_key}")

        # Send email
        email_sender = LicenseEmailSender()
        success, _ = email_sender.send_license_email(
            email,
            user_info['company_name'],
            license_key
        )

        if success:
            logger.info(f"License key sent successfully to {email}: {license_key}")
            return {
                "message": "License key sent successfully",
                "email": email,
                "license_key": license_key  # Include the license key in the response
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
    company_name: str = Form(...)
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

        # Check if Stripe is configured
        if not stripe.api_key:
            logger.warning("Stripe API key not configured. Running in test mode.")
            return {
                "session_id": "cs_test_mock_session_id_for_testing_12345",
                "message": "TEST MODE: Stripe not configured. Set STRIPE_SECRET_KEY environment variable for real payments."
            }

        # Check if user exists (they should, since BasicInfoStep creates them)
        user_info = license_repo.get_license_by_email(user_email)
        if not user_info:
            logger.error(f"User not found: {user_email}")
            raise HTTPException(status_code=404, detail="User not found. Please complete the registration first.")

        logger.info(f"User found for checkout: {user_email}")
        # License key will be created after successful payment in the webhook

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
                    'trial_period_days': 7,
                },
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=user_email,
                metadata={
                    'user_email': user_email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'company_name': company_name
                }
            )
            logger.info(f"Stripe session created: {session.id}")
            return {"session_id": session.id}
        except stripe.error.StripeError as stripe_error:
            logger.error(f"Stripe error: {stripe_error}")
            error_message = str(stripe_error)
            if "price_id" in error_message.lower():
                error_message = "Invalid price ID. Please check your Stripe product configuration."
            raise HTTPException(status_code=400, detail=error_message)

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.exception("Unexpected error during checkout session creation")
        raise HTTPException(status_code=500, detail=str(e))


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

        # Get user info and create license key after successful payment
        user_info = license_repo.get_license_by_email(user_email)
        if user_info and not user_info.get('license_code'):
            license_key = license_repo.create_and_set_license_key(user_email)
        elif user_info:
            license_key = user_info.get('license_code')
        else:
            logger.error(f"User not found during webhook processing: {user_email}")
            license_key = None

        if license_key:
            # Send license key email after successful payment
            logger.info(f"Attempting to send license key email to {user_email} for company {company_name} with license key {license_key}")
            email_sender = LicenseEmailSender()
            try:
                success, sent_license_key = email_sender.send_license_email(
                    user_email, company_name, license_key)
                if success:
                    logger.info(f"License key {license_key} created and emailed to {user_email}")
                else:
                    logger.error(f"Failed to send license email to {user_email}")
            except Exception as e:
                logger.error(f"Exception while sending license email: {e}")
        else:
            logger.error(f"Failed to create license key for {user_email}")

    elif event['type'] == 'customer.subscription.deleted':
        # Handle subscription cancellation
        subscription = event['data']['object']
        customer_id = subscription['customer']
        logger.info(f"Subscription cancelled for customer {customer_id}")

    return {"status": "success"}


@app.get("/user-exists/{email}")
async def user_exists(email: str):
    """Check if a user with the given email already exists."""
    try:
        exists = license_repo.user_exists(email)
        return {"exists": exists}
    except Exception as e:
        logger.error(f"Error checking if user exists for {email}: {e}")
        raise HTTPException(status_code=500, detail="Error checking user existence")


@app.post("/process-payment-success")
async def process_payment_success(session_id: str = Form(...)):
    """Process successful payment by validating Stripe session and creating license key."""
    try:
        logger.info(f"Processing payment success for session: {session_id}")
        
        # Check if Stripe is configured
        if not stripe.api_key:
            logger.warning("Stripe API key not configured. Running in test mode.")
            # In test mode, we can't validate the session, so we'll extract email from session_id
            # For test mode, we expect a mock session format or we'll need to handle it differently
            if session_id == "cs_test_mock_session_id_for_testing_12345":
                # Return success for the mock session without processing
                return {
                    "status": "success",
                    "message": "TEST MODE: Payment processed successfully",
                    "test_mode": True,
                    "license_key": "TEST_LICENSE_KEY",
                    "email": "test@example.com"
                }
            else:
                raise HTTPException(status_code=400, detail="TEST MODE: Invalid session ID. Stripe not configured.")
        
        # Retrieve the session from Stripe
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            logger.info(f"Retrieved Stripe session: {session.id}, status: {session.payment_status}")
        except stripe.error.StripeError as e:
            logger.error(f"Error retrieving Stripe session: {e}")
            raise HTTPException(status_code=400, detail="Invalid session ID")
        
        # Check if payment was successful
        if session.payment_status != 'paid':
            logger.warning(f"Payment not completed for session {session_id}, status: {session.payment_status}")
            raise HTTPException(status_code=400, detail="Payment not completed")
        
        # Extract user data from session metadata
        user_email = session.metadata.get('user_email')
        company_name = session.metadata.get('company_name')
        
        if not user_email:
            logger.error(f"No user email found in session metadata for {session_id}")
            raise HTTPException(status_code=400, detail="User email not found in session")
        
        logger.info(f"Processing successful payment for {user_email}")
        
        # Get user info and create license key
        user_info = license_repo.get_license_by_email(user_email)
        if not user_info:
            logger.error(f"User not found: {user_email}")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create license key if it doesn't exist
        if not user_info.get('license_code'):
            license_key = license_repo.create_and_set_license_key(user_email)
        else:
            license_key = user_info.get('license_code')
            
        if not license_key:
            logger.error(f"Failed to create license key for {user_email}")
            raise HTTPException(status_code=500, detail="Failed to create license key")
        
        # Send license email
        email_sender = LicenseEmailSender()
        try:
            success, sent_license_key = email_sender.send_license_email(
                user_email, company_name or user_info['company_name'], license_key)
            if success:
                logger.info(f"License key {license_key} created and emailed to {user_email}")
                return {
                    "status": "success",
                    "message": "License key created and sent successfully",
                    "license_key": license_key,
                    "email": user_email
                }
            else:
                logger.warning(f"License key created but email failed for {user_email}")
                return {
                    "status": "partial_success",
                    "message": "License key created but email delivery failed",
                    "license_key": license_key,
                    "email": user_email
                }
        except Exception as email_error:
            logger.error(f"Exception while sending license email: {email_error}")
            return {
                "status": "partial_success",
                "message": "License key created but email delivery failed",
                "license_key": license_key,
                "email": user_email
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing payment success: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8005, reload=True)

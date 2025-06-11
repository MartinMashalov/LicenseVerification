#!/usr/bin/env python3
"""
Comprehensive API Testing Script for VisionPay License Server

This script tests all API endpoints by simulating the complete user flow:
1. User signup with basic info and API key
2. Payment processing simulation
3. License key creation and email sending
4. License validation and management
5. User management operations

Run with: python test_apis.py
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER_DATA = {
    "first_name": "John",
    "last_name": "Doe", 
    "company_name": "Test Company Inc",
    "email": "john.doe.test@example.com",
    "mistral_api_key": "test_api_key_12345_demo"
}

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "errors": []
}

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

def log_test(test_name: str, status: str, details: str = ""):
    """Log test results with colors"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    
    if status == "PASS":
        color = Colors.GREEN
        test_results["passed"] += 1
    elif status == "FAIL":
        color = Colors.RED
        test_results["failed"] += 1
        test_results["errors"].append(f"{test_name}: {details}")
    else:  # INFO, WARN, etc.
        color = Colors.YELLOW
    
    print(f"{Colors.CYAN}[{timestamp}]{Colors.END} {color}{status:6}{Colors.END} {Colors.BOLD}{test_name}{Colors.END}")
    if details:
        print(f"         {details}")

def make_request(method: str, endpoint: str, data: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict[str, Any]:
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, params=params, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=10)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, timeout=10)
        elif method.upper() == "DELETE":
            response = requests.delete(url, timeout=10)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        return {
            "success": True,
            "status_code": response.status_code,
            "data": response.json() if response.content else {},
            "headers": dict(response.headers)
        }
    
    except requests.exceptions.ConnectionError:
        return {"success": False, "error": "Connection failed - Is the server running?"}
    except requests.exceptions.Timeout:
        return {"success": False, "error": "Request timeout"}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Request error: {str(e)}"}
    except json.JSONDecodeError:
        return {"success": False, "error": "Invalid JSON response"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}

def test_server_health():
    """Test if server is running and responsive"""
    log_test("Server Health Check", "INFO", "Checking if server is running...")
    
    result = make_request("GET", "/")
    
    if not result["success"]:
        log_test("Server Health Check", "FAIL", result["error"])
        return False
    
    if result["status_code"] == 200:
        log_test("Server Health Check", "PASS", f"Server is running: {result['data'].get('message', 'OK')}")
        return True
    else:
        log_test("Server Health Check", "FAIL", f"Unexpected status code: {result['status_code']}")
        return False

def test_create_account():
    """Test user account creation (simulates frontend signup flow)"""
    log_test("Create Account", "INFO", "Creating new user account...")
    
    account_data = {
        "first_name": TEST_USER_DATA["first_name"],
        "last_name": TEST_USER_DATA["last_name"],
        "company_name": TEST_USER_DATA["company_name"],
        "email": TEST_USER_DATA["email"],
        "mistral_api_key": TEST_USER_DATA["mistral_api_key"]
    }
    
    result = make_request("POST", "/create-account", account_data)
    
    if not result["success"]:
        log_test("Create Account", "FAIL", result["error"])
        return False
    
    if result["status_code"] == 200:
        log_test("Create Account", "PASS", f"Account created for {account_data['email']}")
        return True
    elif result["status_code"] == 400:
        log_test("Create Account", "PASS", "Account already exists (expected in repeat runs)")
        return True
    else:
        log_test("Create Account", "FAIL", f"Status: {result['status_code']}, Data: {result['data']}")
        return False

def test_get_user_info():
    """Test retrieving user information"""
    log_test("Get User Info", "INFO", "Retrieving user information...")
    
    result = make_request("GET", f"/user/{TEST_USER_DATA['email']}")
    
    if not result["success"]:
        log_test("Get User Info", "FAIL", result["error"])
        return False, None
    
    if result["status_code"] == 200:
        user_data = result["data"]
        log_test("Get User Info", "PASS", f"Retrieved info for {user_data.get('email', 'unknown')}")
        return True, user_data
    elif result["status_code"] == 404:
        log_test("Get User Info", "FAIL", "User not found - account creation may have failed")
        return False, None
    else:
        log_test("Get User Info", "FAIL", f"Status: {result['status_code']}, Data: {result['data']}")
        return False, None

def test_get_api_key_by_email():
    """Test retrieving API key by email"""
    log_test("Get API Key by Email", "INFO", "Retrieving API key...")
    
    result = make_request("GET", f"/api-key/by-email/{TEST_USER_DATA['email']}")
    
    if not result["success"]:
        log_test("Get API Key by Email", "FAIL", result["error"])
        return False
    
    if result["status_code"] == 200:
        api_key = result["data"].get("api_key")
        log_test("Get API Key by Email", "PASS", f"Retrieved API key: {api_key[:20]}...")
        return True
    elif result["status_code"] == 404:
        log_test("Get API Key by Email", "FAIL", "API key not found")
        return False
    else:
        log_test("Get API Key by Email", "FAIL", f"Status: {result['status_code']}, Data: {result['data']}")
        return False

def test_update_api_key():
    """Test updating user's API key"""
    log_test("Update API Key", "INFO", "Updating API key...")
    
    new_api_key = "updated_test_api_key_67890_demo"
    update_data = {
        "email": TEST_USER_DATA["email"],
        "new_api_key": new_api_key
    }
    
    result = make_request("PUT", "/update-api-key", update_data)
    
    if not result["success"]:
        log_test("Update API Key", "FAIL", result["error"])
        return False
    
    if result["status_code"] == 200:
        log_test("Update API Key", "PASS", "API key updated successfully")
        return True
    elif result["status_code"] == 404:
        log_test("Update API Key", "FAIL", "User not found for API key update")
        return False
    else:
        log_test("Update API Key", "FAIL", f"Status: {result['status_code']}, Data: {result['data']}")
        return False

def test_create_license_key():
    """Test creating a license key for user"""
    log_test("Create License Key", "INFO", "Creating license key...")
    
    license_data = {"email": TEST_USER_DATA["email"]}
    result = make_request("POST", "/create-license-key", license_data)
    
    if not result["success"]:
        log_test("Create License Key", "FAIL", result["error"])
        return False, None
    
    if result["status_code"] == 200:
        license_key = result["data"].get("license_key")
        log_test("Create License Key", "PASS", f"License key created: {license_key}")
        return True, license_key
    elif result["status_code"] == 404:
        log_test("Create License Key", "FAIL", "User not found for license creation")
        return False, None
    else:
        log_test("Create License Key", "FAIL", f"Status: {result['status_code']}, Data: {result['data']}")
        return False, None

def test_check_license(license_key: str):
    """Test license validation"""
    if not license_key:
        log_test("Check License", "SKIP", "No license key available")
        return False
    
    log_test("Check License", "INFO", "Validating license key...")
    
    result = make_request("GET", f"/check_license/{license_key}")
    
    if not result["success"]:
        log_test("Check License", "FAIL", result["error"])
        return False
    
    if result["status_code"] == 200:
        is_valid = result["data"].get("valid", False)
        if is_valid:
            log_test("Check License", "PASS", f"License key is valid: {license_key}")
            return True
        else:
            log_test("Check License", "FAIL", "License key is not valid")
            return False
    else:
        log_test("Check License", "FAIL", f"Status: {result['status_code']}, Data: {result['data']}")
        return False

def test_get_api_key_by_license(license_key: str):
    """Test retrieving API key by license key"""
    if not license_key:
        log_test("Get API Key by License", "SKIP", "No license key available")
        return False
    
    log_test("Get API Key by License", "INFO", "Retrieving API key by license...")
    
    result = make_request("GET", f"/api-key/by-license/{license_key}")
    
    if not result["success"]:
        log_test("Get API Key by License", "FAIL", result["error"])
        return False
    
    if result["status_code"] == 200:
        api_key = result["data"].get("api_key")
        log_test("Get API Key by License", "PASS", f"Retrieved API key: {api_key[:20]}...")
        return True
    elif result["status_code"] == 404:
        log_test("Get API Key by License", "FAIL", "API key not found for license")
        return False
    else:
        log_test("Get API Key by License", "FAIL", f"Status: {result['status_code']}, Data: {result['data']}")
        return False

def test_send_license_email():
    """Test sending license key via email"""
    log_test("Send License Email", "INFO", "Sending license email...")
    
    email_data = {"email": TEST_USER_DATA["email"]}
    result = make_request("POST", "/send-license-email", email_data)
    
    if not result["success"]:
        log_test("Send License Email", "FAIL", result["error"])
        return False
    
    if result["status_code"] == 200:
        log_test("Send License Email", "PASS", "License email sent successfully")
        return True
    elif result["status_code"] == 404:
        log_test("Send License Email", "FAIL", "User not found for email sending")
        return False
    elif result["status_code"] == 500:
        log_test("Send License Email", "FAIL", "Email service error (check email configuration)")
        return False
    else:
        log_test("Send License Email", "FAIL", f"Status: {result['status_code']}, Data: {result['data']}")
        return False

def test_create_checkout_session():
    """Test Stripe checkout session creation (simulates payment flow)"""
    log_test("Create Checkout Session", "INFO", "Creating Stripe checkout session...")
    
    checkout_data = {
        "price_id": "price_test_12345",  # Test price ID
        "user_email": TEST_USER_DATA["email"],
        "success_url": "https://example.com/success",
        "cancel_url": "https://example.com/cancel",
        "user_data": {
            "first_name": TEST_USER_DATA["first_name"],
            "last_name": TEST_USER_DATA["last_name"],
            "company_name": TEST_USER_DATA["company_name"],
            "email": TEST_USER_DATA["email"],
            "mistral_api_key": TEST_USER_DATA["mistral_api_key"]
        }
    }
    
    result = make_request("POST", "/create-checkout-session", checkout_data)
    
    if not result["success"]:
        log_test("Create Checkout Session", "FAIL", result["error"])
        return False
    
    if result["status_code"] == 200:
        session_id = result["data"].get("session_id")
        if session_id:
            log_test("Create Checkout Session", "PASS", f"Checkout session created: {session_id[:20]}...")
            return True
        else:
            log_test("Create Checkout Session", "FAIL", "No session ID returned")
            return False
    elif result["status_code"] == 400:
        log_test("Create Checkout Session", "FAIL", f"Stripe error: {result['data'].get('detail', 'Unknown error')}")
        return False
    else:
        log_test("Create Checkout Session", "FAIL", f"Status: {result['status_code']}, Data: {result['data']}")
        return False

def test_get_all_licenses():
    """Test retrieving all licenses (admin endpoint)"""
    log_test("Get All Licenses", "INFO", "Retrieving all licenses...")
    
    result = make_request("GET", "/licenses")
    
    if not result["success"]:
        log_test("Get All Licenses", "FAIL", result["error"])
        return False
    
    if result["status_code"] == 200:
        licenses = result["data"]
        if isinstance(licenses, list):
            log_test("Get All Licenses", "PASS", f"Retrieved {len(licenses)} license(s)")
            return True
        else:
            log_test("Get All Licenses", "FAIL", "Invalid response format")
            return False
    else:
        log_test("Get All Licenses", "FAIL", f"Status: {result['status_code']}, Data: {result['data']}")
        return False

def test_add_manual_license():
    """Test manually adding a license key"""
    log_test("Add Manual License", "INFO", "Adding manual license...")
    
    manual_license_data = {
        "email": "manual.test@example.com",
        "license_code": "MANUAL123",
        "organization_name": "Manual Test Org",
        "first_name": "Manual",
        "last_name": "Tester"
    }
    
    result = make_request("POST", "/add-license", manual_license_data)
    
    if not result["success"]:
        log_test("Add Manual License", "FAIL", result["error"])
        return False
    
    if result["status_code"] == 200:
        log_test("Add Manual License", "PASS", "Manual license added successfully")
        return True
    else:
        log_test("Add Manual License", "FAIL", f"Status: {result['status_code']}, Data: {result['data']}")
        return False

def test_delete_user():
    """Test deleting a user (cleanup)"""
    log_test("Delete User", "INFO", "Cleaning up test user...")
    
    # Delete the main test user
    result = make_request("DELETE", f"/user/{TEST_USER_DATA['email']}")
    
    if not result["success"]:
        log_test("Delete User", "FAIL", result["error"])
        return False
    
    if result["status_code"] == 200:
        log_test("Delete User", "PASS", "Test user deleted successfully")
    elif result["status_code"] == 404:
        log_test("Delete User", "PASS", "User not found (already deleted or never created)")
    else:
        log_test("Delete User", "FAIL", f"Status: {result['status_code']}, Data: {result['data']}")
        return False
    
    # Delete the manual test user
    result2 = make_request("DELETE", "/user/manual.test@example.com")
    if result2["success"] and result2["status_code"] == 200:
        log_test("Delete Manual User", "PASS", "Manual test user deleted")
    
    return True

def run_complete_user_flow():
    """Run the complete user flow simulation"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}=== VisionPay API Testing Suite ==={Colors.END}\n")
    print(f"{Colors.YELLOW}Simulating complete user signup and license management flow...{Colors.END}\n")
    
    # 1. Server Health Check
    if not test_server_health():
        print(f"\n{Colors.RED}❌ Server is not responding. Please start the server and try again.{Colors.END}")
        return False
    
    print()
    
    # 2. User Account Management Flow
    log_test("User Flow", "INFO", "Starting user account creation flow...")
    test_create_account()
    
    success, user_data = test_get_user_info()
    if success:
        print(f"         User ID: {user_data.get('id')}")
        print(f"         Created: {user_data.get('created_at')}")
    
    print()
    
    # 3. API Key Management
    log_test("API Key Flow", "INFO", "Testing API key operations...")
    test_get_api_key_by_email()
    test_update_api_key()
    
    print()
    
    # 4. License Management Flow
    log_test("License Flow", "INFO", "Testing license creation and validation...")
    license_success, license_key = test_create_license_key()
    
    if license_success and license_key:
        test_check_license(license_key)
        test_get_api_key_by_license(license_key)
    
    print()
    
    # 5. Email and Payment Flow
    log_test("Communication Flow", "INFO", "Testing email and payment systems...")
    test_send_license_email()
    test_create_checkout_session()
    
    print()
    
    # 6. Admin Operations
    log_test("Admin Flow", "INFO", "Testing admin operations...")
    test_get_all_licenses()
    test_add_manual_license()
    
    print()
    
    # 7. Cleanup
    log_test("Cleanup", "INFO", "Cleaning up test data...")
    test_delete_user()
    
    return True

def print_summary():
    """Print test results summary"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}=== Test Results Summary ==={Colors.END}\n")
    
    total_tests = test_results["passed"] + test_results["failed"]
    pass_rate = (test_results["passed"] / total_tests * 100) if total_tests > 0 else 0
    
    print(f"{Colors.GREEN}✅ Passed: {test_results['passed']}{Colors.END}")
    print(f"{Colors.RED}❌ Failed: {test_results['failed']}{Colors.END}")
    print(f"{Colors.BOLD}📊 Pass Rate: {pass_rate:.1f}%{Colors.END}")
    
    if test_results["errors"]:
        print(f"\n{Colors.RED}❌ Failed Tests:{Colors.END}")
        for error in test_results["errors"]:
            print(f"   • {error}")
    
    if test_results["failed"] == 0:
        print(f"\n{Colors.GREEN}🎉 All tests passed! Your API is working correctly.{Colors.END}")
    else:
        print(f"\n{Colors.YELLOW}⚠️  Some tests failed. Check the errors above and server logs.{Colors.END}")

def main():
    """Main test execution"""
    try:
        print(f"{Colors.CYAN}Starting VisionPay API Test Suite...{Colors.END}")
        print(f"{Colors.YELLOW}Testing against: {BASE_URL}{Colors.END}")
        print(f"{Colors.YELLOW}Test user: {TEST_USER_DATA['email']}{Colors.END}")
        
        success = run_complete_user_flow()
        print_summary()
        
        # Exit with appropriate code
        sys.exit(0 if test_results["failed"] == 0 else 1)
        
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted by user.{Colors.END}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Unexpected error: {str(e)}{Colors.END}")
        sys.exit(1)

if __name__ == "__main__":
    main()





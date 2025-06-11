#!/usr/bin/env python3
"""
VisionPay API Test Runner

Simple script to run all API tests with proper setup checks.
"""

import subprocess
import sys
import os
from pathlib import Path

def check_server_running():
    """Check if the FastAPI server is running"""
    try:
        import requests
        response = requests.get("http://localhost:8000", timeout=5)
        return response.status_code == 200
    except:
        return False

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import requests
        import sqlite3
        import sqlalchemy
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        return False

def main():
    print("🚀 VisionPay API Test Runner")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not os.path.exists("api.py"):
        print("❌ Please run this script from the backend directory")
        sys.exit(1)
    
    # Check dependencies
    print("📦 Checking dependencies...")
    if not check_dependencies():
        print("\n💡 To install dependencies, run:")
        print("   pip install -r requirements.txt")
        sys.exit(1)
    print("✅ Dependencies OK")
    
    # Check if server is running
    print("\n🌐 Checking if server is running...")
    if not check_server_running():
        print("❌ Server is not running on http://localhost:8000")
        print("\n💡 To start the server, run:")
        print("   python api.py")
        print("\n   Or in another terminal:")
        print("   uvicorn api:app --reload")
        sys.exit(1)
    print("✅ Server is running")
    
    # Run tests
    print("\n🧪 Running API tests...")
    print("-" * 40)
    
    try:
        test_file = Path("tests") / "test_apis.py"
        if test_file.exists():
            result = subprocess.run([sys.executable, str(test_file)], 
                                  capture_output=False, text=True)
            sys.exit(result.returncode)
        else:
            print(f"❌ Test file not found: {test_file}")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n❌ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
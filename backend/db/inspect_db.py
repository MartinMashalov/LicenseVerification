import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = str(Path(__file__).parent.parent)
sys.path.append(backend_dir)

from utils.db_utils import get_license_repository

def print_all_licenses():
    """Print all licenses in the database"""
    repo = get_license_repository()
    licenses = repo.get_all_licenses()
    
    if not licenses:
        print("No licenses found in database")
        return
        
    print("\n=== All Licenses ===")
    print(f"Total records: {len(licenses)}\n")
    
    for license in licenses:
        print("License ID:", license['id'])
        print("Name:", f"{license['first_name']} {license['last_name']}")
        print("Company:", license['company_name'])
        print("Email:", license['email'])
        print("License Code:", license['license_code'] or 'Not set')
        print("Created:", license['created_at'])
        print("Updated:", license['updated_at'])
        print("-" * 50)

if __name__ == "__main__":
    print_all_licenses()

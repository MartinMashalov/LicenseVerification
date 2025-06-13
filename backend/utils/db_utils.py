import sqlite3
import os
import string
import secrets
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import create_engine, Column, String, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SQLAlchemy setup
Base = declarative_base()

class License(Base):
    """SQLAlchemy model for license data"""
    __tablename__ = 'licenses'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    company_name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    license_code = Column(String(10), unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert license object to dictionary"""
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'company_name': self.company_name,
            'email': self.email,
            'license_code': self.license_code,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class DatabaseManager:
    """Singleton class for database connection and management"""
    
    _instance = None
    _engine = None
    _session_factory = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):
            # Get the absolute path to the backend directory
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.db_folder = os.path.join(backend_dir, 'db')
            self.db_path = os.path.join(self.db_folder, 'visionpay_licenses.db')
            self._setup_database()
            self.initialized = True
    
    def _setup_database(self):
        """Setup database connection and create tables if they don't exist"""
        try:
            # Create db folder if it doesn't exist
            if not os.path.exists(self.db_folder):
                os.makedirs(self.db_folder)
                logger.info(f"Created database folder: {self.db_folder}")
            
            # Create SQLAlchemy engine
            self._engine = create_engine(f'sqlite:///{self.db_path}', echo=False)
            
            # Create tables if they don't exist
            Base.metadata.create_all(self._engine)
            
            # Create session factory
            self._session_factory = sessionmaker(bind=self._engine)
            
            logger.info(f"Database initialized successfully at: {self.db_path}")
            
        except Exception as e:
            logger.error(f"Failed to setup database: {e}")
            raise
    
    def get_session(self) -> Session:
        """Get a new database session"""
        return self._session_factory()
    
    def close_connection(self):
        """Close database connection"""
        if self._engine:
            self._engine.dispose()


class LicenseRepository:
    """Repository class for license data operations"""
    
    def __init__(self):
        self.db_manager = DatabaseManager()
    
    def get_api_key_by_email(self, email: str) -> Optional[str]:
        """Retrieve Mistral API key for a specific email"""
        with self.db_manager.get_session() as session:
            try:
                license_obj = session.query(License).filter(License.email == email).first()
                if license_obj:
                    logger.info(f"Retrieved API key for email: {email}")
                    return license_obj.mistral_api_key
                else:
                    logger.warning(f"No API key found for email: {email}")
                    return None
            except Exception as e:
                logger.error(f"Error retrieving API key for {email}: {e}")
                session.rollback()
                return None
    
    def get_api_key_by_license_key(self, license_key: str) -> Optional[str]:
        """Retrieve Mistral API key for a specific license key"""
        with self.db_manager.get_session() as session:
            try:
                license_obj = session.query(License).filter(License.license_code == license_key).first()
                if license_obj:
                    logger.info(f"Retrieved API key for license key: {license_key}")
                    return license_obj.mistral_api_key
                else:
                    logger.warning(f"No API key found for license key: {license_key}")
                    return None
            except Exception as e:
                logger.error(f"Error retrieving API key for license key {license_key}: {e}")
                session.rollback()
                return None
    
    def user_exists(self, email: str) -> bool:
        """
        Check if a user with the given email already exists in the database.
        """
        with self.db_manager.get_session() as session:
            try:
                return session.query(License).filter(License.email == email).first() is not None
            except Exception as e:
                logger.error(f"Error checking if user exists for {email}: {e}")
                session.rollback()
                return False

    def add_new_user(self, first_name: str, last_name: str, company_name: str, 
                     email: str) -> Optional[str]:
        """Add a new user to the database and return the user UUID"""
        with self.db_manager.get_session() as session:
            try:
                # Check if user already exists
                existing_user = session.query(License).filter(License.email == email).first()
                if existing_user:
                    logger.warning(f"User with email {email} already exists")
                    return None
                
                # Create new license record
                new_license = License(
                    first_name=first_name,
                    last_name=last_name,
                    company_name=company_name,
                    email=email
                )
                
                session.add(new_license)
                session.commit()
                
                logger.info(f"Successfully added new user: {email} with UUID: {new_license.id}")
                return new_license.id
                
            except IntegrityError as e:
                logger.error(f"Integrity error adding user {email}: {e}")
                session.rollback()
                return None
            except Exception as e:
                logger.error(f"Error adding user {email}: {e}")
                session.rollback()
                return None
    
    def _generate_license_code(self) -> str:
        """Generate a random 10-character alphanumeric license code"""
        characters = string.ascii_letters + string.digits  # a-z, A-Z, 0-9
        return ''.join(secrets.choice(characters) for _ in range(10))
    
    def create_and_set_license_key(self, email: str) -> Optional[str]:
        """Create and set license key for a user based on email, return the license key. 
        If user already has a license key, return the existing one."""
        with self.db_manager.get_session() as session:
            try:
                # Find user by email
                user = session.query(License).filter(License.email == email).first()
                if not user:
                    logger.error(f"User not found for email: {email}")
                    return None
                
                # Check if user already has a license key
                if user.license_code:
                    logger.info(f"User {email} already has license key: {user.license_code}")
                    return user.license_code
                
                # Generate unique license code
                max_attempts = 10
                for attempt in range(max_attempts):
                    license_code = self._generate_license_code()
                    
                    # Check if license code already exists
                    existing_license = session.query(License).filter(License.license_code == license_code).first()
                    if not existing_license:
                        break
                    
                    if attempt == max_attempts - 1:
                        logger.error("Failed to generate unique license code after maximum attempts")
                        return None
                
                # Update user with license code
                user.license_code = license_code
                user.updated_at = datetime.utcnow()
                
                session.commit()
                
                logger.info(f"Successfully created license key for {email}: {license_code}")
                return license_code
                
            except Exception as e:
                logger.error(f"Error creating license key for {email}: {e}")
                session.rollback()
                return None
    
    def get_license_by_code(self, license_code: str) -> Optional[Dict[str, Any]]:
        """Get license information by license code"""
        with self.db_manager.get_session() as session:
            try:
                license_obj = session.query(License).filter(License.license_code == license_code).first()
                if license_obj:
                    return license_obj.to_dict()
                return None
            except Exception as e:
                logger.error(f"Error retrieving license by code {license_code}: {e}")
                return None
    
    def get_license_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get license information by email"""
        with self.db_manager.get_session() as session:
            try:
                license_obj = session.query(License).filter(License.email == email).first()
                if license_obj:
                    return license_obj.to_dict()
                return None
            except Exception as e:
                logger.error(f"Error retrieving license by email {email}: {e}")
                return None
    
    def get_all_licenses(self) -> List[Dict[str, Any]]:
        """Get all licenses from the database"""
        with self.db_manager.get_session() as session:
            try:
                licenses = session.query(License).all()
                return [license.to_dict() for license in licenses]
            except Exception as e:
                logger.error(f"Error retrieving all licenses: {e}")
                return []
    
    def update_user_info(self, email: str, **kwargs) -> bool:
        """Update user information"""
        with self.db_manager.get_session() as session:
            try:
                user = session.query(License).filter(License.email == email).first()
                if not user:
                    logger.error(f"User not found for email: {email}")
                    return False
                
                # Update allowed fields
                allowed_fields = ['first_name', 'last_name', 'company_name']
                for field, value in kwargs.items():
                    if field in allowed_fields and hasattr(user, field):
                        setattr(user, field, value)
                
                user.updated_at = datetime.utcnow()
                session.commit()
                
                logger.info(f"Successfully updated user info for: {email}")
                return True
                
            except Exception as e:
                logger.error(f"Error updating user {email}: {e}")
                session.rollback()
                return False
    
    def delete_user(self, email: str) -> bool:
        """Delete a user from the database"""
        with self.db_manager.get_session() as session:
            try:
                user = session.query(License).filter(License.email == email).first()
                if not user:
                    logger.error(f"User not found for email: {email}")
                    return False
                
                session.delete(user)
                session.commit()
                
                logger.info(f"Successfully deleted user: {email}")
                return True
                
            except Exception as e:
                logger.error(f"Error deleting user {email}: {e}")
                session.rollback()
                return False
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user information by user UUID"""
        with self.db_manager.get_session() as session:
            try:
                license_obj = session.query(License).filter(License.id == user_id).first()
                if license_obj:
                    return license_obj.to_dict()
                return None
            except Exception as e:
                logger.error(f"Error retrieving user by UUID {user_id}: {e}")
                return None

    def create_and_set_license_key_by_user_id(self, user_id: str) -> Optional[str]:
        """Create and set license key for a user based on user_id, return the license key.
        If user already has a license key, return the existing one."""
        with self.db_manager.get_session() as session:
            try:
                # Find user by UUID
                user = session.query(License).filter(License.id == user_id).first()
                if not user:
                    logger.error(f"User not found for UUID: {user_id}")
                    return None
                
                # Check if user already has a license key
                if user.license_code:
                    logger.info(f"User {user_id} already has license key: {user.license_code}")
                    return user.license_code
                
                # Generate unique license code
                max_attempts = 10
                for attempt in range(max_attempts):
                    license_code = self._generate_license_code()
                    
                    # Check if license code already exists
                    existing_license = session.query(License).filter(License.license_code == license_code).first()
                    if not existing_license:
                        break
                    
                    if attempt == max_attempts - 1:
                        logger.error("Failed to generate unique license code after maximum attempts")
                        return None
                
                # Update user with license code
                user.license_code = license_code
                user.updated_at = datetime.utcnow()
                
                session.commit()
                
                logger.info(f"Successfully created license key for user_uuid {user_id}: {license_code}")
                return license_code
                
            except Exception as e:
                logger.error(f"Error creating license key for user_uuid {user_id}: {e}")
                session.rollback()
                return None


# Convenience functions for easy access
def get_db_manager() -> DatabaseManager:
    """Get the database manager instance"""
    return DatabaseManager()

def get_license_repository() -> LicenseRepository:
    """Get the license repository instance"""
    return LicenseRepository()


# Example usage and testing
def test_db_utils():
    # Test the database functionality
    repo = get_license_repository()
    
    # Test adding a user
    user_id = repo.add_new_user(
        first_name="John",
        last_name="Doe", 
        company_name="Test Company",
        email="john.doe@test.com"
    )
    print(f"Add user success, user_id: {user_id}")
    
    # Test getting API key
    api_key = repo.get_api_key_by_email("john.doe@test.com")
    print(f"Retrieved API key: {api_key}")
    
    # Test creating license key by user ID
    license_key = repo.create_and_set_license_key_by_user_id(user_id) if user_id else None
    print(f"Generated license key: {license_key}")
    
    # Test getting license by code
    license_info = repo.get_license_by_code(license_key) if license_key else None
    print(f"License info: {license_info}")
    
    # Test getting user by ID
    user_info = repo.get_user_by_id(user_id) if user_id else None
    print(f"User info: {user_info}")


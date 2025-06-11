# Security Documentation

## Overview

This API has been updated with security improvements to prevent unauthorized license key creation and protect sensitive admin operations.

## Security Features

### 1. Admin API Key Authentication

Sensitive endpoints now require an admin API key for authentication:

- `/admin/create-license-key` - Create license keys (requires user_id, not email)
- `/admin/add-license` - Manually add licenses  
- `/admin/licenses` - View all licenses
- `/admin/user/by-id/{user_id}` - Get user by ID
- `/admin/user/{email}` - Delete users

### 2. Environment Variables Required

Set these environment variables:

```bash
# Required: Set a strong, random admin API key
ADMIN_API_KEY=your-very-secure-random-admin-api-key-here

# Optional: Stripe configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
```

### 3. How to Use Admin Endpoints

Include the admin API key in the `X-API-Key` header:

```bash
curl -X POST "http://localhost:8005/admin/create-license-key" \
  -H "X-API-Key: your-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "550e8400-e29b-41d4-a716-446655440000"}'
```

### 4. API Changes

#### Before (Insecure):
- Anyone could create license keys with just an email
- No authentication required for admin operations
- Used Pydantic models (complex request bodies)

#### After (Secure):
- License key creation requires admin authentication + user_id (UUID)
- All admin operations protected with API key
- Simple function parameters instead of complex models
- User creation returns user_id (UUID) for proper reference
- UUIDs prevent ID enumeration attacks

### 5. Workflow Example

1. **Create User**: `POST /create-account` → Returns `user_id` (UUID)
2. **Create License** (Admin Only): `POST /admin/create-license-key` with `user_id` (UUID)
3. **Send Email**: `POST /send-license-email` with email (for existing users)

## Important Notes

- Change the default admin API key immediately
- Keep the admin API key secret and secure
- The old `/create-license-key` endpoint has been moved to `/admin/create-license-key`
- License keys can only be generated, not manually set (database schema limitation) 
# VisionPay Frontend API Integration

This document explains how the React frontend connects to all the VisionPay backend API endpoints.

## 📋 **Overview**

The frontend is fully integrated with all backend endpoints through a comprehensive API service layer. The integration supports:

- ✅ User account management
- ✅ API key management  
- ✅ License creation and validation
- ✅ Payment processing with Stripe
- ✅ Email notifications
- ✅ Admin functionality

## 🛠 **API Service Structure**

### Location: `src/services/api.ts`

The API service is organized into logical sections:

```typescript
export const apiService = {
  // SERVER HEALTH & BASIC ENDPOINTS
  checkServerHealth()
  
  // USER ACCOUNT MANAGEMENT  
  createAccount()
  getUserInfo()
  deleteUser()
  
  // API KEY MANAGEMENT
  getApiKeyByEmail()
  getApiKeyByLicense()
  updateApiKey()
  
  // LICENSE MANAGEMENT
  createLicenseKey()
  checkLicense()
  sendLicenseEmail()
  addManualLicense()
  getAllLicenses()
  
  // PAYMENT & STRIPE INTEGRATION
  createCheckoutSession()
  
  // UTILITY FUNCTIONS
  completeUserSignup()
  startFreeTrial()
  validateLicenseAndGetApiKey()
  updateUserProfile()
}
```

## 🔗 **Backend Endpoint Mapping**

| Frontend Method | Backend Endpoint | Purpose |
|----------------|------------------|---------|
| `checkServerHealth()` | `GET /` | Check if server is running |
| `createAccount()` | `POST /create-account` | Create new user account |
| `getUserInfo()` | `GET /user/{email}` | Get user details by email |
| `deleteUser()` | `DELETE /user/{email}` | Delete user account |
| `getApiKeyByEmail()` | `GET /api-key/by-email/{email}` | Get API key by email |
| `getApiKeyByLicense()` | `GET /api-key/by-license/{key}` | Get API key by license |
| `updateApiKey()` | `PUT /update-api-key` | Update user's API key |
| `createLicenseKey()` | `POST /create-license-key` | Generate license for user |
| `checkLicense()` | `GET /check_license/{code}` | Validate license code |
| `sendLicenseEmail()` | `POST /send-license-email` | Email license to user |
| `addManualLicense()` | `POST /add-license` | Manually add license (admin) |
| `getAllLicenses()` | `GET /licenses` | Get all licenses (admin) |
| `createCheckoutSession()` | `POST /create-checkout-session` | Create Stripe payment session |

## 📱 **Frontend Components**

### 1. **SignupFlow** - Main User Journey
- **Path**: `/`
- **Components**: `BasicInfoStep`, `ApiKeyStep`, `PaymentStep`, `SuccessStep`
- **APIs Used**: 
  - `startFreeTrial()` - For free trial signup
  - `createCheckoutSession()` - For paid subscriptions
  - `sendLicenseEmail()` - For license delivery

### 2. **LicenseValidator** - License Verification
- **Path**: `/validate`
- **Purpose**: Validate license codes and retrieve API keys
- **APIs Used**:
  - `validateLicenseAndGetApiKey()` - Complete validation workflow
  - `checkLicense()` - License validation
  - `getApiKeyByLicense()` - API key retrieval

### 3. **AdminDashboard** - Administrative Interface
- **Path**: `/admin`
- **Purpose**: Manage users, licenses, and system health
- **APIs Used**:
  - `checkServerHealth()` - Server status
  - `getAllLicenses()` - List all licenses
  - `getUserInfo()` - Search and view users
  - `updateApiKey()` - Update user API keys
  - `createLicenseKey()` - Generate licenses
  - `sendLicenseEmail()` - Send license emails
  - `deleteUser()` - Remove users

### 4. **SuccessPage** - Post-Payment Success
- **Path**: `/success`
- **Purpose**: Show success after payment completion
- **Features**: License key display with copy functionality

## 🔧 **Configuration**

### Environment Variables

Create a `.env` file in the frontend root:

```env
# Backend API URL
REACT_APP_API_BASE_URL=http://localhost:8000

# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
REACT_APP_STRIPE_PRICE_ID=price_your_price_id
```

### TypeScript Types

All API responses are fully typed in `src/types/index.ts`:

```typescript
// Core user data
interface UserSignupData
interface UserInfo
interface CreateAccountRequest
interface CreateAccountResponse

// License management
interface LicenseRequest
interface CreateLicenseKeyResponse
interface LicenseInfo
interface SendLicenseEmailResponse

// API key management  
interface ApiKeyResponse
interface UpdateApiKeyRequest
interface UpdateApiKeyResponse

// Payment integration
interface CheckoutSessionData
interface CheckoutSessionResponse

// Admin functionality
interface ManualLicenseData
interface DeleteUserResponse
interface ServerHealthResponse
```

## 🚀 **Usage Examples**

### User Signup Flow
```typescript
// 1. Create account with API key
const accountData = {
  first_name: "John",
  last_name: "Doe", 
  company_name: "Acme Corp",
  email: "john@acme.com",
  mistral_api_key: "sk-..."
};

// 2. Start free trial (creates account + license + sends email)
const response = await apiService.startFreeTrial(accountData);
console.log("License key:", response.license_key);
```

### License Validation
```typescript
// Validate license and get API key
const result = await apiService.validateLicenseAndGetApiKey("ABC123XYZ");

if (result.isValid) {
  console.log("API Key:", result.apiKey);
  console.log("User Info:", result.userInfo);
} else {
  console.log("Invalid license");
}
```

### Admin Operations
```typescript
// Get all users
const users = await apiService.getAllLicenses();

// Update user's API key
await apiService.updateApiKey({
  email: "user@example.com",
  new_api_key: "new-api-key-here"
});

// Create license for existing user
const license = await apiService.createLicenseKey({
  email: "user@example.com"
});
```

### Payment Processing
```typescript
// Create Stripe checkout session
const session = await apiService.createCheckoutSession({
  price_id: "price_123",
  user_email: "user@example.com", 
  success_url: "https://app.com/success",
  cancel_url: "https://app.com/cancel",
  user_data: userData
});

// Redirect to Stripe
stripe.redirectToCheckout({ sessionId: session.session_id });
```

## 🛡 **Error Handling**

The API service includes comprehensive error handling:

```typescript
// Automatic error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Try-catch in components
try {
  const result = await apiService.getUserInfo(email);
  setUser(result);
} catch (error) {
  console.error('Failed to load user:', error);
  setError('User not found');
}
```

## 🎯 **Testing Integration**

The backend includes a comprehensive test suite that validates all endpoints:

```bash
# Run backend tests
cd backend
python tests/test_apis.py

# Expected result: 100% pass rate with all endpoints working
```

## 🔄 **Data Flow**

### User Signup Flow:
1. User fills `BasicInfoStep` → Updates `UserSignupData`
2. User enters API key in `ApiKeyStep` → Updates `mistralApiKey`
3. User selects plan in `PaymentStep`:
   - **Free Trial**: `startFreeTrial()` → Creates account + license + sends email
   - **Paid Plan**: `createCheckoutSession()` → Redirects to Stripe
4. Success page shows license key with copy functionality

### License Validation Flow:
1. User enters license code in `LicenseValidator`
2. `validateLicenseAndGetApiKey()` calls:
   - `checkLicense()` to validate
   - `getApiKeyByLicense()` to get API key
3. Display user info and API key with copy function

### Admin Management Flow:
1. `AdminDashboard` loads with `checkServerHealth()` + `getAllLicenses()`
2. Admin searches user with `getUserInfo()`
3. Admin can:
   - Update API keys with `updateApiKey()`
   - Create licenses with `createLicenseKey()`
   - Send emails with `sendLicenseEmail()`
   - Delete users with `deleteUser()`

## 🌐 **Available Routes**

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `SignupFlow` | Main user signup and payment |
| `/success` | `SuccessPage` | Post-payment success page |
| `/validate` | `LicenseValidator` | License validation tool |
| `/admin` | `AdminDashboard` | Administrative interface |

## 📈 **Features Implemented**

- ✅ Complete user signup flow with payment
- ✅ Free trial and paid subscription options
- ✅ License key generation and email delivery
- ✅ License validation and API key retrieval
- ✅ User management and admin controls
- ✅ Stripe payment integration
- ✅ Real-time server health monitoring
- ✅ Error handling and loading states
- ✅ TypeScript type safety
- ✅ Responsive design with Tailwind CSS
- ✅ Copy-to-clipboard functionality
- ✅ Test mode support for development

The frontend is now fully connected to all backend endpoints and provides a complete user experience for signup, payment, license management, and administration! 
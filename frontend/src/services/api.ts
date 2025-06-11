import axios from 'axios';
import {
  CheckoutSessionData,
  CheckoutSessionResponse,
  CreateAccountRequest,
  CreateAccountResponse,
  UpdateApiKeyRequest,
  UpdateApiKeyResponse,
  LicenseRequest,
  CreateLicenseKeyResponse,
  ApiKeyResponse,
  UserInfo,
  LicenseInfo,
  SendLicenseEmailResponse,
  ManualLicenseData,
  DeleteUserResponse,
  ServerHealthResponse,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // =============================================
  // SERVER HEALTH & BASIC ENDPOINTS
  // =============================================

  // Check server health
  checkServerHealth: async (): Promise<ServerHealthResponse> => {
    const response = await api.get('/');
    return response.data;
  },

  // =============================================
  // USER ACCOUNT MANAGEMENT
  // =============================================

  // Create new user account
  createAccount: async (accountData: CreateAccountRequest): Promise<CreateAccountResponse> => {
    const formData = new URLSearchParams();
    formData.append('first_name', accountData.first_name);
    formData.append('last_name', accountData.last_name);
    formData.append('company_name', accountData.company_name);
    formData.append('email', accountData.email);
    formData.append('mistral_api_key', accountData.mistral_api_key);
    
    const response = await api.post('/create-account', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // Get user information by email
  getUserInfo: async (email: string): Promise<UserInfo> => {
    const response = await api.get(`/user/${encodeURIComponent(email)}`);
    return response.data;
  },

  // =============================================
  // API KEY MANAGEMENT
  // =============================================

  // Get API key by email
  getApiKeyByEmail: async (email: string): Promise<ApiKeyResponse> => {
    const response = await api.get(`/api-key/by-email/${encodeURIComponent(email)}`);
    return response.data;
  },

  // Get API key by license key
  getApiKeyByLicense: async (licenseKey: string): Promise<ApiKeyResponse> => {
    const response = await api.get(`/api-key/by-license/${encodeURIComponent(licenseKey)}`);
    return response.data;
  },

  // Update user's API key
  updateApiKey: async (updateData: UpdateApiKeyRequest): Promise<UpdateApiKeyResponse> => {
    const formData = new URLSearchParams();
    formData.append('email', updateData.email);
    formData.append('new_api_key', updateData.new_api_key);
    
    const response = await api.put('/update-api-key', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // =============================================
  // LICENSE MANAGEMENT
  // =============================================

  // Check license validity
  checkLicense: async (licenseCode: string): Promise<LicenseInfo> => {
    const response = await api.get(`/check_license/${encodeURIComponent(licenseCode)}`);
    return response.data;
  },

  // Send license key via email
  sendLicenseEmail: async (licenseRequest: LicenseRequest): Promise<SendLicenseEmailResponse> => {
    const formData = new URLSearchParams();
    formData.append('email', licenseRequest.email);
    
    const response = await api.post('/send-license-email', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // =============================================
  // PAYMENT & STRIPE INTEGRATION
  // =============================================

  // Create Stripe checkout session
  createCheckoutSession: async (data: CheckoutSessionData): Promise<CheckoutSessionResponse> => {
    const formData = new URLSearchParams();
    formData.append('price_id', data.price_id);
    formData.append('user_email', data.user_email);
    formData.append('success_url', data.success_url);
    formData.append('cancel_url', data.cancel_url);
    formData.append('first_name', data.user_data.firstName);
    formData.append('last_name', data.user_data.lastName);
    formData.append('company_name', data.user_data.companyName);
    formData.append('mistral_api_key', data.user_data.mistralApiKey);
    
    const response = await api.post('/create-checkout-session', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // =============================================
  // UTILITY FUNCTIONS FOR COMMON WORKFLOWS
  // =============================================

  // Complete user signup flow (combines account creation and license generation)
  completeUserSignup: async (userData: CreateAccountRequest): Promise<{
    account: CreateAccountResponse;
    license: CreateLicenseKeyResponse;
  }> => {
    // Create account
    const account = await apiService.createAccount(userData);
    
    // Generate license key
    const license = await apiService.createLicenseKey({ email: userData.email });
    
    return { account, license };
  },

  // Start free trial (create account + generate license + send email)
  startFreeTrial: async (userData: CreateAccountRequest): Promise<SendLicenseEmailResponse> => {
    // Create account
    await apiService.createAccount(userData);
    
    // Send license email (this will also create the license key)
    const response = await apiService.sendLicenseEmail({ email: userData.email });
    
    return response;
  },

  // Validate license and get associated API key
  validateLicenseAndGetApiKey: async (licenseCode: string): Promise<{
    isValid: boolean;
    apiKey?: string;
    userInfo?: UserInfo;
  }> => {
    try {
      // Check license validity
      const licenseInfo = await apiService.checkLicense(licenseCode);
      
      if (licenseInfo.valid && licenseInfo.license_info) {
        // Get API key for this license
        const apiKeyResponse = await apiService.getApiKeyByLicense(licenseCode);
        
        return {
          isValid: true,
          apiKey: apiKeyResponse.api_key,
          userInfo: licenseInfo.license_info
        };
      }
      
      return { isValid: false };
    } catch (error) {
      console.error('License validation failed:', error);
      return { isValid: false };
    }
  },

  // Update user profile (convenience method)
  updateUserProfile: async (
    email: string, 
    updates: Partial<Pick<CreateAccountRequest, 'first_name' | 'last_name' | 'company_name' | 'mistral_api_key'>>
  ): Promise<UpdateApiKeyResponse> => {
    // For now, we only support updating API key through the dedicated endpoint
    // You could extend this to support other fields when backend supports it
    if (updates.mistral_api_key) {
      return await apiService.updateApiKey({
        email,
        new_api_key: updates.mistral_api_key
      });
    }
    
    throw new Error('Only API key updates are currently supported');
  }
}; 
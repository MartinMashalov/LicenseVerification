import axios from 'axios';
import {
  CheckoutSessionData,
  CheckoutSessionResponse,
  CreateAccountRequest,
  CreateAccountResponse,
  UpdateApiKeyRequest,
  UpdateApiKeyResponse,
  LicenseRequest,
  ApiKeyResponse,
  UserInfo,
  LicenseInfo,
  SendLicenseEmailResponse,
  ServerHealthResponse,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8005';

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

  // Start free trial (create account + generate license + send email)
  startFreeTrial: async (userData: CreateAccountRequest): Promise<SendLicenseEmailResponse> => {
    // Create account (this automatically creates a license key according to backend)
    await apiService.createAccount(userData);
    
    // Send license email
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
      
      if (licenseInfo.valid) {
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
    updates: Partial<Pick<CreateAccountRequest, 'first_name' | 'last_name' | 'company_name'>>
  ): Promise<UpdateApiKeyResponse> => {
    // For now, we only support updating API key through the dedicated endpoint
    // You could extend this to support other fields when backend supports it
    if (updates.company_name) {
      return await apiService.updateApiKey({
        email,
        new_api_key: updates.company_name
      });
    }
    
    throw new Error('Only company name updates are currently supported');
  }
}; 
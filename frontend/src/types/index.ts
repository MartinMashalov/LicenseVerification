export interface UserSignupData {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
}

export interface CheckoutSessionData {
  price_id: string;
  user_email: string;
  success_url: string;
  cancel_url: string;
  user_data: UserSignupData;
}

export enum SignupStep {
  BASIC_INFO = 1,
  PAYMENT = 2,
  SUCCESS = 3
}

export interface LicenseResponse {
  license_key: string;
  success: boolean;
  message?: string;
}

// New types for additional backend endpoints
export interface CreateAccountRequest {
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
}

export interface CreateAccountResponse {
  message: string;
  email: string;
}

export interface UpdateApiKeyRequest {
  email: string;
  new_api_key: string;
}

export interface UpdateApiKeyResponse {
  message: string;
  email: string;
}

export interface LicenseRequest {
  email: string;
}

export interface ApiKeyResponse {
  email?: string;
  license_key?: string;
  api_key: string;
}

export interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  license_code?: string;
  created_at: string;
  updated_at: string;
}

export interface LicenseInfo {
  valid: boolean;
  license_info?: UserInfo;
}

export interface CheckoutSessionResponse {
  session_id: string;
  message?: string;
}

export interface SendLicenseEmailResponse {
  message: string;
  email: string;
  license_key: string;
}

export interface ServerHealthResponse {
  message: string;
} 
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { UserSignupData, CreateAccountRequest } from '../../types';
import { apiService } from '../../services/api';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface PaymentStepProps {
  data: UserSignupData;
  onNext: () => void;
  onBack: () => void;
  setLicenseKey: (key: string) => void;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({ 
  data, 
  onNext, 
  onBack, 
  setLicenseKey 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert UserSignupData to CreateAccountRequest format
  const convertToAccountRequest = (userData: UserSignupData): CreateAccountRequest => ({
    first_name: userData.firstName,
    last_name: userData.lastName,
    company_name: userData.companyName,
    email: userData.email,
    mistral_api_key: userData.mistralApiKey,
  });

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      // Create checkout session
      const checkoutResponse = await apiService.createCheckoutSession({
        price_id: process.env.REACT_APP_STRIPE_PRICE_ID || 'price_1234567890',
        user_email: data.email,
        success_url: `${window.location.origin}/success`,
        cancel_url: `${window.location.origin}`,
        user_data: data
      });

      // Check if we got a test mode response
      if (checkoutResponse.message && checkoutResponse.message.includes('TEST MODE')) {
        console.log('Test mode detected:', checkoutResponse.message);
        
        try {
          const accountData = convertToAccountRequest(data);
          const licenseResponse = await apiService.startFreeTrial(accountData);
          setLicenseKey(licenseResponse.license_key);
          onNext();
          return;
        } catch (accountError) {
          const licenseResponse = await apiService.sendLicenseEmail({ email: data.email });
          setLicenseKey(licenseResponse.license_key);
          onNext();
          return;
        }
      }

      // Redirect to Stripe Checkout for real payments
      const { error } = await stripe.redirectToCheckout({
        sessionId: checkoutResponse.session_id,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-4">
      <div className="w-full max-w-md">
        {/* Simple Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#5B67E8] mb-1">VisionPay</h1>
          <p className="text-gray-500 text-sm">Select Subscription</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Main Pricing Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Popular Badge */}
          <div className="bg-[#5B67E8] px-4 py-2 text-center">
            <span className="text-white font-medium text-sm">VisionPay Pro</span>
          </div>

          <div className="px-6 py-6">
            {/* Pricing Display */}
            <div className="text-center mb-6">
              <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                30 Days FREE
              </div>
              
              <div className="mb-3">
                <div className="text-3xl font-bold text-gray-900">$0</div>
                <div className="text-gray-500 text-sm">for the first month</div>
              </div>
              
              <div className="flex items-center justify-center space-x-2">
                <span className="text-gray-600">then</span>
                <span className="text-xl font-bold text-[#5B67E8]">$65</span>
                <span className="text-gray-500">/month</span>
              </div>
            </div>

            {/* Features List */}
            <div className="flex flex-col items-center mb-6">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Complete 30-day free trial</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Full access to VisionPay</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Priority customer support</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Cancel anytime before trial ends</span>
                </div>
              </div>
            </div>

            {/* Call to Action Button */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-[#5B67E8] hover:bg-[#4A56D8] text-white font-semibold py-3 px-6 rounded-xl text-base transition-all duration-200 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                'Start Your Free Trial'
              )}
            </button>

            {/* Trust Indicators */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                No commitment • Cancel anytime • Secure payment
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 font-medium text-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-gray-400 text-xs">© 2025 VisionPay</p>
        </div>
      </div>
    </div>
  );
}; 
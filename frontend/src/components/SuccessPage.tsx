import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';

export const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(true);
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        console.log('SuccessPage loaded, location search:', location.search);
        
        // Get session_id from URL params (Stripe adds this automatically)
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id');
        
        console.log('Extracted session_id:', sessionId);

        if (!sessionId) {
          // If no session_id, this might be a direct navigation to success page
          console.log('No session_id found in URL params');
          setError('Invalid session. Please complete the payment process.');
          return;
        }

        console.log('Calling processPaymentSuccess with session_id:', sessionId);
        
        // Process the payment success using the session ID
        const result = await apiService.processPaymentSuccess(sessionId);
        
        console.log('processPaymentSuccess result:', result);
        
        if (result.status === 'success' || result.status === 'partial_success') {
          setLicenseKey(result.license_key || '');
          setUserEmail(result.email || '');
          setIsProcessing(false);
        } else {
          setError('Payment processing failed. Please contact support.');
        }
      } catch (err: any) {
        console.error('Error processing success:', err);
        if (err.response?.status === 400) {
          setError('Payment not completed or invalid session. Please try again.');
        } else {
          setError('There was an issue processing your payment. Please contact support.');
        }
        setIsProcessing(false);
      }
    };

    handleSuccess();
  }, [location]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[24px] shadow-xl px-8 py-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#5B67E8] mb-4">VisionPay</h1>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-normal text-gray-800 mb-2">Error</h2>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
            <button
              onClick={() => navigate('/signup')}
              className="w-full py-3 bg-[#5B67E8] hover:bg-[#4A56D8] text-white font-semibold text-base rounded-full text-center transition-all shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[24px] shadow-xl px-8 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#5B67E8] mb-4">VisionPay</h1>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-normal text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 text-sm">
              {isProcessing 
                ? 'Processing payment and creating your license key...'
                : `Thank you for your subscription! Your license key has been sent to ${userEmail}.`}
            </p>
            {!isProcessing && licenseKey && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">Your License Key:</p>
                <p className="text-sm text-blue-900 font-mono bg-white px-2 py-1 rounded border">
                  {licenseKey}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isProcessing && (
            <div className="space-y-4">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 border-2 border-gray-300 rounded-full font-semibold text-base text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-all"
              >
                Create Another Account
              </button>
              <a
                href="https://visionpay.com"
                className="block w-full py-3 bg-[#5B67E8] hover:bg-[#4A56D8] text-white font-semibold text-base rounded-full text-center transition-all shadow-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                Go to VisionPay
              </a>
            </div>
          )}

          {/* Footer Links */}
          <div className="text-center mt-8">
            <div className="text-gray-500 text-sm">
              Need help?{' '}
              <a href="/support" className="text-[#5B67E8] hover:underline font-medium">
                Contact Support
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center mt-8">
            <p className="text-gray-400 text-xs">© 2025 VisionPay</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 
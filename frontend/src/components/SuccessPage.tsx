import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('session_id');
    if (id) {
      setSessionId(id);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[24px] shadow-xl px-8 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#5B67E8] mb-4 tracking-tight">VisionPay</h1>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-normal text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Thank you for your subscription. Your license key has been sent to your email address.
            </p>
          </div>
          
          {sessionId && (
            <div className="bg-gray-50 rounded-xl p-4 mb-8">
              <p className="text-sm text-gray-600 text-center">
                Session ID: <code className="font-mono text-xs bg-white px-2 py-1 rounded border">{sessionId}</code>
              </p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-3 bg-[#5B67E8] hover:bg-[#4A56D8] text-white font-semibold text-base rounded-full transition-all shadow-lg"
            >
              Create Another Account
            </button>
            <a
              href="https://visionpay.com"
              className="block w-full py-3 border-2 border-gray-300 rounded-full font-semibold text-base text-gray-600 hover:border-gray-400 hover:text-gray-700 text-center transition-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              Go to VisionPay
            </a>
          </div>

          {/* Footer Links */}
          <div className="text-center">
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
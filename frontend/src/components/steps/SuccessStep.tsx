import React, { useState } from 'react';
import { UserSignupData } from '../../types';

interface SuccessStepProps {
  data: UserSignupData;
  licenseKey: string;
  onRestart: () => void;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({ data, licenseKey, onRestart }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy license key:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-[24px] shadow-xl px-8 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#5B67E8] mb-4 tracking-tight">VisionPay</h1>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-normal text-gray-800 mb-2">Welcome to VisionPay!</h2>
            <p className="text-gray-500 text-sm">Your account has been successfully created</p>
          </div>

          {/* Account Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Account Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-800">{data.firstName} {data.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Company:</span>
                <span className="font-medium text-gray-800">{data.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-800">{data.email}</span>
              </div>
            </div>
          </div>

          {/* License Key */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Your License Key</h3>
            <p className="text-sm text-gray-600 mb-4">
              This is your unique license key. Please save it securely as you'll need it to activate VisionPay.
            </p>
            
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono text-gray-800 flex-1 break-all pr-4">
                  {licenseKey}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 bg-[#5B67E8] hover:bg-[#4A56D8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> If you refresh or close this page, you'll lose access to your license key. 
                  We've also sent it to your email address.
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h4 className="font-semibold text-gray-800 mb-3 text-base">Next Steps:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Check your email for the license key confirmation</li>
              <li>Download VisionPay from our website</li>
              <li>Enter your license key during installation</li>
              <li>Start using VisionPay with your Mistral API key</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mb-8">
            <button
              onClick={onRestart}
              className="flex-1 py-3 rounded-full font-semibold text-base border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-all"
            >
              Create Another Account
            </button>
            <a
              href="https://visionpay.com"
              className="flex-1 py-3 bg-[#5B67E8] hover:bg-[#4A56D8] text-white font-semibold text-base rounded-full text-center transition-all shadow-lg"
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
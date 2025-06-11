import React, { useState } from 'react';
import { apiService } from '../services/api';
import { UserInfo } from '../types';

interface LicenseValidatorProps {
  onClose?: () => void;
}

export const LicenseValidator: React.FC<LicenseValidatorProps> = ({ onClose }) => {
  const [licenseCode, setLicenseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    userInfo?: UserInfo;
    apiKey?: string;
    error?: string;
  } | null>(null);

  const validateLicense = async () => {
    if (!licenseCode.trim()) {
      setResult({ isValid: false, error: 'Please enter a license code' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const validation = await apiService.validateLicenseAndGetApiKey(licenseCode.trim());
      setResult(validation);
    } catch (error) {
      console.error('License validation failed:', error);
      setResult({ 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[24px] shadow-xl px-8 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#5B67E8] mb-4 tracking-tight">VisionPay</h1>
            <h2 className="text-xl font-normal text-gray-800">License Validator</h2>
            <p className="text-gray-500 text-sm mt-2">Enter your license code to verify and get your API key</p>
          </div>

          {/* License Input */}
          <div className="mb-6">
            <label htmlFor="licenseCode" className="block text-[#5B67E8] text-sm font-medium mb-2">
              License Code *
            </label>
            <input
              type="text"
              id="licenseCode"
              value={licenseCode}
              onChange={(e) => setLicenseCode(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#5B67E8] rounded-xl focus:outline-none focus:border-[#4A56D8] text-gray-800 text-sm placeholder-gray-400 text-center"
              placeholder="Enter your license code"
              onKeyDown={(e) => e.key === 'Enter' && validateLicense()}
            />
          </div>

          {/* Validate Button */}
          <button
            onClick={validateLicense}
            disabled={loading}
            className={`w-full py-3 rounded-full font-semibold text-base transition-all mb-6 ${
              licenseCode.trim()
                ? 'bg-[#5B67E8] hover:bg-[#4A56D8] text-white shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Validating...' : 'Validate License'}
          </button>

          {/* Results */}
          {result && (
            <div className={`p-4 rounded-xl mb-6 ${
              result.isValid 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {result.isValid ? (
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-green-800 font-semibold">Valid License</h3>
                  </div>
                  
                  {result.userInfo && (
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-gray-600">Name:</div>
                        <div className="text-gray-800 font-medium">
                          {result.userInfo.first_name} {result.userInfo.last_name}
                        </div>
                        <div className="text-gray-600">Company:</div>
                        <div className="text-gray-800 font-medium">{result.userInfo.company_name}</div>
                        <div className="text-gray-600">Email:</div>
                        <div className="text-gray-800 font-medium">{result.userInfo.email}</div>
                        <div className="text-gray-600">Created:</div>
                        <div className="text-gray-800 font-medium">
                          {new Date(result.userInfo.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {result.apiKey && (
                        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-xs">API Key:</span>
                            <button
                              onClick={() => copyToClipboard(result.apiKey!)}
                              className="text-[#5B67E8] text-xs hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="font-mono text-xs text-gray-800 mt-1 break-all">
                            {result.apiKey}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-2">
                    <div className="w-5 h-5 bg-red-500 rounded-full mr-3 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-red-800 font-semibold">Invalid License</h3>
                  </div>
                  <p className="text-red-700 text-sm">
                    {result.error || 'The license code you entered is not valid or has expired.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 rounded-full font-semibold text-base text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-all"
              >
                Close
              </button>
            )}
            <button
              onClick={() => {
                setLicenseCode('');
                setResult(null);
              }}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-base rounded-full transition-all"
            >
              Clear
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-400 text-xs">© 2025 VisionPay</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 
import React, { useState } from 'react';
import { UserSignupData } from '../../types';

interface ApiKeyStepProps {
  data: UserSignupData;
  updateData: (updates: Partial<UserSignupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ApiKeyStep: React.FC<ApiKeyStepProps> = ({ data, updateData, onNext, onBack }) => {
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.mistralApiKey) {
      onNext();
    }
  };

  const isValid = data.mistralApiKey;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[24px] shadow-xl px-8 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#5B67E8] mb-4 tracking-tight">VisionPay</h1>
            <h2 className="text-xl font-normal text-gray-800">API Configuration</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="mistralApiKey" className="block text-[#5B67E8] text-sm font-medium mb-2">
                Mistral API Key *
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  id="mistralApiKey"
                  value={data.mistralApiKey}
                  onChange={(e) => updateData({ mistralApiKey: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border-2 border-[#5B67E8] rounded-xl focus:outline-none focus:border-[#4A56D8] text-gray-800 text-sm placeholder-gray-400 text-center"
                  placeholder=""
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showKey ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.757 7.757M7.757 7.757l2.122 2.122" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Get your API key from{' '}
                <a href="https://console.mistral.ai/api-keys/" target="_blank" rel="noopener noreferrer" className="text-[#5B67E8] hover:underline">
                  Mistral's console
                </a>
              </p>
            </div>

            <div className="pt-4 flex space-x-3">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-3 rounded-full font-semibold text-base border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!isValid}
                className={`flex-1 py-3 rounded-full font-semibold text-base transition-all ${
                  isValid
                    ? 'bg-[#5B67E8] hover:bg-[#4A56D8] text-white shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="text-center mt-8">
            <div className="text-gray-500 text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-[#5B67E8] hover:underline font-medium">
                Sign In
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
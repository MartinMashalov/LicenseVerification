import React, { useState } from 'react';
import { UserSignupData } from '../../types';
import { api, apiService } from '../../services/api';

interface BasicInfoStepProps {
  data: UserSignupData;
  updateData: (updates: Partial<UserSignupData>) => void;
  onNext: () => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, updateData, onNext }) => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.firstName && data.lastName && data.companyName && data.email) {
      setIsLoading(true);
      setError('');
      
      try {
        // Check if user exists first
        const response = await api.get(`/user-exists/${encodeURIComponent(data.email)}`);
        const { exists } = response.data;
        
        if (exists) {
          setError('A user with this email already exists. Please use a different email.');
          return;
        }

        // Create new user account (without license key)
        await apiService.createAccount({
          first_name: data.firstName,
          last_name: data.lastName,
          company_name: data.companyName,
          email: data.email
        });

        // Move to next step after successful account creation
        onNext();
      } catch (err: any) {
        console.error('Error creating account:', err);
        if (err.response?.status === 500 && err.response?.data?.detail?.includes('already exists')) {
          setError('A user with this email already exists. Please use a different email.');
        } else {
          setError('Failed to create account. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isValid = data.firstName && data.lastName && data.companyName && data.email;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[24px] shadow-xl px-8 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#5B67E8] mb-4 tracking-tight">VisionPay</h1>
            <h2 className="text-xl font-normal text-gray-800">Sign Up</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="firstName" className="block text-gray-500 text-sm font-medium mb-2">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                value={data.firstName}
                onChange={(e) => updateData({ firstName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#5B67E8] text-gray-800 text-sm placeholder-gray-400 text-center"
                placeholder=""
                required
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-gray-500 text-sm font-medium mb-2">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                value={data.lastName}
                onChange={(e) => updateData({ lastName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#5B67E8] text-gray-800 text-sm placeholder-gray-400 text-center"
                placeholder=""
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-500 text-sm font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={data.email}
                onChange={(e) => updateData({ email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#5B67E8] text-gray-800 text-sm placeholder-gray-400 text-center"
                placeholder=""
                required
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-gray-500 text-sm font-medium mb-2">
                Company Name *
              </label>
              <input
                type="text"
                id="companyName"
                value={data.companyName}
                onChange={(e) => updateData({ companyName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#5B67E8] text-gray-800 text-sm placeholder-gray-400 text-center"
                placeholder=""
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={!isValid || isLoading}
                className={`w-full py-3 rounded-full font-semibold text-base transition-all ${
                  isValid && !isLoading
                    ? 'bg-[#5B67E8] hover:bg-[#4A56D8] text-white shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Creating...' : 'Continue'}
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
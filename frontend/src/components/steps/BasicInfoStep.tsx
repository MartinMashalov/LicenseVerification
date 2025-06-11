import React from 'react';
import { UserSignupData } from '../../types';

interface BasicInfoStepProps {
  data: UserSignupData;
  updateData: (updates: Partial<UserSignupData>) => void;
  onNext: () => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, updateData, onNext }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.firstName && data.lastName && data.companyName && data.email) {
      onNext();
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
              <label htmlFor="firstName" className="block text-[#5B67E8] text-sm font-medium mb-2">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                value={data.firstName}
                onChange={(e) => updateData({ firstName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[#5B67E8] rounded-xl focus:outline-none focus:border-[#4A56D8] text-gray-800 text-sm placeholder-gray-400 text-center"
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

            <div className="pt-4">
              <button
                type="submit"
                disabled={!isValid}
                className={`w-full py-3 rounded-full font-semibold text-base transition-all ${
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
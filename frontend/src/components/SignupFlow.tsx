import React, { useState } from 'react';
import { UserSignupData, SignupStep } from '../types';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { ApiKeyStep } from './steps/ApiKeyStep';
import { PaymentStep } from './steps/PaymentStep';
import { SuccessStep } from './steps/SuccessStep';

const initialFormData: UserSignupData = {
  firstName: '',
  lastName: '',
  companyName: '',
  email: '',
  mistralApiKey: '',
};

export const SignupFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<SignupStep>(SignupStep.BASIC_INFO);
  const [formData, setFormData] = useState<UserSignupData>(initialFormData);
  const [licenseKey, setLicenseKey] = useState<string>('');

  const updateFormData = (updates: Partial<UserSignupData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < SignupStep.SUCCESS) {
      setCurrentStep(prev => (prev + 1) as SignupStep);
    }
  };

  const prevStep = () => {
    if (currentStep > SignupStep.BASIC_INFO) {
      setCurrentStep(prev => (prev - 1) as SignupStep);
    }
  };

  const resetFlow = () => {
    setCurrentStep(SignupStep.BASIC_INFO);
    setFormData(initialFormData);
    setLicenseKey('');
  };

  const renderStep = () => {
    switch (currentStep) {
      case SignupStep.BASIC_INFO:
        return (
          <BasicInfoStep 
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
          />
        );
      
      case SignupStep.API_KEY:
        return (
          <ApiKeyStep 
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      
      case SignupStep.PAYMENT:
        return (
          <PaymentStep 
            data={formData}
            onNext={nextStep}
            onBack={prevStep}
            setLicenseKey={setLicenseKey}
          />
        );
      
      case SignupStep.SUCCESS:
        return (
          <SuccessStep 
            data={formData}
            licenseKey={licenseKey}
            onRestart={resetFlow}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {renderStep()}
    </>
  );
}; 
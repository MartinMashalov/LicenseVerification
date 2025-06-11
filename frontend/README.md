# VisionPay License Signup Frontend

This is the React frontend application for the VisionPay license signup process. It features a multi-step signup flow with Stripe payment integration.

## Features

- **Multi-step signup process**:
  1. Basic information (Name, Company)
  2. API key configuration (Email, Mistral API key)
  3. Payment selection (Free trial or $65/month subscription)
  4. Success page with license key display

- **Stripe integration** for secure payments
- **Responsive design** with Tailwind CSS
- **TypeScript** for type safety
- **Modern UI** with professional aesthetics

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API server running on port 8000

### Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
REACT_APP_STRIPE_PRICE_ID=price_your_stripe_price_id
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

### Stripe Configuration

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your publishable key from the Stripe dashboard
3. Create a product and price in Stripe dashboard
4. Copy the price ID to your environment variables
5. Set up webhooks in Stripe to point to your backend API

### API Integration

The frontend expects the following API endpoints on your backend:

- `POST /create-checkout-session` - Create Stripe checkout session
- `POST /send-license-email` - Send license email for free trial
- `GET /check_license/{license_code}` - Verify license validity
- `GET /licenses` - Get all licenses (admin)

## Project Structure

```
src/
├── components/
│   ├── steps/
│   │   ├── BasicInfoStep.tsx     # Step 1: Basic information
│   │   ├── ApiKeyStep.tsx        # Step 2: API key configuration
│   │   ├── PaymentStep.tsx       # Step 3: Payment selection
│   │   └── SuccessStep.tsx       # Step 4: Success & license key
│   ├── SignupFlow.tsx            # Main signup flow orchestrator
│   └── SuccessPage.tsx           # Stripe success redirect page
├── services/
│   └── api.ts                    # API service functions
├── types/
│   └── index.ts                  # TypeScript interfaces
└── App.tsx                       # Main app with routing
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Payment Flow

1. User fills out basic information and API key
2. User selects either:
   - **Free Trial**: Generates license immediately via email
   - **Monthly Subscription**: Redirects to Stripe Checkout
3. After successful payment, license key is sent via email
4. Success page displays license key with copy functionality

## Notes

- License keys are generated as UUID strings
- Free trial doesn't require credit card
- Payment success redirects to `/success` route
- License keys are only displayed once (not stored in frontend)
- Email confirmation is sent for all license generations

## Development

The application uses:
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Stripe React.js** for payment processing
- **Axios** for API communication
- **React Router** for navigation

## Support

For issues or questions, please check the backend API logs and ensure all environment variables are properly configured.

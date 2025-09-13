# SmartPlanner - Project Expense & Income Tracker

A Next.js 14 fullstack PWA application for tracking project expenses and income with OTP authentication, token-based billing, and M-PESA integration.

## 🌟 Features

### Authentication & Security
- 📱 **OTP Login**: Phone number registration with SMS verification via Wasiliana API
- 🔐 **Token-Based Billing**: First signup free, subsequent logins cost 1 token (1 KES)
- 🔒 **Session Persistence**: Long-lived sessions tied to device security
- 🛡️ **Row Level Security**: Supabase RLS for data protection

### Financial Management
- 💼 **Project Management**: Create and track multiple projects
- 💰 **Expense Tracking**: Categorized expense tracking with date stamps
- 📈 **Income Tracking**: Multiple income sources per project
- 📊 **Financial Reports**: Tax calculations, reinvestment rates, profit analysis
- 📄 **Export Options**: PDF and CSV export capabilities

### Billing & Payments
- 💳 **M-PESA Integration**: Secure payments via Daraja API
- 🪙 **Token System**: 1 KES per token, used for login/password reset
- 💸 **Flexible Packages**: Buy tokens in various denominations
- 📱 **STK Push**: Direct mobile payment prompts

### Mobile & PWA
- 📱 **Installable**: Install as native app on Android/iOS
- 🔄 **Offline Support**: Work offline with automatic sync
- 📱 **Responsive Design**: Mobile-first responsive interface
- 🔄 **Background Sync**: Sync data when connection returns

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL), Next.js API Routes
- **Authentication**: Custom OTP system with Supabase Auth
- **Payments**: M-PESA Daraja API
- **SMS**: Wasiliana SMS API
- **PWA**: Custom service worker, manifest.json
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- M-PESA Daraja API credentials
- Wasiliana SMS API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartplanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Wasiliana SMS API Configuration
   WASILIANA_API_KEY=your_wasiliana_api_key
   WASILIANA_BASE_URL=https://api.wasiliana.com

   # M-PESA Daraja API Configuration
   MPESA_CONSUMER_KEY=your_mpesa_consumer_key
   MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
   MPESA_SHORTCODE=your_mpesa_shortcode
   MPESA_PASSKEY=your_mpesa_passkey
   MPESA_CALLBACK_URL=https://your-domain.vercel.app/api/mpesa/callback

   # App Configuration
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Set up Supabase database**
   
   Run the SQL schema in your Supabase SQL editor:
   ```bash
   # Copy the contents of supabase/schema.sql and run in Supabase
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   ```
   http://localhost:3000
   ```

## 📦 Database Schema

The application uses the following Supabase tables:

### Core Tables
- **users**: User profiles with phone numbers and verification status
- **user_tokens**: Token balances for billing
- **projects**: Project information with tax and reinvestment rates
- **expenses**: Project expenses with categories and amounts
- **income**: Project income sources and amounts
- **payments**: M-PESA payment records

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Secure functions for token management

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/logout` - Logout user

### Payments
- `POST /api/mpesa/stk-push` - Initiate M-PESA payment
- `POST /api/mpesa/callback` - Handle M-PESA payment callbacks

## 📱 PWA Features

### Installation
- Installable on Android/iOS devices
- Custom app icons and splash screens
- Standalone display mode

### Offline Support
- Service worker for caching
- Background sync for offline data
- Automatic sync when online

### Native Features
- Push notifications (planned)
- Device integration
- Screen lock security

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Authentication pages
│   ├── tokens/            # Token purchase pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   └── supabase/         # Supabase client configuration
└── types/                # TypeScript type definitions
```

## 🔐 Security Features

### Authentication
- Phone number-based registration
- SMS OTP verification
- Token-based access control
- Session persistence with security

### Data Protection
- Supabase Row Level Security
- Encrypted data transmission
- Secure API endpoints
- CORS protection

### Payment Security
- M-PESA secure payment gateway
- Transaction verification
- Receipt validation
- Fraud protection

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set environment variables**
   - Add all environment variables in Vercel dashboard
   - Update MPESA_CALLBACK_URL to your Vercel domain

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Domain Setup
- Configure custom domain in Vercel
- Update M-PESA callback URL
- Test PWA installation

## 📊 Usage

### User Journey
1. **Registration**: Enter phone number → Receive OTP → Verify (free)
2. **Login**: Enter phone → OTP sent (costs 1 token) → Verify
3. **Token Purchase**: Buy tokens via M-PESA when balance is low
4. **Project Management**: Create projects, add expenses/income
5. **Reports**: Generate financial reports and export data

### Token System
- First registration: Free
- Each login: 1 token (1 KES)
- Password reset: 1 token (1 KES)
- Purchase via M-PESA: 1 KES = 1 token

## 🧪 Testing

### Development Testing
```bash
# Run development server
npm run dev

# Test PWA features
# - Use Chrome DevTools > Application > Service Workers
# - Test offline functionality
# - Verify manifest.json
```

### Production Testing
- Test M-PESA payments (use sandbox credentials)
- Verify SMS delivery
- Test PWA installation on mobile devices
- Check offline sync functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic authentication and billing
- ✅ Project management
- ✅ PWA functionality
- ✅ M-PESA integration

### Phase 2 (Planned)
- [ ] Advanced reporting
- [ ] Team collaboration
- [ ] Push notifications
- [ ] Data export improvements
- [ ] Multi-currency support

### Phase 3 (Future)
- [ ] AI-powered insights
- [ ] Automated expense categorization
- [ ] Integration with accounting software
- [ ] Advanced analytics dashboard

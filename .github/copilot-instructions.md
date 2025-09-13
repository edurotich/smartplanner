<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js 14 fullstack Project Expense & Income Tracker with the following technology stack:
- Frontend: Next.js 14 with TypeScript, TailwindCSS, shadcn/ui
- Backend: Supabase (PostgreSQL) 
- Authentication: OTP login via Wasiliana SMS API with token-based billing
- Payments: M-PESA Daraja API for token purchases
- PWA: Installable on mobile devices with offline support
- Deployment: Vercel

Key Features:
- Phone number registration with OTP verification
- Token-based billing system (1 KES per login/password reset)
- Project management with expenses and income tracking
- Financial reports with tax and reinvestment calculations
- PWA with offline synchronization
- M-PESA integration for token purchases

Database Schema (Supabase):
- users (id, phone, otp_code, verified, created_at)
- user_tokens (id, user_id, balance, updated_at) 
- projects (id, user_id, name, description, boq_budget, tax_rate, reinvestment_rate, created_at)
- expenses (id, project_id, title, category, amount, date, created_at)
- income (id, project_id, source, amount, date, created_at)
- payments (id, user_id, mpesa_receipt, amount, tokens_added, created_at)

Development Guidelines:
- Use TypeScript for type safety
- Follow mobile-first responsive design
- Implement offline-first architecture with local storage sync
- Use shadcn/ui components for consistent UI
- Ensure PWA installability and service worker caching

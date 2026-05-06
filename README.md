# Leduc Receipt Pro

**Enterprise-grade receipt intelligence platform for Canadian businesses, built with CRA compliance and Alberta construction industry requirements in mind.**

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials, Google Gemini API key, and integration secrets.

3. **Database Setup**:
   - Run the SQL setup scripts in Supabase SQL Editor:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_rls_policies.sql`
     - `supabase/migrations/003_functions.sql`
   - Configure **Storage** buckets: `receipt-images`

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🛠 Features

- **AI Receipt Scanning**: Google Gemini 2.5 Flash for high-accuracy receipt parsing with fraud detection
- **CRA Compliance**: Built-in audit logs, data integrity hashing, and 7-year retention logic
- **Multi-Currency Support**: Automatic CAD conversion for international receipts
- **Accounting Integration**: QuickBooks Online and Xero sync with circuit breaker patterns
- **Batch Processing**: Handle 50+ receipts in one session with robust error handling
- **Duplicate Detection**: SHA-256 hash-based duplicate prevention
- **Approval Workflows**: Owner approval for high-value expenses
- **Enterprise Security**: Row Level Security, comprehensive error handling, and retry logic
- **PIPEDA Compliant**: Privacy policy aligned with Canadian data protection laws

## 📂 Architecture

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL with RLS)
- **Storage**: Supabase Storage
- **AI**: Google Gemini 2.5 Flash
- **Styling**: Tailwind CSS v4 + Framer Motion
- **State**: React Query (TanStack Query v5)
- **Forms**: React Hook Form + Zod validation

## 🔐 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | ✅ |
| `GOOGLE_AI_KEY` | Google Gemini API Key | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Application URL (OAuth redirects) | ✅ |
| `QBO_CLIENT_ID` / `QBO_CLIENT_SECRET` | QuickBooks Online credentials | ✅ |
| `XERO_CLIENT_ID` / `XERO_CLIENT_SECRET` | Xero credentials | ✅ |

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Important**: Add all environment variables from `.env.local` to your Vercel project settings.

### Health Check

After deployment, verify system status:
```
GET /api/health
```

Returns health status for database, storage, and auth connections.

## 🛡️ Security Features

- **Row Level Security**: Database-level access control
- **Integrity Hashing**: SHA-256 verification for all receipts
- **Audit Trail**: Complete change history for compliance
- **Error Handling**: Comprehensive Supabase error handling with retry logic
- **Security Headers**: X-Frame-Options, CSP, and other security headers
- **Input Validation**: Zod schema validation on all server actions

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 Legal Pages

- **Privacy Policy**: `/privacy` - PIPEDA compliant
- **Terms of Service**: `/terms` - Service terms and conditions

## 🆘 Troubleshooting

### Build Issues

If you encounter build errors, ensure:
1. All environment variables are set
2. Node.js version is 18+
3. Dependencies are up to date: `npm install`

### Database Connection

If database connection fails:
1. Verify Supabase credentials
2. Check RLS policies are properly configured
3. Test connection via `/api/health` endpoint

## 📝 License

Proprietary - All rights reserved.

---

*Built with enterprise-grade security and CRA compliance for Canadian businesses.*
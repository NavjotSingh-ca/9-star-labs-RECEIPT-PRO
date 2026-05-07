# API Setup Guide — Receipt Pro

Complete this checklist to enable all Phase 1 features. All services listed have **free tiers** that are sufficient for getting your first paying customers.

---

## Required for Billing (Phase 1.1)

### 1. Stripe (Payments & Subscriptions)
**Cost:** Free until you charge customers

1. Go to https://dashboard.stripe.com/register
2. Create an account (use your business email)
3. Complete the onboarding wizard (you can skip bank details initially)
4. Once in the dashboard:
   - Go to "Developers" → "API keys"
   - Copy **Publishable key** (starts with `pk_test_`)
   - Copy **Secret key** (starts with `sk_test_`)
   - Go to "Developers" → "Webhooks" → "Add endpoint"
   - Add endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - Select all events, then copy the **Signing secret**
5. Create your products:
   - Go to "Product catalog" → "Add product"
   - Create "Pro Plan" — $29/mo, recurring
   - Create "Enterprise Plan" — $99/mo, recurring
   - Copy the **Price IDs** (starts with `price_`)
6. Add to `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
7. Update `src/app/settings/billing/page.tsx` with your real Price IDs:
   - Replace `price_placeholder_pro` with your actual Pro Price ID
   - Replace `price_placeholder_enterprise` with your actual Enterprise Price ID

---

### 2. Resend (Transactional Email)
**Cost:** 3,000 emails/month free forever

1. Go to https://resend.com/signup
2. Create an account
3. Verify your domain (requires adding DNS records to your domain registrar)
4. Go to "API Keys" → "Create API Key"
5. Copy the key (starts with `re_`)
6. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_...
   ```
7. Update `FROM_EMAIL` in `src/lib/services/email.ts` to your verified domain:
   ```typescript
   const FROM_EMAIL = 'Receipt Pro <receipts@yourdomain.com>';
   ```

---

## Required for QBO Integration (Phase 1.2)

### 3. Intuit Developer (QuickBooks Online)
**Cost:** Free sandbox, production requires app review

1. Go to https://developer.intuit.com/
2. Click "Sign up" and create an account
3. Go to "Dashboard" → "Create an app"
4. Select "QuickBooks Online and Payments"
5. Name your app "Receipt Pro"
6. Go to "Development Settings" → "Keys & Credentials"
7. Copy **Client ID** and **Client Secret**
8. Add Redirect URI: `https://your-domain.com/api/qbo/callback`
9. Add to `.env.local`:
   ```
   QBO_CLIENT_ID=AB... (long string)
   QBO_CLIENT_SECRET=... (secret)
   ```

---

## Optional But Recommended

### 4. Sentry (Error Tracking)
**Cost:** 5,000 errors/month free

1. Go to https://sentry.io/signup/
2. Create a project for "Next.js"
3. Copy the DSN (looks like `https://...@....ingest.sentry.io/...`)
4. Add to `.env.local`:
   ```
   SENTRY_DSN=https://...
   ```

### 5. Better Uptime (Status Page)
**Cost:** Free tier (1 monitor)

1. Go to https://betteruptime.com/sign_up
2. Create a status page
3. Add monitor for your domain
4. Optional: Add their widget to your landing page

### 6. Crisp (Chat Support)
**Cost:** Free forever (2 agents)

1. Go to https://crisp.chat/en/
2. Create an account
3. Go to "Settings" → "Website" settings
4. Copy your **Website ID**
5. Add to your landing page (I can help with this)

---

## Environment File Template

Create `.env.local` in your project root with:

```env
# Supabase (already set up)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Gemini AI (already set up)
GEMINI_API_KEY=AI...

# Stripe (required for billing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (required for emails)
RESEND_API_KEY=re_...

# QBO (required for QuickBooks integration)
QBO_CLIENT_ID=AB...
QBO_CLIENT_SECRET=...

# Site URL (required for redirects)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## Verification Checklist

After setting up each service, verify:

- [ ] Stripe: Can create checkout session from `/settings/billing`
- [ ] Stripe: Webhook endpoint shows green checkmark in Stripe dashboard
- [ ] Resend: Domain shows "Verified" in Resend dashboard
- [ ] Resend: Test email sends successfully
- [ ] QBO: App shows "Development/Production" status in Intuit dashboard

---

## Next Steps

1. Complete Stripe setup (required for first paying customer)
2. Complete Resend setup (required for transactional emails)
3. Tell me when you're ready and I'll implement Phase 1.2 (QBO OAuth) and Phase 1.3+ (Email templates, Onboarding wizard, PWA)

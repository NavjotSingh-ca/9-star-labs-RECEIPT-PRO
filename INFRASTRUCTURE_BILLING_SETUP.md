# ⚠️ BILLING INFRASTRUCTURE SETUP - REQUIRED ACTION

## IMPORTANT: This file must NOT be deleted until setup is complete and verified by the user.

## Current Status
All users are on a **Free Trial** until April 2027. Upgrades are locked but will be available in the future.

## To Enable Real Billing (Must Do Later)

### Environment Variables Required (set in Vercel):

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for client | Stripe Dashboard → Developers → API Keys |
| `STRIPE_SECRET_KEY` | Stripe secret key for server | Stripe Dashboard → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO` | Price ID for Pro plan ($19) | Stripe Dashboard → Products → Create product → Add price |
| `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS` | Price ID for Business plan ($49) | Stripe Dashboard → Products → Create product → Add price |

### Steps to Complete Setup:

1. **Create Stripe Products** (in Stripe Dashboard):
   - Create "Pro" product with $19/month recurring price
   - Create "Business" product with $49/month recurring price
   - Copy the price IDs (format: `price_xxxxxxxxxxxxx`)

2. **Set Environment Variables** in Vercel:
   - Go to Project Settings → Environment Variables
   - Add all four variables above

3. **Verify Setup**:
   - Run `npm run dev` locally with `.env.local`
   - Check that pricing table shows "Start 14-Day Trial" for Pro/Business plans
   - Test checkout flow works

### What Changes After Setup:

- Pro/Business "Available Soon" buttons become "Start 14-Day Trial"
- Clicking them will redirect to Stripe checkout
- Free tier "Get Started Free" becomes "Current Plan"

---

### Next Agent Notification Requirement

**Any agent that reads this file MUST notify the user at least once per session about this pending billing setup.**

Add this to your response when appropriate:
> "🔔 Reminder: Billing infrastructure setup is pending. See `INFRASTRUCTURE_BILLING_SETUP.md` for required environment variables to enable paid plans (Pro/Business). All users currently on free trial until April 2027."
# LandingPage + App Shell UI Overhaul

**Date**: 2026-07-16
**Status**: Approved design

## Section 1: LandingPage Refactor

File: `src/components/LandingPage.tsx` (560 lines)

### 1.1 Fix Scroll Animations (root cause of "half empty" page)

**Problem**: The `stagger` constant includes `whileInView` and `viewport` as top-level object keys, but these are motion element **props**, not variant values. When passed via `variants={stagger}`, framer-motion silently ignores them. The features grid (24 cards), pricing section (3 cards), and FAQ items all use this broken pattern — they stay at `opacity: 0, y: 20` forever.

**Fix**: Split into two:
- `staggerVariants`: only animation target values (`initial`, `animate` with `opacity`/`y`)
- Pass `whileInView="animate"`, `viewport={{ once: true }}` as **separate props** on each `<motion.div>`

The `fadeUp` pattern already works (spread as `{...fadeUp}`) — no change needed.

Affected sections:
- Feature cards grid (lines 454-463)
- Pricing grid (lines 478-489)
- FAQ items (line 531)
- Stats row (line 427) — already uses `animate` not `whileInView`, verify

### 1.2 Make Feature Cards Clickable

**Problem**: FeatureCard is a decorative `<motion.div>` with zero click handlers. Users click expecting a demo, preview, or navigation — nothing happens.

**Fix**: Add `onClick` to FeatureCard:
```tsx
onClick={() => {
  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
}}
```
Add `cursor-pointer` class. Cards already have `hover:-translate-y-0.5` — keep it. Optionally add a subtle "Learn more →" text that appears on hover within the card.

### 1.3 Condense Features (mobile-friendly)

**Problem**: 24 feature cards in a single column on mobile = overwhelming scroll. Performance cost of 24 framer-motion elements.

**Fix**:
- Show top **12** curated features by default
- Hide remaining 12 behind a "Show all 24 features →" toggle button (controlled by `useState`)
- Curated selection: AI Receipt Scanning, CRA Readiness Score, Audit Trail, Budget Management, Team Approvals, Mileage Tracking, Bank Reconciliation, Smart Search, Multi-Currency, Custom Reports, QBO & Xero Export, Dark Mode
- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` with `gap-2 sm:gap-3`

### 1.4 Fix Hash-Link Scrolling

**Problem**: `<a href="#features">` in the header nav may be intercepted by Next.js App Router as a client-side navigation instead of hash scroll.

**Fix**: Replace `<a>` tags with `<button>` elements that call:
```tsx
const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};
```
Keep `scroll-mt-20` on each section to account for the fixed header.

### 1.5 Mobile-Specific Layout Fixes

- Hero heading: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`
- Hero padding: `pt-24 pb-16 sm:pt-36 sm:pb-28`
- Stats: `grid-cols-2` base, `sm:grid-cols-4`
- Feature card gap: `gap-2` mobile, `gap-3` desktop
- Pricing section: ensure stacked cards on mobile have adequate spacing (`gap-4 sm:gap-6`)
- CTA banner: `p-6 sm:p-12` inner padding
- `max-w-6xl` containers reduce to `px-4` on mobile already — verify no overflow

---

## Section 2: App Shell Rebuild

Files: `src/app/page.tsx` (840 lines), `src/components/layout/*.tsx`

### 2.1 Fix Employee Role Redirect Bug

**Problem**: `page.tsx` lines 260-264:
```js
if (role === 'Employee') {
  if (!(EMPLOYEE_TAB_ORDER).includes(activeTab)) {
    setTabWithUrl('scan');  // silent redirect!
  }
}
```
Employee users clicking ANY feature not in `EMPLOYEE_TAB_ORDER` (which is most of the 23+ features) get silently redirected to scan.

**Fix**: Replace redirect with a toast notification:
```tsx
if (role === 'Employee' && !EMPLOYEE_TAB_ORDER.includes(activeTab)) {
  toast.error('This feature is not available for your role.');
  // Keep current tab, don't redirect
}
```

### 2.2 Decompose page.tsx

Split into focused modules:

**`src/hooks/useAuth.ts`** — All auth state management:
- User, role, orgId, authLoading state
- `useEffect` for `supabase.auth.getUser()`, `onAuthStateChange`
- Bootstrap org logic
- Return `{ user, role, orgId, authLoading, hasMounted, handleSignOut }`

**`src/components/tab-content.tsx`** — Tab content switch:
- Export `TabContent` component receiving `{ activeTab, receipts, role, userId, orgId, fetchReceipts, setTabWithUrl, user }`
- Contains all 33+ cases from the switch statement (dashboard → dark-sync)
- Each case wraps in `ErrorBoundary` and returns the appropriate component

**`src/components/AppShell.tsx`** — Authenticated app shell:
- Receives `{ user, role, orgId, plan, planLabel, receipts, activeTab, setTabWithUrl, handleSignOut, fetchReceipts }`
- Renders: Sidebar + (TopBar + content + MobileNav + MoreSheet)
- Contains keyboard shortcuts, touch gestures, AuditHUD, ambient gradients, OnboardingTour, FeatureWizard

**`page.tsx`** — Slim orchestration (~100 lines):
- Auth state → LandingPage/AuthScreen/AppShell
- Suspense wrapper

### 2.3 Mobile Overflow Fixes

- Main content: add `pb-[calc(4rem+env(safe-area-inset-bottom))]` for bottom nav + notch safety
- Ambient blur divs: wrap in `overflow-hidden` container to prevent horizontal scroll
- Tab panels: add `max-w-full overflow-x-hidden` to prevent wide child content from breaking layout
- Verify all 33+ feature component containers respect width constraints

### 2.4 Animation Consistency

- `AnimatePresence mode="wait"` already wraps `tabContent` — correct
- `key={activeTab}` on the motion.div wrapper — correct
- Sidebar collapse: add `will-change: transform, opacity` to reduce mobile jank
- Reduce sidebar collapse animation stiffness if spring feels heavy on low-end devices

### 2.5 Remove Dead Weight

- No deletions — all 23 feature dynamic imports are correctly lazy-loaded
- The `prefetchQuery` for dashboard is fine
- Touch swipe navigation over `FULL_TAB_ORDER` (36 items) is fine

---

## Implementation Order

1. **LandingPage**: Fix animations → condense features → feature cards clickable → hash nav → mobile layout
2. **App Shell**: Fix employee redirect → extract useAuth → extract TabContent → extract AppShell → mobile overflow fixes
3. **Verify**: `npx tsc --noEmit`, `npm run test`, manual mobile viewport check

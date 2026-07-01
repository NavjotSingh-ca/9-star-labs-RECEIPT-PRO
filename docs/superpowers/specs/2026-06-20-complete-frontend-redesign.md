# Leduc Receipt Pro — Complete Frontend Redesign

## Design Direction: "Gold Standard"
**Warm Professional Finance** — Stripe meets Linear for Canadian SMB accounting.

- **Accent**: True champagne gold (`#bea98e` dark / `#8b7355` light) — replaces all emerald green
- **Personality**: Trustworthy, sharp, fast, slightly premium. "A high-end accounting firm's dashboard."
- **Vibe**: Confident but not flashy. Data-dense but airy. Warm but serious.

---

## 1. Design Token System

### Colors
```css
:root {
  /* Backgrounds */
  --obsidian: #f5f5f4;     /* zinc-50 — warm off-white content bg */
  --surface: #ffffff;      /* pure white cards */
  --surface-raised: #fafaf9;
  --surface-hover: #f5f5f4;

  /* Text */
  --text-primary: #0c0a09;   /* stone-950 */
  --text-secondary: #44403c; /* stone-700 */
  --text-muted: #a8a29e;     /* stone-400 */

  /* Accent — TRUE champagne/gold */
  --champagne: #8b7355;         /* light mode gold */
  --champagne-dim: #6b5a42;
  --champagne-glow: rgba(139, 115, 85, 0.12);

  /* Semantic */
  --danger: #dc2626;
  --warning: #d97706;
  --info: #2563eb;
  --success: #16a34a;

  /* Borders (glassmorphism) */
  --glass-border: rgba(0, 0, 0, 0.06);
  --glass-border-hover: rgba(0, 0, 0, 0.12);

  /* Sidebar — always dark */
  --sidebar-bg: #09090b;
  --sidebar-surface: #18181b;
  --sidebar-text: #fafafa;
  --sidebar-text-secondary: #a1a1aa;
  --sidebar-text-muted: #52525b;
  --sidebar-hover: rgba(255, 255, 255, 0.05);
  --sidebar-active: rgba(190, 169, 142, 0.12);
  --sidebar-accent: #bea98e;    /* champagne for sidebar accent */
}
```

### Radius Tokens
Replace all hardcoded `rounded-[2rem]` / `rounded-[3rem]` with:
```css
--radius-xs: 0.25rem;
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
--radius-2xl: 1.25rem;
--radius-card: 1rem;
--radius-button: 0.5rem;        /* was rounded-[2rem] — now standard */
--radius-pill: 9999px;
```

### Shadows
```css
--shadow-card: 0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.04);
--shadow-card-hover: 0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
--shadow-modal: 0 16px 48px rgba(0,0,0,0.15);
--shadow-dropdown: 0 4px 16px rgba(0,0,0,0.08);
```

### Chart Colors (OKLCH — theme-aware)
```css
--chart-1: oklch(0.65 0.08 80);    /* champagne/gold */
--chart-2: oklch(0.55 0.15 260);   /* blue */
--chart-3: oklch(0.55 0.18 30);    /* red */
--chart-4: oklch(0.65 0.14 100);   /* green */
--chart-5: oklch(0.6 0.1 180);     /* teal */
--chart-6: oklch(0.55 0.12 320);   /* purple */
--chart-7: oklch(0.65 0.15 50);    /* amber */
--chart-8: oklch(0.55 0.16 340);   /* pink */
```

---

## 2. Component Changes

### Sidebar
- Keep always-dark pattern
- Background: `#09090b` (darker than current `#0F172A`)
- Active indicator: champagne accent bar with spring animation
- Collapse toggle: keep, tooltip on icon
- Remove `scale(0.97)` on nav items

### Mobile Bottom Nav
- **CRITICAL FIX**: No hardcoded dark colors — use CSS variables
- `bg-surface/80 backdrop-blur-xl` instead of `bg-black/70`
- Active state: champagne accent
- Scan FAB: champagne gradient (`shimmer-scan` updated)
- Bottom safe area padding

### Buttons (button.tsx)
- Replace `rounded-[2rem]` with `rounded-[var(--radius-button)]` = `rounded-lg`
- Primary variant: champagne bg
- Remove global `scale(0.97)` on all buttons
- Focus ring: champagne

### Cards (card.tsx)
- `rounded-xl` → keep (or `rounded-[var(--radius-card)]`)
- Shadow: `var(--shadow-card)`
- Hover: `var(--shadow-card-hover)`, `var(--glass-border-hover)`
- Remove `before:bg-gradient-to-b white/2%` overlay (subtle, kept)

### Charts
- CategoryDonut: replace hardcoded `COLORS` array with `var(--chart-1)` through `var(--chart-8)`
- DailySpendChart: replace `var(--champagne)` (green) with actual gold `var(--champagne)`
- Tooltips: use CSS variables, consistent styling
- All chart empty states: unified card design

### Dashboard
- Hero metric: bigger (`text-4xl`), gold accent
- KPI cards: cleaner, no icon backgrounds by default
- Alerts: use semantic border-left, not hardcoded blue/amber
- Empty state: simple SVG illustration, clear CTA
- Remove `scroll(0.97)` on interaction

### Settings Pages
- Add framer-motion page transitions (stagger in)
- Same card/button/layout design language
- Settings sidebar nav: champagne active state

### History / Tables
- Replace `minWidth: 800` with responsive column strategy
- Better density options (compact / comfortable)
- Row hover: `bg-champagne/5`
- Sort indicators: updated

### Global Styles
- Remove `button:active { scale(0.97) }` globally
- `<summary>`: reduce to `scale(0.98)` on `@media (hover: none)` only
- Focus ring: champagne (`2px solid var(--champagne)`)
- Selection: `rgba(190, 169, 142, 0.25)` (champagne, not green)
- Ambient gradient: champagne glow not green glow
- NextTopLoader: `#bea98e` (already correct)
- Toast styling: champagne accents

---

## 3. Animation Philosophy
"Motion with purpose — never for its own sake."

| Where | What | Why |
|-------|------|-----|
| Tab transitions | `fadeIn` (0.15s), remove `y` offset | Reduce perceived lag |
| Card hover | `scale(1.01)` + shadow | Subtle depth cue |
| Sidebar collapse | Spring (stiffness: 300, damping: 28) | Physical feel |
| Page load | Stagger children (0.03s apart) | Natural rhythm |
| Button tap | `scale(0.98)` only on mobile/touch | No desktop bounce |
| Skeleton | CSS shimmer (kept) | Works great |
| Settings nav | Fade in links | Lightweight motion |
| Scan success | Confetti (kept, limited) | Delight |

**Removed**: `scale(0.97)` on every tap globally. `AnimatePresence` simplified on tab changes.

---

## 4. Mobile Responsiveness

| Breakpoint | Layout |
|-----------|--------|
| < 640px | Single column, compact cards, bottom nav |
| 640-1023px | 2-column grid where possible, top bar + bottom nav |
| ≥ 1024px | Sidebar + full content, no bottom nav |

- Tables: horizontal scroll on mobile, sticky first column
- Bottom nav: theme-aware (not hardcoded dark)
- Top bar: hidden on desktop

---

## 5. File Change Summary

### Core (globals.css)
- Complete rewrite of `@theme` block
- Add radius, shadow, chart color tokens
- Fix accent to true champagne gold
- Remove global `scale(0.97)`
- Update selection, focus ring, ambient gradient

### UI Primitives (23 files)
- `button.tsx` — radius, accent, variants
- `card.tsx` — shadow, radius
- `badge.tsx` — champagne accent
- `input.tsx` — focus ring, border
- All others: update accent colors

### Layout (4 files)
- `Sidebar.tsx` — sidebar-accent fix, remove scale
- `MobileNav.tsx` — light mode fix, theme-aware
- `TopBar.tsx` — accent update
- `MoreSheet.tsx` — accent update

### Charts (4 files)
- `CategoryDonut.tsx` — CSS variable colors, radius tokens
- `DailySpendChart.tsx` — fix accent, radius tokens
- `SpendingChart.tsx` — CSS variable colors
- `Sparkline.tsx` — theme-aware stroke

### Dashboard
- `Dashboard.tsx` — accent update, remove scale, KPI restyle

### Settings (4 pages + layout)
- `settings/layout.tsx` — accent, motion
- `settings/billing/page.tsx` — styling
- `settings/org/page.tsx` — styling
- `settings/security/page.tsx` — styling
- `settings/team/page.tsx` — styling

### Supporting
- `ui-utils.ts` — categoryColor, approvalBadge accent updates
- `page.tsx` — ambient gradient fix
- `layout.tsx` — selection color fix
- `PremiumSkeletons.tsx` — accent update

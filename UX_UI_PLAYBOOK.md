# Leduc Receipt Pro — UX/UI Implementation Playbook

**Purpose:** Before building or editing any UI — a table, a form, a modal, a loading state, an animation — check the relevant section below first. These are not suggestions, they are the interaction rules for this product.

**Stack:** Next.js (App Router) + React, Tailwind CSS, shadcn/ui (CVA-based primitives), Framer Motion, AutoAnimate, Zod + React Hook Form, Supabase/Postgres.

---

## 0. GENERAL OPERATING PRINCIPLES

- **Perceived speed threshold:** ~400ms (Doherty Threshold). Under 200ms needs no loading indicator. Showing one for a sub-300ms action makes the wait feel *longer*.
- **Six states minimum for any input:** default, focus, error, success, disabled, loading.
- **Match surface to severity:** a validation typo ≠ a modal. A destructive action ≠ a toast.
- **Never encode meaning with color alone** — 8–12% of users have color vision deficiency. Every status signal needs icon/label/shape/position as a second channel.
- **Reversible ≠ irreversible:** cheap reversible actions (archive, toggle) = instant + undo. Irreversible actions (delete org, purge data) = typed confirmation.
- **This is a financial/compliance app** — trust cues matter more. Money, tax data, and audit trails should prioritize "correct and accountable" over "fast and fun."

## 1. DESIGN TOKEN ARCHITECTURE

Three-layer token model:
- **Primitives** — raw values, no meaning attached (`--gray-100`, `--blue-600`)
- **Semantic** — meaning-based names (`--color-primary`, `--color-danger`, `--color-surface`)
- **Component** — usage-specific (`--button-bg`, `--table-header-bg`)

Rules:
- Name tokens by **role**, never by literal value
- Snap all spacing/type to a fixed scale (4/8/12/16/24/32/48/64px)
- Dark mode = swap semantic token set, not invert colors procedurally
- Never hardcode raw hex/px in component files

## 2. DARK MODE

- Base is near-black (#121212), not pure black (#000000)
- Elevation = lighter greys going up, not shadows
- Desaturate accent colors ~20% for dark mode
- Never pure white text — use soft off-white with opacity tiers (100%/70%/45%)

## 3. MOTION & ANIMATION SYSTEM

| Interaction | Duration | Easing |
|---|---|---|
| Element entrance | 200–300ms | ease-out |
| Element exit | ~150ms | ease-in |
| Tap/press | <100ms | — |
| Attention-grabbing | 500–800ms | spring/overshoot |
| List stagger | ~50ms between items | — |
| Card hover lift | ~200ms | ease-out |
| Toggle switch | ~250ms | ease-out |

- Linear easing = continuous motion only (spinners, marquees)
- Spring/overshoot = confirmations and playful moments, not routine data entry
- Accordions: use `grid-template-rows: 0fr → 1fr`, never animate `height: auto`
- Chevron rotation must match panel timing exactly

## 4. DATA TABLES

- Sort: tri-state (asc → desc → unsorted), not binary
- Right-align numeric columns with tabular (monospaced) figures
- Freeze header on vertical scroll, freeze first column on horizontal scroll
- Row density as a token-driven control (36/48/60px)
- Full row as click target — tint + accent bar + checkbox
- Select-all: empty → indeterminate (dash) → fully checked

## 5. CHARTS & DASHBOARD KPIs

- Bar chart y-axes start at zero, always
- Bars = compare discrete values; lines = change over time; limit pie to ~5 slices
- Keep aspect ratio ~45° average slope for trend lines
- Strip decorative chart-junk (no gridlines/shadows/3D)
- One accent color for the series that matters
- Title charts with the takeaway, not the metric name

## 6. PAGINATION & LARGE LISTS

- Use cursor-based pagination for receipt list (offset drifts on insert)
- Match style to job: numbered = audit review, load-more = appends, infinite = mobile
- Keep cursor in URL for shareable/refreshable views
- Restore scroll position on return from detail view
- Truncate long page lists (first, last, current, neighbors + ellipsis)

## 7. SEARCH & FILTERING

- Descriptive placeholder: "Search by vendor, amount, or date"
- Surface recent searches on focus
- Filter chips: idle / active / disabled (three distinct states)
- Update result counts on same frame as tap
- "Clear all" with live count
- Zero-result: offer popular searches, clear filters, broader date range
- Full keyboard: arrows, Enter, Escape

## 8. FORMS — GENERAL FIELD BEHAVIOR

- Six states per field: default, focus, error, success, disabled, loading
- Labels above field permanently (never placeholder-as-label)
- Errors = color + icon + message together
- Success shown inline, not in a toast
- Disabled ≠ loading (different visual treatment)
- **Validate on blur**, not on keystroke and not only on submit
- Once errored, switch to live revalidation for that field

## 9. FORMS — SPECIALIZED INPUTS

**Date pickers:**
- Presets: Today, Yesterday, Last 7/30 days, Last quarter, This tax year
- Two months side-by-side (three on large)
- Full keyboard: arrows, Enter, Escape, PgUp/Dn for months, Shift+Pg for years
- Mobile: full-screen sheet, "today" anchored, large confirm button

**Currency/amount:**
- Validate and format on blur
- Store raw numeric, display formatted
- Group digits for card numbers (4-4-4-4), reformat pasted values

**OTP/2FA:**
- Single string in state, boxes are just rendered view
- Treat paste as primary input path
- Auto-advance focus; backspace on empty = jump back and clear
- `inputmode="numeric"` + `autocomplete="one-time-code"`
- Shake on wrong code; lock green on right code

**Passwords:**
- Requirement checklist live as user types
- Real-time strength meter
- Show/hide toggle
- Never block paste

## 10. MULTI-STEP FLOWS

- Chunk by meaning, not field count
- Always show progress (one indicator, consistent everywhere)
- Validate within each step
- Persist on every step change (back/refresh must not wipe data)

## 11. FILE UPLOAD (Receipt Capture)

- System of states: drag feedback → honest progress → error recovery → preview → queue
- Dropzone reacts on drag-over (border, glow, copy)
- Real percent-complete + estimated time, not a bare spinner
- Failed upload: inline retry, never force full restart
- Show real thumbnail + file type + size
- Multi-file queue: individual progress + individual retry
- Surface OCR-extracted fields inline next to thumbnail

## 12. LOADING & WAIT STATES

| Situation | Use | Why |
|---|---|---|
| Known shape, >300ms (receipt list, dashboard cards) | Skeleton | Previews layout |
| Short, unknown, <3s (button save) | Spinner | Never full-page |
| >3s with progress (bulk export) | Progress bar | + metadata |
| Reversible low-stakes action | Optimistic UI | See Section 15 |
| Under ~300ms | Nothing | Flash reads as glitch |

- Skelton shape must match real content dimensions
- Animate skeleton with shimmer sweep

## 13. ERRORS

- Match surface to severity: inline for field errors, banner/toast for connection, prominent space for server/permission errors
- Every error needs a way out: Retry, support link, or expandable details
- Write for humans: "Error 500 — an error occurred" is useless
- Prevent via live inline validation on blur

## 14. TOASTS & NOTIFICATIONS

- Position: bottom-right desktop, top edge mobile
- Auto-dismiss: routine = ~4s, warnings = ~7s, critical = never auto-dismiss
- Cap visible stack at 3
- Always close button (desktop) + swipe-to-dismiss (mobile) + pause on hover
- Four surfaces: toast (low-priority), banner (persistent), modal (blocking), badge (passive count)
- Never stack multiple blocking modals

## 15. OPTIMISTIC UI — AND WHERE NOT TO USE IT

- **Good fit:** toggles, favorites, reordering, marking read — reversible, low-stakes
- **Bad fit (financial app):** payments, Stripe charges, bank reconciliation, tax report submission, QBO/Xero sync — never show confirmed before server confirms

## 16. UNDO & SOFT DELETE

- Undo beats confirmation dialog for most cases
- Soft delete: `deleted_at` flag, recoverable for 30 days, then hard-purge
- Visible countdown on undo toast
- Heavy friction (typed confirmation) only for truly irreversible actions (delete org, purge data)

## 17. NAVIGATION

- Mobile: bottom tabs (3–5 primary destinations). Hamburger = secondary-only
- Desktop: persistent sidebar for 5+ sections
- Command palette (Cmd/Ctrl+K) = accelerator, not replacement for visible nav
- Breadcrumbs only earn their space past 2 levels of hierarchy

## 18. TABS

- Active indicator slides (spring), never teleports
- Overflow: scroll with edge fade, chevrons on desktop
- Full keyboard: arrows move, Home/End jump to first/last
- Focus ring color ≠ active tab color (must be distinct)
- Mobile: <5 tabs = segmented control, >5 = bottom sheet

## 19. COMMAND PALETTE

- Fuzzy match, not exact substring
- Group into labeled sections
- Never open to blank void
- Fully keyboard-driven
- Nested/drill-down commands with breadcrumb

## 20. MODALS, SHEETS, DRAWERS, POPOVERS

- **Modal:** full scrim, single decision, blocking only
- **Bottom sheet:** mobile-first default, snap points
- **Drawer:** edge-anchored, secondary panel, leaves rest alive
- **Popover:** small (~200px), anchored to trigger
- Don't use full-screen modal for routine non-blocking actions

## 21. DRAG AND DROP

- Confirm pickup: scale-up + deeper shadow + slight tilt
- Show drop target before release
- Snap to valid slots
- Pair with short undo toast (~5s)

## 22. DROPDOWNS, ACCORDIONS, TOOLTIPS, TOGGLES

**Dropdowns:** real hit target (≥48px), visible caret, auto-flip upward, search past ~10 items, 150ms open animation
**Accordions:** single-open vs multi-open deliberate, header is `<button>` with aria-expanded/aria-controls
**Tooltips:** ~300ms delay, visible arrow, one short sentence (~300px max)
**Toggles:** full flip animation (250ms), go optimistic for async

## 23. FOCUS STATES & KEYBOARD ACCESSIBILITY

- Never remove default outline without replacing (2px ring, 2px offset, sufficient contrast)
- Use `:focus-visible` (no ring on mouse click)
- Focus order = DOM order
- Trap focus inside modals (Tab cycles, Escape closes)
- Skip link as first focusable element

## 24. VISUAL HIERARCHY, SHADOWS, CONTRAST

- Primary element ~2x body text size
- Spend color like currency — mostly neutral, one accent per screen
- Layer multiple shadows (contact + mid + wide), not one blurred drop-shadow
- WCAG AA: 4.5:1 for body, 3:1 for large text/UI components

## 25. MICROCOPY & EMPTY STATES

- Button labels name the reward: "Save this expense" > "Submit"
- Turn errors into next steps
- Four distinct empty states: first-run, no-results, error, filtered-out — each with own copy and CTA
- First-run = onboarding opportunity: ghost preview + "Upload your first receipt"
- Write like a helpful colleague, not a log file

## 26. COGNITIVE / PSYCHOLOGY PRINCIPLES

- **Doherty Threshold:** 400ms = responsive line
- **Zeigarnik Effect:** unfinished tasks pull users back — leave one item unchecked
- **Peak-End Rule:** users judge by most intense moment + how it ended
- **Serial Position Effect:** items at start/end of list remembered best
- **Von Restorff Effect:** standout item gets disproportionate attention
- **Fitts's Law:** frequent actions need to be large and close
- **Hick's Law:** more choices = slower decisions
- **Jakob's Law:** users expect familiar patterns — don't invent novel date pickers
- **Aesthetic-Usability Effect:** polished = perceived as easier to use

## 27. KNOWN-ISSUE CROSS-REFERENCE

- CSP unsafe-inline styles → token-driven classes (Section 1). Fix together.
- Tax-form validation gaps → Section 8 (field states) + Section 13 (errors)
- Offline queue / PWA → Section 12 (loading) + Section 16 (soft delete)
- Accessibility debt (missing ARIA) → Section 22 (accordion) + Section 23 (focus)

## 28. HOW TO WIRE THIS FILE

- Claude Code / OpenCode auto-loads AGENTS.md/CLAUDE.md at project root
- Keep in version control
- Split into separate files later if it grows too large
- Update as real product decisions are made

---

*Compiled from UX pattern libraries and established UX/psychology research, reorganized around this app's actual feature set.*

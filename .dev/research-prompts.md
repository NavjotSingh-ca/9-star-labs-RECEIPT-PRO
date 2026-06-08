# Deep Research Prompt — Scanner UX

## Context
Leduc Receipt Pro is a Next.js receipt management app for Canadian businesses. The Scanner component (899 lines) handles:
- Camera capture via MediaDevices API
- Gallery/file upload (single + batch)
- Image cropping
- Duplicate detection
- AI OCR processing
- Offline queue
- Vendor prefill from history
- Batch scanning (up to 50)

The current implementation is a monolithic component with 30+ state variables and complex conditional rendering — hard to maintain and test. The AGENTS.md describes a goal to refactor into a state-machine-driven architecture.

## Research Questions

1. **State machine patterns for camera-first apps** — How do production apps like Scanner Pro, Adobe Scan, or Google Lens structure their capture flow state machines? What states (idle, capturing, reviewing, processing, saving, error) are standard?

2. **Camera UX best practices** — What are current mobile-first camera UX patterns for document scanning? Specifically:
   - Auto-capture vs. manual shutter
   - Edge detection overlay
   - Viewport aspect ratio (4:3, full screen?)
   - Flash/torch toggle patterns
   - Focus and exposure lock gestures

3. **Batch scanning UX** — How do apps like Genius Scan handle batch mode?
   - Queue management UX
   - Progress indicators
   - Reorder/delete in queue
   - "Add more" after initial capture

4. **Error recovery** — What are good patterns for:
   - Blur detection feedback (retake vs. proceed)
   - Camera permission denied (fallback to upload)
   - Network loss during upload (offline queue UX)
   - OCR failure (manual fill fallback)

5. **Performance** — How do top scanner apps handle:
   - Large image processing without blocking UI
   - Memory management (resizing before upload)
   - Camera stream lifecycle on mobile (background/foreground)

## Deliverable
A 2-3 page design brief with:
- Recommended state machine states and transitions (Mermaid diagram)
- Component tree / file structure for the refactored scanner
- UX flow diagrams for single capture, batch, gallery upload, and error recovery
- Mobile-first interaction patterns (gestures, haptics, transitions)
- References to production apps that implement these patterns well

---

# Deep Research Prompt — Legal & Compliance for Canadian Receipt SaaS

## Context
Leduc Receipt Pro is a Canadian receipt management SaaS for businesses across all industries (retail, construction, professional services, hospitality, trades, etc.). It stores receipt images, extracts line items via AI, generates CRA-compliant audit exports, and integrates with QuickBooks Online / Xero. Users upload images containing PII (names, addresses, payment card info). The app stores data in Supabase (PostgreSQL + S3-compatible storage) with SHA-256 integrity hashes and AES-256-GCM encryption for OAuth tokens.

The app is designed with a future "niche profiles" system — businesses will be able to select their industry (construction, cafe/restaurant, retail, trades, etc.) and unlock category presets, tax rules, and reporting tailored to that vertical. For now, the base app serves all business owners.

The app links to `/terms` and `/privacy` pages in its navigation, but these pages currently don't exist (return 404). The app also doesn't have a cookie notice or data retention policy shown to users.

## Research Questions

### 1. CRA Digital Record-Keeping Requirements
- What are the exact CRA requirements for digital receipt storage (format, retention period, accessibility)?
- What constitutes a "legible" receipt for ITC (Input Tax Credit) claims under the Excise Tax Act?
- Does CRA accept SHA-256 hashes as proof of integrity / non-repudiation?
- What are the record-keeping obligations for GST/HST registered businesses in Canada?
- Are there specific requirements for different industries (construction, hospitality, retail, trades) vs. general businesses? Which industries have unique record-keeping rules?

### 2. PIPEDA Compliance for Receipt Scanning
- What PIPEDA requirements apply to a receipt scanning app that processes images containing personal information?
- What disclosures must be made in the privacy policy about AI processing of receipt images?
- Does processing receipt images (which may contain card numbers, addresses, names) require explicit consent?
- What are the data residency requirements for Canadian financial data (must it stay in Canada)?
- Supabase currently stores data in US regions by default — is this a compliance risk?

### 3. Terms of Service Requirements
- What standard clauses must a B2B SaaS Terms of Service include for Canadian businesses?
- What disclaimers are needed around AI extraction accuracy (OCR errors, hallucinated line items)?
- How should liability be limited for financial record-keeping software?
- What service level guarantees (or lack thereof) are standard for receipt scanning apps?
- Is a binding arbitration clause standard for Canadian SaaS?

### 4. Data Retention & Deletion
- What is the recommended data retention period for receipt images (CRA requires 6 years)?
- After the retention period, what deletion process is expected?
- Should users be able to delete their own data on demand (right to deletion)?
- What happens to receipt data when a user cancels their subscription / closes their account?

### 5. Industry-Specific Requirements
- Which industries have unique CRA record-keeping rules (construction lien laws, hospitality tip reporting, retail inventory accounting)?
- Are there province-specific requirements for different business types (WCB, liquor licensing, etc.)?
- What niche-specific features would be most valuable: construction (job costing, lien act), cafe/restaurant (tip pools, food cost), retail (inventory, COGS), trades (permit tracking, mileage), professional services (billable hours, client codes)?

### 6. Audit Trail Legal Standards
- What legal standards exist for digital audit trails in Canada?
- Does SHA-256 + timestamp meet the standard for non-repudiation?
- Are there specific requirements for the audit trail UI (must show who did what and when)?
- What logging must be retained vs. what can be ephemeral?

## Deliverable
A 2-3 page compliance brief that:
- Lists each legal/compliance requirement with a priority (must-have / should-have / nice-to-have)
- Maps requirements to specific code features we need to implement (or already have)
- Provides template structure for Terms of Service and Privacy Policy pages
- Notes any jurisdiction-specific pitfalls (Quebec privacy law, etc.)
- Recommends whether we need lawyer-drafted docs vs. standard templates

---

# Deep Research Prompt — Offline-First Receipt Capture & Sync

## Context
Leduc Receipt Pro is a Next.js/PWA receipt management app for Canadian businesses. The core user flow is: capture a receipt photo → AI extracts data → review → save. This happens in the field — construction sites, restaurants, retail floors, trade vehicles — where internet connectivity is unreliable or absent.

The app already has a basic `useOfflineQueue` hook (`src/hooks/useOfflineQueue.ts`) and IndexedDB (`idb` package installed). But the current implementation is minimal: it catches save failures and queues them for retry when the network returns. There's no true offline-first experience — the scanner, camera, AI extraction, and form UI all require connectivity to function fully.

## Research Questions

### 1. Offline-First Architecture Patterns
- What are the established patterns for offline-first web apps (local-first, CRDT, conflict-free replicated data types)?
- How do production apps like Linear, Notion, or Excalidraw handle offline state?
- What's the right tradeoff between optimistic UI vs. pessimistic UI for a financial records app where data integrity matters?
- Should we use Service Workers (Workbox) or app-level IndexedDB for offline storage?

### 2. Offline Receipt Capture Flow
- How should the scanner behave offline?
  - Can the camera stream + capture work without the network? (MediaDevices API doesn't need internet)
  - Can AI extraction (Gemini) run offline, or should we use a local on-device model (TensorFlow.js, MediaPipe)?
  - Fallback: if AI extraction can't run offline, what does the UI look like? (manual entry form)
- What metadata should be captured offline vs. deferred to sync?

### 3. Sync Engine Design
- How should queued offline receipts sync when connectivity returns?
  - FIFO order vs. priority (e.g., save metadata first, upload images after)
  - Conflict resolution: what if a receipt was deleted on another device while this one was offline?
  - Partial uploads: what if the image upload succeeds but the DB insert fails?
- Should there be a sync progress UI? (e.g., "3 receipts waiting to sync")
- How to handle storage quota limits on mobile (IndexedDB has 5-50MB depending on browser)?

### 4. Service Worker Strategy
- Should receipt images be cached in the Service Worker cache or in IndexedDB?
- What's the caching strategy for:
  - App shell (static assets) → CacheFirst (install-time precache)
  - API responses → NetworkFirst with fallback to cache
  - Receipt images → CacheWithRefresh (serve from cache, refresh in background)
- How to handle auth tokens in the Service Worker for background sync?

### 5. Background Sync API
- Can we use the Background Sync API (ServiceWorkerRegistration.sync.register) to auto-retry failed uploads when the browser is backgrounded?
- What's fallback for browsers that don't support Background Sync (Safari)?
- Periodic Sync API — could this be used to check for pending receipts periodically?

### 6. Competing Products Analysis
- How do competitors (Expensify, Concur, QuickBooks Receipt Capture, Wave, Zoho Expense) handle offline capture?
- Which ones do it well vs. poorly?
- What's the minimum viable offline experience for a receipt app to feel "reliable"?

### 7. Data Integrity for Offline Financial Records
- How to ensure SHA-256 integrity hashes work offline (hash before upload)?
- What audit trail entries should be created offline vs. on sync?
- How to handle the CRA 7-year retention requirement in an offline context?
- Should offline-created receipts be marked differently in the UI?

## Deliverable
A 3-4 page offline-first architecture brief with:
- Recommended sync engine design (priority queue, conflict resolution, retry strategy)
- Service Worker caching strategy (app shell, API responses, images)
- Offline capture UX flow (scanner → AI fallback → manual entry → queue → sync)
- Data model for offline queue items (what fields to store locally)
- Sync progress UI mockups
- Implementation roadmap (Phase 1: basic queue → Phase 2: full offline capture → Phase 3: background sync)
- Browser compatibility matrix (which features work on Chrome/Safari/Firefox mobile)
- References to existing code in the app (useOfflineQueue, idb, existing mutations)

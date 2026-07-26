/**
 * Central feature data for the landing page and feature detail pages.
 * Each feature has a slug (id), title, icon, descriptions, sections, benefits, and related features.
 */

export interface FeatureSection {
  title: string;
  content: string;
}

export interface FeatureData {
  id: string;
  title: string;
  icon: string;
  shortDescription: string;
  longDescription: string;
  sections: readonly FeatureSection[];
  benefits: readonly string[];
  relatedFeatures: readonly string[];
  highlighted?: boolean;
}

export const features = [
  {
    id: 'ai-receipt-scanning',
    title: 'AI Receipt Scanning',
    icon: 'Camera',
    shortDescription: 'Snap a photo or forward an email. AI extracts vendor, date, amount, and tax automatically.',
    longDescription:
      'Our proprietary AI engine processes receipt images in under 2 seconds. It extracts vendor name, transaction date, total amount, subtotal, tax (GST/HST/PST/QST), and line items with industry-leading accuracy.',
    sections: [
      {
        title: 'How It Works',
        content:
          'Take a photo with your phone, upload an image, or forward a receipt email. The AI extracts structured data using a fine-tuned vision model trained on over 100,000 Canadian receipts. Results appear instantly — review and correct before saving.',
      },
      {
        title: 'Supported Formats',
        content:
          'JPEG, PNG, PDF, WebP, and HEIC images. Email forwarding supports HTML and plain text receipts. Maximum file size is 20MB per receipt, with batch processing of up to 50 receipts at once.',
      },
      {
        title: 'Accuracy & Confidence',
        content:
          'Every extraction includes a confidence score (0–100%). High-confidence receipts auto-save. Low-confidence items flag for manual review. Over time, the AI learns from your corrections and improves accuracy on your specific vendors.',
      },
    ],
    benefits: [
      'Under 2 seconds per receipt',
      'GST/HST/PST/QST auto-detection',
      '100K+ Canadian receipt training set',
      'Confidence scoring for quality control',
    ],
    relatedFeatures: ['email-forwarding', 'smart-search', 'bulk-export'],
  },
  {
    id: 'smart-search',
    title: 'Smart Search',
    icon: 'Search',
    shortDescription: 'Search by text, date range, amount, category, or merchant. Filters persist across sessions.',
    longDescription:
      'Find any receipt in milliseconds. Smart Search indexes every field — vendor, date, amount, category, tags, and even text extracted from receipt images via OCR.',
    sections: [
      {
        title: 'Search Capabilities',
        content:
          'Full-text search across all receipt fields. Filter by date range (presets: today, this week, this month, last month, custom). Filter by amount range, category, vendor, payment method, approval status, and tags.',
      },
      {
        title: 'Semantic Mode',
        content:
          'Toggle to AI semantic search. Type natural language queries like "lunch meetings last month" or "receipts over $200 from Amazon". The AI understands intent and returns relevant results instantly.',
      },
      {
        title: 'Persistent Filters',
        content:
          'Your active filters persist across browser sessions. Saved searches let you bookmark common queries like "Q4 marketing expenses" or "unreimbursed travel". Share saved searches with your team.',
      },
    ],
    benefits: [
      'Full-text search with OCR',
      'AI semantic mode for natural language',
      'Persistent filters across sessions',
      'Saved searches for common queries',
    ],
    relatedFeatures: ['ai-receipt-scanning', 'tags-labels', 'receipt-calendar'],
  },
  {
    id: 'receipt-calendar',
    title: 'Receipt Calendar',
    icon: 'CalendarDays',
    shortDescription: 'See your spending on a calendar. Click any day to view receipts.',
    longDescription:
      'Visualize your spending chronologically. The Receipt Calendar shows each day with a total spend indicator. Days with receipts show a champagne dot — the larger the dot, the higher the spend.',
    sections: [
      {
        title: 'Calendar View',
        content:
          'Monthly calendar with color-coded daily totals. Click any day to expand and see all receipts for that day in a side panel. Navigate between months with smooth transitions.',
      },
      {
        title: 'Spend Heat Map',
        content:
          'Days are shaded by total spend — lighter for low amounts, darker for high amounts. Spot spending patterns instantly: heavy-spend days, clusters around weekends, or gaps in your record-keeping.',
      },
    ],
    benefits: [
      'Visual calendar with spend indicators',
      'Click-to-expand daily receipts',
      'Spend heat map for pattern spotting',
      'Smooth month navigation',
    ],
    relatedFeatures: ['smart-search', 'spending-insights', 'tags-labels'],
  },
  {
    id: 'vendor-analytics',
    title: 'Vendor Analytics',
    icon: 'Store',
    shortDescription: 'Top vendors by spend with trend sparklines. Know where your money goes.',
    longDescription:
      'Understand your vendor landscape at a glance. Vendor Analytics ranks your top vendors by total spend, shows month-over-month trends, and highlights changes in spending patterns.',
    sections: [
      {
        title: 'Vendor Ranking',
        content:
          'See your top 10 vendors by total spend with sparkline trend graphs. Click any vendor to drill into all receipts from that vendor, with average spend per visit and frequency analysis.',
      },
      {
        title: 'Trend Detection',
        content:
          'AI automatically flags vendors with significant spend increases (20%+ month-over-month) or new vendors that appear frequently. Get alerted before small vendors become large expenses.',
      },
    ],
    benefits: [
      'Top 10 vendors with trend sparklines',
      'Month-over-month spend comparison',
      'AI-powered anomaly detection',
      'Vendor drill-down with full receipt list',
    ],
    relatedFeatures: ['spending-insights', 'budget-management', 'smart-search'],
  },
  {
    id: 'budget-management',
    title: 'Budget Management',
    icon: 'PiggyBank',
    shortDescription: 'Set per-category budgets. Visual progress rings. Overspend alerts.',
    longDescription:
      'Stay on top of your spending with per-category budgets. Set monthly or quarterly limits for categories like Office Supplies, Travel, Meals & Entertainment, and more.',
    sections: [
      {
        title: 'Budget Setup',
        content:
          'Create budgets for any category with custom time periods (monthly, quarterly, yearly). Set soft warnings (80% of budget) and hard limits. Budgets auto-rollover or reset based on your preference.',
      },
      {
        title: 'Progress Tracking',
        content:
          'Circular progress rings show real-time budget usage. Color-coded: green (under 70%), amber (70–90%), red (over 90%). See remaining amounts and projected overspend based on current trends.',
      },
      {
        title: 'Overspend Alerts',
        content:
          'Receive email and in-app notifications when you hit warning thresholds. AI predicts if you\'re on track to overspend based on historical patterns. Alerts include actionable suggestions.',
      },
    ],
    benefits: [
      'Per-category budget limits',
      'Real-time progress rings',
      'Overspend predictions with AI',
      'Email and in-app alerts',
    ],
    relatedFeatures: ['spending-insights', 'vendor-analytics', 'cash-flow-forecast'],
  },
  {
    id: 'cash-flow-forecast',
    title: 'Cash Flow Forecast',
    icon: 'TrendingUp',
    shortDescription: '90-day spend projection based on moving averages. Plan ahead with confidence.',
    longDescription:
      'Predict your future spending with AI-powered cash flow forecasting. The model analyzes 12 months of historical data, identifies seasonal patterns, and projects 90 days forward.',
    sections: [
      {
        title: 'Forecast Model',
        content:
          'Uses weighted moving averages with seasonal adjustment. The model accounts for recurring expenses, historical trends, and known upcoming payments. Accuracy improves as more data is collected.',
      },
      {
        title: 'Visual Projection',
        content:
          'Interactive chart shows historical spend (actual) plus 90-day forecast (projected). Confidence intervals show the likely range. Toggle between daily, weekly, and monthly views.',
      },
      {
        title: 'Scenario Planning',
        content:
          'Run "what-if" scenarios: what happens to cash flow if you add a new subscription? What if a major vendor changes pricing? See the impact instantly on your projected runway.',
      },
    ],
    benefits: [
      '90-day AI-powered forecast',
      'Seasonal adjustment for accuracy',
      'Interactive chart with confidence bands',
      'What-if scenario planning',
    ],
    relatedFeatures: ['budget-management', 'spending-insights', 'vendor-analytics'],
  },
  {
    id: 'tax-dashboard',
    title: 'Tax Dashboard',
    icon: 'ReceiptText',
    shortDescription: 'YTD GST/PST summary, quarterly estimates, and deduction readiness checker.',
    longDescription:
      'Your complete tax command center. The Tax Dashboard aggregates YTD totals for GST/HST/PST/QST, estimates quarterly remittance amounts, and checks every receipt for deduction readiness.',
    sections: [
      {
        title: 'GST/HST Summary',
        content:
          'Year-to-date totals for input tax credits (ITCs) by province. See how much GST/HST you can claim, broken down by category. Quarterly and annual views with PDF export.',
      },
      {
        title: 'Deduction Readiness',
        content:
          'Every receipt is scored 0–100 for CRA deduction readiness. Missing vendor BN? Low score. Missing detailed line items? Low score. The dashboard shows exactly what each receipt needs to pass audit scrutiny.',
      },
      {
        title: 'Quarterly Estimates',
        content:
          'Based on your actuals, the dashboard estimates your next quarterly remittance. Compares against previous quarters and highlights significant changes that might need review.',
      },
    ],
    benefits: [
      'YTD GST/HST/PST/QST totals',
      'Per-receipt deduction readiness score',
      'Quarterly remittance estimates',
      'PDF export for accountant review',
    ],
    relatedFeatures: ['cra-readiness-score', 'cra-reports', 'mileage-tracking'],
  },
  {
    id: 'multi-currency',
    title: 'Multi-Currency',
    icon: 'DollarSign',
    shortDescription: 'Handle USD, EUR, and more. Live exchange rates, auto-convert to CAD.',
    longDescription:
      'Process receipts in any currency. Live exchange rates from the Bank of Canada auto-convert foreign amounts to CAD. Track both original and CAD amounts for complete financial records.',
    sections: [
      {
        title: 'Supported Currencies',
        content:
          'USD, EUR, GBP, JPY, AUD, MXN, and 30+ more. Exchange rates update daily from the Bank of Canada. Manual override available for specific transactions.',
      },
      {
        title: 'Dual Display',
        content:
          'Every receipt shows both the original currency amount and the CAD equivalent. Tax totals are converted at the rate effective on the transaction date. Choose your reporting currency.',
      },
    ],
    benefits: [
      '30+ currencies supported',
      'Bank of Canada daily rates',
      'Transaction-date rate locking',
      'Dual-currency display on every receipt',
    ],
    relatedFeatures: ['tax-dashboard', 'cra-reports', 'bulk-export'],
  },
  {
    id: 'tags-labels',
    title: 'Tags & Labels',
    icon: 'Tags',
    shortDescription: 'Color-coded tags. Filter by tag. Bulk tag edit for organization.',
    longDescription:
      'Organize receipts your way with custom tags and labels. Create color-coded tags for projects, clients, departments, or any classification system your business needs.',
    sections: [
      {
        title: 'Tag Management',
        content:
          'Create unlimited tags with custom colors and names. Assign multiple tags per receipt. Filter the entire receipt list by one or more tags. Bulk operations for adding and removing tags.',
      },
      {
        title: 'Smart Tagging',
        content:
          'AI suggests tags based on vendor, category, and amount patterns. Auto-tag rules let you define conditions: "if vendor is Amazon and amount > $100, tag as Office Supplies".',
      },
    ],
    benefits: [
      'Unlimited custom tags with colors',
      'AI-powered tag suggestions',
      'Auto-tag rules engine',
      'Bulk tag operations',
    ],
    relatedFeatures: ['smart-search', 'receipt-calendar', 'project-costing'],
  },
  {
    id: 'kanban-workflow',
    title: 'Kanban Workflow',
    icon: 'Kanban',
    shortDescription: 'Drag-and-drop approval board. Move receipts through pending → approved → rejected.',
    longDescription:
      'Manage receipt approvals visually with a drag-and-drop Kanban board. Move receipts through custom workflow stages: Pending Review, Approved, Rejected, Needs Info.',
    sections: [
      {
        title: 'Board View',
        content:
          'Three-column Kanban board: Pending, Approved, Rejected. Drag receipts between columns for instant status changes. Each card shows vendor, amount, date, and submitter.',
      },
      {
        title: 'Approval Workflow',
        content:
          'Customizable approval chains. Set rules: "receipts over $500 need manager approval", "specific categories need director approval". Email notifications for pending approvals. Escalation if not reviewed within 48 hours.',
      },
    ],
    benefits: [
      'Drag-and-drop Kanban board',
      'Customizable approval chains',
      'Email notifications for pending items',
      'Auto-escalation for stale approvals',
    ],
    relatedFeatures: ['team-approvals', 'audit-trail', 'payables-dashboard'],
  },
  {
    id: 'receipt-comparison',
    title: 'Receipt Comparison',
    icon: 'GitCompare',
    shortDescription: 'Compare two receipts side-by-side. Highlights differences automatically.',
    longDescription:
      'Spot discrepancies instantly. Select any two receipts and view them side-by-side with AI-highlighted differences in amounts, dates, vendors, and tax calculations.',
    sections: [
      {
        title: 'How It Works',
        content:
          'Select any two receipts from your list. The comparison view shows both receipts side-by-side with every field aligned. Differences are highlighted in color — green for matches, red for mismatches.',
      },
      {
        title: 'Use Cases',
        content:
          'Perfect for audit preparation, vendor dispute resolution, and duplicate receipt detection. Also useful when comparing a paper receipt against its digital copy for accuracy verification.',
      },
    ],
    benefits: [
      'Side-by-side field comparison',
      'AI-highlighted differences',
      'Color-coded match/mismatch indicators',
      'Audit and dispute resolution tool',
    ],
    relatedFeatures: ['ai-receipt-scanning', 'audit-trail', 'spend-anomalies'],
  },
  {
    id: 'recurring-detector',
    title: 'Recurring Detector',
    icon: 'Repeat',
    shortDescription: 'Auto-detect recurring expenses by vendor and amount. Never miss a subscription.',
    longDescription:
      'AI automatically identifies recurring expenses — subscriptions, memberships, monthly retainers. Detects patterns by vendor name, amount, and frequency. Get alerts for new or changed recurring charges.',
    sections: [
      {
        title: 'Detection Engine',
        content:
          'Analyzes receipt history for patterns: same vendor + same amount + regular interval. Flags detected recurrences and groups them for easy review. Accuracy improves as more data accumulates.',
      },
      {
        title: 'Subscription Management',
        content:
          'See all detected subscriptions in one view with monthly totals, renewal dates, and price history. Get alerts when a subscription price changes or a new recurring charge appears.',
      },
    ],
    benefits: [
      'AI-powered recurring detection',
      'Subscription dashboard with totals',
      'Price change alerts',
      'New recurring charge notifications',
    ],
    relatedFeatures: ['budget-management', 'spending-insights', 'vendor-analytics'],
  },
  {
    id: 'bulk-export',
    title: 'Bulk Export',
    icon: 'FileDown',
    shortDescription: 'Export to CSV, PDF, ZIP. QBO and Xero formats supported.',
    longDescription:
      'Export your receipt data in multiple formats. CSV for spreadsheets, PDF for archiving, ZIP for original images + metadata. QBO and Xero formatted CSVs for direct import into accounting software.',
    sections: [
      {
        title: 'Export Formats',
        content:
          'CSV (all fields, including tax breakdown), PDF (individual or batch, with receipt images), ZIP (original images + JSON metadata), QBO-formatted CSV, Xero-formatted CSV.',
      },
      {
        title: 'Export Options',
        content:
          'Export selected receipts, all receipts, or filter by date range, category, approval status, or tags. Schedule recurring exports via email. Customize which fields are included.',
      },
    ],
    benefits: [
      'CSV, PDF, ZIP, QBO, Xero formats',
      'Batch export with filters',
      'Scheduled recurring exports',
      'Custom field selection',
    ],
    relatedFeatures: ['qbo-xero-export', 'cra-reports', 'tax-dashboard'],
  },
  {
    id: 'spending-insights',
    title: 'Spending Insights',
    icon: 'BarChart3',
    shortDescription: 'AI-style observations: busiest spend days, top categories, trends.',
    longDescription:
      'Get AI-generated insights about your spending patterns. Natural language observations like "You spent 30% more on dining this month" or "Your busiest spend day is Tuesday".',
    sections: [
      {
        title: 'AI Observations',
        content:
          'The AI analyzes your receipt data and generates plain-English observations. See trends you might miss: category shifts, day-of-week patterns, vendor concentration risks, and seasonal variations.',
      },
      {
        title: 'Visual Analytics',
        content:
          'Interactive charts: category breakdown (donut), daily spend (bar chart), weekly trends (line chart), and vendor concentration (treemap). All charts exportable for presentations.',
      },
    ],
    benefits: [
      'Natural language AI observations',
      'Interactive multi-chart dashboard',
      'Exportable chart images',
      'Trend and pattern detection',
    ],
    relatedFeatures: ['vendor-analytics', 'cash-flow-forecast', 'budget-management'],
  },
  {
    id: 'cra-readiness-score',
    title: 'CRA Readiness Score',
    icon: 'ClipboardCheck',
    shortDescription: '0–100 score based on receipt completeness. Know exactly what\'s missing before tax season.',
    longDescription:
      'Every receipt gets a CRA Readiness Score — from 0 to 100 — based on how well it would stand up to a CRA audit. The score considers: vendor BN, detailed line items, tax breakdown with rates, valid receipt date, and receipt image quality.',
    sections: [
      {
        title: 'Scoring Criteria',
        content:
          'Score components: Business Number (BN) presence (20 pts), detailed line items (20 pts), tax breakdown with rates (20 pts), valid receipt date (10 pts), high-quality image (15 pts), matching totals (15 pts).',
      },
      {
        title: 'Improvement Suggestions',
        content:
          'For each receipt below 100, see exactly what\'s missing: "Add vendor BN from your contact list" or "Split this receipt into line items for better deductions". Batch improve receipts with similar gaps.',
      },
    ],
    benefits: [
      'Per-receipt CRA audit readiness score',
      '6 evaluation criteria with weights',
      'Actionable improvement suggestions',
      'Batch improvement for similar gaps',
    ],
    relatedFeatures: ['tax-dashboard', 'cra-reports', 'mileage-tracking'],
  },
  {
    id: 'audit-trail',
    title: 'Audit Trail',
    icon: 'ShieldCheck',
    shortDescription: 'Every action logged. Full audit history for compliance, with paginated search.',
    longDescription:
      'Every single action in the system is logged with timestamp, user, and details. Full audit trail for compliance requirements, with paginated search and export.',
    sections: [
      {
        title: "What's Logged",
        content:
          'Receipt creation, edits, deletions, approval status changes, exports, logins, team changes, and settings modifications. Each entry includes: timestamp, user, action type, and before/after values for changes.',
      },
      {
        title: 'Audit Search',
        content:
          'Filter audit logs by action type, date range, user, or receipt. Search across all log entries. Export audit reports for external auditors or compliance reviews.',
      },
    ],
    benefits: [
      'Every action logged immutably',
      'Before/after values for changes',
      'Filterable and searchable logs',
      'Export for external auditors',
    ],
    relatedFeatures: ['cra-readiness-score', 'team-approvals', 'kanban-workflow'],
  },
  {
    id: 'spend-anomalies',
    title: 'Spend Anomalies',
    icon: 'AlertTriangle',
    shortDescription: 'AI detects unusual spending patterns. Get alerted before small issues become big problems.',
    longDescription:
      'AI continuously monitors your spending for anomalies. Detects fraud signals, unusual vendor activity, math errors, missing business numbers, and duplicate receipts.',
    sections: [
      {
        title: 'Anomaly Types',
        content:
          'Fraud suspicion (unusual vendor or amount patterns), spend anomalies (>2x historical average for a vendor), math errors (subtotal + tax ≠ total), missing BN on receipts over $100, and duplicate receipts.',
      },
      {
        title: 'Alert System',
        content:
          'Real-time alerts when anomalies are detected. Severity levels: info, warning, critical. Email digests for non-urgent anomalies. Dashboard shows all active anomalies with resolution tracking.',
      },
    ],
    benefits: [
      '5 types of anomaly detection',
      'Real-time fraud alerts',
      'Severity levels with email digests',
      'Resolution tracking dashboard',
    ],
    relatedFeatures: ['audit-trail', 'cra-readiness-score', 'receipt-comparison'],
  },
  {
    id: 'mileage-tracking',
    title: 'Mileage Tracking',
    icon: 'Route',
    shortDescription: 'Log business trips, calculate CRA mileage rates, export for tax filings.',
    longDescription:
      'Track business mileage the right way. Log trips with start/end locations, calculate distances, apply CRA mileage rates, and export for T2125 or T777 tax forms.',
    sections: [
      {
        title: 'Trip Logging',
        content:
          'Log trips manually or import from GPS. For each trip: date, purpose, starting and ending odometer or locations. Auto-calculate distance using mapping APIs.',
      },
      {
        title: 'CRA Rates',
        content:
          'Automatically applies current CRA mileage rates (updated annually). Separate rates for first 5,000km and remaining kilometers. Supports multiple vehicles with individual rate tracking.',
      },
    ],
    benefits: [
      'Manual and GPS trip logging',
      'Auto-calculated distances',
      'Current CRA mileage rates',
      'T2125/T777 export ready',
    ],
    relatedFeatures: ['cra-reports', 'tax-dashboard', 'bulk-export'],
  },
  {
    id: 'bank-reconciliation',
    title: 'Bank Reconciliation',
    icon: 'Landmark',
    shortDescription: 'Auto-match bank transactions to receipts. Spot missing receipts instantly.',
    longDescription:
      'Upload bank statements or connect via CSV. Our engine automatically matches bank transactions to receipts, identifies unmatched items, and helps you reconcile your books.',
    sections: [
      {
        title: 'Matching Engine',
        content:
          'Matches bank transactions to receipts by amount, date, and description. Configurable tolerance for date (±3 days) and amount (±$5). Manual matching for edge cases.',
      },
      {
        title: 'Reconciliation Workflow',
        content:
          'Dashboard shows: matched (green), unmatched bank transactions (amber — possible missing receipts), unmatched receipts (blue — possibly not yet deposited). Clear action items for each category.',
      },
    ],
    benefits: [
      'Intelligent auto-matching',
      'Configurable matching tolerance',
      'Clear reconciliation status dashboard',
      'Missing receipt detection',
    ],
    relatedFeatures: ['payables-dashboard', 'audit-trail', 'spend-anomalies'],
  },
  {
    id: 'project-costing',
    title: 'Project Costing',
    icon: 'Building2',
    shortDescription: 'Assign receipts to projects. See profitability per project in real-time.',
    longDescription:
      'Track project costs with precision. Assign receipts to specific projects, monitor budgets vs. actuals, and see real-time profitability per project with margin analysis.',
    sections: [
      {
        title: 'Project Setup',
        content:
          'Create projects with budgets, timelines, and team assignments. Set hourly rates for labour and track material costs via receipts. See projected vs. actual costs in real-time.',
      },
      {
        title: 'Profitability Analysis',
        content:
          'Per-project profit & loss view: total revenue, total costs (receipts + labour), gross margin, and margin percentage. Compare profitability across projects to identify your most (and least) profitable work.',
      },
    ],
    benefits: [
      'Receipt-to-project assignment',
      'Budget vs. actuals tracking',
      'Real-time P&L per project',
      'Cross-project profitability comparison',
    ],
    relatedFeatures: ['tags-labels', 'smart-search', 'budget-management'],
  },
  {
    id: 'payables-dashboard',
    title: 'Payables Dashboard',
    icon: 'Wallet',
    shortDescription: 'Track outstanding payments. Color-coded aging: green → amber → red.',
    longDescription:
      'Never miss a payment. The Payables Dashboard shows all outstanding receipts that need reimbursement, with aging analysis and priority sorting.',
    sections: [
      {
        title: 'Aging Analysis',
        content:
          'Receipts are color-coded by age: green (0–30 days), amber (31–60 days), red (61+ days). Sort by urgency, amount, or vendor. See total outstanding payable balance at a glance.',
      },
      {
        title: 'Reimbursement Workflow',
        content:
          'Mark receipts as paid, partially paid, or pending. Batch approve reimbursements. Email notifications to approvees when payment is sent. Export payable report for accounting.',
      },
    ],
    benefits: [
      'Color-coded aging analysis',
      'Total outstanding balance',
      'Batch reimbursement approvals',
      'Payment notification emails',
    ],
    relatedFeatures: ['bank-reconciliation', 'team-approvals', 'kanban-workflow'],
  },
  {
    id: 'email-forwarding',
    title: 'Email Forwarding',
    icon: 'Mail',
    shortDescription: 'Get a unique email address. Forward receipts → they auto-import.',
    longDescription:
      'Get a unique @ receipt email address. Forward any digital receipt from your inbox — the AI extracts the data and stores it automatically. No app needed for importing.',
    sections: [
      {
        title: 'How It Works',
        content:
          'You get a unique forwarding address: receipts+{yourorg}@app.9starlabs.ca. Forward any receipt email to this address. The AI extracts vendor, amount, date, and attachments. Receipt appears in your account within seconds.',
      },
      {
        title: 'Supported Sources',
        content:
          'Works with Gmail, Outlook, Yahoo, iCloud, and any email provider that supports forwarding. Attachments can be images, PDFs, or HTML receipts. Multiple receipts in one email are split and processed individually.',
      },
    ],
    benefits: [
      'Unique @ receipt email address',
      'Works with any email provider',
      'Auto-extracts from forwarded emails',
      'Multi-receipt email support',
    ],
    relatedFeatures: ['ai-receipt-scanning', 'smart-search', 'bulk-export'],
  },
  {
    id: 'team-approvals',
    title: 'Team Approvals',
    icon: 'Users',
    shortDescription: 'Multi-user with role-based access. Owners review, employees submit.',
    longDescription:
      'Collaborate with your team. Employees submit receipts, managers review, owners approve. Role-based access control ensures the right people see the right data.',
    sections: [
      {
        title: 'Roles & Permissions',
        content:
          'Three roles: Owner (full access, billing, team management), Reviewer (approve/reject receipts, view all), Member (submit own receipts, view own). Custom roles available on Enterprise plan.',
      },
      {
        title: 'Approval Flows',
        content:
          'Set approval rules: receipts over $500 need review, specific categories need manager approval, etc. Email notifications for pending approvals. Escalation if not reviewed within 48 hours.',
      },
    ],
    benefits: [
      'Role-based access control',
      'Custom approval rules',
      'Email notification workflows',
      'Auto-escalation for pending items',
    ],
    relatedFeatures: ['kanban-workflow', 'payables-dashboard', 'audit-trail'],
  },
  {
    id: 'dark-mode',
    title: 'Dark Mode',
    icon: 'Moon',
    shortDescription: 'Light and dark themes, system-aware. Sync preference across devices.',
    longDescription:
      'Work comfortably day or night. Full dark mode with system preference detection. Sync your theme choice across all devices. Every UI element is carefully themed for both modes.',
    sections: [
      {
        title: 'Theme Options',
        content:
          'Three modes: Light, Dark, System (follows your OS preference). Smooth transition between modes with no flash. Theme persists across sessions and syncs via your account.',
      },
      {
        title: 'Visual Design',
        content:
          'Dark mode is not an afterthought — every card, chart, table, and UI element is carefully designed for both themes. Charts auto-adjust colors for readability in dark mode.',
      },
    ],
    benefits: [
      'Light, dark, and system modes',
      'Cross-device theme sync',
      'Smooth theme transitions',
      'Chart color adaptation',
    ],
    relatedFeatures: [],
  },
  {
    id: 'cra-reports',
    title: 'CRA-Ready Reports',
    icon: 'ScrollText',
    shortDescription: 'Generate T2125 statements, expense summaries, and mileage logs for tax filing.',
    longDescription:
      'Generate CRA-ready tax documents with one click. T2125 Statement of Business Activities, T777 Expense Statement, mileage logs, and GST/HST summary reports.',
    sections: [
      {
        title: 'Available Reports',
        content:
          'T2125 Statement of Business Activities, T777 Employment Expense, T1 Business Income Summary, mileage log (CRA format), GST/HST summary with ITC breakdown. All reports include your business details and are ready to file.',
      },
      {
        title: 'Report Customization',
        content:
          'Select specific date ranges, categories, or projects. Include/exclude mileage. Add custom headers and footers. Preview before generating. PDF and CSV formats.',
      },
    ],
    benefits: [
      'T2125, T777, mileage log reports',
      'GST/HST summary with ITCs',
      'CRA-ready format',
      'PDF and CSV export',
    ],
    relatedFeatures: ['tax-dashboard', 'cra-readiness-score', 'mileage-tracking'],
  },
  {
    id: 'qbo-xero-export',
    title: 'QBO & Xero Export',
    icon: 'FileSpreadsheet',
    shortDescription: 'One-click CSV export formatted for QuickBooks Online and Xero.',
    longDescription:
      'Export your receipt data directly into QuickBooks Online and Xero formats. Properly mapped fields, tax codes, and categories for seamless import into your accounting software.',
    sections: [
      {
        title: 'QuickBooks Online',
        content:
          'CSV format compatible with QBO import. Fields mapped: vendor → Payee, date → Transaction Date, category → Account, GST/HST → Tax Amount. Includes chart of accounts mapping.',
      },
      {
        title: 'Xero',
        content:
          'Xero-ready CSV with proper field mapping. Bank account coding, tax rate mapping, and contact creation. Supports both inventory and non-inventory items.',
      },
    ],
    benefits: [
      'QBO and Xero formatted CSV',
      'Proper tax code mapping',
      'Chart of accounts matching',
      'One-click export flow',
    ],
    relatedFeatures: ['bulk-export', 'cra-reports', 'tax-dashboard'],
  },
  {
    id: 'ai-insights',
    title: 'AI Insights',
    icon: 'Lightbulb',
    shortDescription: 'AI-generated observations about your spending patterns and trends.',
    longDescription:
      'Your personal AI financial analyst. Get daily, weekly, and monthly insights about your spending. Natural language summaries with actionable recommendations.',
    sections: [
      {
        title: 'Daily Briefing',
        content:
          'Every morning, AI generates a brief: "Yesterday you spent $342 at 3 vendors. Your biggest expense was $199 at Staples. You have 5 receipts pending approval." Contextual and actionable.',
      },
      {
        title: 'Trend Analysis',
        content:
          'Deep analysis of spending trends: category shifts, vendor concentration, seasonal patterns, and anomaly detection. AI connects dots you might miss and presents findings in plain English.',
      },
    ],
    benefits: [
      'AI-generated daily briefings',
      'Natural language observations',
      'Trend and pattern analysis',
      'Actionable recommendations',
    ],
    relatedFeatures: ['spending-insights', 'spend-anomalies', 'cash-flow-forecast'],
  },
  {
    id: 'custom-reports',
    title: 'Custom Reports',
    icon: 'Star',
    shortDescription: 'Build custom reports with date ranges, categories, and metrics. Schedule email delivery.',
    longDescription:
      'Build exactly the report you need. Choose metrics, date ranges, categories, and grouping. Save as templates and schedule automatic email delivery. Perfect for monthly management reports.',
    sections: [
      {
        title: 'Report Builder',
        content:
          'Drag-and-drop report builder. Select metrics: total spend, tax amounts, receipt count, average per receipt. Group by: category, vendor, project, month, quarter. Filter by any field.',
      },
      {
        title: 'Scheduling',
        content:
          'Schedule reports daily, weekly, or monthly. Email delivery to any address. Multiple recipients supported. PDF, CSV, or both formats. Templates save your configurations for reuse.',
      },
    ],
    benefits: [
      'Drag-and-drop report builder',
      'Automatic email scheduling',
      'Custom metrics and groupings',
      'Reusable report templates',
    ],
    relatedFeatures: ['bulk-export', 'cra-reports', 'spending-insights'],
  },
] as const;

/**
 * Get a feature by its URL slug.
 */
export function getFeatureBySlug(slug: string): FeatureData | undefined {
  return features.find((f) => f.id === slug);
}

/**
 * Resolve a Lucide icon name string to a lazy import path.
 * The actual icons are imported in the components that render them.
 */
export const featureIconMap: Record<string, string> = {
  Camera: 'Camera',
  Search: 'Search',
  CalendarDays: 'CalendarDays',
  Store: 'Store',
  PiggyBank: 'PiggyBank',
  TrendingUp: 'TrendingUp',
  ReceiptText: 'ReceiptText',
  DollarSign: 'DollarSign',
  Tags: 'Tags',
  Kanban: 'Kanban',
  GitCompare: 'GitCompare',
  Repeat: 'Repeat',
  FileDown: 'FileDown',
  BarChart3: 'BarChart3',
  ClipboardCheck: 'ClipboardCheck',
  ShieldCheck: 'ShieldCheck',
  AlertTriangle: 'AlertTriangle',
  Route: 'Route',
  Landmark: 'Landmark',
  Building2: 'Building2',
  Wallet: 'Wallet',
  Mail: 'Mail',
  Users: 'Users',
  Moon: 'Moon',
  ScrollText: 'ScrollText',
  FileSpreadsheet: 'FileSpreadsheet',
  Lightbulb: 'Lightbulb',
  Star: 'Star',
};
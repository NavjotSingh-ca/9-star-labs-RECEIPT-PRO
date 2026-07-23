/**
 * Centralized configuration constants for the application.
 * All magic numbers, timeouts, and configuration values should be defined here.
 */

/**
 * Application identity.
 * Production: "9 Star Labs Receipt Pro"
 * Local/dev:  "Leduc Receipt Pro" (set NEXT_PUBLIC_APP_NAME in .env.local)
 *
 * Uses NEXT_PUBLIC_* so it's available to both server and client components.
 * Next.js inlines NEXT_PUBLIC_* env vars at build time via string replacement.
 */
export const APP_NAME: string = (process.env.NEXT_PUBLIC_APP_NAME as string) || '9 Star Labs Receipt Pro';
export const APP_TAGLINE = 'Gold Standard Receipt Intelligence';
export const APP_DESCRIPTION = 'Enterprise-grade receipt management with AI-powered extraction, CRA-compliant tax exports, and real-time financial insights.';

/**
 * React Query / TanStack Query cache configuration
 */
export const QUERY_CONFIG = {
  /** Default stale time for most queries (5 minutes) */
  DEFAULT_STALE_TIME: 5 * 60 * 1000,
  
  /** Short stale time for frequently changing data (30 seconds) */
  SHORT_STALE_TIME: 30 * 1000,
  
  /** Long stale time for rarely changing data (10 minutes) */
  LONG_STALE_TIME: 10 * 60 * 1000,
  
  /** Very long stale time for static/reference data (1 hour) */
  STATIC_STALE_TIME: 60 * 60 * 1000,
  
  /** Default cache time (10 minutes) */
  DEFAULT_CACHE_TIME: 10 * 60 * 1000,
  
  /** Retry configuration */
  DEFAULT_RETRY: 2,
  RETRY_DELAY: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  
  /** Refetch intervals */
  REFETCH_ON_WINDOW_FOCUS: false,
  REFETCH_ON_RECONNECT: true,
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  /** Default requests per window */
  DEFAULT_MAX_TOKENS: 10,
  
  /** Default window in milliseconds (1 minute) */
  DEFAULT_WINDOW_MS: 60 * 1000,
  
  /** Stricter limits for sensitive operations */
  STRICT_MAX_TOKENS: 5,
  STRICT_WINDOW_MS: 60 * 1000,
  
  /** Lenient limits for read operations */
  LENIENT_MAX_TOKENS: 100,
  LENIENT_WINDOW_MS: 60 * 1000,
  
  /** Health check limits */
  HEALTH_MAX_TOKENS: 30,
  HEALTH_WINDOW_MS: 60 * 1000,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION_CONFIG = {
  /** Default page size */
  DEFAULT_PAGE_SIZE: 25,
  
  /** Maximum page size */
  MAX_PAGE_SIZE: 100,
  
  /** Page size for exports */
  EXPORT_PAGE_SIZE: 1000,
  
  /** Virtualized list item height (px) */
  VIRTUAL_ITEM_HEIGHT: 56,
  
  /** Overscan for virtualized lists */
  VIRTUAL_OVERSCAN: 10,
} as const;

/**
 * Retry/backoff configuration
 */
export const RETRY_CONFIG = {
  /** Maximum retry attempts */
  MAX_RETRIES: 5,
  
  /** Base delay in milliseconds */
  BASE_DELAY_MS: 1000,
  
  /** Maximum delay cap in milliseconds */
  MAX_DELAY_MS: 30000,
  
  /** Exponential backoff multiplier */
  BACKOFF_MULTIPLIER: 2,
  
  /** Jitter factor (0-1) */
  JITTER_FACTOR: 0.1,
} as const;

/**
 * File upload limits
 */
export const UPLOAD_CONFIG = {
  /** Maximum single file size (20MB) */
  MAX_FILE_SIZE: 20 * 1024 * 1024,
  
  /** Maximum total upload size (50MB) */
  MAX_TOTAL_SIZE: 50 * 1024 * 1024,
  
  /** Allowed MIME types */
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  
  /** Image compression quality (0-1) */
  IMAGE_QUALITY: 0.85,
  
  /** Maximum image dimension (px) */
  MAX_DIMENSION: 4096,
} as const;

/**
 * Session/authentication configuration
 */
export const AUTH_CONFIG = {
  /** Session cookie name */
  SESSION_COOKIE_NAME: 'sb-session',
  
  /** CSRF cookie name */
  CSRF_COOKIE_NAME: 'csrf-token',
  
  /** Session cookie max age (30 days) */
  SESSION_MAX_AGE: 60 * 60 * 24 * 30,
  
  /** CSRF cookie max age (30 days) */
  CSRF_MAX_AGE: 60 * 60 * 24 * 30,
  
  /** Password reset token expiry (1 hour) */
  RESET_TOKEN_EXPIRY_MS: 60 * 60 * 1000,
  
  /** Email verification token expiry (24 hours) */
  VERIFICATION_TOKEN_EXPIRY_MS: 24 * 60 * 60 * 1000,
} as const;

/**
 * UI/Animation configuration
 */
export const UI_CONFIG = {
  /** Default animation duration (ms) */
  ANIMATION_DURATION: 200,
  
  /** Reduced motion animation duration (ms) */
  REDUCED_MOTION_DURATION: 1,
  
  /** Framer Motion spring stiffness */
  SPRING_STIFFNESS: 500,
  
  /** Framer Motion spring damping */
  SPRING_DAMPING: 30,
  
  /** Debounce delay for search inputs (ms) */
  SEARCH_DEBOUNCE_MS: 300,
  
  /** Toast notification duration (ms) */
  TOAST_DURATION: 5000,
  
  /** Loading spinner minimum display time (ms) */
  MIN_LOADING_TIME: 500,
} as const;

/**
 * Financial/CRA configuration
 */
export const FINANCIAL_CONFIG = {
  /** CRA mileage rate for first 5000 km (CAD/km) */
  CRA_RATE_FIRST_5000: 0.70,
  
  /** CRA mileage rate after 5000 km (CAD/km) */
  CRA_RATE_AFTER_5000: 0.64,
  
  /** CRA threshold in kilometers */
  CRA_THRESHOLD_KM: 5000,
  
  /** Default tax year (previous year) */
  DEFAULT_TAX_YEAR: () => new Date().getFullYear() - 1,
  
  /** Currency locale for formatting */
  CURRENCY_LOCALE: 'en-CA',
  
  /** Currency code */
  CURRENCY_CODE: 'CAD',
  
  /** Maximum decimal places for currency */
  MAX_DECIMAL_PLACES: 2,
} as const;

/**
 * Storage keys for localStorage/sessionStorage
 */
export const STORAGE_KEYS = {
  /** User preferences */
  PREFERENCES: 'lrp-preferences',
  
  /** Feature flags */
  FEATURE_FLAGS: 'lrp-feature-flags',
  
  /** Onboarding completion */
  ONBOARDING_COMPLETE: 'lrp-onboarding-complete',
  
  /** Last visited tab */
  LAST_TAB: 'lrp-last-tab',
  
  /** Consent banner dismissal */
  CONSENT_DISMISSED: 'lrp-consent-dismissed',
  
  /** Offline queue */
  OFFLINE_QUEUE: '9sl-offline-queue',
  
  /** Theme preference */
  THEME: 'theme',
  
  /** CSRF token */
  CSRF_TOKEN: 'csrf-token',
} as const;

/**
 * API route prefixes
 */
export const API_ROUTES = {
  BASE: '/api',
  STRIPE: '/api/stripe',
  QBO: '/api/qbo',
  CRA: '/api/cra',
  TEAM: '/api/team',
  FEATURES: '/api/features',
  HEALTH: '/api/health',
  EXPORT: '/api/export',
  REPORTS: '/api/reports',
  RECEIPTS: '/api/receipts',
  EMAIL: '/api/email',
  DIGEST: '/api/digest',
  DOCS: '/api/docs',
} as const;

/**
 * Public page routes
 */
export const PUBLIC_ROUTES = [
  '/',
  '/privacy',
  '/terms',
  '/auth/callback',
  '/notifications',
] as const;

/**
 * Protected page routes (require authentication)
 */
export const PROTECTED_ROUTES = [
  '/settings',
  '/settings/billing',
  '/settings/org',
  '/settings/security',
  '/settings/team',
  '/settings/features',
  '/settings/admin',
] as const;

/**
 * Feature flag keys
 */
export const FEATURE_FLAGS = {
  SCANNER: 'scanner',
  BANKING: 'banking',
  TAX_EXPORT: 'tax_export',
  MILEAGE: 'mileage',
  APPROVALS: 'approvals',
  REIMBURSEMENTS: 'reimbursements',
  PROJECTS: 'projects',
  BUDGETS: 'budgets',
  CASH_FLOW: 'cash_flow',
  ANOMALY_DETECTION: 'anomaly_detection',
  AUDIT_TRAIL: 'audit_trail',
  PAYABLES: 'payables',
  SMART_SEARCH: 'smart_search',
  VENDOR_ANALYTICS: 'vendor_analytics',
  RECURRING_DETECTOR: 'recurring_detector',
  RECEIPT_CALENDAR: 'receipt_calendar',
  RECEIPT_TIMELINE: 'receipt_timeline',
  RECEIPT_COMPARISON: 'receipt_comparison',
  RECEIPT_TAGS: 'receipt_tags',
  BATCH_OPERATIONS: 'batch_operations',
  SHARE_RECEIPT: 'share_receipt',
  READINESS_SCORE: 'readiness_score',
  SPENDING_INSIGHTS: 'spending_insights',
  EMAIL_FORWARD: 'email_forward',
  SLACK_ALERTS: 'slack_alerts',
  QBO_EXPORT: 'qbo_export',
  XERO_EXPORT: 'xero_export',
  DARK_MODE_SYNC: 'dark_mode_sync',
  MULTI_CURRENCY: 'multi_currency',
  EXPORT_DASHBOARD: 'export_dashboard',
  TIME_TRACKING: 'time_tracking',
} as const;

/**
 * User roles
 */
export const USER_ROLES = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
  ACCOUNTANT: 'Accountant',
  AUDITOR: 'Auditor',
} as const;

/**
 * Approval statuses
 */
export const APPROVAL_STATUSES = {
  SUBMITTED: 'submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REIMBURSED: 'reimbursed',
} as const;

/**
 * Reimbursement statuses
 */
export const REIMBURSEMENT_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  REJECTED: 'rejected',
} as const;

/**
 * Currency codes
 */
export const CURRENCIES = {
  CAD: 'CAD',
  USD: 'USD',
  EUR: 'EUR',
} as const;

/**
 * Date format constants
 */
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'MMM D, YYYY',
  DISPLAY_WITH_DAY: 'dddd, MMMM D, YYYY',
  MONTH_YEAR: 'MMMM YYYY',
  YEAR_ONLY: 'YYYY',
} as const;

/**
 * Regex patterns
 */
export const REGEX_PATTERNS = {
  /** UUID v4 */
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  /** Email */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  /** Canadian postal code */
  CA_POSTAL_CODE: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
  
  /** CRA Business Number (9 digits) */
  CRA_BN: /^\d{9}$/,
  
  /** ISO date */
  ISO_DATE: /^\d{4}-\d{2}-\d{2}$/,
  
  /** Currency amount (up to 2 decimals) */
  CURRENCY: /^\d+(\.\d{1,2})?$/,
  
  /** SHA-256 hex */
  SHA256_HEX: /^[a-f0-9]{64}$/i,
} as const;
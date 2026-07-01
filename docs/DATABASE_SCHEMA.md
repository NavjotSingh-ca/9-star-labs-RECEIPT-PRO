# Leduc Receipt Pro — Database Schema Reference

> Source of truth: `supabase/setup.sql` — run against Supabase SQL Editor to apply changes.

## Conventions

- All tables use `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- All tables have `created_at timestamptz DEFAULT now()`
- Tenant isolation via `org_id` column on all tenant-scoped tables
- RLS enabled on all tables; policies enforce `org_id = get_user_org()`
- Soft-delete via `is_deleted` boolean on `receipts`

---

## Tables

### organizations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text NOT NULL | |
| org_slug | text UNIQUE | Used for inbound email routing |
| receipt_email | text UNIQUE | |
| tax_year_lock | integer | NULL = no lock |
| created_at | timestamptz | |

**RLS:** `Select_Org` (SELECT only, org match), `Update_Org` (UPDATE only, org match)

---

### user_roles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK→auth.users | ON DELETE CASCADE, UNIQUE |
| org_id | uuid FK→organizations | ON DELETE CASCADE |
| role | text NOT NULL | CHECK: `Owner`, `Employee`, `Accountant` |
| invited_by | uuid FK→auth.users | ON DELETE SET NULL |
| created_at | timestamptz | |

**RLS:** `Select_Roles` (SELECT only, org match). INSERT/UPDATE/DEFAULT blocked by `No_Direct_*` policies. Use `upsert_user_role()` SECURITY DEFINER RPC instead.

**Key:** `uniq_user_role UNIQUE (user_id)` — one role per user.

---

### receipts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK→organizations | NOT NULL, ON DELETE CASCADE |
| user_id | uuid FK→auth.users | NOT NULL, ON DELETE CASCADE |
| vendor_name | text | |
| vendor_address | text | |
| business_number | text | CRA business number |
| vendor_tax_number | text | |
| total_amount | numeric DEFAULT 0 | |
| subtotal | numeric | |
| tax_amount | numeric DEFAULT 0 | GST/HST |
| pst_amount | numeric | Provincial sales tax |
| currency | text DEFAULT 'CAD' | |
| exchange_rate | numeric DEFAULT 1.0 | |
| cad_equivalent | numeric | |
| transaction_date | text | Stored as text! Cast to date in queries |
| transaction_time | text | |
| payment_method | text | |
| payment_reference | text | |
| card_last_four | text | |
| category | text | |
| notes | text | |
| document_type | text | |
| business_unit_id | uuid FK→business_units | ON DELETE SET NULL |
| project_id | uuid FK→projects | ON DELETE SET NULL |
| image_url | text | Supabase Storage URL |
| source_file_name | text | |
| source_file_type | text | |
| confidence_score | numeric | AI confidence 0-100 |
| cra_readiness_score | numeric | CRA-ready score 0-100 |
| blur_score | numeric | Blur detection |
| thermal_warning | boolean DEFAULT false | Thermal paper detected |
| capture_source | text | 'camera', 'gallery', 'email_screenshot', etc. |
| usage_type | text | |
| business_use_percent | numeric | |
| job_code | text | |
| vehicle_id | text | |
| paid_by | text | |
| reimbursement_status | text DEFAULT 'pending' | |
| needs_reimbursement | boolean DEFAULT false | |
| approval_status | text DEFAULT 'submitted' | |
| accountant_status | text | |
| review_status | text | |
| needs_review | boolean DEFAULT false | |
| integrity_hash | text | Merkle hash for audit trail |
| duplicate_hash | text | Hash for duplicate detection |
| duplicate_warning | boolean DEFAULT false | |
| math_mismatch_warning | boolean DEFAULT false | |
| missing_bn_warning | boolean DEFAULT false | |
| high_audit_risk | boolean DEFAULT false | |
| flagged_for_audit | boolean DEFAULT false | |
| fraud_suspicion | boolean DEFAULT false | |
| fraud_reason | text | |
| line_items | jsonb DEFAULT '[]' | Array of line item objects |
| semantic_embedding | vector(768) | pgvector embedding for semantic search |
| is_deleted | boolean DEFAULT false | Soft delete flag |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**RLS:** Scoped by org. Users see own receipts; Owners/Accountants see all in org.
**Trigger:** `before_receipt_delete` blocks DELETE of approved receipts within 7 years.
**Constraint:** `uniq_org_duplicate_hash UNIQUE (org_id, duplicate_hash)` — dedup.
**Indexes:** 15+ indexes including partial filtered indexes for fraud, math mismatch, missing BN, high confidence, reimbursement.

---

### audit_logs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK→organizations | ON DELETE CASCADE |
| receipt_id | uuid FK→receipts | ON DELETE CASCADE |
| user_id | uuid FK→auth.users | ON DELETE SET NULL |
| action | text NOT NULL | |
| details | text | |
| previous_hash | text | Merkle chain |
| event_hash | text | |
| created_at | timestamptz | |

**RLS:** Org-scoped. User sees own; Owners/Accountants see all.
**Indexes:** org+created_at, user_id, receipt_id, event_hash.

---

### receipt_history
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK→organizations | ON DELETE CASCADE |
| receipt_id | uuid FK→receipts | ON DELETE CASCADE |
| user_id | uuid FK→auth.users | ON DELETE SET NULL |
| vendor_name | text | Snapshot |
| vendor_tax_number | text | Snapshot |
| business_number | text | Snapshot |
| transaction_date | text | Snapshot |
| total_amount | numeric | Snapshot |
| subtotal | numeric | Snapshot |
| tax_amount | numeric | Snapshot |
| pst_amount | numeric | Snapshot |
| payment_method | text | Snapshot |
| category | text | Snapshot |
| notes | text | Snapshot |
| document_type | text | Snapshot |
| project_id | uuid | Snapshot |
| exchange_rate | numeric | Snapshot |
| cad_equivalent | numeric | Snapshot |
| duplicate_hash | text | Snapshot |
| integrity_hash | text | Snapshot |
| archived_at | timestamptz | |
| archived_by | uuid FK→auth.users | ON DELETE SET NULL |

**Indexes:** receipt_id, org_id.

---

### business_units
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK→organizations | ON DELETE CASCADE |
| name | text NOT NULL | |
| created_at | timestamptz | |

---

### projects
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK→organizations | ON DELETE CASCADE |
| user_id | uuid FK→auth.users | ON DELETE CASCADE |
| name | text NOT NULL | |
| code | text | Job code |
| budget_amount | numeric | |
| created_at | timestamptz | |

---

### vehicles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK→organizations | ON DELETE CASCADE |
| user_id | uuid FK→auth.users | ON DELETE CASCADE |
| make | text | |
| model | text | |
| year | integer | |
| license_plate | text | |
| nickname | text NOT NULL | |
| default_rate_per_km | numeric DEFAULT 0.68 | CRA rate |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### mileage_logs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK→organizations | ON DELETE CASCADE |
| user_id | uuid FK→auth.users | ON DELETE CASCADE |
| vehicle_id | uuid FK→vehicles | ON DELETE SET NULL |
| trip_date | date NOT NULL | |
| purpose | text NOT NULL | |
| start_location | text | |
| end_location | text | |
| distance_km | numeric NOT NULL | CHECK (distance_km > 0) |
| rate_per_km | numeric NOT NULL | |
| total_amount | numeric NOT NULL | |
| is_reimbursed | boolean DEFAULT false | |
| project_id | uuid FK→projects | ON DELETE SET NULL |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### bank_transactions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK→organizations | ON DELETE CASCADE |
| account_id | text NOT NULL | |
| date | date NOT NULL | |
| amount | numeric NOT NULL | |
| payee_name | text | |
| description | text | |
| reference_number | text | |
| category | text | |
| matched_receipt_id | uuid FK→receipts | ON DELETE SET NULL |
| match_confidence | numeric | |
| match_method | text | |
| is_reconciled | boolean DEFAULT false | |
| transaction_date | text NOT NULL DEFAULT '' | Duplicated from `date` column |
| uploaded_by | uuid FK→auth.users | ON DELETE SET NULL |
| statement_date | date | |
| source_file_name | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Constraints:** `uniq_tx_ref UNIQUE (org_id, account_id, reference_number)`, `uniq_tx_content UNIQUE (org_id, transaction_date, amount, description)`.

---

### subscriptions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK→organizations | UNIQUE, ON DELETE CASCADE |
| stripe_customer_id | text | |
| stripe_subscription_id | text UNIQUE | |
| plan | text NOT NULL DEFAULT 'free' | CHECK: `free`, `starter`, `pro`, `business`, `enterprise` |
| receipt_limit | integer DEFAULT 50 | |
| user_limit | integer DEFAULT 1 | |
| status | text | CHECK: `active`, `trialing`, `past_due`, `canceled` |
| trial_ends_at | timestamptz | |
| current_period_end | timestamptz | |
| cancel_at_period_end | boolean DEFAULT false | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### organization_settings
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK→organizations | UNIQUE, ON DELETE CASCADE |
| business_name | text | |
| business_number | text | |
| address | text | |
| province | text DEFAULT 'AB' | |
| gst_registrant | boolean DEFAULT true | |
| high_value_threshold | numeric DEFAULT 500.00 | |
| require_approval_above | numeric DEFAULT 500.00 | |
| slack_webhook_url | text | |
| qbo_auth_state | text | OAuth state |
| qbo_auth_nonce | text | OAuth nonce |
| qbo_auth_started_at | timestamptz | |
| qbo_realm_id | text | QBO company ID |
| qbo_access_token | text | AES-256-GCM encrypted |
| qbo_refresh_token | text | AES-256-GCM encrypted |
| qbo_token_expires_at | timestamptz | |
| qbo_connected_at | timestamptz | |
| qbo_sync_enabled | boolean DEFAULT false | |
| default_sync_account | text | |
| last_sync_at | timestamptz | |
| xero_refresh_token | text | |
| xero_tenant_id | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### access_codes
| Column | Type | Notes |
|--------|------|-------|
| code | text PK | 8-char |
| org_id | uuid FK→organizations | ON DELETE CASCADE |
| role | text NOT NULL | |
| business_unit_id | uuid FK→business_units | ON DELETE CASCADE |
| created_by | uuid FK→auth.users | ON DELETE CASCADE |
| created_at | timestamptz | |
| expires_at | timestamptz | Default: 7 days |

---

### Other Tables
| Table | Purpose |
|-------|---------|
| `vendor_defaults` | Per-vendor prefill defaults (category, job_code, business_use_percent) |
| `receipt_comments` | Receipt discussion threads |
| `report_templates` | Saved report configs |
| `report_schedules` | Automated report schedules (cron) |
| `fx_rate_cache` | Bank of Canada FX rate cache |
| `scan_attempts` | Rate limit tracking for scanner |
| `processed_webhook_events` | Stripe/Resend webhook idempotency |

---

## Key RPC Functions

| Function | Purpose |
|----------|---------|
| `get_user_org()` | Returns current user's org_id (SECURITY DEFINER) |
| `has_elevated_role()` | Returns true if user is Owner or Accountant |
| `bootstrap_first_user_org(p_user_id, p_org_name)` | Creates org + Owner role for first-time user |
| `generate_access_code(p_created_by, p_role, p_bu_id)` | Creates 8-char invite code |
| `redeem_access_code(p_code, p_user_id)` | Redeems invite, creates user_roles entry |
| `upsert_user_role(p_target_user_id, p_role, p_org_id)` | Role management (Owner-only) |
| `get_dashboard_stats(p_org_id, p_user_id, p_role)` | Dashboard KPIs (org-guarded) |
| `get_receipts_paginated(...)` | Paginated receipt list with filters (org-guarded) |
| `get_spend_anomalies(p_org_id)` | Spend anomaly detection (org-guarded) |
| `get_project_actuals(p_org_id)` | Project budget tracking (org-guarded) |
| `generate_report(...)` | Custom report generation (dynamic SQL) |
| `match_receipts(...)` | Semantic search via pgvector |
| `get_user_email(p_user_id)` | Email lookup (SECURITY DEFINER) |

---

## Key Triggers

| Trigger | Table | Purpose |
|---------|-------|---------|
| `before_receipt_delete` | receipts | Blocks DELETE of approved receipts within 7 years |
| `trg_set_org_id` | receipts, audit_logs, receipt_history | Auto-fills org_id from user_roles on INSERT |
| `trg_set_updated_at` | receipts, subscriptions, organization_settings, bank_transactions, vehicles, mileage_logs, vendor_defaults | Auto-updates updated_at on UPDATE |

---

## Key Indexes (22+)

- `idx_receipts_org_deleted` — `(org_id, is_deleted)` — main query filter
- `idx_receipts_org_status` — `(org_id, approval_status)` — approval queries
- `idx_receipts_category` — `(org_id, category) WHERE is_deleted = false` — dashboard category breakdown
- `idx_receipts_fraud` — `(org_id) WHERE fraud_suspicion = true` — fraud alerts
- `idx_receipts_reimbursement` — `(org_id) WHERE paid_by = 'employee_cash' AND needs_reimbursement = true` — payables
- `idx_receipts_vendor_fts` — GIN index on `to_tsvector('english', vendor_name)` — text search
- All FK columns indexed (user_id, org_id, project_id, business_unit_id, vehicle_id, etc.)

---

## Important Gotchas

1. **`transaction_date` is stored as `text`**, not `date` — cast with `::date` in queries
2. **`get_receipts_paginated` RPC** needs `::date` casts — run `setup.sql` against Supabase to apply
3. **`uniq_org_duplicate_hash`** drops duplicates before creating the constraint (idempotent)
4. **Token encryption format**: `enc:iv:authTag:ciphertext` (AES-256-GCM)
5. **DO NOT modify schema outside `setup.sql`** — it is the single source of truth

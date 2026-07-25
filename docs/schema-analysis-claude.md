# Schema Analysis — Claude CLI (postgres-best-practices + fullstack-debugger)

Ran: `claude --effort max --output-format json` with skills auto-loaded

## Findings

| # | Area | Severity | Issue | Effort to Fix |
|---|------|----------|-------|:------------:|
| 1 | FK Indexes | **High** | 10 missing FK indexes on `receipts(business_unit_id, project_id)`, `bank_transactions(matched_receipt_id)`, `vehicles(user_id)`, `mileage_logs(user_id)`, `receipt_comments(receipt_id)`, `audit_logs(user_id)`, `projects(user_id)`, `user_roles(org_id)` | Low |
| 2 | RLS Bypass | **Critical** | SECURITY DEFINER functions (`get_user_org`, `has_elevated_role`) lack `SET search_path = ''` — attacker can escalate via RPC | Low |
| 3 | Redundant Indexes | **Medium** | 6+ overlapping indexes on `receipts` (e.g., `idx_receipts_org_id` + `idx_receipts_org_deleted` share leading column) | Low |
| 4 | Trigger Perf | **High** | 3 triggers on INSERT/DELETE per row (org lookup, hash, audit). Serializes bulk imports | Medium |
| 5 | Wide Table | **High** | `receipts` has 70+ columns → TOAST overhead, UPDATE bloat | High |
| 6 | Partial Index | **Medium** | Missing `WHERE is_deleted=false AND approval_status='pending'` index for common pending-receipts query | Low |
| 7 | MV Subquery | **Medium** | `org_dashboard_summary` MV subquery scans receipts per row — needs covering index | Medium |
| 8 | Redundant GIN | **Low** | `idx_receipts_fts` (search_vector) already includes vendor_name. `idx_receipts_vendor_fts` is duplicate | Low |
| 9 | Race Condition | **Medium** | Partial unique `uniq_org_duplicate_hash` allows concurrent duplicate inserts to both pass | Medium |

## Key Actions (Highest Impact)

1. **Fix RLS bypass** — Add `SET search_path = ''` to all SECURITY DEFINER functions (5 min)
2. **Add FK indexes** — 10 `CREATE INDEX` statements (10 min)  
3. **Fix trigger perf** — Convert `duplicate_hash` to `GENERATED ALWAYS AS STORED`, remove `set_org_id_from_user` trigger, batch bulk inserts
4. **Drop redundant indexes** — Remove 6 overlapping indexes to speed up writes

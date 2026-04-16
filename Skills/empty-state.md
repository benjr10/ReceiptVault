# ReceiptVault — Empty States Specification

## 1. Purpose

This document defines all empty states, detection logic, fallback strategies, and risk protection.

Goals:

- No false empty states
- No confusion between loading, error, and empty
- System must self-correct under failure
- Deterministic behavior under all conditions


## 2. Core Principles

### 2.1 Empty is a Confirmed State

Empty must ONLY be shown when:

- data absence is confirmed
- sync is completed OR safely timed out
- no error exists


### 2.2 State Priority (Strict Order)

System MUST evaluate states in this order:

1. error_state
2. loading_state
3. syncing_state
4. empty_state
5. data_state

Lower states MUST NOT override higher ones


### 2.3 Timeout Protection (CRITICAL)

System must NEVER wait indefinitely.

IF sync OR loading exceeds threshold:

- fallback to safe state
- inform user


## 3. Global State Resolution Engine

ON render:

- IF error_detected → show error_state

- ELSE IF loading AND no_local_data → show loading_state

- ELSE IF sync_in_progress AND no_local_data:
    IF sync_time < MAX_SYNC_WAIT:
        show syncing_state
    ELSE:
        show fallback_state

- ELSE IF data_exists → show data_state

- ELSE → evaluate empty_state


## 4. Sync Timeout Protection

DEFINE:

- MAX_SYNC_WAIT = 5 seconds

IF sync exceeds MAX_SYNC_WAIT:

- stop blocking UI
- show fallback state:
  "Still syncing… some data may be missing"


## 5. Data Validation Layer

Before showing empty:

System MUST verify:

- local_data_checked == true
- sync_attempted == true OR timeout_reached

IF NOT:

- DO NOT show empty


## 6. First-Time User State

### Condition

- total_data == 0
- user_has_never_created_expense == true

### UI

- "No expenses yet"
- "Start tracking your spending in seconds"
- CTA: "Add Expense"


## 7. Returning User Empty State

### Condition

- total_data == 0
- user_has_created_expense_before == true

### UI

- "No expenses available"
- CTA: "Add Expense"


## 8. Expense List Empty State

### Condition

- total_data == 0
- sync_completed OR timeout_reached

### Rule

- Never render blank list


## 9. Filtered Empty State

### Condition

- total_data > 0
- filters_active == true
- filtered_results == 0
- sync_completed OR timeout_reached

### UI

- "No matching expenses"
- CTA: "Clear Filters"


## 10. Search Empty State

### Condition

- search_active == true
- search_results == 0
- sync_completed OR timeout_reached

### Priority

- overrides filter state


## 11. Search + Sync Protection

IF search_active AND sync_in_progress:

- show:
  "Searching… results updating"


## 12. Dashboard Empty State

### Condition

- total_data == 0
- sync_completed OR timeout_reached

### UI

- "No data to display"
- CTA: "Add Expense"

### Rule

- replace charts with placeholder (not remove layout)


## 13. Report Empty State

### Condition

- selected_range_data == 0

### Rule

- block report generation
- show guidance


## 14. Offline Handling

IF offline:

- IF local_data_exists → show data

- IF no_local_data:
    IF user_is_new → show first-time state
    ELSE → show offline empty state


## 15. Delete-All Protection

IF user deletes last item:

- show temporary state:
  "All expenses deleted"

- mark as local_change_pending_sync

### Conflict Handling

IF server restores data after sync:

- show reconciliation notice:
  "Some items were restored from sync"


## 16. Multi-State Conflict Resolution

When multiple conditions are true:

Priority:

1. error
2. offline
3. search
4. filters
5. base empty

System MUST resolve to ONE state only


## 17. Backend Failure Protection

IF backend_fetch_failed:

- show error_state
- NEVER show empty


## 18. Corrupted Data Protection

IF local_data_corrupted:

- show recovery state:
  "We’re fixing your data. Please wait."

- trigger re-sync


## 19. Flicker Protection

- Minimum 300ms delay before empty evaluation
- Prevent rapid state switching


## 20. Partial Data Awareness

IF partial_data_loaded:
- show available data
- show indicator:
  "More data syncing…"


## 21. Visual Differentiation
Each empty state MUST have:

- unique message
- distinct icon/context


## 22. Analytics Protection

Track:
- empty_state_type
- sync_status_at_time
- fallback_triggered

Ensure:
- no duplicate event firing


## 23. Accessibility
- text always present
- screen-reader compatible
- no reliance on visuals alone


## 24. Component Rules

### Lists
- never blank
- always show state component

### Charts
- always maintain structure
- replace with placeholder


## 25. Self-Healing Rules (NEW)

System must:
- retry sync automatically
- re-evaluate state after every sync
- correct wrong states dynamically


## 26. Fallback State (Unknown Issues)
IF system cannot determine correct state:

- show safe fallback:

  "We’re updating your data. Please wait or refresh."

- provide retry action


## 27. Forbidden Patterns
- blank screens
- empty during loading
- empty during errors
- multiple conflicting states
- indefinite waiting


## 28. Final Guarantee

The system guarantees:
- Empty states only appear when data absence is confirmed
- No confusion between loading, syncing, error, and empty
- System recovers from delays, failures, and unknown conditions
- No user will believe their data is lost
- UI will always present a valid, explainable state

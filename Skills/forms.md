# ReceiptVault — Forms Design

## 1. Overview
This document defines all user input forms in ReceiptVault.

### Design Principles
- Speed first (≤10 seconds for core actions)
- Minimal required inputs
- Mobile-first interaction
- Local-first (instant save)
- Sync-safe (eventual consistency)
- Clear validation and feedback

### Core Behavior
All forms must:
1. Validate inputs in real time
2. Save instantly to IndexedDB
3. Trigger Sync Queue (async)
4. Prevent duplicate submissions
5. Provide immediate feedback


## 2. Global Rules

### Required Fields
- Expense Form → `amount`, `category_id`
- All other fields → optional

### Validation Rules
- Real-time validation
- Inline error messages
- Prevent submission if invalid
- Trim whitespace from text inputs
- Normalize text (lowercase for comparisons)

### Submission Flow (Standard for All Forms)
1. Validate inputs  
2. Lock form (prevent double tap)  
3. Generate UUID  
4. Save to IndexedDB (instant)  
5. Set `sync_status = pending`  
6. Add to Sync Queue  
7. Unlock form  
8. Show success feedback  

### Offline Behavior
- Works fully offline
- Never blocks submission
- Shows “Offline Mode” indicator
- Auto-syncs when online

### Feedback
Each submission must show:
- Success confirmation (instant)
- Validation errors (if any)
- Sync status:
  - `pending`
  - `synced`
  - `failed`
- Optional Undo (5 seconds)


### Time & Currency
- Store timestamps in UTC
- Display in local time
- Currency field included (default: NGN)


### Input Limits
- `note` → max 200 characters
- `name` → max 50 characters

## 3. Forms

## 3.1 Expense Form (Core)

### Purpose
Log an expense in under 10 seconds.

### Inputs

| Field | Type | Required | Notes |
|------|------|--------|------|
| amount | number | ✅ | Must be > 0 |
| category_id | select | ✅ | Required |
| currency | hidden | ✅ | Default NGN |
| expense_date | date | ❌ | Default = today |
| project_id | select | ❌ | Optional |
| note | text | ❌ | Max 200 chars |
| receipt_file | file | ❌ | Image only |

### UI Behavior
- Numeric keypad auto-opens
- Amount formatted (e.g. 3,500)
- Category shown as tiles
- Last used category pre-selected
- Inline “Add Category” option
- Save button disables on tap

### File Handling
- Max size: 5MB
- Compress before upload
- Format: JPEG/WebP
- Set `receipt_status = pending`

### Submission Flow
1. Validate inputs  
2. Lock form  
3. Generate UUID  
4. Save locally:
   - `sync_status = pending`
   - `receipt_status = pending` (if file exists)  
5. Queue operations:
   - expense create  
   - receipt upload (if present)  
6. Unlock form  
7. Show success  
8. Offer Undo  

### Edit Mode
- Pre-fill data
- Update locally
- Set `sync_status = pending`
- Queue update operation

## 3.2 Category Form

### Inputs
| Field | Type | Required |
|------|------|--------|
| name | text | ✅ |

### Rules
- Cannot be empty
- Must be unique (case-insensitive)

### Behavior
- Save locally
- Sync via queue
- Supports edit mode

## 3.3 Project / Client Form

### Inputs
| Field | Type | Required |
|------|------|--------|
| name | text | ✅ |

### Rules
- Cannot be empty

### Behavior
- Save locally
- Sync via queue
- Supports edit mode

## 3.4 Login Form

### Inputs
| Field | Type | Required |
|------|------|--------|
| email | email | ✅ |
| password | password | ✅ |

### Rules
- Valid email format
- Password ≥ 8 characters

### Behavior
- Send to Auth Service
- Backend handles rate limiting
- Store session on success

## 3.5 Registration Form

### Inputs
| Field | Type | Required |
|------|------|--------|
| full_name | text | ✅ |
| email | email | ✅ |
| password | password | ✅ |

### Rules
- Valid email
- Password ≥ 8
- All fields required

### Behavior
- Create account
- Redirect to Expense Form

## 3.6 Report Form

### Inputs
| Field | Type | Required |
|------|------|--------|
| start_date | date | ✅ |
| end_date | date | ✅ |
| categories | multi-select | ❌ |
| project_id | select | ❌ |
| include_receipts | toggle | ❌ |

### Rules
- `start_date ≤ end_date`

### Behavior
1. Check sync status  
2. If not fully synced:
   - Show warning  
   - Provide “Sync Now” option  
3. Fetch data  
4. Generate report  


## 3.7 Recurring Expense Form

### Inputs
| Field | Type | Required |
|------|------|--------|
| amount | number | ✅ |
| category_id | select | ✅ |
| frequency | select | ✅ |
| start_date | date | ✅ |
| end_date | date | ❌ |
| project_id | select | ❌ |
| note | text | ❌ |
| is_active | boolean | ✅ |

### Rules
- amount > 0
- frequency: weekly / monthly
- start_date ≤ end_date (if provided)

### Behavior
- Save locally
- Sync via queue


## 4. Error Handling
Forms must handle:
- Validation errors (inline)
- Offline state (non-blocking)
- Sync failures (status-based)
- Upload failures (retry via system)


## 5. Summary
This form system ensures:
- Fast input (≤10 seconds)
- Offline reliability
- Safe syncing
- Clear feedback
- Accurate reporting


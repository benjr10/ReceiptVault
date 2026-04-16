# ReceiptVault — Notifications Design

## 1. Overview

This document defines all notification behaviors in ReceiptVault.

Notifications ensure:
- Users always know what is happening
- No action is ambiguous
- Errors are visible and actionable

### Design Principles

- Immediate feedback (no silent actions)
- Clear, human-readable language
- Minimal noise (no spam)
- Context-aware (linked to records)
- Offline-aware
- Actionable where necessary


## 2. Notification Types

### Toast Notifications

**Purpose:** Immediate feedback

**Behavior:**
- Auto-dismiss (2–4 seconds)
- Non-blocking
- Rate-limited (max 1 per 2 seconds)

**Use Cases:**
- Expense saved
- Category created
- Report generated

### Inline Status Indicators

**Purpose:** Show record-level state

**Attached To:**
- Expense items
- Receipt uploads

**States:**
- pending
- syncing
- synced
- failed
- permanent_failure

### Banner Notifications

**Purpose:** Show global system state

**Behavior:**
- Persistent but dismissible
- Reappears if issue persists

**Use Cases:**
- Offline mode
- Sync issues
- Storage warnings

### Notification Log (Lightweight)

**Purpose:** Prevent loss of important messages

**Behavior:**
- Stores recent important notifications
- Accessible via UI (optional MVP enhancement)
- Stores:
  - message
  - type
  - reference_id
  - timestamp

### Push Notifications (Out of Scope)
- Not implemented in MVP
- Reserved for future (recurring reminders, alerts)


## 3. Core Notification Rules

### Deduplication

To prevent spam:
- Deduplicate notifications by:
  - type
  - reference_id
  - time window (e.g. 5 seconds)

- Repeat events must not trigger duplicate notifications

### Priority Handling

Priority order:
1. Errors (highest)
2. Warnings
3. Success
4. Info (lowest)

**Rules:**
- Only one high-priority notification visible at a time
- Errors override all other notifications
- Lower-priority notifications are suppressed if necessary

### Rate Limiting
- Max 1 toast every 2 seconds
- Group similar events:
  - e.g. “3 items failed to sync”

### Record Linking
All relevant notifications must include:
- `reference_id` (e.g. expense_id)
- Ability to navigate to affected item

### Actionable Notifications
When applicable, notifications must include actions:
- Retry now
- View item

### Network Stability Handling
- Debounce network changes (2–3 seconds)
- Prevent rapid offline/online flickering

## 4. Notification Triggers

### Expense Actions

#### On Save
- Toast: "Expense saved"
- Inline status = pending

#### On Sync Success
- Inline status = synced
- No toast

#### On Sync Failure
- Inline status = failed
- Toast: "Failed to sync. Retrying..."

#### On Permanent Failure
- Inline status = permanent_failure
- Banner: "Some items failed to sync"
- Include count + tap to view


### Receipt Upload

#### On Upload Start
- Inline status = uploading

#### On Upload Success
- Inline status = uploaded

#### On Upload Failure
- Inline status = failed
- Toast: "Receipt upload failed. Retrying..."

#### On Permanent Failure
- Inline status = permanent_failure
- Persistent indicator on expense

### Category / Project Actions
- Toast: "Saved successfully"

### Report Generation

#### On Success
- Toast: "Report ready"

#### On Failure
- Toast: "Failed to generate report"

#### If Data Not Fully Synced
- Warning banner before generation

### Sync System

#### Offline Mode
- Banner: "You're offline. Changes will sync when online"

#### Sync In Progress
- Subtle indicator (no toast spam)

#### Partial Sync Failure
- Banner: "X items failed to sync"
- Tap → view failed items

#### Full Sync Success
- Toast: "All changes synced"
- ONLY when all records = synced

### Recurring Expenses

#### On Due Reminder
- In-app notification:
  "Recurring expense due today"

#### On Auto-Save
- Toast: "Recurring expense added"

### Storage Limit

#### At 80% Usage
- Banner: "Storage almost full"
#### At Limit Reached
- Banner: "Storage limit reached. Uploads blocked"


## 5. Visual & UX Rules

### Status Differentiation
- pending → subtle indicator
- syncing → animated indicator
- failed → warning icon + color
- permanent_failure → strong alert + icon

### Accessibility
- Do NOT rely on color alone
- Use:
  - icons
  - labels
  - text

### Banner Behavior
- Dismissible
- Reappears if issue persists
- Does not block core actions

### Notification Suppression
- Repeated success messages suppressed
- Batch actions grouped into one message

Example:
- Instead of 5 toasts → "5 expenses saved"


## 6. Notification Lifecycle

Each notification must:
1. Trigger on event  
2. Pass deduplication check  
3. Respect priority rules  
4. Display  
5. Auto-dismiss (if toast)  
6. Persist if needed (banner/inline)  
7. Update when state changes  


## 7. System Integration

Connected Components:
- Expense Component → triggers save notifications
- IndexedDB Manager → local state
- Sync Queue → pending state
- Sync Processor → success/failure updates
- Retry Manager → retry logic
- Conflict Resolver → conflict alerts (if needed)
- Storage Service → receipt upload notifications
- Background Task Processor → recurring + retry alerts


## 8. Summary
This notification system ensures:
- No duplicate or spam notifications
- Clear visibility into sync state
- Actionable error handling
- Strong user trust
- Validation errors 
- Smooth offline-to-online transitions

All notifications must strictly follow defined rules, triggers, and behaviors.

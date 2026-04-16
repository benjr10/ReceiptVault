# ReceiptVault — Loading States

# ReceiptVault — Loading States,

## 1. Purpose

This document defines all loading states, error handling, and risk mitigation strategies.

Goals:
- No data loss
- No silent failures
- Deterministic system behavior
- Full offline reliability
- AI-executable logic


## 2. State Model
All operations must use:

- idle
- loading
- success
- failed
- pending_sync
- syncing
- synced


## 3. Global Rules

### 3.1 Immediate Feedback

ON any user action:
- UI must update within 100ms


### 3.2 Local-First Execution

ALL write operations:

1. Save locally (IndexedDB)
2. Assign UUID (client-generated)
3. Mark as pending_sync
4. Add to sync queue


### 3.3 No Silent Operations

IF any async process runs:
- show visible indicator OR
- show global system status


### 3.4 No Infinite Loading

IF loading exceeds expected time:
- transition to failed
- show retry option


### 3.5 Retry Logic

FOR any failed operation:

- retry_count += 1

IF retry_count <= 3:
  wait (2^retry_count) seconds
  retry

ELSE:
  mark as failed
  expose manual retry


### 3.6 Idempotency (CRITICAL)

ALL backend writes must include:

- client_generated_id

Server must:

- reject duplicates
- return existing record if already processed


## 4. Expense Save Flow

### Execution

ON Save:

1. Validate input
2. Generate UUID
3. Save to IndexedDB
4. Set sync_status = pending_sync
5. Show success immediately
6. Add to sync queue


### Sync Logic

ON network stable:

FOR each item in queue (FIFO):

- send to backend

IF success:
  mark as synced

IF failure:
  apply retry logic


### UI States

- pending_sync → clock
- syncing → spinner
- synced → checkmark
- failed → retry


### Risk Handling

- App crash → data persists in IndexedDB
- Duplicate → prevented via UUID
- Unsynced → remains visible
- Failure → always shown


## 5. Receipt Upload

### Execution

ON image selected:

1. Compress image
2. IF compression fails → use original
3. Save locally
4. Queue upload


### Upload Logic

- Upload AFTER expense is synced
- Never upload before parent exists


### UI

- uploading → spinner overlay
- success → image visible
- failed → retry button


### Risk Handling

- Upload interruption → retry
- Storage full → block upload
- Broken link → reattach after retry
- Partial failure → tracked separately


## 6. Dependency Enforcement (CRITICAL)

RULE:

- Child operations MUST NOT execute before parent

Example:

- Expense must sync BEFORE receipt upload

IF parent not synced:
- block child operation


## 7. Queue System Protection

### FIFO with Skip Logic

FOR each queue item:

IF item fails 3 times:
- mark as failed
- SKIP
- continue queue


### Prevent Queue Blocking

- One failed item must NOT stop queue


### Queue Recovery

ON app restart:
- reload queue
- resume all pending items


## 8. Race Condition Handling

IF local update and server update conflict:

- compare timestamps
IF local > server:
  keep local

ELSE:
  accept server


## 9. Out-of-Order Sync Protection
Each operation must include:
- dependency_id
- operation_type

SYSTEM MUST:
- enforce correct order
- reject invalid sequence


## 10. Network Stability Handling

### Prevent Network Flapping

ON network reconnect:
- wait 3–5 seconds stable connection
- THEN start sync


## 11. Dashboard Loading

### Flow
1. Load local data
2. Render immediately
3. Sync in background
4. Update UI silently


### Rules
- NEVER wait for backend
- NEVER show blank screen


### Risk Handling
- Stale data → refresh after sync
- Flicker → partial updates only


## 12. Report Generation

### Flow
1. User triggers
2. Start async processing
3. Generate PDF
4. Return file


### Rules
- Only allowed blocking process

### Risk Handling

- Long process → loader
- Failure → retry
- Empty data → show empty state


## 13. App Startup

### Flow
1. Load IndexedDB
2. Render UI
3. Resume queue
4. Attempt sync


### Risk Handling
- Crash recovery → resume all
- No data → empty state
- Offline → skip sync


## 14. Offline Mode

IF offline:
- allow all writes
- disable sync
- queue operations


### UI
- persistent banner: “Offline mode”


### Risk Handling
- Data confusion → clear indicator
- Conflict → resolve on sync


## 15. Sync Engine

### Execution
ON stable network:

FOR queue:
- process FIFO
- enforce dependencies
- update states


### Conflict Resolution
- server is source of truth
- local reconciles after response


## 16. Storage Failure Handling
IF IndexedDB write fails:
- show blocking error
- prevent operation
- do NOT proceed


## 17. App Crash / Kill Recovery

ON app restart:
- reload local DB
- reload queue
- resume pending operations


## 18. Duplicate Prevention

ALL operations must:
- include UUID
- be idempotent

Server must:
- detect duplicate requests
- return existing record


## 19. Data Reconciliation

ON sync complete:
- fetch latest server data
- merge with local state
- update UI


## 20. File Upload Integrity

IF upload interrupted:
- retry from start OR resume

IF corrupted:
- discard and retry


## 21. Performance Protection
- limit queue size
- enforce image compression
- avoid large dataset loads


## 22. Error Types (Explicit)

All errors must be categorized:
- validation_error
- network_error
- storage_error
- server_error
- sync_error


## 23. User Interaction Protection
- prevent multiple rapid clicks
- debounce actions
- disable critical buttons during processing


## 24. Global Error Visibility
SYSTEM MUST:
- track all failed operations
- show summary: “X items failed to sync”
- allow user retry


## 25. Time Consistency
- prefer server timestamps
- fallback to client if offline


## 26. Final Guarantees
The system guarantees:
- No data loss
- No duplicate corruption
- No silent failure
- No blocked queue
- No undefined state

All operations must be:
- visible
- recoverable
- deterministic

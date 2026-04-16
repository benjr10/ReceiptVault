# ReceiptVault — Error States Specification 

## 1. Purpose

This document defines all error states, classification, prioritization, and recovery logic.

Goals:

- No silent failures
- No incorrect error messages
- No overwhelming error display
- Every error is understandable and actionable
- System remains stable under all failure conditions


## 2. Core Principles

### 2.1 Accurate Error Classification

Errors MUST reflect the real cause.

System must NOT:

- show server error when offline
- show empty state when error exists


### 2.2 Single Source of Truth (Error Priority)

Only ONE primary error should be visible at a time.

Priority order:

1. authentication_error
2. storage_error
3. network_error
4. server_error
5. sync_error
6. validation_error


### 2.3 No Silent Failures

ALL errors must:

- be logged
- be visible (if user-impacting)
- trigger recovery flow


### 2.4 Human-Readable Messaging

Errors must avoid technical language.

Example:
"We couldn’t save your changes. Check your internet and try again."


### 2.5 Controlled Visibility

Errors must NOT:

- stack infinitely
- repeat aggressively
- interrupt unnecessarily


## 3. Global Error Handling Logic

ON error_detected:

- classify_error()
- IF multiple_errors → select highest priority
- log_error()
- display_error()
- attach recovery_action()


## 4. Error Types

- validation_error
- network_error
- storage_error
- server_error
- sync_error
- authentication_error
- permission_error


## 5. Validation Errors

- Inline only
- Highlight field
- Show clear correction message
- Block only invalid input


## 6. Network Errors

### Detection

- navigator.offline == true
- request timeout

### UI

- "You're offline. We'll save your changes locally."

### Behavior

- Switch to offline mode
- Queue operations

### Rule

- Retry only after stable connection (3–5 seconds)


## 7. Storage Errors

### Condition

- IndexedDB failure
- storage full

### UI (Blocking)

- "Your device storage is full or unavailable"

### Behavior

- Block action
- Prevent data loss


## 8. Server Errors

### Condition

- backend failure

### UI

- "We’re having trouble on our side. Please try again."

### Behavior

- Non-blocking
- Retry allowed


## 9. Sync Errors

### UI

- Item-level indicator
- Global message: "Some items couldn’t be synced"

### Behavior

- Retry max 3 times
- Then mark as failed
- Allow manual retry

### Rule

- Do not repeat same error endlessly


## 10. Authentication Errors

### UI

- "Your session expired. Please log in again."

### Behavior

- Redirect to login
- Preserve local data


## 11. Permission Errors

### UI

- "Permission needed to complete this action"

### Behavior

- Prompt once
- If denied → guide to settings

### Rule

- No repeated prompts


## 12. File Upload Errors

### UI

- "Upload failed" on image
- Retry button

### Behavior

- Keep local copy
- Allow retry


## 13. Conflict Resolution

IF server_timestamp exists:
- use server_timestamp

ELSE:
- use client_timestamp

### Rule

- Log all conflicts
- No silent overwrite


## 14. Retry Protection System

- Max retries: 3
- Exponential backoff

### Anti-Spam

- Debounce rapid retry clicks

### Stability Rule

- Do not retry on unstable network


## 15. Error Visibility Timing

- Minimum display: 2 seconds
- Stay until resolved or dismissed


## 16. Error Aggregation

### Summary

- "X items need attention"

### Rule

- Allow user to view details
- Summary must not hide specific errors


## 17. Offline Awareness

IF offline:

- suppress server errors
- show network/offline state only


## 18. Background Error Protection

- Background failures MUST appear in UI

Example:
- Failed sync → visible badge


## 19. App Restart Recovery

ON restart:

- reload failed operations
- re-display unresolved errors


## 20. User Interaction Protection

- Disable repeated clicks
- Prevent duplicate submissions
- Debounce critical actions


## 21. Messaging Rules

Every error must answer:

1. What went wrong?
2. Why it happened?
3. What should I do next?


## 22. Accessibility

- All errors must include text
- Screen-reader readable
- Color not sole indicator


## 23. Forbidden Patterns

- Silent failures
- Vague messages
- Infinite retry loops
- Multiple error popups
- Disappearing errors
- Retry spam


## 24. Global Risk Coverage

- Wrong error type → fixed by classification
- Too many errors → fixed by priority system
- Retry abuse → fixed by debounce + limits
- Offline confusion → fixed by offline rules
- Hidden failures → fixed by forced visibility


## 25. Final Guarantee

The system guarantees:

- Only relevant errors are shown
- Errors are understandable
- Errors are actionable
- No user is overwhelmed
- No failure is hidden

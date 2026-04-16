# ReceiptVault — AI Builder Instruction File

## 1. Product Overview

ReceiptVault is a mobile-first expense tracking application for freelancers, sole traders, and small business owners.

The product enables users to:
- Log expenses in under 10 seconds
- Capture and store receipt images
- Categorize and organize spending
- View insights via a dashboard
- Generate tax-ready reports (PDF/CSV)

Core promise:
"Snap. Tag. Report. Done."

The system must prioritize speed, reliability, and data safety over feature expansion.

## 2. Target Users

- Freelancers
- Sole traders
- Small business owners (1–5 people)

User characteristics:
- Mobile-first usage
- Limited accounting knowledge
- Inconsistent internet access
- Low tolerance for complexity

## 3. Core Principles (NON-NEGOTIABLE)

### Speed First
- Expense entry <10 seconds
- Save must never be blocked

### Simplicity
- No accounting jargon
- No setup required before first use
- Optional fields always skippable

### Reliability
- Data must never be lost
- Every action must confirm success or failure

### Offline Capability
- Users can log expenses without internet
- Sync must be safe and recoverable

## 4. MVP Scope

### MUST BUILD
- Authentication (Email + OAuth)
- Quick expense entry
- Receipt photo capture
- Category system
- Dashboard
- PDF report generation
- Offline mode with sync
- Error + empty states

### SHOULD BUILD
- Project/client tagging
- Search and filters
- CSV export

### EXCLUDED
- Bank integrations
- AI receipt scanning
- Multi-currency
- Team accounts
- Invoice features

## 5. System Architecture

### Frontend
- Mobile-first PWA
- Uses IndexedDB for local persistence (not temporary storage)
- Handles offline queue and UI

### Backend (Supabase)
- Auth (Supabase Auth)
- Database (PostgreSQL)
- Storage (receipt images)
- Edge Functions (background processing)

### Fallback Strategy
- If background sync is unavailable, sync resumes when user reopens app
- All critical operations must work without background execution

## 6. Data Model

### Users
- id
- name
- email

### Expenses
- id (UUID generated client-side)
- user_id
- amount
- category_id
- project_id (optional)
- note
- date
- receipt_url
- sync_status (pending, synced, failed)
- created_at

### Categories
- id
- user_id (nullable)
- name

### Projects
- id
- user_id
- name

## 7. Offline & Sync System
### Persistence
- All offline data stored in IndexedDB (persistent)
- Data must survive app refresh and device restart

### Sync Queue
- FIFO queue
- Each item has retry_count and status

### Sync Rules
1. Save locally first (always)
2. Attempt sync when online
3. Upload expense data before image
4. Update sync_status after completion

### Reliability
- Max retry: 3 attempts with exponential backoff
- Failed items remain visible and retryable by user
- Sync resumes automatically when app reopens

### Data Safety
- No deletion allowed until confirmed synced
- Local data acts as temporary backup until sync completes


## 8. Receipt Image Handling
- Compress images to balance clarity and size (~0.5–1MB)
- Fallback to original format if compression fails
- Upload runs in background but must be resumable

### UX
- Show upload status (uploading, failed, complete)
- Allow manual retry

### Storage Rules
- Warn user at 80% usage
- Block uploads at limit with clear guidance

## 9. Background Processing
- Use Edge Functions where supported
- If unavailable, tasks execute on app open

### Tasks
- Retry failed syncs
- Storage usage checks
- Recurring expense generation (if enabled)

## 10. Notification System
### System Notifications
- Sync completed
- Sync failed
- Storage warning

### Engagement (Minimal)
- Weekly summary of spending

Notifications must be:
- Non-intrusive
- Optional where platform restricts delivery


## 11. Core User Flows
### First-Time User
- Sign up → Add Expense screen
- No onboarding steps

### Add Expense
- Enter amount
- Select category
- Optional fields
- Save → instant confirmation

Target: <10 seconds

### Report Generation
- Select date range
- Generate → Download

Target: ≤3 taps

## 12. Performance Requirements

- Dashboard load <2 seconds
- Expense save <1 second
- Image upload <5 seconds (non-blocking)
- Sync completion <30 seconds after reconnect

---

## 13. Error Handling

Every error must:
- Be visible
- Explain the issue
- Offer recovery action

All background failures must surface in UI (no hidden failures)


## 14. Analytics
Use one tool only (e.g. PostHog)
Track:
- First expense logged
- Time to first action
- Daily/weekly usage
- Report generation
- Sync failures


## 15. Security
- Row Level Security enforced
- Signed URLs for file access
- Input validation on all fields
- Basic rate limiting on critical actions (auth, uploads)

## 16. Storage & Cost Control

- Max 1GB per user
- Image compression enforced
- Optional future upgrade path


## 17. Versioning

- Maintain backward-compatible schema updates
- Add new fields without breaking existing data
- Use migration scripts for changes


## 18. Retention Strategy

- Immediate value: first expense <60 seconds
- Dashboard shows instant insights
- Weekly summary reinforces usage

No aggressive notifications or gamification in MVP


## 19. Data Recovery

- Synced data stored securely in backend
- Unsynced data persists locally until confirmed synced
- Users can retry failed items manually



## 20. Success Metrics

- 80% of expenses logged <10 seconds
- First expense within 60 seconds
- Sync success rate ≥99%
- Report generation ≤3 taps
- 7-day retention ≥40%


## 21. Product Philosophy
ReceiptVault is not trying to be powerful.

It is trying to be used.
If a feature adds friction, remove it.
If a system adds risk, simplify it.

Every decision must support:
Snap → Tag → Report → Done


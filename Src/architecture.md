# ReceiptVault — System Architecture

## 1. Overview
This document defines the high-level architecture of ReceiptVault.

The system is designed to:
- Support mobile-first usage
- Enable reliable offline-first operation
- Ensure consistent data synchronization
- Maintain scalability and simplicity

The architecture follows a local-first, cloud-synced model with a single source of truth in the backend.

## 2. Architectural Style
ReceiptVault uses a Client-Centric Architecture with structured backend services.

### Key Characteristics:
- Local-first interaction model
- Backend as the authoritative data source
- Asynchronous, queue-based synchronization
- Clearly defined layer boundaries
- Stateless backend services


## 3. High-Level Components
The system is composed of five structured layers:
1. Client Layer (Frontend - PWA)
2. Local Data Layer (IndexedDB)
3. Sync & Processing Layer
4. API Layer (Gateway)
5. Backend Services Layer (Supabase)

## 4. Architecture Diagram (Logical)

```
+----------------------+
|      User Device     |
|   (Mobile Browser)   |
+----------+-----------+
           |
           v
+----------------------+
|   Frontend (PWA)     |
| - UI Components      |
| - State Management   |
| - Validation Logic   |
+----------+-----------+
           |
           v
+----------------------+
|   Local Data Layer   |
|   (IndexedDB)        |
| - Persistent Storage |
| - Offline Support    |
+----------+-----------+
           |
           v
+----------------------+
| Sync & Processing    |
| - Queue System       |
| - Retry Logic        |
| - Conflict Handling  |
+----------+-----------+
           |
           v
+----------------------+
|      API Layer       |
|  (Request Gateway)   |
| - Validation         |
| - Rate Limiting      |
| - Request Handling   |
+----------+-----------+
           |
           v
+----------------------+
|  Backend Services    |
|  (Supabase)          |
| - Auth               |
| - Database           |
| - Storage            |
| - Edge Functions     |
+----------------------+
```

## 5. Component Responsibilities

### Client Layer (PWA)
- Handles user interaction and UI rendering
- Performs input validation before processing
- Displays real-time feedback to users
- Operates independently of network availability

### Local Data Layer
- Stores all user actions immediately
- Maintains persistent data across sessions
- Acts as temporary working state before synchronization

### Sync & Processing Layer
- Maintains a queue of all pending operations
- Processes operations sequentially (FIFO)
- Ensures operations are idempotent

#### Conflict Handling Strategy:
- Latest update (based on timestamp) takes precedence
- Server response always resolves final state
- Conflicts are automatically reconciled without duplication

### API Layer (Gateway)
- Serves as the only entry point to backend services
- Validates all incoming requests
- Enforces rate limiting and security checks
- Ensures consistent request structure

### Backend Services Layer

#### Authentication
- Manages user identity and sessions

#### Database
- Stores structured, validated data
- Acts as the single source of truth

#### Storage
- Stores receipt images
- Ensures secure and controlled access

#### Edge Functions
- Handles background processing tasks
- Executes retry and maintenance operations


## 6. Data Ownership & Consistency

- Backend database is the **single source of truth**
- Local data is considered **temporary and sync-dependent**
- Data is only considered final after backend confirmation

## 7. Data Flow Architecture

### 7.1 Write Flow (Expense Creation)

```
User Action
   ↓
Frontend Validation
   ↓
Save to Local Storage
   ↓
Add to Sync Queue
   ↓
Process via API Layer
   ↓
Backend Validation
   ↓
Database Commit (Source of Truth)
   ↓
Acknowledgement to Client
```

### 7.2 Image Handling Flow
```
Capture Image
   ↓
Compress Image
   ↓
Temporary Local Storage
   ↓
Upload via API Layer
   ↓
Store in Cloud Storage
   ↓
Confirm Upload
   ↓
Attach to Expense Record
```

### 7.3 Read Flow
```
User Request
   ↓
Load from Local Data (fast access)
   ↓
Sync with Backend Data
   ↓
Merge and Display Updated State
```

## 8. Communication Model
- All client-server communication occurs via HTTPS APIs
- API Layer standardizes all interactions
- Sync operations are asynchronous and resumable


## 9. Failure Handling Strategy
- Each layer handles failures independently
- Failed operations remain in sync queue until resolved
- Partial operations are safely resumed
- User is informed of recoverable errors


## 10. Performance Architecture
- Local-first operations ensure instant response
- Backend processing is asynchronous
- Data queries are indexed and optimized
- Dashboard uses limited data window for efficiency


## 11. Security Architecture
- All requests require authentication
- Row Level Security (RLS) enforced at database level
- API Layer enforces validation and rate limiting
- Storage access controlled via signed URLs


## 12. Scalability Design
- Stateless backend allows horizontal scaling
- User data is isolated per account
- Storage scales independently of compute
- API layer ensures consistent growth handling


## 13. Platform Constraints Handling
- Designed for low-end mobile devices
- Operates under unstable network conditions
- Does not depend on background execution guarantees
- Sync resumes on user interaction


## 14. Versioning & Evolution
- API versioning ensures backward compatibility
- Database changes are additive
- System supports safe incremental updates


## 15. Architecture Principles
- Backend is the source of truth
- Local-first for speed and usability
- Clear separation of responsibilities
- Fail-safe and recoverable operations
- Simplicity over complexity


## 16. Summary
The ReceiptVault architecture ensures:
- Reliable offline-first operation
- Consistent and safe data synchronization
- Clear system boundaries and responsibilities
- Scalable and maintainable structure

All architectural decisions support:
Reliability → Simplicity → Performance → Scalability

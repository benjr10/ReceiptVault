# ReceiptVault — Component Design

## 1. Overview

This document defines all system components for ReceiptVault in a structured, AI-ready format.

Design Principles:
- Local-first (instant user feedback)
- Sync-driven (eventual consistency with backend)
- Simple, fast, reliable (MVP aligned)

Key Rules:
- Local writes happen instantly
- Remote sync happens asynchronously
- Backend is the final source of truth after sync

## 2. Global Data Rules

### ID Strategy
- All records use UUID (generated on device)
- Ensures offline-safe creation

### Record State Fields (ALL entities)
Each record must include:

- id: UUID
- user_id: UUID
- created_at: timestamp
- updated_at: timestamp
- sync_status: pending | synced | failed
- is_deleted: boolean
- deleted_at: timestamp (nullable)

### Receipt Fields (Expense only)

- receipt_url: string (nullable)
- receipt_status: pending | uploaded | failed

## Frontend Components

### App Shell
**Purpose:**
Initialize application and manage navigation.

**Inputs:**
- User session
- Route state

**Outputs:**
- Loaded views

**Actions:**
- Initialize global state
- Detect network status (online/offline)
- Route between pages
- Load core modules

**Dependencies:**
- Auth Service
- State Manager

### State Manager
**Purpose:**
Manage global application state.

**Inputs:**
- UI events
- data updates

**Outputs:**
- updated UI state

**Actions:**
- Store global state (user, sync status, network state)
- Provide reactive updates to UI

### Expense Component
**Purpose:**
Capture and submit expense data instantly.

**Inputs:**
- amount
- category_id
- project_id (optional)
- note (optional)
- expense_date

**Outputs:**
- locally stored expense
**Actions:**
1. Validate required fields
2. Generate UUID
3. Save instantly to IndexedDB
4. Set sync_status = pending
5. Add operation to Sync Queue

**Dependencies:**
- IndexedDB Manager
- Sync Queue Manager

### Dashboard Component
**Purpose:**
Display summarized expense data.

**Inputs:**
- local expense data
- sync status summary

**Outputs:**
- aggregated metrics
- chart data

**Actions:**
- Filter last 30-day data
- Compute totals
- Display sync state (e.g. syncing, offline)

**Dependencies:**
- Local Data Layer
- State Manager

### Report Component

**Purpose:**
Generate downloadable reports.

**Inputs:**
- filtered expense data

**Outputs:**
- PDF file
- CSV file

**Actions:**
- Format data
- Generate file
- Trigger download

**Dependencies:**
- Data Formatter Utility

### Feedback Component

**Purpose:**
Provide user feedback.

**Inputs:**
- operation status
- record sync status

**Outputs:**
- notifications

**Actions:**
- Show success/error messages
- Show per-record sync state
- Show offline/online indicators

## Local Data Components

### IndexedDB Manager

**Purpose:**
Primary local database (instant writes).

**Inputs:**
- create/update/delete requests

**Outputs:**
- stored records

**Actions:**
- Insert records instantly
- Update records
- Soft delete records (is_deleted = true)
- Retrieve records


### Local Cache Handler

**Purpose:**
Optimize reads.

**Inputs:**
- query requests

**Outputs:**
- cached results

**Actions:**
- Cache recent queries
- Invalidate cache after sync

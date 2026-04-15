# System Architecture – ReceiptVault

## 1. Overview

ReceiptVault is a mobile-first web application designed to help small business owners and freelancers quickly log, track, and report expenses.

The system is built with a focus on:
- Speed (expense logging under 10 seconds)
- Simplicity (minimal steps and clean interactions)
- Reliability (clear feedback and secure data storage)

---

## 2. High-Level Architecture

The system follows a simple client–backend architecture powered by Supabase services.

### Architecture Flow:

User → Frontend → Authentication → Database / Storage → Report Engine → Output (PDF)

---

## 3. System Components

### 3.1 Frontend (UI Layer)
- Mobile-first web interface
- Handles all user interactions:
  - Add expense
  - View dashboard
  - Generate reports
- Sends and receives data from backend services

---

### 3.2 Authentication Layer
- Managed using Supabase Auth
- Handles:
  - User signup and login
  - Session management
  - Secure access to user-specific data

---

### 3.3 Database Layer
- Powered by Supabase Database
- Stores structured data:
  - Users
  - Expenses
  - Categories
  - Projects/Clients

---

### 3.4 Storage Layer
- Powered by Supabase Storage
- Stores receipt images
- Each image is linked to a specific expense
- Uploads happen in the background

---

### 3.5 Report Engine
- Powered by jsPDF
- Generates downloadable PDF reports
- Uses filtered expense data
- Runs client-side (no server processing required)

---

### 3.6 Hosting
- Deployed using Vercel
- Ensures fast and reliable access

---

## 4. Data Flow

### 4.1 Expense Creation Flow
1. User inputs expense details on frontend
2. Frontend validates input
3. Data is sent to Supabase Database
4. Optional receipt image is uploaded to Storage
5. System returns success confirmation

---

### 4.2 Dashboard Flow
1. Frontend requests expense data (last 30 days)
2. Backend returns data
3. Frontend processes and displays:
   - Total spend
   - Category breakdown
   - Daily trends

---

### 4.3 Report Generation Flow
1. User selects date range
2. Frontend fetches filtered data
3. Data is passed to jsPDF
4. PDF is generated and downloaded

---

## 5. Key Architectural Decisions

- Mobile-first web app (not native)
- Supabase used for backend to reduce complexity
- Client-side PDF generation for speed
- Simple modular structure to support fast development

---

## 6. Non-Functional Considerations

### Performance
- Expense save: < 1 second
- Dashboard load: < 2 seconds

### Offline Support
- Expenses can be logged offline
- Data syncs automatically when connection is restored

### Security
- User data is isolated per account
- Authentication required for all actions
- Secure storage of files and data

---

## 7. Summary

The system architecture is designed to be simple, scalable, and efficient, enabling fast development through AI-assisted (vibe coding) workflows while maintaining a clear separation of responsibilities across system components.

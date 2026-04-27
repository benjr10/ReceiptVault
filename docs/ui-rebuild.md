

## ⚠️ EXECUTION INSTRUCTIONS (READ FIRST)

You MUST follow this document step-by-step.

This is NOT documentation — this is the **source of truth** for rebuilding the UI.

Do NOT:
- summarize
- skip sections
- reinterpret instructions

You MUST:
- Read this entire file
- Then implement everything exactly as specified

Failure to follow instructions exactly is not acceptable.

---

# 🧩 PROJECT CONTEXT

You are working inside an **EXISTING Next.js App Router project**.

Your task is to **rebuild the ENTIRE frontend UI** to EXACTLY match the provided UI reference screens.

---

# 🔥 PRIMARY RULE (NO EXCEPTIONS)

The UI must match the screenshots in:

→ `/assets/ui-rebuild`

Pixel-for-pixel.

### ❌ DO NOT:
- redesign
- simplify
- skip sections
- invent layouts

---

# 📁 ASSET USAGE (VERY IMPORTANT)

### UI Reference (READ ONLY)
- `/assets/ui-rebuild`
- These are `.jpg` screenshots
- Used ONLY for visual reference

### Implementation Assets (USE THESE)
- `/assets`
- Icons
- Illustrations
- Images

---

# ⚙️ PROJECT RULES

### Framework
- Next.js (App Router)

### Work ONLY inside:
- `src/app`
- `src/components`

### ❌ DO NOT:
- change backend logic
- modify Supabase integration
- introduce plain HTML structure
- restructure project

---

# 🎨 DESIGN SYSTEM (STRICT)

- MUST use: `design-tokens.css`
- NO hardcoded colors

### Must strictly match:
- spacing
- border radius
- shadows
- typography

Everything must visually match the screenshots.

---

# 📱 SCREENS TO BUILD (COMPLETE)

---

## 1️⃣ SPLASH SCREEN

- Full teal background
- Centered logo
- No extra elements

---

## 2️⃣ ONBOARDING (3 SCREENS)

Each screen includes:

- Illustration (from `/assets`)
- Title
- Subtitle
- Pagination dots (3 total)
- "Skip" (top right)

### Buttons:
- Screen 1 & 2 → **Next**
- Screen 3 → **Get Started**

### Flow:
Next → Next → Get Started → Login

---

## 3️⃣ LOGIN SCREEN

- Logo + app name
- "Welcome Back"
- Email input
- Password input (with visibility toggle)
- "Forgot password"
- Sign In button
- Divider: "or continue with"
- Google button
- Bottom: "Create one"

⚠️ Register must be **modal/overlay (NOT separate page)**

---

## 4️⃣ DASHBOARD (HOME)

### Header:
- Greeting
- User name
- Notification icon

### Filter:
- Rolling period dropdown

### Main Card:
- Total expenses
- Amount (₦)
- % change
- Avg/day

### Category Card:
- Top spending category
- Progress bar

### Charts:
- Donut chart (category)
- Bar chart (daily)

### Recent Section:
- Expense list
- "See all"

### Bottom Navigation:
- Home
- Expenses
- Floating "+" button
- Reports
- Profile

---

## 5️⃣ EXPENSES LIST

- Offline banner
- Title: "All Expenses"

### Filters:
- Time chips
- Category chips
- Project chips

### Content:
- Total card
- Expense items:
  - Icon
  - Title
  - Category + date
  - Amount
  - Status indicator

---

## 6️⃣ ADD EXPENSE (MODAL)

Must be **bottom sheet modal**

### Fields:
- Title
- Amount (₦)
- Category (grid with icons)
- Project (optional)
- Note (optional, char count)
- Receipt upload box

### Category:
- Grid layout
- Selected state
- Includes "Custom"

### Button:
- Save Expense

---

## 7️⃣ REPORTS SCREEN

### Top:
- Back button
- Title: Reports

### Filter:
- 7 Days / 30 Days / 90 Days toggle

### Main Card:
- Total spending
- Avg/day
- Number of expenses

### Category Breakdown:
- Label
- Amount
- Colored progress bar

### Chart:
- Daily spending chart

### Bottom Navigation:
(Same as dashboard)

---

## 8️⃣ PROFILE SCREEN

### Top:
- Back button
- Notification icon

### Profile Card:
- Avatar (initials)
- Name
- Email

### Options:
- Recurring Expense
- Default Currency
- Categories
- Storage Used (progress bar)
- Change Password
- Logout
- Terms & Privacy

---

## 9️⃣ SETTINGS SCREEN

### Section: Preferences

#### Recurring Expense:
- None / Weekly / Bi-weekly / Monthly / Quarterly / Yearly
- Selected state highlighted

#### Default Currency:
- USD / EUR / GBP / NGN / KES / GHS / ZAR
- Selected highlighted

### Footer:
"Changes are saved automatically..."

---

## 🔟 NOTIFICATIONS SCREEN

### Top:
- Back button
- "Mark all read"

### List Items:
- Icon
- Title
- Description
- Date
- Unread indicator (dot)

---

## 1️⃣1️⃣ CATEGORIES SCREEN

### Top:
- Back button
- "+" button

### Add Form:
- Input: category name
- Buttons: Add / Cancel

### List:
- Category items
- Label: "Default" (for system categories)

### Footer:
Default categories cannot be deleted

---

# 🧠 BEHAVIOR RULES

- Navigation must work across all screens
- Bottom navigation must be persistent
- Modals must open/close smoothly
- Buttons must have pressed/active states
- Forms must validate properly
- Offline banner must display when needed

---

# 🚫 STRICTLY FORBIDDEN

- No UI redesign
- No missing sections
- No placeholder UI
- No fake assets
- No deviation from screenshots

---

# 🎯 FINAL GOAL

Rebuild the ENTIRE UI exactly as shown in:

→ `/assets/ui-rebuild`

Using real assets from:

→ `/assets`

### Requirements:
- Mobile-first
- Pixel-accurate
- Fully functional navigation
- Demo-ready

---

# ✅ DEFINITION OF DONE

The implementation is ONLY complete if:

- All 11 screens are built
- UI matches screenshots exactly
- Navigation works across all screens
- No placeholder UI exists
- Mobile layout is perfect

If any of these are not met, the task is incomplete.
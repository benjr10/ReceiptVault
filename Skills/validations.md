# ReceiptVault – Validations

## 1. Overview
Define all input validation rules for expense entry and form interactions.

## 2. Principles
- Real-time validation
- Inline error messages
- Clear and specific feedback

## 3. Field Validations

### Amount
- Must be numeric
- Reject non-numeric input
- Show inline error immediately

### Category
- Required field
- Cannot save without selection

### Note
- Optional
- No validation required

## 4. Save Rules
- Prevent save if:
  - Required fields are missing
  - Amount is invalid

## 5. Error Handling
- All errors must:
  - Be visible immediately
  - Clearly explain the issue

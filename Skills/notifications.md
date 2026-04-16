# ReceiptVault – Notifications

## 1. Overview
Define all system-triggered user feedback to ensure no silent states.

## 2. Principles
- All actions must produce visible feedback
- No silent success or failure
- Messages must be clear and immediate

## 3. Notification Types

### Success
- Trigger: Expense saved successfully
- Immediate visual confirmation (toast or checkmark)

### Error
- Trigger:
  - Validation failure
  - Photo upload failure
  - Any system failure
- Clear explanation of failure
- Retry option where applicable

### Loading
- Trigger:
  - Photo upload
  - Save action
- Visible progress indicator

### Recurring Expense
- Trigger: Recurring expense is due
- Notify user in-app
- Wait for confirmation if required

## 4. Global Rule
- User must always know:
  - What is happening
  - What succeeded
  - What failed

# ReceiptVault — API Handlers

## 1. Overview
This document defines all API handlers with strict execution rules.

All handlers must:
- Be idempotent
- Validate all inputs
- Enforce ownership and data integrity
- Return structured responses
- Handle partial failures safely


## 2. Global Rules
- All endpoints require valid authentication token
- All operations must include `id` and `updated_at`
- Backend always resolves final state
- All timestamps must be in ISO 8601 (UTC)
- Maximum request size and field limits must be enforced


## 3. Standard Response Format

### Success
```json
{
  "status": "success",
  "code": "SUCCESS",
  "data": {},
  "message": "Operation successful"
}
```

### Error
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Readable message"
}
```

## 4. Constraints & Limits
- Max note length: 500 characters  
- Max image size: 2MB (after compression)  
- Pagination default: 20 items  
- Pagination max: 100 items  
- Rate limit: 60 requests/minute per user  


## 5. Expense Handlers

### Create / Upsert Expense
**Endpoint:**  
POST /expenses

**Input:**
```json
{
  "id": "uuid",
  "amount": 2000,
  "category_id": "uuid",
  "project_id": "uuid (optional)",
  "note": "string",
  "expense_date": "ISO8601",
  "updated_at": "ISO8601"
}
```

**Actions:**
1. Validate authentication  
2. Validate:
   - amount > 0  
   - note length ≤ 500  
   - expense_date format  
3. Verify category and project belong to user  

4. Check if record exists:
   - If NOT exists → insert record  
   - If exists:
     - Compare `updated_at`
     - If incoming is newer → update record  
     - If older → ignore (return existing record)

5. Return final stored record  


### Get Expenses (Paginated)

**Endpoint:**  
GET /expenses

**Query Params:**
- page (default: 1)
- limit (max: 100)
- start_date (optional)
- end_date (optional)
- category_id (optional)

**Actions:**
1. Validate authentication  
2. Validate query params:
   - limit ≤ 100  
   - valid date range  
3. Fetch user-owned expenses  
4. Exclude deleted records  
5. Apply filters  
6. Apply pagination  
7. Return paginated result  

### Delete Expense (Idempotent)
**Endpoint:**  
DELETE /expenses/{id}

**Actions:**
1. Validate authentication  
2. Verify ownership  
3. Check if already deleted:
   - If yes → return success  
4. Set `deleted_at`  
5. Return success  

## 6. Receipt Handlers

### Upload Receipt (Atomic)
**Endpoint:**  
POST /receipts/upload
**Actions:**
1. Validate authentication  
2. Verify expense ownership  
3. Validate file:
   - image type only  
   - size ≤ 2MB  
4. Upload file to temporary storage  
5. If upload succeeds:
   - Update expense with receipt_url  
   - Move file to permanent storage  
6. If any step fails:
   - Delete temporary file  
7. Return signed URL  

### Get Receipt
**Endpoint:**  
GET /receipts/{expense_id}
**Actions:**
1. Validate authentication  
2. Verify ownership  
3. Retrieve receipt_url  
4. Generate signed URL (time-limited)  
5. Return URL  

## 7. Category Handlers

### Get Categories
**Actions:**
1. Validate authentication  
2. Fetch:
   - system categories  
   - user categories  
3. Return list  

### Create Category
**Actions:**
1. Validate authentication  
2. Validate name (non-empty, ≤ 100 chars)  
3. Insert category linked to user  
4. Return created category  


## 8. Project Handlers

### Get Projects
**Actions:**
1. Validate authentication  
2. Fetch user projects  
3. Exclude deleted  
4. Return list  

### Create Project
**Actions:**
1. Validate authentication  
2. Validate name  
3. Insert project  
4. Return project  


## 9. Bulk Sync Handler
### Sync Operations
**Endpoint:**  
POST /sync
**Input:**
- ordered list of operations

**Actions:**
1. Validate authentication  
2. Validate operations:
   - Must include id and updated_at  
   - Must be ordered (create → update → delete)  
3. Process each operation sequentially:
   For each operation:
   - Execute using same rules as individual endpoints  
   - Catch errors per operation  
   - Continue processing next item  
4. Track results:
   - success_count  
   - failed_count  
   - failed_items list  
5. Return summary  


## 10. Error Codes
- INVALID_INPUT  
- UNAUTHORIZED  
- NOT_FOUND  
- FORBIDDEN  
- RATE_LIMIT_EXCEEDED  
- CONFLICT_IGNORED  
- SERVER_ERROR  

## 11. Security Rules
- All data must be user-scoped  
- Ownership must be verified before all operations  
- Rate limiting enforced at API layer  
- File access via signed URLs only  


## 12. Logging & Monitoring
- Log all requests (excluding sensitive data)  
- Log all errors with error codes  
- Track sync failures and retries  


## 13. Summary

This API design ensures:
- Safe and repeatable operations (idempotency)
- Conflict-resistant updates
- Controlled data access
- Reliable sync behavior
- AI-compatible execution logic

All handlers must strictly follow defined validation, execution steps, and response formats.

# ReceiptVault – Export Logic

## 1. Overview
Define how expense data is exported and structured.

## 2. CSV Export

### Scope
- Full history or filtered data

### Columns
- Date
- Amount
- Category
- Project
- Note
- Receipt Attached (Y/N)

## 3. PDF Export

### Generation
- Client-side using jsPDF

### Content
- Date
- Description
- Category
- Project
- Amount

### Totals
- Category subtotals
- Grand total

### Metadata
- User name
- Selected date range

### Options
- Include receipt images
- Customize columns or sections

## 4. Output
- Downloadable
- Shareable

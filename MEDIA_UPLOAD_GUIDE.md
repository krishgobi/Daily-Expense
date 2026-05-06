# Media Upload Feature - Integration Guide

## Overview

Users can now upload optional media files (images, PDFs, documents) for:
- **Cash Expenses**
- **Digital Expenses**
- **Borrowed Money** (Transactions)
- **Lent Money** (Transactions)

---

## Frontend Setup

### 1. Import FileUpload Component

```tsx
import { FileUpload } from '@/components/Common/FileUpload'
```

### 2. Add to Expense Form

```tsx
import React, { useState } from 'react'
import { FileUpload } from '@/components/Common/FileUpload'
import { expenseService } from '@/services/expenseService'

export const CreateExpenseForm: React.FC = () => {
  const [expenseId, setExpenseId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    purpose: '',
    amount: 0,
    date: new Date(),
    paymentMethod: '',
    description: '',
  })

  const handleCreateExpense = async () => {
    // Create expense first
    const response = await expenseService.createExpense(formData)
    setExpenseId(response.id)
    // Now user can upload media
  }

  const handleFileUpload = (media: any) => {
    console.log('File uploaded:', media)
    // Refresh expense details if needed
  }

  const handleError = (error: string) => {
    // Show error message to user
    alert(error)
  }

  return (
    <div className="space-y-4">
      {/* Expense Form Fields */}
      <input
        type="text"
        placeholder="Expense purpose"
        value={formData.purpose}
        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
      />
      
      <input
        type="number"
        placeholder="Amount"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
      />

      <button onClick={handleCreateExpense}>Create Expense</button>

      {/* File Upload Component */}
      {expenseId && (
        <FileUpload
          entityId={expenseId}
          entityType="expense"
          onFileUpload={handleFileUpload}
          onError={handleError}
          maxFiles={5}
        />
      )}
    </div>
  )
}
```

### 3. Add to Transaction Form (Borrowed/Lent)

```tsx
import React, { useState } from 'react'
import { FileUpload } from '@/components/Common/FileUpload'
import { transactionService } from '@/services/transactionService'

export const CreateTransactionForm: React.FC = () => {
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    transaction_type: 'BORROWED', // or 'LENT'
    person_name: '',
    amount: 0,
    given_date: new Date(),
    purpose: '',
  })

  const handleCreateTransaction = async () => {
    // Create transaction first
    const response = await transactionService.createTransaction(formData)
    setTransactionId(response.id)
    // Now user can upload media (receipt, agreement, etc.)
  }

  const handleFileUpload = (media: any) => {
    console.log('Media uploaded:', media)
  }

  return (
    <div className="space-y-4">
      {/* Transaction Form Fields */}
      <select
        value={formData.transaction_type}
        onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
      >
        <option value="BORROWED">Money Borrowed</option>
        <option value="LENT">Money Lent</option>
      </select>

      <input
        type="text"
        placeholder="Person name"
        value={formData.person_name}
        onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
      />

      <input
        type="number"
        placeholder="Amount"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
      />

      <button onClick={handleCreateTransaction}>Create Transaction</button>

      {/* File Upload Component */}
      {transactionId && (
        <FileUpload
          entityId={transactionId}
          entityType="transaction"
          onFileUpload={handleFileUpload}
          maxFiles={3}
        />
      )}
    </div>
  )
}
```

---

## File Upload Component Props

```typescript
interface FileUploadProps {
  entityId: string              // ID of expense or transaction
  entityType: 'expense' | 'transaction'  // Type of entity
  onFileUpload?: (media: any) => void    // Callback after upload
  onError?: (error: string) => void      // Error handler
  maxFiles?: number             // Maximum files allowed (default: 5)
  existingMedia?: any[]         // Pre-existing media files
}
```

---

## API Endpoints

### Upload Media to Expense

**Endpoint:** `POST /api/v1/expenses/{expense_id}/upload-media`

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/expenses/123/upload-media \
  -H "Authorization: Bearer <token>" \
  -F "file=@receipt.pdf"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "media-uuid",
    "file_name": "receipt.pdf",
    "file_type": "PDF",
    "file_size": 245000,
    "uploaded_at": "2026-05-05T10:30:00Z"
  },
  "message": "Media uploaded successfully"
}
```

### Delete Media from Expense

**Endpoint:** `DELETE /api/v1/expenses/{expense_id}/media/{media_id}`

```bash
curl -X DELETE http://localhost:8000/api/v1/expenses/123/media/media-123 \
  -H "Authorization: Bearer <token>"
```

### Upload Media to Transaction

**Endpoint:** `POST /api/v1/transactions/{transaction_id}/upload-media`

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/transactions/456/upload-media \
  -H "Authorization: Bearer <token>" \
  -F "file=@agreement.jpg"
```

### Delete Media from Transaction

**Endpoint:** `DELETE /api/v1/transactions/{transaction_id}/media/{media_id}`

---

## Supported File Types

| Type | Extensions | MIME Types |
|------|-----------|-----------|
| **Images** | jpg, jpeg, png, gif, webp | image/* |
| **Documents** | pdf | application/pdf |
| **Word** | doc, docx | application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document |
| **Excel** | xls, xlsx | application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet |

---

## File Size Limits

- **Maximum file size:** 10MB
- **Maximum files per entity:** 5 (default, configurable)

---

## Backend Implementation

### Database Models

```python
# Expense Media
class ExpenseMedia(Base):
    __tablename__ = "expense_media"
    
    id = Column(UUID, primary_key=True)
    expense_id = Column(UUID, ForeignKey("expenses.id"))
    file_name = Column(String(255))
    file_path = Column(String(500))
    file_type = Column(String(20))  # IMAGE, PDF, DOCUMENT
    file_size = Column(Integer)
    uploaded_at = Column(DateTime)

# Transaction Media
class TransactionMedia(Base):
    __tablename__ = "transaction_media"
    
    id = Column(UUID, primary_key=True)
    transaction_id = Column(UUID, ForeignKey("transactions.id"))
    file_name = Column(String(255))
    file_path = Column(String(500))
    file_type = Column(String(20))
    file_size = Column(Integer)
    uploaded_at = Column(DateTime)
```

### File Storage

Files are stored locally in:
```
uploads/{user_id}/{entity_type}/{year}/{month}/{unique_filename}
```

Example:
```
uploads/f47ac10b-58cc-4372-a567-0e02b2c3d479/expense/2026/5/a1b2c3d4.pdf
uploads/f47ac10b-58cc-4372-a567-0e02b2c3d479/transaction/2026/5/e5f6g7h8.jpg
```

---

## Display Media in UI

### In Expense List

```tsx
export const ExpenseListItem: React.FC<{expense: any}> = ({expense}) => (
  <div className="expense-item">
    <h4>{expense.purpose}</h4>
    <p>₹{expense.amount}</p>
    
    {/* Show media count */}
    {expense.media && expense.media.length > 0 && (
      <div className="flex gap-2">
        {expense.media.map(media => (
          <div key={media.id} className="thumbnail">
            {media.file_type === 'IMAGE' && (
              <img src={media.file_path} alt={media.file_name} className="w-12 h-12" />
            )}
            {media.file_type === 'PDF' && (
              <div className="w-12 h-12 bg-red-100 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)
```

### Show Media Badge

```tsx
{expense.media && expense.media.length > 0 && (
  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
    {expense.media.length} file{expense.media.length > 1 ? 's' : ''}
  </span>
)}
```

---

## Error Handling

The FileUpload component handles:

- ❌ Invalid file types
- ❌ Files exceeding size limit (10MB)
- ❌ Too many files uploaded (exceeding maxFiles)
- ❌ Network errors
- ❌ Server errors

All errors are passed to the `onError` callback for UI display.

---

## Example: Complete Expense Form with Media

```tsx
import React, { useState } from 'react'
import { FileUpload } from '@/components/Common/FileUpload'
import { expenseService } from '@/services/expenseService'

export const AddExpensePage: React.FC = () => {
  const [step, setStep] = useState<'form' | 'media'>('form')
  const [expenseId, setExpenseId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    purpose: '',
    amount: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })
  const [error, setError] = useState('')

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await expenseService.createCashExpense({
        purpose: formData.purpose,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description,
      })
      setExpenseId(response.id)
      setStep('media')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create expense')
    }
  }

  const handleFileUpload = (media: any) => {
    // Show success message
    alert(`Uploaded: ${media.file_name}`)
  }

  const handleSkipMedia = () => {
    // Redirect to expenses list
    window.location.href = '/expenses'
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {step === 'form' ? (
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <h2 className="text-2xl font-bold">Add Expense</h2>

          <input
            type="text"
            placeholder="Purpose"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="number"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />

          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Continue
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Add Receipt/Proof (Optional)</h2>

          {expenseId && (
            <FileUpload
              entityId={expenseId}
              entityType="expense"
              onFileUpload={handleFileUpload}
              maxFiles={3}
            />
          )}

          <button
            onClick={handleSkipMedia}
            className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## Testing

### Local Development

```bash
# Start backend
cd backend
python -m uvicorn app.main:app --reload

# Test upload endpoint
curl -X POST http://localhost:8000/api/v1/expenses/123/upload-media \
  -H "Authorization: Bearer <your-token>" \
  -F "file=@test.pdf"
```

### Frontend Testing

1. Create an expense/transaction
2. Upload a file using the FileUpload component
3. Verify file appears in the list
4. Test deletion
5. Check that media is persisted in database

---

## Future Enhancements

- [ ] Image preview/gallery view
- [ ] Drag-and-drop multiple files
- [ ] Compress images before upload
- [ ] Generate thumbnails for images
- [ ] Cloud storage integration (AWS S3, Firebase)
- [ ] OCR for receipts
- [ ] Media sharing with collaborators


# 🚀 Supabase Storage Setup Guide

## Complete Setup Instructions for Media Uploads

All data and file uploads are now **stored on Supabase** (persistent, scalable, production-ready).

---

## **STEP 1: Execute SQL Queries on Supabase** ⚙️

### Go to Supabase Dashboard:
1. Open [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **zksjamrfyccgzbvnhwiu**
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**

### Execute Query 1: Create Storage Buckets & Policies
Copy and paste this entire query from `SUPABASE_STORAGE_SETUP.sql` file and execute it:

```sql
-- Create expense-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-media',
  'expense-media',
  true,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create transaction-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transaction-media',
  'transaction-media',
  true,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for expense-media
CREATE POLICY "Allow authenticated users to upload expense media"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND bucket_id = 'expense-media'
);

CREATE POLICY "Allow authenticated users to read expense media"
ON storage.objects FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND bucket_id = 'expense-media'
);

CREATE POLICY "Allow users to delete their own expense media"
ON storage.objects FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND bucket_id = 'expense-media'
  AND SPLIT_PART(name, '/', 1) = auth.uid()::text
);

-- Storage policies for transaction-media
CREATE POLICY "Allow authenticated users to upload transaction media"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND bucket_id = 'transaction-media'
);

CREATE POLICY "Allow authenticated users to read transaction media"
ON storage.objects FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND bucket_id = 'transaction-media'
);

CREATE POLICY "Allow users to delete their own transaction media"
ON storage.objects FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND bucket_id = 'transaction-media'
  AND SPLIT_PART(name, '/', 1) = auth.uid()::text
);
```

✅ If successful, you'll see "0 rows" (no errors = success)

---

### Execute Query 2: Add file_url Column to Tables
```sql
-- Add file_url column to both media tables
ALTER TABLE expense_media 
ADD COLUMN IF NOT EXISTS file_url VARCHAR(1000);

ALTER TABLE transaction_media 
ADD COLUMN IF NOT EXISTS file_url VARCHAR(1000);

-- Verify
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('expense_media', 'transaction_media')
AND column_name = 'file_url'
ORDER BY table_name;
```

Expected result:
```
expense_media  | file_url | character varying
transaction_media | file_url | character varying
```

---

## **STEP 2: Update Backend on Render** 🚀

### Go to Render Dashboard:
1. Open [render.com/dashboard](https://render.com/dashboard)
2. Click your **daily-expense** service
3. Click **Manual Deploy** → **Deploy latest commit**

Wait for deployment to complete (2-3 minutes)

**Verify deployment:**
```bash
curl -s https://daily-expense-oiwb.onrender.com/health | jq .
```

Should return:
```json
{
  "status": "healthy",
  "service": "Tracksy.AI API",
  "version": "1.0.0"
}
```

---

## **STEP 3: Update Frontend on Vercel** ⚡

### Go to Vercel Dashboard:
1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your **daily-expense-mocha** project
3. Click on the latest deployment
4. Click **Redeploy** button in the top right

OR manually trigger:
- Go to **Deployments** tab
- Find latest deployment (should be vercel.json config)
- Click **...** → **Redeploy**

Wait for deployment to complete (1-2 minutes)

---

## **STEP 4: Test Everything** ✅

### Test 1: Login to Frontend
```
https://daily-expense-mocha.vercel.app/login
```

Should load without 404 ✅

### Test 2: Add Expense with Media
1. Click "Digital Expense" button
2. Fill in form:
   - Purpose: "Test Expense"
   - Amount: 100
   - Date: Today
   - Payment: Google Pay
3. Click "Add Expense"
4. **New!** You'll see green success message + file upload section
5. Drag and drop a file (or click to select)
6. File uploads to Supabase Storage ✅

### Test 3: Verify Data in Supabase
Go to [supabase.com/dashboard](https://supabase.com/dashboard):

1. **SQL Editor** → Run:
```sql
SELECT * FROM expenses LIMIT 5;
SELECT * FROM expense_media LIMIT 5;
```

Should show:
- ✅ Expense record in `expenses` table
- ✅ Media record in `expense_media` with file_url populated

2. **Storage** → Click **expense-media** bucket
   - Should see folder: `{user-id}/expense/{year}/{month}/{file-uuid}`
   - Files are here! ✅

3. **Check Media URL** → Click any file in Storage → Copy public URL
   - URL looks like: `https://zksjamrfyccgzbvnhwiu.supabase.co/storage/v1/object/public/expense-media/{path}`
   - This same URL is stored in `file_url` column ✅

---

## **What's Changed** 🔄

### Backend Updates:
- ✅ Created `supabase_storage.py` - Supabase Storage client
- ✅ Updated `file_upload.py` - Uses Supabase instead of local filesystem
- ✅ Added `supabase==2.3.4` to requirements.txt
- ✅ Updated database models - Added `file_url` column
- ✅ Updated `/upload-media` endpoints - Save URLs to database

### Frontend Updates:
- ✅ Added FileUpload component to ExpenseForm
- ✅ Component appears AFTER expense is created (optional)
- ✅ Shows file upload status + progress
- ✅ Displays uploaded files with download links

### Database Updates:
- ✅ New Supabase Storage buckets: `expense-media`, `transaction-media`
- ✅ Storage policies configured for authenticated users
- ✅ `file_url` columns added to media tables
- ✅ All files now stored permanently on Supabase

---

## **Architecture** 🏗️

```
User Action: Upload File
    ↓
Frontend FileUpload Component
    ↓
POST /api/v1/expenses/{id}/upload-media
    ↓
Backend: save_upload_file()
    ↓
Supabase Storage Client
    ↓
Upload to Supabase Bucket (expense-media/transaction-media)
    ↓
Get Public URL back
    ↓
Store in Database: expense_media.file_url
    ↓
Return URL to Frontend
    ↓
Frontend displays file with link
```

---

## **Data Flow** 📊

**All Your Data on Supabase:**
- ✅ Users: `auth.users` (Supabase Auth)
- ✅ Profiles: `public.profiles`
- ✅ Expenses: `public.expenses`
- ✅ Expense Media: `public.expense_media` + Files in Storage
- ✅ Transactions: `public.transactions`
- ✅ Transaction Media: `public.transaction_media` + Files in Storage
- ✅ Categories: `public.expense_categories`

**Nothing on Local Filesystem** (files deleted when dyno restarts)
**Everything Persistent on Supabase** ✅

---

## **Troubleshooting** 🔧

### Files not showing after upload?
1. Check `expense_media` table - does it have data?
2. Check Supabase Storage bucket - files exist?
3. Try Vercel redeploy (clear cache)

### Upload button not appearing?
1. Make sure expense is created first (green success message)
2. Check browser console for errors
3. Verify Render deployment completed

### Slow loading?
1. Check Vercel build logs for errors
2. Check Render logs for backend errors
3. Clear browser cache and try again

### Files accessible?
1. Get file URL from database: `SELECT file_url FROM expense_media LIMIT 1;`
2. Paste URL in browser - should download file
3. If 404, check Supabase Storage policies

---

## **Files Modified** 📝

1. `backend/app/utils/supabase_storage.py` - NEW
2. `backend/app/utils/file_upload.py` - UPDATED (now uses Supabase)
3. `backend/app/models/__init__.py` - UPDATED (added file_url columns)
4. `backend/app/api/v1/expenses.py` - UPDATED (store URLs)
5. `backend/app/api/v1/transactions.py` - UPDATED (store URLs)
6. `backend/requirements.txt` - UPDATED (added supabase)
7. `frontend/src/components/Expenses/ExpenseForm.tsx` - UPDATED (added FileUpload)
8. `supabase/migrations/004_add_file_url_to_media.sql` - NEW
9. `SUPABASE_STORAGE_SETUP.sql` - NEW (reference guide)

---

## **Next Steps** 🎯

1. ✅ Execute SQL queries (Step 1)
2. ✅ Redeploy backend (Step 2)
3. ✅ Redeploy frontend (Step 3)
4. ✅ Test everything (Step 4)
5. ✅ Verify data on Supabase

**You're done!** Everything now stores on Supabase. 🎉

Questions? Check Supabase logs or browser console for errors.

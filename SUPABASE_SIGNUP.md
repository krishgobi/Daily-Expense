# Supabase Signup Setup

## Step 1: Create `profiles`

Run this SQL in the Supabase SQL editor, or apply the file at
`supabase/migrations/001_create_profiles.sql`.

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);
```

## Step 2: Enable RLS and Policies

```sql
alter table public.profiles enable row level security;

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can select their own profile" on public.profiles;
create policy "Users can select their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);
```

## Step 3: Signup Flow

1. User enters full name, email address, password, and confirm password.
2. The frontend validates required fields and confirms both passwords match.
3. The frontend calls `supabase.auth.signUp({ email, password })`.
4. Supabase Auth stores the email and password securely. The app never stores passwords manually.
5. The app passes `full_name` as Supabase Auth metadata.
6. The database trigger in `supabase/migrations/002_create_profile_on_signup.sql` creates the linked `public.profiles` row automatically.

Note: this trigger-based profile creation works whether email confirmation is enabled or disabled.

## Step 4: Mac Commands

From the project root:

```bash
cd /Users/pointonezero/Desktop/expense/frontend
npm install
cp .env.example .env
```

Edit `frontend/.env` and add your Supabase values:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Start the frontend:

```bash
npm run dev
```

Open the shown local URL, usually:

```bash
http://localhost:5173
```

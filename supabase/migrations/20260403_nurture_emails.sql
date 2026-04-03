-- Nurture email tracking table
-- Run each statement separately in the Supabase SQL Editor if needed

-- 1. Create the nurture_emails table
create table if not exists nurture_emails (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  sequence text not null,
  email_key text not null,
  sent_at timestamptz default now(),
  unique(email, email_key)
);

-- 2. Index for quick lookups
create index if not exists idx_nurture_emails_email on nurture_emails(email);

-- 3. Enable RLS (only service role can access)
alter table nurture_emails enable row level security;

-- 4. Add unsubscribed column to leads table
-- If this errors, run it separately
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'leads' and column_name = 'unsubscribed'
  ) then
    alter table leads add column unsubscribed boolean default false;
  end if;
end $$;

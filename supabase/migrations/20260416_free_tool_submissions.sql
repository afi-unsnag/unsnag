-- Free tool submissions log
-- Stores every submission to the /yours free tool for product insight.
-- Captures the situation text, the AI output, and an optional email.

create table if not exists public.free_tool_submissions (
  id uuid default gen_random_uuid() primary key,
  situation text not null,
  whats_yours jsonb,
  whats_not_yours jsonb,
  email text,
  session_id text,
  created_at timestamptz default now()
);

create index if not exists idx_free_tool_submissions_created_at
  on public.free_tool_submissions (created_at desc);

create index if not exists idx_free_tool_submissions_email
  on public.free_tool_submissions (email)
  where email is not null;

-- RLS: the edge function writes via service_role, so no anon policies needed.
-- Reads happen from Supabase dashboard (which bypasses RLS as admin).
alter table public.free_tool_submissions enable row level security;

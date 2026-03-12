-- ============================================================
-- Automations Schema: webhooks, functions, events, results, meetings
-- ============================================================

-- 1. Webhooks table
create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  secret text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.webhooks enable row level security;
create policy "public full access on webhooks" on public.webhooks
  for all to public using (true) with check (true);

-- 2. Webhook functions table
create table if not exists public.webhook_functions (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  name text not null,
  prompt text not null,
  output_table text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.webhook_functions enable row level security;
create policy "public full access on webhook_functions" on public.webhook_functions
  for all to public using (true) with check (true);

-- 3. Webhook events table (the queue)
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  error text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.webhook_events enable row level security;
create policy "public full access on webhook_events" on public.webhook_events
  for all to public using (true) with check (true);

-- Index for queue polling
create index idx_webhook_events_status on public.webhook_events(status);
create index idx_webhook_events_webhook_id on public.webhook_events(webhook_id);

-- 4. Automation results table
create table if not exists public.automation_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.webhook_events(id) on delete cascade,
  function_id uuid not null references public.webhook_functions(id) on delete cascade,
  webhook_name text not null,
  result_data jsonb not null default '{}'::jsonb,
  routed_to text,
  routed_record_id text,
  created_at timestamptz not null default now()
);

alter table public.automation_results enable row level security;
create policy "public full access on automation_results" on public.automation_results
  for all to public using (true) with check (true);

create index idx_automation_results_event_id on public.automation_results(event_id);

-- 5. Meetings table (for Jane Meeting Assistant)
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  title text not null,
  date timestamptz not null,
  duration_minutes integer,
  attendees jsonb default '[]'::jsonb,
  summary text,
  action_items jsonb default '[]'::jsonb,
  meeting_type text,
  source text not null default 'fathom',
  fathom_url text,
  share_url text,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.meetings enable row level security;
create policy "public full access on meetings" on public.meetings
  for all to public using (true) with check (true);

create index idx_meetings_external_id on public.meetings(external_id);
create index idx_meetings_date on public.meetings(date desc);

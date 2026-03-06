create extension if not exists "pgcrypto";

create table if not exists public.task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  event_type text not null check (event_type in ('dispatch','progress','artifact','warning','escalation','complete','note')),
  actor text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.task_events enable row level security;

drop policy if exists "Allow anon read task_events" on public.task_events;
create policy "Allow anon read task_events" on public.task_events for select using (true);

drop policy if exists "Allow anon insert task_events" on public.task_events;
create policy "Allow anon insert task_events" on public.task_events for insert with check (true);

drop policy if exists "Allow anon update task_events" on public.task_events;
create policy "Allow anon update task_events" on public.task_events for update using (true) with check (true);

drop policy if exists "Allow anon delete task_events" on public.task_events;
create policy "Allow anon delete task_events" on public.task_events for delete using (true);

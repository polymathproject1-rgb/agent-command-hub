create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  agent_name text not null,
  agent_emoji text not null,
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
  progress int check (progress between 0 and 100),
  column_key text not null check (column_key in ('todo', 'doing', 'needs-input', 'done')),
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "Allow anon read tasks" on public.tasks;
create policy "Allow anon read tasks"
on public.tasks
for select
using (true);

drop policy if exists "Allow anon update tasks" on public.tasks;
create policy "Allow anon update tasks"
on public.tasks
for update
using (true)
with check (true);

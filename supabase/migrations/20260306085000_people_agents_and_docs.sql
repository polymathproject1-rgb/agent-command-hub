create extension if not exists "pgcrypto";

create table if not exists public.humans (
  id uuid primary key default gen_random_uuid(),
  display_name text not null unique,
  role text,
  created_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emoji text,
  can_self_register boolean not null default true,
  self_registered boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by_human_id uuid references public.humans(id),
  created_at timestamptz not null default now()
);

create table if not exists public.integration_docs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content_md text not null default '',
  updated_by text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.humans enable row level security;
alter table public.agents enable row level security;
alter table public.integration_docs enable row level security;

-- humans policies
drop policy if exists "Allow anon read humans" on public.humans;
create policy "Allow anon read humans" on public.humans for select using (true);
drop policy if exists "Allow anon insert humans" on public.humans;
create policy "Allow anon insert humans" on public.humans for insert with check (true);
drop policy if exists "Allow anon update humans" on public.humans;
create policy "Allow anon update humans" on public.humans for update using (true) with check (true);

-- agents policies
drop policy if exists "Allow anon read agents" on public.agents;
create policy "Allow anon read agents" on public.agents for select using (true);
drop policy if exists "Allow anon insert agents" on public.agents;
create policy "Allow anon insert agents" on public.agents for insert with check (true);
drop policy if exists "Allow anon update agents" on public.agents;
create policy "Allow anon update agents" on public.agents for update using (true) with check (true);

-- docs policies
drop policy if exists "Allow anon read integration_docs" on public.integration_docs;
create policy "Allow anon read integration_docs" on public.integration_docs for select using (true);
drop policy if exists "Allow anon insert integration_docs" on public.integration_docs;
create policy "Allow anon insert integration_docs" on public.integration_docs for insert with check (true);
drop policy if exists "Allow anon update integration_docs" on public.integration_docs;
create policy "Allow anon update integration_docs" on public.integration_docs for update using (true) with check (true);

insert into public.humans (display_name, role)
values ('Mani', 'Owner')
on conflict (display_name) do update set role = excluded.role;

insert into public.agents (name, emoji, self_registered, can_self_register)
values ('Rei', '🦐', false, true)
on conflict (name) do update set emoji = excluded.emoji;

insert into public.integration_docs (slug, title, content_md, updated_by)
values (
  'kanban-api',
  'Kanban Board API Documentation',
  '# Kanban Board API\n\n## Core Rules\n- request_type: task | assignee | subtask | question\n- Move task with action=update + column\n- Always include agent_name + agent_emoji\n\n## Columns\n- to_do\n- doing\n- needs_input\n- done\n- canceled\n',
  'system'
)
on conflict (slug) do nothing;

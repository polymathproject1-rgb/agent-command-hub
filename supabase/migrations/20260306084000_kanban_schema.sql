create extension if not exists "pgcrypto";

create table if not exists public.board_columns (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.board_columns enable row level security;
drop policy if exists "Allow anon read board_columns" on public.board_columns;
create policy "Allow anon read board_columns" on public.board_columns for select using (true);

insert into public.board_columns (name, color, position)
values
  ('To Do', '#ef4444', 0),
  ('Doing', '#f59e0b', 1),
  ('Needs Input', '#8b5cf6', 2),
  ('Done', '#10b981', 3),
  ('Canceled', '#6b7280', 4)
on conflict (name) do update set color = excluded.color, position = excluded.position;

alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists board_column_id uuid references public.board_columns(id);
alter table public.tasks add column if not exists due_date date;
alter table public.tasks add column if not exists position int;
alter table public.tasks add column if not exists created_by_bujji boolean default false;

-- Backfill board_column_id from legacy column_key if available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'column_key'
  ) THEN
    UPDATE public.tasks t
    SET board_column_id = bc.id
    FROM public.board_columns bc
    WHERE t.board_column_id IS NULL
      AND lower(bc.name) = CASE t.column_key
        WHEN 'to_do' THEN 'to do'
        WHEN 'doing' THEN 'doing'
        WHEN 'needs_input' THEN 'needs input'
        WHEN 'done' THEN 'done'
        WHEN 'canceled' THEN 'canceled'
        WHEN 'todo' THEN 'to do'
        WHEN 'needs-input' THEN 'needs input'
        ELSE 'to do'
      END;
  END IF;
END $$;

-- default any remaining to To Do
update public.tasks t
set board_column_id = bc.id
from public.board_columns bc
where t.board_column_id is null and bc.name = 'To Do';

create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.task_assignees (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.subtasks enable row level security;
alter table public.task_assignees enable row level security;

-- tasks policies
alter table public.tasks enable row level security;
drop policy if exists "Allow anon read tasks" on public.tasks;
create policy "Allow anon read tasks" on public.tasks for select using (true);
drop policy if exists "Allow anon insert tasks" on public.tasks;
create policy "Allow anon insert tasks" on public.tasks for insert with check (true);
drop policy if exists "Allow anon update tasks" on public.tasks;
create policy "Allow anon update tasks" on public.tasks for update using (true) with check (true);
drop policy if exists "Allow anon delete tasks" on public.tasks;
create policy "Allow anon delete tasks" on public.tasks for delete using (true);

-- subtasks policies
drop policy if exists "Allow anon read subtasks" on public.subtasks;
create policy "Allow anon read subtasks" on public.subtasks for select using (true);
drop policy if exists "Allow anon insert subtasks" on public.subtasks;
create policy "Allow anon insert subtasks" on public.subtasks for insert with check (true);
drop policy if exists "Allow anon update subtasks" on public.subtasks;
create policy "Allow anon update subtasks" on public.subtasks for update using (true) with check (true);
drop policy if exists "Allow anon delete subtasks" on public.subtasks;
create policy "Allow anon delete subtasks" on public.subtasks for delete using (true);

-- assignees policies
drop policy if exists "Allow anon read assignees" on public.task_assignees;
create policy "Allow anon read assignees" on public.task_assignees for select using (true);
drop policy if exists "Allow anon insert assignees" on public.task_assignees;
create policy "Allow anon insert assignees" on public.task_assignees for insert with check (true);
drop policy if exists "Allow anon update assignees" on public.task_assignees;
create policy "Allow anon update assignees" on public.task_assignees for update using (true) with check (true);
drop policy if exists "Allow anon delete assignees" on public.task_assignees;
create policy "Allow anon delete assignees" on public.task_assignees for delete using (true);

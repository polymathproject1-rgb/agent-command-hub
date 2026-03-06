alter table public.humans add column if not exists auth_user_id uuid unique;
alter table public.humans add column if not exists email text unique;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.humans (auth_user_id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'user-' || left(new.id::text, 8)
    ),
    'Human'
  )
  on conflict (auth_user_id)
  do update set
    email = excluded.email,
    display_name = excluded.display_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Backfill existing users (including Mani if already signed up)
insert into public.humans (auth_user_id, email, display_name, role)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    split_part(coalesce(u.email, ''), '@', 1),
    'user-' || left(u.id::text, 8)
  ) as display_name,
  'Human' as role
from auth.users u
on conflict (auth_user_id)
do update set
  email = excluded.email,
  display_name = excluded.display_name;

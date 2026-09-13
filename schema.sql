-- משפט ביום. / Supabase schema
-- Run this file in the Supabase SQL editor before deploying the application.

create extension if not exists pgcrypto;

create type public.quote_status as enum ('pending', 'approved', 'rejected');
create type public.content_status as enum ('visible', 'hidden');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '',
  status text check (char_length(status) <= 120),
  avatar_url text,
  is_admin boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nickname_length check (char_length(nickname) between 2 and 30)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 2 and 600),
  author_name text check (char_length(author_name) <= 60),
  status public.quote_status not null default 'pending',
  submitted_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.daily_draws (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete restrict,
  draw_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, draw_date)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (array_length(regexp_split_to_array(trim(body), '\\s+'), 1) <= 100),
  status public.content_status not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quote_id, user_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text check (char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  unique (comment_id, reporter_id)
);

create index daily_draws_user_quote_idx on public.daily_draws(user_id, quote_id);
create index quotes_status_idx on public.quotes(status, created_at desc);
create index comments_quote_idx on public.comments(quote_id, created_at);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(nullif(left(new.raw_user_meta_data ->> 'full_name', 30), ''), 'משתמש חדש'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create or replace function public.assign_comment_author()
returns trigger language plpgsql security definer set search_path = public as $$ begin new.user_id = auth.uid(); return new; end; $$;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger comments_updated_at before update on public.comments for each row execute procedure public.set_updated_at();
create trigger comments_assign_author before insert on public.comments for each row execute procedure public.assign_comment_author();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.user_has_quote(target_quote uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.daily_draws where user_id = auth.uid() and quote_id = target_quote);
$$;

-- Atomic daily draw in Israel time. Repeats only after every approved quote was seen.
create or replace function public.draw_daily_quote()
returns table (draw_id uuid, draw_date date, quote_id uuid, quote_text text, quote_author_name text)
language plpgsql security definer set search_path = public as $$
declare
  today_israel date := (now() at time zone 'Asia/Jerusalem')::date;
  chosen public.quotes%rowtype;
  created_draw public.daily_draws%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.profiles where id = auth.uid() and is_suspended) then raise exception 'Account suspended'; end if;

  select * into created_draw from public.daily_draws where user_id = auth.uid() and draw_date = today_israel;
  if found then
    return query select created_draw.id, created_draw.draw_date, q.id, q.text, q.author_name from public.quotes q where q.id = created_draw.quote_id;
    return;
  end if;

  select q.* into chosen from public.quotes q
  where q.status = 'approved' and not exists (
    select 1 from public.daily_draws d where d.user_id = auth.uid() and d.quote_id = q.id
  ) order by random() limit 1;
  if not found then
    select q.* into chosen from public.quotes q where q.status = 'approved' order by random() limit 1;
  end if;
  if not found then raise exception 'No approved quotes available'; end if;

  insert into public.daily_draws(user_id, quote_id, draw_date)
  values (auth.uid(), chosen.id, today_israel)
  on conflict (user_id, draw_date) do update set quote_id = public.daily_draws.quote_id
  returning * into created_draw;
  return query select created_draw.id, created_draw.draw_date, chosen.id, chosen.text, chosen.author_name;
end;
$$;

alter table public.profiles enable row level security;
alter table public.quotes enable row level security;
alter table public.daily_draws enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

create policy "profiles are public" on public.profiles for select to authenticated using (true);
create policy "profiles public to visitors" on public.profiles for select to anon using (true);
create or replace function public.update_own_profile(new_nickname text, new_status text default null, new_avatar_url text default null)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare result public.profiles;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.profiles set nickname = trim(new_nickname), status = nullif(trim(new_status), ''), avatar_url = new_avatar_url
  where id = auth.uid() and not is_suspended returning * into result;
  if not found then raise exception 'Profile update unavailable'; end if;
  return result;
end; $$;
create policy "no direct profile update" on public.profiles for update to authenticated using (false);
create policy "admin profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "approved quotes readable" on public.quotes for select to authenticated using (status = 'approved' or submitted_by = auth.uid() or public.is_admin());
create policy "approved quotes public to visitors" on public.quotes for select to anon using (status = 'approved');
create or replace function public.submit_quote(quote_text text, display_name text default null)
returns public.quotes language plpgsql security definer set search_path = public as $$
declare result public.quotes; today_israel date := (now() at time zone 'Asia/Jerusalem')::date;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.quotes where submitted_by = auth.uid() and (created_at at time zone 'Asia/Jerusalem')::date = today_israel) then
    raise exception 'אפשר להציע משפט אחד בלבד ביום';
  end if;
  insert into public.quotes(text, author_name, submitted_by) values (trim(quote_text), nullif(trim(display_name), ''), auth.uid()) returning * into result;
  return result;
end; $$;
create policy "no direct quote submission" on public.quotes for insert to authenticated with check (false);
create policy "admin manage quotes" on public.quotes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "own draws" on public.daily_draws for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "eligible comments readable" on public.comments for select to authenticated using (public.user_has_quote(quote_id) and (status = 'visible' or user_id = auth.uid() or public.is_admin()));
create policy "add one comment after draw" on public.comments for insert to authenticated with check (user_id = auth.uid() and public.user_has_quote(quote_id));
create policy "edit own comment" on public.comments for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin comments" on public.comments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "report eligible comment" on public.reports for insert to authenticated with check (reporter_id = auth.uid() and public.user_has_quote((select quote_id from public.comments where id = comment_id)));
create policy "admin reports" on public.reports for select to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "public avatar read" on storage.objects for select using (bucket_id = 'avatars');
create policy "own avatar upload" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own avatar update" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Seed the initial approved collection.
insert into public.quotes (text, status) values
  ('עם ישראל חי-יזרים.', 'approved'),
  ('אנשים מחפשים זהב ומדלגים על יהלומים.', 'approved'),
  ('כמה שאתה יותר רחוק מהמציאות אתה יותר כוכב.', 'approved');

-- After your first login, make your account the administrator once:
-- update public.profiles set is_admin = true where id = '<your-auth-user-uuid>';

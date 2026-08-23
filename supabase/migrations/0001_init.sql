-- ============================================================
-- Aura Mail — initial schema
-- profiles / organizations / organization_members
-- (Reports live in Redis, not here — same split as Scam Shield:
--  Postgres = identity/org layer, Redis = report/correlation data)
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references profiles(id),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;

-- profiles: users manage only their own row
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- organization_members: users see only their own membership rows
create policy "org_members_select_own" on organization_members
  for select using (user_id = auth.uid());

create policy "org_members_insert_self_as_member" on organization_members
  for insert with check (user_id = auth.uid() and role = 'member');

-- organizations: visible only to members
create policy "organizations_select_if_member" on organizations
  for select using (
    exists (
      select 1 from organization_members m
      where m.organization_id = organizations.id
      and m.user_id = auth.uid()
    )
  );

-- ============================================================
-- RPC functions (SECURITY DEFINER)
-- ============================================================

create or replace function create_organization_with_admin(org_name text, invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  insert into organizations (name, created_by, invite_code)
  values (org_name, auth.uid(), invite_code)
  returning id into new_org_id;

  insert into organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'admin');

  return new_org_id;
end;
$$;

create or replace function lookup_organization_by_invite_code(lookup_code text)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select organizations.id, organizations.name
  from organizations
  where organizations.invite_code = lookup_code;
end;
$$;

grant execute on function create_organization_with_admin(text, text) to authenticated;
grant execute on function lookup_organization_by_invite_code(text) to authenticated;
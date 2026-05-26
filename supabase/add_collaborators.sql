-- Migration: Collaborative Edit Permissions
-- Apply this script in your Supabase SQL Editor to enable shared access control!

-- 1. Create helper security definer functions to bypass RLS recursion limits
create or replace function public.is_diagram_owner(diag_id uuid, user_uuid uuid)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from public.driver_diagrams
    where id = diag_id
    and user_id = user_uuid
  );
end;
$$;

create or replace function public.can_read_diagram(diag_id uuid, user_uuid uuid, user_email text)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from public.driver_diagrams
    where id = diag_id
    and (
      user_id = user_uuid
      or
      exists (
        select 1 from public.diagram_collaborators
        where diagram_id = diag_id
        and email = user_email
      )
    )
  );
end;
$$;

create or replace function public.can_write_diagram(diag_id uuid, user_uuid uuid, user_email text)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from public.driver_diagrams
    where id = diag_id
    and (
      user_id = user_uuid
      or
      exists (
        select 1 from public.diagram_collaborators
        where diagram_id = diag_id
        and email = user_email
        and role = 'editor'
      )
    )
  );
end;
$$;

-- 2. Create diagram_collaborators table
create table if not exists public.diagram_collaborators (
  id uuid primary key default gen_random_uuid(),
  diagram_id uuid not null references public.driver_diagrams(id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (diagram_id, email)
);

-- Enable RLS
alter table public.diagram_collaborators enable row level security;

-- 3. Drop existing policies on public.driver_diagrams
drop policy if exists "Users can read their own driver diagrams" on public.driver_diagrams;
drop policy if exists "Users can insert their own driver diagrams" on public.driver_diagrams;
drop policy if exists "Users can update their own driver diagrams" on public.driver_diagrams;
drop policy if exists "Users can delete their own driver diagrams" on public.driver_diagrams;
drop policy if exists "Users can read their own or collaborated diagrams" on public.driver_diagrams;
drop policy if exists "Users can update their own or collaborated diagrams with editor role" on public.driver_diagrams;

-- 4. Create updated policies for public.driver_diagrams using helper functions
create policy "Users can read their own or collaborated diagrams"
on public.driver_diagrams
for select
to authenticated
using (
  public.can_read_diagram(id, auth.uid(), (select auth.jwt() ->> 'email'))
);

create policy "Users can insert their own driver diagrams"
on public.driver_diagrams
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own or collaborated diagrams with editor role"
on public.driver_diagrams
for update
to authenticated
using (
  public.can_write_diagram(id, auth.uid(), (select auth.jwt() ->> 'email'))
)
with check (
  public.can_write_diagram(id, auth.uid(), (select auth.jwt() ->> 'email'))
);

create policy "Users can delete their own driver diagrams"
on public.driver_diagrams
for delete
to authenticated
using (
  public.is_diagram_owner(id, auth.uid())
);

-- 5. Drop existing policies on public.driver_diagram_versions
drop policy if exists "Users can read their own diagram versions" on public.driver_diagram_versions;
drop policy if exists "Users can insert their own diagram versions" on public.driver_diagram_versions;
drop policy if exists "Users can delete their own diagram versions" on public.driver_diagram_versions;
drop policy if exists "Users can read their own or collaborated diagram versions" on public.driver_diagram_versions;
drop policy if exists "Users can insert their own or collaborated diagram versions" on public.driver_diagram_versions;
drop policy if exists "Users can delete their own or collaborated diagram versions" on public.driver_diagram_versions;

-- 6. Create updated policies for public.driver_diagram_versions using helper functions
create policy "Users can read their own or collaborated diagram versions"
on public.driver_diagram_versions
for select
to authenticated
using (
  public.can_read_diagram(diagram_id, auth.uid(), (select auth.jwt() ->> 'email'))
);

create policy "Users can insert their own or collaborated diagram versions"
on public.driver_diagram_versions
for insert
to authenticated
with check (
  public.can_write_diagram(diagram_id, auth.uid(), (select auth.jwt() ->> 'email'))
);

create policy "Users can delete their own or collaborated diagram versions"
on public.driver_diagram_versions
for delete
to authenticated
using (
  public.is_diagram_owner(diagram_id, auth.uid())
);

-- 7. Drop existing policies on public.diagram_collaborators
drop policy if exists "Users can read collaborators of their own or shared diagrams" on public.diagram_collaborators;
drop policy if exists "Owners can insert collaborators" on public.diagram_collaborators;
drop policy if exists "Owners can update collaborators" on public.diagram_collaborators;
drop policy if exists "Owners can delete collaborators" on public.diagram_collaborators;

-- 8. Create policies for public.diagram_collaborators using helper functions (strictly avoiding recursion)
create policy "Users can read collaborators of their own or shared diagrams"
on public.diagram_collaborators
for select
to authenticated
using (
  public.can_read_diagram(diagram_id, auth.uid(), (select auth.jwt() ->> 'email'))
);

create policy "Owners can insert collaborators"
on public.diagram_collaborators
for insert
to authenticated
with check (
  public.is_diagram_owner(diagram_id, auth.uid())
);

create policy "Owners can update collaborators"
on public.diagram_collaborators
for update
to authenticated
using (
  public.is_diagram_owner(diagram_id, auth.uid())
)
with check (
  public.is_diagram_owner(diagram_id, auth.uid())
);

create policy "Owners can delete collaborators"
on public.diagram_collaborators
for delete
to authenticated
using (
  public.is_diagram_owner(diagram_id, auth.uid())
);

-- 9. Grant access on table diagram_collaborators to authenticated & service roles
grant select, insert, update, delete on public.diagram_collaborators to authenticated;
grant select, insert, update, delete on public.diagram_collaborators to service_role;

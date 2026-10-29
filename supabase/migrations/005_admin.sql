-- Devis voyages : rôles et administration du catalogue (V2)
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.
-- Puis désigner le premier admin (voir tout en bas).

-- ---------------------------------------------------------------------------
-- Profils : un par compte, avec son rôle (client ou admin)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  role        text not null default 'client' check (role in ('client', 'admin')),
  created_at  timestamptz not null default now()
);

-- Chaque nouveau compte reçoit automatiquement son profil.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Les comptes déjà créés reçoivent aussi leur profil.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- Vrai si l'utilisateur connecté est admin. « security definer » : la fonction
-- lit profiles sans passer par sa RLS (sinon les règles s'appelleraient en boucle).
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Aussi appelée par la règle de lecture des voyages pour les visiteurs (anon),
-- pour qui elle renvoie simplement false.
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS des profils : chacun lit le sien, les admins lisent tout.
-- Seul le rôle est modifiable, par un admin, et jamais sur son propre compte
-- (pour ne pas se retirer ses droits par erreur et se retrouver sans admin).
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (role) on public.profiles to authenticated;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can change other users' role"
  on public.profiles for update
  to authenticated
  using ((select public.is_admin()) and id <> (select auth.uid()))
  with check ((select public.is_admin()) and id <> (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Catalogue : voyages archivables, écriture réservée aux admins
-- ---------------------------------------------------------------------------

alter table public.trips add column archived_at timestamptz;

-- Un voyage archivé disparaît du site public ; les admins le voient toujours.
drop policy "Anyone can read trips" on public.trips;
create policy "Anyone can read active trips"
  on public.trips for select
  to anon, authenticated
  using (archived_at is null or (select public.is_admin()));

-- Pas de suppression de voyage : on l'archive (update de archived_at).
grant insert, update on public.trips to authenticated;
grant insert, update, delete on public.departures, public.options to authenticated;

create policy "Admins can create trips"
  on public.trips for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins can update trips"
  on public.trips for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins can create departures"
  on public.departures for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins can update departures"
  on public.departures for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete departures"
  on public.departures for delete to authenticated
  using ((select public.is_admin()));

create policy "Admins can create options"
  on public.options for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins can update options"
  on public.options for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete options"
  on public.options for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Premier admin : à exécuter séparément, une seule fois, avec l'email
-- d'un compte déjà créé sur le site. Les suivants se nomment depuis /admin.
--
--   update public.profiles set role = 'admin' where email = 'votre@email.fr';
-- ---------------------------------------------------------------------------

-- Devis voyages : profil enrichi et suivi des devis par les admins (V4)
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.

-- ---------------------------------------------------------------------------
-- Profil enrichi : prénom, nom, téléphone ; date à laquelle un compte est devenu admin
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column first_name  text check (first_name is null or length(trim(first_name)) between 1 and 80),
  add column last_name   text check (last_name is null or length(trim(last_name)) between 1 and 80),
  add column phone       text check (phone is null or phone ~ '^\+?[0-9 .()-]{6,25}$'),
  add column admin_since timestamptz;

update public.profiles set admin_since = now() where role = 'admin';

-- L'inscription transmet prénom, nom et téléphone (métadonnées du compte).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Droits sur les profils.
-- Chacun peut modifier son prénom, son nom et son téléphone, jamais son rôle.
-- Le rôle ne change plus par un update direct, mais par la fonction set_user_role,
-- qui vérifie que l'appelant est admin et qu'il ne modifie pas son propre compte.
-- ---------------------------------------------------------------------------

drop policy "Admins can change other users' role" on public.profiles;
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Réservé aux admins' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'Impossible de modifier son propre rôle' using errcode = '42501';
  end if;
  if p_role not in ('client', 'admin') then
    raise exception 'Rôle inconnu' using errcode = '22023';
  end if;

  update public.profiles
  set role = p_role,
      admin_since = case when p_role = 'admin' then coalesce(admin_since, now()) else null end
  where id = p_user_id;
end;
$$;

revoke execute on function public.set_user_role(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Devis : indicateur d'accessibilité, lien vers le profil, lecture par les admins
-- ---------------------------------------------------------------------------

-- Au moins une option d'accessibilité payante. Les devis antérieurs restent à false
-- (l'information n'était pas enregistrée).
alter table public.quotes add column has_accessibility boolean not null default false;

-- Permet de lire un devis avec le profil de son client en une requête.
alter table public.quotes
  add constraint quotes_user_profile_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

create policy "Admins can read all quotes"
  on public.quotes for select
  to authenticated
  using ((select public.is_admin()));

create index quotes_created_at_idx on public.quotes (created_at desc);

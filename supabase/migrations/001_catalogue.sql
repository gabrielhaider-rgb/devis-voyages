-- Devis voyages : schéma du catalogue (voyages, départs, options)
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.

-- ---------------------------------------------------------------------------
-- Tables
-- Les prix sont en centimes (entiers) pour éviter les erreurs d'arrondi.
-- ---------------------------------------------------------------------------

create table public.trips (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title          text not null check (length(trim(title)) > 0),
  destination    text not null check (length(trim(destination)) > 0),
  duration_days  integer not null check (duration_days > 0),
  description    text not null,
  image_url      text,
  created_at     timestamptz not null default now()
);

create table public.departures (
  id                      uuid primary key default gen_random_uuid(),
  trip_id                 uuid not null references public.trips (id) on delete cascade,
  departure_date          date not null,
  price_per_person_cents  integer not null check (price_per_person_cents >= 0),
  unique (trip_id, departure_date)
);

create table public.options (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips (id) on delete cascade,
  label         text not null check (length(trim(label)) > 0),
  price_cents   integer not null check (price_cents >= 0),
  pricing_type  text not null check (pricing_type in ('fixed', 'per_person')),
  category      text not null default 'standard'
                check (category in ('standard', 'accessibility'))
);

create index departures_trip_id_idx on public.departures (trip_id);
create index options_trip_id_idx on public.options (trip_id);

-- ---------------------------------------------------------------------------
-- Row Level Security : le catalogue est lisible par tout le monde,
-- et personne ne peut l'écrire via l'API (il est rempli par le seed SQL).
-- L'écriture par les admins arrivera en V2.
-- ---------------------------------------------------------------------------

alter table public.trips enable row level security;
alter table public.departures enable row level security;
alter table public.options enable row level security;

revoke all on public.trips, public.departures, public.options from anon, authenticated;
grant select on public.trips, public.departures, public.options to anon, authenticated;

create policy "Anyone can read trips"
  on public.trips for select
  to anon, authenticated
  using (true);

create policy "Anyone can read departures"
  on public.departures for select
  to anon, authenticated
  using (true);

create policy "Anyone can read options"
  on public.options for select
  to anon, authenticated
  using (true);

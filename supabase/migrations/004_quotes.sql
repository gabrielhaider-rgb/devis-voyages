-- Devis voyages : devis enregistrés par les clients (V1.1)
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.
--
-- Un devis enregistré garde une copie figée du voyage, des lignes et du total :
-- si le catalogue change ensuite, le devis garde son prix d'origine.

create table public.quotes (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trip_slug              text not null,
  trip_title             text not null,
  destination            text not null,
  duration_days          integer not null check (duration_days > 0),
  departure_date         date not null,
  travelers              integer not null check (travelers between 1 and 9),
  -- [{ "label": "Voyage", "detail": "650 € × 2 voyageurs", "amountCents": 130000 }, …]
  lines                  jsonb not null check (jsonb_typeof(lines) = 'array'),
  -- ["Chambre adaptée (PMR)", …]
  included_accessibility jsonb not null default '[]' check (jsonb_typeof(included_accessibility) = 'array'),
  total_cents            integer not null check (total_cents >= 0),
  created_at             timestamptz not null default now()
);

create index quotes_user_id_created_at_idx on public.quotes (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security : un client ne lit et ne crée que ses propres devis.
-- Pas de modification ni de suppression (hors périmètre de la V1.1).
-- ---------------------------------------------------------------------------

alter table public.quotes enable row level security;

revoke all on public.quotes from anon, authenticated;
grant select, insert on public.quotes to authenticated;

create policy "Users can read their own quotes"
  on public.quotes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own quotes"
  on public.quotes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

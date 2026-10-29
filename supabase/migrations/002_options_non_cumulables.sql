-- Devis voyages : options non cumulables
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.
--
-- Des options d'un même voyage qui partagent le même exclusive_group
-- ne peuvent pas être choisies ensemble (ex. les deux transferts).
-- null = option cumulable avec toutes les autres.

alter table public.options add column exclusive_group text;

update public.options
set exclusive_group = 'transfert'
where label in ('Transfert aéroport', 'Transfert en véhicule adapté');

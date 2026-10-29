-- Devis voyages : en Islande, le 4x4 (sans chauffeur) et le véhicule adapté
-- avec chauffeur font double emploi : ils ne se cumulent pas.
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.

update public.options
set exclusive_group = 'transport'
where label in ('Location d''un 4x4', 'Véhicule adapté avec chauffeur');

-- Devis voyages : catalogue de démonstration
-- À exécuter après 001_catalogue.sql : SQL Editor > New query > coller > Run.
-- Peut être relancé : il vide d'abord le catalogue (départs et options compris).
-- Les prix sont en centimes : 65000 = 650 €.

truncate public.trips cascade;

-- ---------------------------------------------------------------------------
-- Voyages
-- ---------------------------------------------------------------------------

insert into public.trips (slug, title, destination, duration_days, description) values
  ('lisbonne-5-jours', 'Lisbonne, 5 jours', 'Portugal', 5,
   'Ruelles de l''Alfama, tramway 28 et pastéis de nata : une escapade au bord du Tage, hôtel 4 étoiles au cœur de la ville.'),
  ('marrakech-7-jours', 'Marrakech, 7 jours', 'Maroc', 7,
   'Souks de la médina, jardins Majorelle et riad avec patio : une semaine entre effervescence et calme, aux portes du désert.'),
  ('rome-4-jours', 'Rome, 4 jours', 'Italie', 4,
   'Colisée, Forum et Trastevere : quatre jours pour découvrir la Ville éternelle, hôtel 3 étoiles près de la piazza Navona.'),
  ('islande-8-jours', 'Islande, 8 jours', 'Islande', 8,
   'Cascades, glaciers et sources chaudes : un road trip sur la côte sud, de Reykjavik à la lagune glaciaire de Jökulsárlón.'),
  ('japon-12-jours', 'Japon, 12 jours', 'Japon', 12,
   'Tokyo, Hakone, Kyoto et Nara : un premier voyage au Japon entre mégapoles, temples et ryokan traditionnel.');

-- ---------------------------------------------------------------------------
-- Départs (prix par personne)
-- ---------------------------------------------------------------------------

insert into public.departures (trip_id, departure_date, price_per_person_cents)
select t.id, v.departure_date::date, v.price_per_person_cents
from (values
  ('lisbonne-5-jours',  '2027-05-12',  65000),
  ('lisbonne-5-jours',  '2027-07-14',  82000),
  ('marrakech-7-jours', '2027-03-15',  89000),
  ('marrakech-7-jours', '2027-04-20',  95000),
  ('marrakech-7-jours', '2027-11-10',  79000),
  ('rome-4-jours',      '2027-04-08',  56000),
  ('rome-4-jours',      '2027-05-27',  61000),
  ('rome-4-jours',      '2027-10-14',  52000),
  ('islande-8-jours',   '2027-06-10', 215000),
  ('islande-8-jours',   '2027-09-02', 189000),
  ('japon-12-jours',    '2027-04-01', 345000),
  ('japon-12-jours',    '2027-10-21', 319000)
) as v (slug, departure_date, price_per_person_cents)
join public.trips t on t.slug = v.slug;

-- ---------------------------------------------------------------------------
-- Options (standard et accessibilité)
-- ---------------------------------------------------------------------------

insert into public.options (trip_id, label, price_cents, pricing_type, category)
select t.id, v.label, v.price_cents, v.pricing_type, v.category
from (values
  -- Lisbonne : options des cas de test du PRD (section 4)
  ('lisbonne-5-jours',  'Assurance annulation',                 4000, 'per_person', 'standard'),
  ('lisbonne-5-jours',  'Transfert aéroport',                   6000, 'fixed',      'standard'),
  ('lisbonne-5-jours',  'Excursion à Sintra',                   3500, 'per_person', 'standard'),
  ('lisbonne-5-jours',  'Transfert en véhicule adapté',         8000, 'fixed',      'accessibility'),
  ('lisbonne-5-jours',  'Assistance à l''aéroport',                0, 'per_person', 'accessibility'),
  ('lisbonne-5-jours',  'Chambre adaptée (PMR)',                   0, 'fixed',      'accessibility'),

  ('marrakech-7-jours', 'Assurance annulation',                 4500, 'per_person', 'standard'),
  ('marrakech-7-jours', 'Transfert aéroport',                   5000, 'fixed',      'standard'),
  ('marrakech-7-jours', 'Nuit sous tente dans le désert d''Agafay', 12000, 'per_person', 'standard'),
  ('marrakech-7-jours', 'Hammam et massage',                    4000, 'per_person', 'standard'),
  ('marrakech-7-jours', 'Chambre adaptée (PMR)',                   0, 'fixed',      'accessibility'),
  ('marrakech-7-jours', 'Transfert en véhicule adapté',         9000, 'fixed',      'accessibility'),
  ('marrakech-7-jours', 'Assistance à l''aéroport',                0, 'per_person', 'accessibility'),

  ('rome-4-jours',      'Assurance annulation',                 3500, 'per_person', 'standard'),
  ('rome-4-jours',      'Transfert aéroport',                   5500, 'fixed',      'standard'),
  ('rome-4-jours',      'Visite guidée des musées du Vatican',  6500, 'per_person', 'standard'),
  ('rome-4-jours',      'Chambre adaptée (PMR)',                   0, 'fixed',      'accessibility'),
  ('rome-4-jours',      'Assistance à l''aéroport',                0, 'per_person', 'accessibility'),
  ('rome-4-jours',      'Location d''un fauteuil roulant',     12000, 'fixed',      'accessibility'),

  ('islande-8-jours',   'Assurance annulation',                 7000, 'per_person', 'standard'),
  ('islande-8-jours',   'Location d''un 4x4',                  45000, 'fixed',      'standard'),
  ('islande-8-jours',   'Entrée au Blue Lagoon',                9000, 'per_person', 'standard'),
  ('islande-8-jours',   'Chambre adaptée (PMR)',                   0, 'fixed',      'accessibility'),
  ('islande-8-jours',   'Véhicule adapté avec chauffeur',      60000, 'fixed',      'accessibility'),
  ('islande-8-jours',   'Accompagnement par un guide formé',   25000, 'fixed',      'accessibility'),

  ('japon-12-jours',    'Assurance annulation',                 9000, 'per_person', 'standard'),
  ('japon-12-jours',    'Japan Rail Pass 7 jours',             32000, 'per_person', 'standard'),
  ('japon-12-jours',    'Cérémonie du thé à Kyoto',             5000, 'per_person', 'standard'),
  ('japon-12-jours',    'Chambre adaptée (PMR)',                   0, 'fixed',      'accessibility'),
  ('japon-12-jours',    'Assistance à l''aéroport',                0, 'per_person', 'accessibility'),
  ('japon-12-jours',    'Accompagnement par un guide formé',   40000, 'fixed',      'accessibility')
) as v (slug, label, price_cents, pricing_type, category)
join public.trips t on t.slug = v.slug;

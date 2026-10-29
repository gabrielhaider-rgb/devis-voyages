-- Devis voyages : plafonds de messages de l'assistant (V3)
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.
--
-- Chaque message envoyé à l'assistant prend une « place » ; au-delà des plafonds,
-- l'assistant répond qu'il est indisponible sans appeler Claude (donc sans coût).
-- Les adresses IP ne sont jamais stockées en clair : seulement leur empreinte (hash).

create table public.assistant_usage (
  bucket        text not null,         -- 'ip-heure:<hash>', 'ip-jour:<hash>', 'site-heure', 'site-jour'
  window_start  timestamptz not null,  -- début de l'heure ou du jour compté
  count         integer not null default 0,
  primary key (bucket, window_start)
);

-- Personne ne lit ni n'écrit cette table via l'API : seule la fonction ci-dessous y touche.
alter table public.assistant_usage enable row level security;
revoke all on public.assistant_usage from anon, authenticated;

-- Incrémente un compteur et renvoie sa nouvelle valeur (atomique, sans course).
create function public.assistant_bump(p_bucket text, p_window timestamptz)
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.assistant_usage as u (bucket, window_start, count)
  values (p_bucket, p_window, 1)
  on conflict (bucket, window_start) do update set count = u.count + 1
  returning u.count;
$$;

revoke execute on function public.assistant_bump(text, timestamptz) from public, anon, authenticated;

-- Vrai si ce message peut être traité. Plafonds :
--   par adresse IP : 20 par heure, 50 par jour ;
--   pour tout le site : 300 par heure, 1 000 par jour (coût maximal garanti).
-- Les plafonds du site ne sont comptés que si ceux de l'adresse IP sont respectés,
-- pour qu'une seule adresse ne puisse pas bloquer l'assistant pour tout le monde.
create function public.assistant_take_slot(p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_hour timestamptz := date_trunc('hour', now());
  current_day  timestamptz := date_trunc('day', now());
begin
  if p_ip_hash is null or length(p_ip_hash) <> 64 then
    return false;
  end if;

  -- Ménage : on oublie les compteurs de plus de deux jours.
  delete from public.assistant_usage where window_start < now() - interval '2 days';

  if public.assistant_bump('ip-heure:' || p_ip_hash, current_hour) > 20
     or public.assistant_bump('ip-jour:' || p_ip_hash, current_day) > 50 then
    return false;
  end if;

  if public.assistant_bump('site-heure', current_hour) > 300
     or public.assistant_bump('site-jour', current_day) > 1000 then
    return false;
  end if;

  return true;
end;
$$;

revoke execute on function public.assistant_take_slot(text) from public;
grant execute on function public.assistant_take_slot(text) to anon, authenticated;

-- SkinRead · retención de datos de las clientas (24/11/2026)
-- Principio de limitación del plazo de conservación (art. 5.1.e RGPD).
--  1. A las 24 h se quitan del consejo los enlaces a las imágenes de Perfect Corp (ya caducan a las 2 h).
--  2. A los 12 meses se borran las respuestas de salud, las puntuaciones y el perfil y los avisos de la
--     rutina. Quedan la fecha, los productos y precios de la rutina y si se vendió, para las estadísticas de la farmacia. El plazo lo debe confirmar el asesor legal.
-- Se ejecuta cada noche a las 3:30 (UTC) con pg_cron. Es idempotente: se puede lanzar varias veces.

create extension if not exists pg_cron;

create or replace function privado.purgar_consejos()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.consejos
     set puntuaciones_foto = puntuaciones_foto - 'imagenes'
   where creado < now() - interval '24 hours'
     and puntuaciones_foto ? 'imagenes';

  update public.consejos
     set respuestas = jsonb_build_object('purgado', true),
         puntuaciones_foto = null,
         -- el perfil y los avisos de la rutina también delatan la salud (p. ej., embarazo)
         rutinas = (rutinas - 'perfil' - 'derivacion' - 'no_recomiendo')
                   #- '{rutinas,basica,avisos}' #- '{rutinas,media,avisos}' #- '{rutinas,completa,avisos}'
   where creado < now() - interval '12 months'
     and not coalesce((respuestas ->> 'purgado')::boolean, false);
end $$;
revoke all on function privado.purgar_consejos() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'purgar_consejos';
select cron.schedule('purgar_consejos', '30 3 * * *', 'select privado.purgar_consejos()');

-- SkinRead · seguimiento a las 4 semanas (24/11/2026)
-- 1. Cada análisis con foto recibe un código de revisión (único por farmacia), sin nombre ni contacto.
-- 2. Si la clienta lo acepta aparte, su foto se guarda 35 días para enseñar el antes y el después.
--    Solo la ven los usuarios de esa farmacia y se borra sola (pg_cron, cada hora).
-- 3. La revisión queda enlazada al primer análisis (seguimiento_de).
-- Solo añade columnas, una tabla y amplía la purga. No borra ni modifica datos existentes.

alter table public.consejos
  add column if not exists codigo text check (codigo ~ '^[A-Z0-9]{3}-[A-Z0-9]{3}$'),
  add column if not exists seguimiento_de uuid references public.consejos(id) on delete set null;
create unique index if not exists consejos_farmacia_codigo_idx on public.consejos (farmacia_id, codigo) where codigo is not null;

create table if not exists public.fotos_seguimiento (
  consejo_id uuid primary key references public.consejos(id) on delete cascade,
  farmacia_id uuid not null references public.farmacias(id) on delete cascade,
  jpeg_base64 text not null check (char_length(jpeg_base64) <= 3000000),
  creado timestamptz not null default now(),
  caduca timestamptz not null default now() + interval '35 days'
);
alter table public.fotos_seguimiento enable row level security;
drop policy if exists fotos_seguimiento_farmacia on public.fotos_seguimiento;
create policy fotos_seguimiento_farmacia on public.fotos_seguimiento for all to authenticated
  using (privado.es_miembro(farmacia_id)) with check (privado.es_miembro(farmacia_id));
grant select, insert, delete on public.fotos_seguimiento to authenticated;

-- Purga ampliada: fotos caducadas, enlaces de imágenes a las 24 h y datos de salud y código a los 12 meses
create or replace function privado.purgar_consejos()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.fotos_seguimiento where caduca < now();

  update public.consejos
     set puntuaciones_foto = puntuaciones_foto - 'imagenes'
   where creado < now() - interval '24 hours'
     and puntuaciones_foto ? 'imagenes';

  update public.consejos
     set respuestas = jsonb_build_object('purgado', true),
         puntuaciones_foto = null,
         codigo = null,
         rutinas = (rutinas - 'perfil' - 'derivacion' - 'no_recomiendo')
                   #- '{rutinas,basica,avisos}' #- '{rutinas,media,avisos}' #- '{rutinas,completa,avisos}'
   where creado < now() - interval '12 months'
     and not coalesce((respuestas ->> 'purgado')::boolean, false);
end $$;
revoke all on function privado.purgar_consejos() from public, anon, authenticated;

-- cada hora, para que la foto no pase de los 35 días
select cron.unschedule(jobid) from cron.job where jobname = 'purgar_consejos';
select cron.schedule('purgar_consejos', '15 * * * *', 'select privado.purgar_consejos()');

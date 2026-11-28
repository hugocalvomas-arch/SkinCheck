-- SkinRead · foto desde el móvil con un QR (28/11/2026)
-- El iPad (o el ordenador) con la sesión de la farmacia crea un enlace de un solo uso que caduca a los 10 minutos.
-- El móvil, sin sesión, solo puede dejar UNA foto en ese enlace (función security definer); no puede leer nada.
-- La pantalla de la farmacia recoge la foto y borra la fila en el mismo momento. Lo caducado se purga cada 10 minutos.
-- Solo añade una tabla, dos funciones y una tarea de purga. No toca datos existentes.

create table if not exists public.fotos_movil (
  token text primary key check (token ~ '^[A-Za-z0-9_-]{32,64}$'),
  farmacia_id uuid not null references public.farmacias(id) on delete cascade,
  jpeg_base64 text check (char_length(jpeg_base64) <= 3000000),
  creado timestamptz not null default now(),
  caduca timestamptz not null default now() + interval '10 minutes'
);
alter table public.fotos_movil enable row level security;
drop policy if exists fotos_movil_farmacia on public.fotos_movil;
create policy fotos_movil_farmacia on public.fotos_movil for all to authenticated
  using (privado.es_miembro(farmacia_id)) with check (privado.es_miembro(farmacia_id));
grant select, insert, delete on public.fotos_movil to authenticated;

-- El móvil comprueba que el enlace sigue vivo antes de abrir la cámara
create or replace function public.enlace_movil_vivo(p_token text)
returns boolean
language sql security definer set search_path = ''
as $$
  select exists (select 1 from public.fotos_movil where token = p_token and caduca > now() and jpeg_base64 is null)
$$;

-- El móvil deja la foto una sola vez; después el enlace ya no admite otra
create or replace function public.subir_foto_movil(p_token text, p_foto text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare n int;
begin
  if p_foto is null or char_length(p_foto) > 3000000 then return false; end if;
  update public.fotos_movil set jpeg_base64 = p_foto
   where token = p_token and caduca > now() and jpeg_base64 is null;
  get diagnostics n = row_count;
  return n = 1;
end $$;

revoke all on function public.enlace_movil_vivo(text) from public;
revoke all on function public.subir_foto_movil(text, text) from public;
grant execute on function public.enlace_movil_vivo(text) to anon, authenticated;
grant execute on function public.subir_foto_movil(text, text) to anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'purgar_fotos_movil';
select cron.schedule('purgar_fotos_movil', '*/10 * * * *', 'delete from public.fotos_movil where caduca < now()');

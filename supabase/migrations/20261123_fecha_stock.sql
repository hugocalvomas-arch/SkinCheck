-- SkinCheck · guardar la fecha y las filas de la última subida de stock (23/11/2026)
-- Solo añade 2 columnas y actualiza una función. No borra datos.
alter table public.farmacias add column if not exists stock_subido timestamptz, add column if not exists stock_filas integer;

create or replace function public.guardar_mapeo_csv(p_farmacia uuid, p_mapeo jsonb, p_programa text default null, p_filas integer default null)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not (privado.es_miembro(p_farmacia) or privado.es_admin()) then raise exception 'sin permiso'; end if;
  update public.farmacias
     set mapeo_csv = p_mapeo,
         programa_gestion = coalesce(nullif(p_programa, ''), programa_gestion),
         stock_subido = now(),
         stock_filas = coalesce(p_filas, stock_filas)
   where id = p_farmacia;
end $$;
drop function if exists public.guardar_mapeo_csv(uuid, jsonb, text);
revoke all on function public.guardar_mapeo_csv(uuid, jsonb, text, integer) from public, anon;
grant execute on function public.guardar_mapeo_csv(uuid, jsonb, text, integer) to authenticated;

update public.farmacias set stock_subido = now(), stock_filas = 15 where nombre = 'Farmacia de Hugo';

-- Opción por farmacia: recomendar también productos que no tiene en stock (los pide para la clienta).
-- Por defecto no: solo se recomienda lo que hay en la estantería.
alter table public.farmacias add column if not exists recomendar_sin_stock boolean not null default false;

-- Los miembros no pueden editar la tabla farmacias; esta función cambia solo esta opción y solo en su farmacia.
create or replace function public.cambiar_recomendar_sin_stock(p_farmacia uuid, p_valor boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not (privado.es_miembro(p_farmacia) or privado.es_admin()) then
    raise exception 'sin_acceso';
  end if;
  update public.farmacias set recomendar_sin_stock = p_valor where id = p_farmacia;
end $$;
revoke execute on function public.cambiar_recomendar_sin_stock(uuid, boolean) from public, anon;
grant execute on function public.cambiar_recomendar_sin_stock(uuid, boolean) to authenticated;

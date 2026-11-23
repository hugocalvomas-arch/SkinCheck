-- SkinCheck · funciones de administración (23/11/2026)
-- Solo añade funciones e un índice. No borra ni modifica datos.

-- Miembros de una farmacia con su email (solo admin)
create or replace function public.admin_miembros(p_farmacia uuid)
returns table(user_id uuid, email text, rol text)
language plpgsql security definer set search_path = ''
as $$
begin
  if not privado.es_admin() then raise exception 'sin permiso'; end if;
  return query
    select m.user_id, u.email::text, m.rol::text
      from public.miembros m join auth.users u on u.id = m.user_id
     where m.farmacia_id = p_farmacia
     order by u.email;
end $$;
revoke all on function public.admin_miembros(uuid) from public, anon;
grant execute on function public.admin_miembros(uuid) to authenticated;

-- Asociar un código sin clasificar a un producto del catálogo
create or replace function public.admin_clasificar(p_codigo text, p_producto text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_ean text; v_cn text; v_n int;
begin
  if not privado.es_admin() then raise exception 'sin permiso'; end if;
  if not exists (select 1 from public.productos where id = p_producto) then return 'no_existe'; end if;

  select max(s.ean), max(s.cn) into v_ean, v_cn from public.sin_clasificar s where s.codigo = p_codigo;
  if v_ean is null and v_cn is null then return 'sin_pendientes'; end if;

  if v_ean is not null and exists (select 1 from public.productos where ean = v_ean and id <> p_producto) then
    return 'ean_en_otro_producto';
  end if;
  if v_cn is not null and exists (select 1 from public.productos where cn = v_cn and id <> p_producto) then
    return 'cn_en_otro_producto';
  end if;

  update public.productos
     set ean = coalesce(ean, v_ean), cn = coalesce(cn, v_cn), actualizado = now()
   where id = p_producto;

  insert into public.stock (farmacia_id, producto_id, pvp, unidades)
  select s.farmacia_id, p_producto, s.pvp, coalesce(s.unidades, 0)
    from public.sin_clasificar s where s.codigo = p_codigo
  on conflict (farmacia_id, producto_id)
  do update set unidades = public.stock.unidades + excluded.unidades,
                pvp = coalesce(excluded.pvp, public.stock.pvp);

  delete from public.sin_clasificar where codigo = p_codigo;
  get diagnostics v_n = row_count;
  return 'ok:' || v_n;
end $$;
revoke all on function public.admin_clasificar(text, text) from public, anon;
grant execute on function public.admin_clasificar(text, text) to authenticated;

create index if not exists sin_clasificar_codigo_idx on public.sin_clasificar (codigo);

-- Solicitudes de información desde la web comercial (formulario de contacto)
create table if not exists public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 2 and 120),
  farmacia text not null check (char_length(farmacia) between 2 and 160),
  ciudad text check (char_length(ciudad) <= 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  telefono text check (char_length(telefono) <= 40),
  programa text check (char_length(programa) <= 40),
  mensaje text check (char_length(mensaje) <= 2000),
  atendida boolean not null default false
);
alter table public.solicitudes enable row level security;
-- cualquiera puede enviar el formulario; solo los administradores pueden leerlo y marcarlo
drop policy if exists solicitudes_insertar on public.solicitudes;
create policy solicitudes_insertar on public.solicitudes for insert to anon, authenticated with check (atendida = false);
drop policy if exists solicitudes_admin on public.solicitudes;
create policy solicitudes_admin on public.solicitudes for select to authenticated using (privado.es_admin());
drop policy if exists solicitudes_admin_upd on public.solicitudes;
create policy solicitudes_admin_upd on public.solicitudes for update to authenticated using (privado.es_admin()) with check (privado.es_admin());
grant insert on public.solicitudes to anon, authenticated;
grant select, update on public.solicitudes to authenticated;

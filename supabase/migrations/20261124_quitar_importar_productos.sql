-- Revisión 24/11: la importación del catálogo ya terminó. Esta función era SECURITY DEFINER y la podía llamar
-- cualquiera sin sesión (solo la protegía un token). Se elimina junto con su token. Ningún código la usa.
drop function if exists public.importar_productos(jsonb, text);
delete from privado.config where clave = 'import_token';

-- ============================================================
-- EXCELENTEMENTE · Fase 5: formulario de contacto
-- Ejecutar DESPUÉS de 002_roles_portal.sql, en el SQL Editor.
-- Idempotente: se puede volver a ejecutar.
-- ============================================================

create table if not exists public.contact_messages (
  id         bigint generated always as identity primary key,
  name       text not null,
  email      text not null,
  phone      text,
  service    text,
  message    text not null,
  status     text not null default 'nuevo' check (status in ('nuevo', 'leido', 'respondido')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Cualquiera (incluso sin sesión) puede enviar una consulta.
drop policy if exists "contacto: crear" on public.contact_messages;
create policy "contacto: crear"
  on public.contact_messages for insert to anon, authenticated
  with check (true);

-- Solo el administrador puede leer, actualizar o borrar.
drop policy if exists "admin: gestionar mensajes" on public.contact_messages;
create policy "admin: gestionar mensajes"
  on public.contact_messages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- select status, count(*) from public.contact_messages group by status;

-- ============================================================
-- EXCELENTEMENTE · Fase 2: roles, vínculos y permisos
-- Ejecutar DESPUÉS de schema.sql, en el SQL Editor de Supabase.
-- Idempotente: se puede volver a ejecutar.
-- ============================================================

-- ============================================================
-- 1. ROLES
-- ============================================================

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('paciente', 'profesional', 'admin'));

-- ============================================================
-- 2. FICHA PROFESIONAL ↔ CUENTA DE AUTH
-- ============================================================

alter table public.professionals
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.professionals
  add column if not exists photo_url text;

alter table public.professionals
  add column if not exists display_order integer not null default 0;

create unique index if not exists professionals_user_id_key
  on public.professionals (user_id)
  where user_id is not null;

create index if not exists professionals_category_idx
  on public.professionals (category, display_order);

-- ============================================================
-- 3. SERVICIOS POR PROFESIONAL
-- ============================================================

create table if not exists public.professional_services (
  professional_id text not null references public.professionals(id) on delete cascade,
  service_id      bigint not null references public.services(id) on delete cascade,
  primary key (professional_id, service_id)
);

alter table public.professional_services enable row level security;

-- ============================================================
-- 4. CITAS: ESTADOS DE GESTIÓN
-- ============================================================

alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments add constraint appointments_status_check
  check (status in ('pendiente', 'proxima', 'confirmada', 'pasada', 'atendida', 'cancelada', 'no_asistio'));

alter table public.appointments
  add column if not exists notes text;

create index if not exists appointments_professional_idx
  on public.appointments (professional_id, date);

-- ============================================================
-- 5. FUNCIONES AUXILIARES (evitan recursión en RLS)
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_professional()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'profesional'
  );
$$;

create or replace function public.my_professional_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.professionals
  where user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_professional() from public;
revoke all on function public.my_professional_id() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_professional() to authenticated;
grant execute on function public.my_professional_id() to authenticated;

-- Un usuario no puede ascenderse a admin/profesional por su cuenta.
-- El SQL Editor (auth.uid() = null) sí puede asignar roles.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'No autorizado para cambiar el rol';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Un profesional no puede cambiar el vínculo de su ficha ni su visibilidad.
create or replace function public.guard_professional_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.id is distinct from old.id
       or new.user_id is distinct from old.user_id
       or new.active is distinct from old.active
       or new.display_order is distinct from old.display_order then
      raise exception 'No autorizado para cambiar el vínculo o la visibilidad';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_professional_link on public.professionals;
create trigger guard_professional_link
  before update on public.professionals
  for each row execute function public.guard_professional_link();

-- ============================================================
-- 6. GRANTS
-- ============================================================

grant insert, update, delete on public.professionals to authenticated;
grant insert, update, delete on public.schedule_blocks to authenticated;
grant insert, update, delete on public.services to authenticated;
grant select on public.professional_services to anon, authenticated;
grant insert, update, delete on public.professional_services to authenticated;

-- ============================================================
-- 7. RLS · PROFESSIONALS
-- ============================================================

drop policy if exists "catalogo: leer profesionales" on public.professionals;
drop policy if exists "catalogo: leer profesionales activos" on public.professionals;
create policy "catalogo: leer profesionales activos"
  on public.professionals for select to anon, authenticated
  using (active = true);

drop policy if exists "admin: gestionar profesionales" on public.professionals;
create policy "admin: gestionar profesionales"
  on public.professionals for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profesional: leer su ficha" on public.professionals;
create policy "profesional: leer su ficha"
  on public.professionals for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "profesional: editar su ficha" on public.professionals;
create policy "profesional: editar su ficha"
  on public.professionals for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- 8. RLS · SCHEDULE_BLOCKS
-- ============================================================

drop policy if exists "admin: gestionar horarios" on public.schedule_blocks;
create policy "admin: gestionar horarios"
  on public.schedule_blocks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profesional: gestionar sus horarios" on public.schedule_blocks;
create policy "profesional: gestionar sus horarios"
  on public.schedule_blocks for all to authenticated
  using (professional_id = public.my_professional_id())
  with check (professional_id = public.my_professional_id());

-- ============================================================
-- 9. RLS · APPOINTMENTS
-- ============================================================

drop policy if exists "admin: gestionar citas" on public.appointments;
create policy "admin: gestionar citas"
  on public.appointments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profesional: leer sus citas" on public.appointments;
create policy "profesional: leer sus citas"
  on public.appointments for select to authenticated
  using (professional_id = public.my_professional_id());

drop policy if exists "profesional: actualizar sus citas" on public.appointments;
create policy "profesional: actualizar sus citas"
  on public.appointments for update to authenticated
  using (professional_id = public.my_professional_id())
  with check (professional_id = public.my_professional_id());

-- ============================================================
-- 10. RLS · PROFILES
-- ============================================================

drop policy if exists "admin: leer perfiles" on public.profiles;
create policy "admin: leer perfiles"
  on public.profiles for select to authenticated
  using (public.is_admin());

drop policy if exists "admin: editar perfiles" on public.profiles;
create policy "admin: editar perfiles"
  on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profesional: leer sus pacientes" on public.profiles;
create policy "profesional: leer sus pacientes"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1 from public.appointments a
      where a.user_id = profiles.id
        and a.professional_id = public.my_professional_id()
    )
  );

-- ============================================================
-- 11. RLS · SERVICES
-- ============================================================

drop policy if exists "admin: gestionar servicios" on public.services;
create policy "admin: gestionar servicios"
  on public.services for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 12. RLS · COMMENTS (moderación)
-- ============================================================

drop policy if exists "admin: moderar comentarios" on public.comments;
create policy "admin: moderar comentarios"
  on public.comments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 13. RLS · PROFESSIONAL_SERVICES
-- ============================================================

drop policy if exists "catalogo: leer servicios profesionales" on public.professional_services;
create policy "catalogo: leer servicios profesionales"
  on public.professional_services for select to anon, authenticated
  using (true);

drop policy if exists "admin: gestionar servicios profesionales" on public.professional_services;
create policy "admin: gestionar servicios profesionales"
  on public.professional_services for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 14. BOOTSTRAP (ejecutar a mano cuando existan las cuentas)
-- ============================================================

-- 1) Registra la cuenta normalmente en /registro.html y confirma el correo.
-- 2) Conviértela en administrador:
-- update public.profiles set role = 'admin'
-- where email = 'TU_CORREO_ADMIN@dominio.com';

-- 3) Para un profesional: registra su cuenta, confirma el correo y luego:
-- update public.profiles set role = 'profesional'
-- where email = 'CORREO_PROFESIONAL@dominio.com';
--
-- update public.professionals
-- set user_id = (select id from auth.users where email = 'CORREO_PROFESIONAL@dominio.com')
-- where id = 'wilbert-barzola';

-- 4) Verificación:
-- select p.email, p.role, pr.id as ficha
-- from public.profiles p
-- left join public.professionals pr on pr.user_id = p.id
-- order by p.created_at;

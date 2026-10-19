-- ============================================================
-- EXCELENTEMENTE · Fase 3: portal del profesional
-- Ejecutar DESPUÉS de 002_roles_portal.sql, en el SQL Editor.
-- Idempotente: se puede volver a ejecutar.
-- ============================================================

-- ============================================================
-- 1. SERVICIOS QUE OFRECE CADA PROFESIONAL
-- ============================================================

drop policy if exists "profesional: gestionar sus servicios" on public.professional_services;
create policy "profesional: gestionar sus servicios"
  on public.professional_services for all to authenticated
  using (professional_id = public.my_professional_id())
  with check (professional_id = public.my_professional_id());

-- ============================================================
-- 2. VERIFICACIÓN
-- ============================================================

-- select professional_id, count(*) as servicios
-- from public.professional_services
-- group by professional_id
-- order by servicios desc;
